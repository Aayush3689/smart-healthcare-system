# Stage 1: Build the React/Vite app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source files
COPY . .

# Build Vite application directly for production
RUN npx vite build

# Stage 2: Serve the built app with Nginx
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]