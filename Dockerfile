# Etapa de build
# Feito por Luis Fernando
# 29-05-2025
FROM node:20.11.0 as build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install -g @angular/cli@14.2.13
RUN npm install

COPY . .

RUN ng build --configuration=production
FROM nginx:stable-alpine
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/captive-portal /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
