#!/bin/bash

# Custom domain you want to map
DOMAIN="pong.42.fr"
IP="127.0.0.1"

# Check if it's already in /etc/hosts
if grep -q "$DOMAIN" /etc/hosts; then
    echo "$DOMAIN already exists in /etc/hosts"
else
    echo "Adding $DOMAIN to /etc/hosts"
    # Use tee with sudo to append
    echo "$IP    $DOMAIN" | sudo tee -a /etc/hosts > /dev/null
    echo "Done! You can now access http://$DOMAIN"
fi
