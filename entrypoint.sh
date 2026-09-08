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

# ---------------------------------------------------------------------------
# Swagger Basic Auth — build /etc/nginx/.htpasswd before nginx starts
# Env (K8s Secret / docker -e, never commit):
#   SWAGGER_USER
#   SWAGGER_PASSWORD
# ---------------------------------------------------------------------------
HTPASSWD_FILE=/etc/nginx/.htpasswd

hash_password() {
  _plain="$1"
  if command -v openssl >/dev/null 2>&1; then
    # Apache MD5 (apr1) — compatible with nginx auth_basic_user_file
    openssl passwd -apr1 "$_plain"
    return 0
  fi
  if command -v htpasswd >/dev/null 2>&1; then
    # -nbB: bcrypt hash line "user:hash" → take hash only via cut if needed
    # Prefer openssl path; htpasswd used as full-line fallback in caller
    return 1
  fi
  return 1
}

if [ -n "${SWAGGER_USER:-}" ] && [ -n "${SWAGGER_PASSWORD:-}" ]; then
  if HASH="$(hash_password "${SWAGGER_PASSWORD}")"; then
    echo "${SWAGGER_USER}:${HASH}" > "$HTPASSWD_FILE"
  elif command -v htpasswd >/dev/null 2>&1; then
    htpasswd -nbB "${SWAGGER_USER}" "${SWAGGER_PASSWORD}" > "$HTPASSWD_FILE"
  else
    echo "ERROR: need openssl or htpasswd to create ${HTPASSWD_FILE}" >&2
    exit 1
  fi
  chmod 644 "$HTPASSWD_FILE"
  echo "Swagger Basic Auth enabled for user: ${SWAGGER_USER}"
else
  # No credentials → auth file invalid so all Basic Auth attempts fail
  echo "# SWAGGER_USER / SWAGGER_PASSWORD not set — Swagger locked" > "$HTPASSWD_FILE"
  chmod 644 "$HTPASSWD_FILE"
  echo "WARN: SWAGGER_USER/SWAGGER_PASSWORD unset; Swagger Basic Auth has no valid users" >&2
fi

exec "$@"
