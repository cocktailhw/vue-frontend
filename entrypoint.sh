#!/bin/sh
set -e

# Runtime frontend env (public by design — never put secrets here)
echo "window._env_ = {" > /usr/share/nginx/html/env-config.js
echo "  APP_ENV: \"${APP_ENV:-PRODUCTION}\"," >> /usr/share/nginx/html/env-config.js
echo "  API_BASE_URL: \"${API_BASE_URL:-/api}\"" >> /usr/share/nginx/html/env-config.js
echo "};" >> /usr/share/nginx/html/env-config.js

# Backend upstream is injected at runtime (not stored in the public repo)
BACKEND_UPSTREAM="${BACKEND_UPSTREAM:-http://backend:8080}"

# Extra nginx allow lines for Swagger / OpenAPI (e.g. 'allow 203.0.113.10;')
# Keep personal/public IPs out of git — pass via CI/CD or docker -e
SWAGGER_WHITELIST_RULE="${SWAGGER_WHITELIST_RULE:-}"

TMP_CONF="$(mktemp)"
sed "s|__BACKEND_UPSTREAM__|${BACKEND_UPSTREAM}|g" \
  /etc/nginx/nginx.conf.template > "$TMP_CONF"

# Substitute ${SWAGGER_WHITELIST_RULE} (supports multi-line allow rules)
export SWAGGER_WHITELIST_RULE
if command -v envsubst >/dev/null 2>&1; then
  envsubst '${SWAGGER_WHITELIST_RULE}' < "$TMP_CONF" > /etc/nginx/conf.d/default.conf
else
  # Fallback when gettext/envsubst is unavailable
  awk -v rule="$SWAGGER_WHITELIST_RULE" '{
    gsub(/\$\{SWAGGER_WHITELIST_RULE\}/, rule)
    print
  }' "$TMP_CONF" > /etc/nginx/conf.d/default.conf
fi
rm -f "$TMP_CONF"

exec "$@"
