# Build stage
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

COPY src/ ./src/

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built JavaScript files from builder stage
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]