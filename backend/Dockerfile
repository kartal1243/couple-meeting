FROM node:22-slim

RUN apt-get update && apt-get install -y python3 python3-pip build-essential g++ make && rm -rf /var/lib/apt/lists/*
RUN pip3 install --break-system-packages yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "index.js"]
