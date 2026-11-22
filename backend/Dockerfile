# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definition files
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma

# Install all dependencies (including devDependencies for build and prisma)
RUN npm ci

# Copy source code and configuration files
COPY . .

# Generate Prisma Client and build NestJS
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy package manifests and Prisma schema for production runtime
COPY package*.json prisma.config.ts ./
COPY prisma ./prisma

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled files and generated prisma client from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/scripts ./scripts

# Ensure uploads directory exists
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "dist/main.js"]
