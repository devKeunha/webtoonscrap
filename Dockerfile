FROM node
WORKDIR /app
WORKDIR /app/data
COPY package*.json ./
RUN npm install -g npm@9.7.2
RUN npm install
COPY . .
EXPOSE 8080
CMD [ "npm", "start" ]