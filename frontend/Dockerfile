# pull the Node.js Docker image
FROM node:alpine

# create the directory inside the container
WORKDIR /usr/src/app

COPY . .

RUN npm install && npm install -g serve && rm -rf dist && npm run build

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]