import fs from "fs";
import path from "path";
import process from "process";
import * as core from "@actions/core";
import * as inputHelper from "./input-helper";
import * as consoleHelper from "./console-helper";
import archiver from "archiver";

function determineBaseDir(baseDirInput: string): string {
  const fallbackDir =
    process.env.BITBUCKET_CLONE_DIR ||
    process.env.GITHUB_WORKSPACE ||
    process.env.CI_BUILDS_DIR ||
    process.env.CODEBUILD_SRC_DIR ||
    process.cwd();

  const chosenDir =
    baseDirInput && baseDirInput !== process.cwd() ? baseDirInput : fallbackDir;
  core.debug(`Base directory determined: ${chosenDir}`);
  return chosenDir;
}

function zipDirectory(sourceDir: string, outPath: string) {
  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

function zipFiles(files: string[], outputZip: string) {
  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outputZip);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve());
    archive.on("error", reject);

    archive.pipe(output);
    for (const file of files) archive.file(file, { name: path.basename(file) });
    archive.finalize();
  });
}

async function zipIndividualPackages(
  packageDirs: fs.Dirent[],
  basePath: string,
): Promise<string[]> {
  const tempDir = "/tmp/packages";
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const zipPaths: string[] = [];

  for (const dir of packageDirs) {
    const sourceDir = path.join(basePath, dir.name);
    const zipPath = path.join(tempDir, `${dir.name}.zip`);
    core.info(`Zipping ${dir.name}...`);
    await zipDirectory(sourceDir, zipPath);
    zipPaths.push(zipPath);
  }

  return zipPaths;
}

async function main(): Promise<void> {
  core.debug("Starting main function");

  const inputs = inputHelper.getInputs();

  try {
    inputHelper.validateInputs(inputs);
  } catch (error) {
    core.setFailed(`Input validation failed: ${(error as Error).message}`);
    return;
  }

  const BASE_DIR = determineBaseDir(inputs.base_dir);

  core.debug(
    `Inputs summary:
      BASE_DIR=${BASE_DIR}
      PACKAGE_DIR=${inputs.package_dir}
      INSTANCE_NAME=${inputs.instance_name}
      TAGS=${inputs.tag}
      DESCRIPTION=${inputs.description}`,
  );

  const fullPackagePath = path.join(BASE_DIR, inputs.package_dir);

  if (!fs.existsSync(fullPackagePath)) {
    core.setFailed(`${inputs.package_dir} directory doesn't exist.`);
    return;
  }

  const entries = fs.readdirSync(fullPackagePath, { withFileTypes: true });
  const packageDirs = entries.filter((entry) => entry.isDirectory());

  core.debug(
    `Found ${entries.length} entries; ${packageDirs.length} package directories`,
  );

  if (packageDirs.length === 0) {
    core.setFailed(`${inputs.package_dir} contains no packages.`);
    return;
  }

  core.info(
    `Found ${packageDirs.length} package(s) in /${inputs.package_dir}:`,
  );
  packageDirs.forEach((dir) => core.info(`- ${dir.name}`));

  const zipPath = path.join(BASE_DIR, "packages.zip");

  core.info(`Archiving individual packages...`);
  const zippedPackages = await zipIndividualPackages(
    packageDirs,
    fullPackagePath,
  );

  core.info(`Archiving packages to ${zipPath}...`);
  await zipFiles(zippedPackages, zipPath);

  core.info("Uploading packages to Lonti Console...");
  const result = await consoleHelper.uploadPackages(
    inputs.access_token,
    inputs.instance_name,
    inputs.tag,
    inputs.description,
    zipPath,
  );

  if (result.code >= 200 && result.code < 300) {
    core.notice(
      `Code: ${result.code} | Message: ${result.message} | Content: ${result.content}`,
    );
  } else {
    core.setFailed(
      `Code: ${result.code} | Message: ${result.message} | Content: ${result.content}`,
    );
  }
}

main();
