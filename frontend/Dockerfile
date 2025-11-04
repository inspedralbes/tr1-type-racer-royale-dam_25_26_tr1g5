# ==============================
#   STAGE 1 – Build amb Node
# ==============================
FROM node:20-alpine AS build
WORKDIR /app

# Copiem els fitxers de dependències primer per aprofitar cache
COPY package*.json ./
RUN npm ci

# Copiem la resta del projecte
COPY . .

# Definim la variable d'entorn (pots passar-la com ARG)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Compilem el projecte amb Vite
RUN npm run build


# ==============================
#   STAGE 2 – Serve amb Nginx
# ==============================
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Copiem els fitxers generats del build
COPY --from=build /app/dist .

# Copiem la configuració de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposem el port 80 (el del Nginx)
EXPOSE 80

# Arranquem Nginx
CMD ["nginx", "-g", "daemon off;"]
