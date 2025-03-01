FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --force

COPY . .

RUN npm run build

EXPOSE 7000

CMD ["npm", "run", "start:prod"]
