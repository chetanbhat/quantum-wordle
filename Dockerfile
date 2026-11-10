FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package-lock.json package.json ./
RUN npm ci
COPY . .

FROM dependencies AS prod_builder
RUN npm run build

FROM nginx:stable-alpine AS prod
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=prod_builder /app/build /usr/share/nginx/html
EXPOSE 80

FROM dependencies AS dev
EXPOSE 3000
CMD ["npm", "start"]
