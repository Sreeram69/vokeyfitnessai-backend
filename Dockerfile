# Use lightweight, secure Node.js Alpine base image
FROM node:20-alpine
WORKDIR /app

# Install production-only packages to keep container size highly optimized
COPY package*.json ./
RUN npm ci --only=production

# Copy application source files
COPY . .

# Set default production runtime environment parameters
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Execute server bootup cleanly
CMD ["node", "server.js"]
