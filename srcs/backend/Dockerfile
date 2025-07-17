FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN apk update && apk add sqlite

RUN npm install

COPY . .

COPY secrets/.env ./secrets/.env

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
