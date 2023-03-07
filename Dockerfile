FROM node:16.14.0-alpine3.14@sha256:98a87dfa76dde784bb4fe087518c839697ce1f0e4f55e6ad0b49f0bfd5fbe52c AS node_modules
WORKDIR /app
COPY package-lock.json package.json ./
RUN npm install
COPY . .

FROM node_modules AS prod_builder
RUN npm run build

FROM nginx:1.20.2-alpine@sha256:016789c9a2d021b2dcb5e1c724c75ab0a57cc4e8cd7aab7bb28e69fec7c8c4fc AS prod
COPY --from=prod_builder /app/build /usr/share/nginx/html
# Default HTTP port of Nginx.
EXPOSE 80

FROM node_modules AS dev
EXPOSE 3000
CMD npm run start
