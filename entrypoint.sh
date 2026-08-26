#!/bin/sh
set -e

# Runtime frontend env (public by design — never put secrets here)
echo "window._env_ = {" > /usr/share/nginx/html/env-config.js
echo "  APP_ENV: \"${APP_ENV:-PRODUCTION}\"," >> /usr/share/nginx/html/env-config.js
echo "  API_BASE_URL: \"${API_BASE_URL:-/api}\"" >> /usr/share/nginx/html/env-config.js
echo "};" >> /usr/share/nginx/html/env-config.js

# Backend upstream is injected at runtime (not stored in the public repo)
BACKEND_UPSTREAM="${BACKEND_UPSTREAM:-http://backend:8080}"
sed "s|__BACKEND_UPSTREAM__|${BACKEND_UPSTREAM}|g" \
  /etc/nginx/nginx.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"
