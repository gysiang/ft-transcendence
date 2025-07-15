FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN apk update && apk sqlite

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
