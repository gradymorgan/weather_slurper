FROM node:8

ENV INFLUX_HOST influxdb
ENV INFLUX_PORT 8086
ENV INFLUX_DB weather

ENV WEATHERFLOW_PORT 50222
ENV HTTP_PUT_PORT 3000

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3000
EXPOSE 50222/udp

CMD [ "npm", "start" ]

