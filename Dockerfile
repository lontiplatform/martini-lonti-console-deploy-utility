FROM node:24-alpine

LABEL \
  maintainer="Lonti <support@lonti.com>" \
  org.opencontainers.image.title="martini-lonti-console-deploy-utilty" \
  org.opencontainers.image.description="Archives and deploys packages to Martini Essentials and Elastic server instances via the Lonti Console." \
  org.opencontainers.image.authors="Lonti <support@lonti.com>" \
  org.opencontainers.image.url="https://github.com/lontiplatform/martini-lonti-console-deploy-utilty" \
  org.opencontainers.image.vendor="https://lonti.com" \
  org.opencontainers.image.licenses="MIT"

COPY LICENSE README.md ./

COPY dist/ ./dist/

COPY entrypoint.sh ./entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
