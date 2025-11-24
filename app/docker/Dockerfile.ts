FROM node:alpine

WORKDIR /usr/src/app

RUN npm install -g typescript ts-node

CMD ["ts-node"]
