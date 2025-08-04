# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for better caching
RUN apk add --no-cache python3 make g++

# Copy package files first for better layer caching
COPY server-package.json package.json
COPY package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN npm install

# Copy the server files
COPY server.js ./
COPY lib/ ./lib/

# Create .env.local file if it doesn't exist (will be overridden by environment variables)nig
RUN touch .env.local

# Expose the port the server runs on
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const req = http.request({hostname: 'localhost', port: 8001, path: '/health', method: 'GET'}, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

# Start the server
CMD ["npm", "start"] 