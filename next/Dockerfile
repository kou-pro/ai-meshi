FROM node:20-alpine

WORKDIR /app

# nextフォルダ内のpackage.jsonをコピー
COPY next/package.json next/package-lock.json ./

RUN npm install

# nextフォルダの中身をコピー
COPY next .

EXPOSE 3000

CMD ["npm", "run", "dev"]