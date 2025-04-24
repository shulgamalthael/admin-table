# pull the Node.js Docker image
FROM node:alpine

RUN npm install && npm install -g serve && rm -rf dist && npm run build

EXPOSE 5173

CMD ["serve", "-s", "build", "-l", "5173"]