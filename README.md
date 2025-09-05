# Martini Build Pipeline Lonti Managed Hosting

This GitHub Action builds, archives, and deploys Martini packages to **Martini Essentials** or **Elastic server instances** via the **Lonti Console**.  
It is packaged as a Docker-based GitHub Action and automatically published to Docker Hub on tagged releases.

## Usage

Here’s an example workflow using this action:

```yaml
name: Deploy Martini Package to Lonti Console

on: [push]

jobs:
  deploy:
    name: Deploy package
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - name: Deploy Martini package to Lonti Console
        uses: lontiplatform/martini-build-pipeline-lonti-managed-hosting@v1.0.0
        with:
          instance_name: my-martini-instance.el.server.com
          access_token: ${{ secrets.ACCESS_TOKEN }}
```

## Inputs

| Variable        | Required | Default                                                    | Description                                     |
| --------------- | -------- | ---------------------------------------------------------- | ----------------------------------------------- |
| `instance_name` | Yes      | –                                                          | Name of the Martini instance.                   |
| `access_token`  | Yes      | –                                                          | Access token from Lonti Console.                |
| `base_dir`      | No       | *(empty)*                                                  | Base directory for package lookup.              |
| `package_dir`   | No       | `packages`                                                 | Directory containing packages.                  |
| `description`   | No       | `Deployed by Martini Build Pipeline Lonti Managed Hosting` | Description attached to the deployment.         |
| `tag`           | No       | `latest`                                                   | Tag applied to the deployment.                  |

