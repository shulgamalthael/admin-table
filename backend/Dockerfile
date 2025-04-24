# pull the Node.js Docker image
FROM node:alpine

# create the directory inside the container
WORKDIR /usr/src/app

COPY . .

RUN npm install && npm run build

EXPOSE 5000

CMD ["node", "./dist/src/index.js"]