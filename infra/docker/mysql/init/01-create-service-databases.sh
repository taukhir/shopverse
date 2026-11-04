#!/bin/sh
set -eu

run_mysql() {
  if [ -n "${MYSQL_HOST:-}" ]; then
    MYSQL_PWD="${MYSQL_ROOT_PASSWORD}" mysql --protocol=tcp --host="${MYSQL_HOST}" -uroot
  else
    MYSQL_PWD="${MYSQL_ROOT_PASSWORD}" mysql --protocol=socket -uroot
  fi
}

if [ -n "${MYSQL_HOST:-}" ]; then
  attempt=1
  until MYSQL_PWD="${MYSQL_ROOT_PASSWORD}" mysql \
      --protocol=tcp \
      --host="${MYSQL_HOST}" \
      -uroot \
      --execute="SELECT 1" >/dev/null 2>&1; do
    if [ "${attempt}" -ge 30 ]; then
      echo "MySQL did not accept bootstrap connections after ${attempt} attempts." >&2
      exit 1
    fi

    attempt=$((attempt + 1))
    sleep 2
  done
fi

run_mysql <<SQL
CREATE DATABASE IF NOT EXISTS order_service;
CREATE DATABASE IF NOT EXISTS inventory_service;
CREATE DATABASE IF NOT EXISTS payment_service;

GRANT ALL PRIVILEGES ON order_service.* TO '${MYSQL_USER}'@'%';
GRANT ALL PRIVILEGES ON inventory_service.* TO '${MYSQL_USER}'@'%';
GRANT ALL PRIVILEGES ON payment_service.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL
