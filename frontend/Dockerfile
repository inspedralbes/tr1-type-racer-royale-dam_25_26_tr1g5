FROM node:20 AS build
WORKDIR /app
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable
COPY --from=build /app/dist /usr/share/nginx/html
# SPA fallback a Nginx del "frontend" intern (no el proxy extern):
RUN printf "server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files \$uri /index.html; } }" > /etc/nginx/conf.d/default.conf
EXPOSE 80
