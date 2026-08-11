# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /src
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:prod

FROM nginx:1.27-alpine AS final
# Both must be defined so envsubst always substitutes them in the template.
# API_URL = API origin (scheme+host, no /api); API_HOST = bare host for the Host header.
ENV API_URL=http://localhost:5201
ENV API_HOST=localhost:5201
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /src/dist/prumo-erp /usr/share/nginx/html
EXPOSE 8080
