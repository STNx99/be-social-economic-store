# Use the official Bun image
FROM oven/bun:latest AS base
WORKDIR /usr/src/app

# Install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# Copy dependencies and source code
FROM base AS release
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Expose the port Hono usually runs on (default is often 3000)
EXPOSE 3000

# Run the application
USER bun
ENTRYPOINT [ "bun", "run", "src/index.ts" ]