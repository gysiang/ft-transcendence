FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends sqlite3 && \
    rm -rf /var/lib/apt/lists/*

# Copy project files
COPY . .

COPY secrets/.env ./secrets/.env

# Install dependencies (force rebuild sodium-native) and build project
RUN npm install && npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
