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

# Swagger Basic Auth credentials (pass via CI/CD / K8s Secret — never commit)
# SWAGGER_BASIC_USER / SWAGGER_BASIC_PASSWORD
HTPASSWD_FILE=/etc/nginx/.htpasswd
if [ -n "${SWAGGER_BASIC_USER:-}" ] && [ -n "${SWAGGER_BASIC_PASSWORD:-}" ]; then
  if command -v openssl >/dev/null 2>&1; then
    HASH="$(openssl passwd -apr1 "${SWAGGER_BASIC_PASSWORD}")"
    echo "${SWAGGER_BASIC_USER}:${HASH}" > "$HTPASSWD_FILE"
  elif command -v htpasswd >/dev/null 2>&1; then
    htpasswd -nbB "${SWAGGER_BASIC_USER}" "${SWAGGER_BASIC_PASSWORD}" > "$HTPASSWD_FILE"
  else
    echo "ERROR: openssl or htpasswd required to build .htpasswd" >&2
    exit 1
  fi
  chmod 644 "$HTPASSWD_FILE"
else
  # No credentials → all Basic Auth attempts fail (Swagger stays locked)
  echo "# SWAGGER_BASIC_USER/PASSWORD not set" > "$HTPASSWD_FILE"
  chmod 644 "$HTPASSWD_FILE"
fi

exec "$@"
