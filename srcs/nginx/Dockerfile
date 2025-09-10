FROM nginx:stable-alpine

RUN apk add --no-cache openssl

# Create directories
RUN mkdir -p /etc/nginx/ssl /var/www/html

# Generate SSL certificates (with explicit paths)
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/pong.42.fr.key \
    -out /etc/nginx/ssl/pong.42.fr.crt \
    -subj "/C=SG/ST=Singapore/L=Singapore/O=42School/OU=42/CN=pong.42.fr" \
    && chmod 644 /etc/nginx/ssl/pong.42.fr.crt \
    && chmod 600 /etc/nginx/ssl/pong.42.fr.key

COPY default.conf /etc/nginx/conf.d/default.conf
