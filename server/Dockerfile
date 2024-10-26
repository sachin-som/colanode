# Build stage
FROM node:20-alpine as builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY src/ ./src/

# Build and verify output
RUN npm run build && \
    ls -la dist/ && \
    if [ ! -f dist/index.js ]; then \
        echo "dist/index.js not found after build!" && \
        exit 1; \
    fi

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built JavaScript files from builder stage
COPY --from=builder /app/dist ./dist

# Verify files were copied correctly
RUN ls -la dist/ && \
    if [ ! -f dist/index.js ]; then \
        echo "dist/index.js not found in production stage!" && \
        exit 1; \
    fi

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]