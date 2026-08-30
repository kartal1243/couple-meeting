FROM node:22-slim

RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "index.js"]
