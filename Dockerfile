# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set environment variable to hardcode port 8080
ENV PORT=8080

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY server-package.json package.json
COPY package-lock.json* pnpm-lock.yaml* ./

# Install dependencies
RUN npm install

# Copy the server files
COPY server.js ./
COPY lib/ ./lib/

# Expose port 8080
EXPOSE 8080

# Start the server
CMD ["npm", "start"] 
