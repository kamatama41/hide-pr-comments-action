FROM node:14-alpine3.12

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY index.js .

CMD [ "node", "/usr/src/app/index.js" ]
