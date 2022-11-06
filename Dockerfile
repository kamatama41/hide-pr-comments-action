FROM node:18-alpine3.16

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY index.js .

CMD [ "node", "/usr/src/app/index.js" ]
