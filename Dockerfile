# Multi-stage build for SparkTest Cloud
FROM node:18-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY apps/saas/frontend/package.json ./apps/saas/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build packages
RUN pnpm build

# Production stage
FROM node:18-alpine AS production

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy built application
COPY --from=base /app ./

# Expose port
EXPOSE 3000

# Start the frontend application
CMD ["pnpm", "dev", "--filter", "@tatou/frontend"]
