FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/shopverse-web/browser /usr/share/nginx/html

# nginx only needs writable cache/PID paths; static assets remain read-only.
RUN sed -i -e 's@^[[:space:]]*pid[[:space:]].*;@pid /tmp/nginx.pid;@' \
    -e '/^[[:space:]]*user[[:space:]]/d' /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /var/cache/nginx

USER nginx
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
