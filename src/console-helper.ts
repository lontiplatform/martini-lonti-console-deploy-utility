import path from "path";
import * as core from "@actions/core";
import { fetch, FormData } from "undici";
import { openAsBlob } from "node:fs";

interface ConsoleUploadResponse {
  code: number;
  message: string;
  content: string;
}

export async function uploadPackages(
  accessToken: string,
  instanceName: string,
  tag: string,
  description: string,
  zipFilePath: string,
): Promise<ConsoleUploadResponse> {
  core.debug(`Preparing to upload packages. Zip path: ${zipFilePath}`);

  const fileBlob = await openAsBlob(zipFilePath);
  const filename = path.basename(zipFilePath);

  const form = new FormData();
  form.set("instanceName", instanceName);
  form.set("tags", tag);
  form.set("description", description);
  form.set("file", fileBlob, filename);

  core.debug(
    `Form data prepared with instanceName: ${instanceName}, tag: ${tag}`,
  );

  const response = await fetch(
    "https://console.lonti.com/api/v2/managed-hosting/deploy",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    },
  );

  core.debug(`HTTP response status: ${response.status}`);

  const status = response.status;
  let responseBody: ConsoleUploadResponse | null = null;
  let rawText: string | null = null;

  try {
    responseBody = (await response.json()) as ConsoleUploadResponse;
    core.debug(`Response JSON parsed: ${JSON.stringify(responseBody)}`);
  } catch (error) {
    core.debug(
      `Response JSON parse failed: ${(error as Error).message}, reading as text`,
    );
    rawText = await response.text();
    core.debug(`Response raw text: ${rawText}`);
  }

  if (responseBody) {
    return responseBody;
  }

  return {
    code: status,
    message: rawText ? "Non-JSON error" : "Unknown error",
    content: rawText ?? "No response body available",
  };
}
