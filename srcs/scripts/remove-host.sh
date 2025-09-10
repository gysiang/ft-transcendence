#!/bin/bash

# Custom domain you want to map
DOMAIN="pong.42.fr"

# Check if it's already in /etc/hosts
if grep -q "$DOMAIN" /etc/hosts; then
    echo "Removing $DOMAIN from /etc/hosts"
    sudo sed -i.bak "/$DOMAIN/d" /etc/hosts
    echo "Done! $DOMAIN removed from /etc/hosts"
else
    echo "$DOMAIN not found in /etc/hosts"
fi
