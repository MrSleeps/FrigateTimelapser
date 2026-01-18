FROM node:20-alpine
RUN mkdir -p /app/node_modules
RUN mkdir -p /app/public
RUN mkdir -p /app/public/css
RUN mkdir -p /app/public/js
RUN mkdir -p /app/public/images
RUN mkdir -p /app/files
RUN mkdir -p /app/views
RUN mkdir -p /app/public/favicons
RUN mkdir -p /app/data
RUN mkdir -p /app/public/fonts
WORKDIR /app
COPY data/* /app/data
COPY .env /app
COPY *.js /app
COPY package*.json /app
COPY public/package*.json /app/public
COPY public/css/*.css /app/public/css
COPY public/js/* /app/public/js
COPY public/images/* /app/public/images
COPY views/ /app/views
COPY public/favicons/*.* /app/public/favicons
COPY public/fonts/*.* /app/public/fonts
RUN npm install
RUN apk update
RUN apk upgrade
RUN apk add --no-cache ffmpeg
RUN apk add --no-cache curl
HEALTHCHECK --start-period=120s --start-interval=5s --interval=15s --timeout=5s --retries=3 \
    CMD curl --fail --silent --show-error http://127.0.0.1:8500/healthcheck || exit 1
EXPOSE 8500
CMD [ "node", "server.js" ]
