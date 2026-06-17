FROM node:22-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY apps/web apps/web
COPY packages packages

EXPOSE 3000

CMD ["npm", "--workspace", "apps/web", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]
