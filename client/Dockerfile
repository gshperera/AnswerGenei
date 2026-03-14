# ---- STAGE 1: BUILDER ----

# Contains everything needed to BUILD the app
FROM node:24-alpine AS builder

# Add this line to accept build argument
ARG NEXT_PUBLIC_API_URL
# Set it as environment variable for the build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /app

# copy package files and install dependencies
# Docker chaches layer - if these files don't change, it reuses this layer
COPY package.json package-lock.json* ./

# Install ALL dependencies (including dev dependencies needed for build)
# ci - (clean install) - uses package-lock.json exactly
RUN npm ci

# copy the rest of your code
COPY . .

# Add debug logging in Dockerfile
RUN echo "🔧 Docker build - NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"

# This creates the .next folder with optimized static files
RUN npm run build

# ---- STAGE 2: RUNNER ----
# This stage contains ONLY what's needed to RUN the app
FROM node:24-alpine AS runner

WORKDIR /app

# set to production environment
ENV NODE_ENV=production
# Pass the build arg to runtime if needed
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public                     
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose the port the app runs on
EXPOSE 3000

# Run the Next.js application
CMD ["node", "server.js"]
