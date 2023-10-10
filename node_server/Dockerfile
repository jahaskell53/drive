FROM ubuntu


RUN apt-get update && apt-get install -y npm

WORKDIR /app

COPY . /app

RUN npm install

CMD [ "node", "node_client.js" ]
