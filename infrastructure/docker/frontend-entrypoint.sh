#!/bin/sh

# Substitute environment variables in the Nginx configuration file
envsubst '$VITE_API_BASE_URL' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Execute the main Nginx command
exec "$@"
