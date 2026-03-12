# To pin to an immutable digest (recommended for production), run:
#   docker pull node:22-bookworm-slim
#   docker inspect node:22-bookworm-slim --format '{{index .RepoDigests 0}}'
# Then replace the tag below with the digest, e.g.:
#   FROM node@sha256:<digest>
FROM node:22-bookworm-slim AS build

# VITE_API_URL is intentionally left empty — nginx proxies /api to the backend.
# Override at build time if you prefer direct API calls: --build-arg VITE_API_URL=https://...
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /usr/src/app

COPY package*.json package-lock.json ./

RUN npm ci

COPY ./ ./

RUN npm run build

# To pin the nginx image:
#   docker pull nginx:stable-alpine
#   docker inspect nginx:stable-alpine --format '{{index .RepoDigests 0}}'
FROM nginx:stable-alpine AS production

COPY --from=build /usr/src/app/nginx /etc/nginx/conf.d
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]