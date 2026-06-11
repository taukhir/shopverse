#!/bin/sh
set -eu

mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS order_service;
CREATE DATABASE IF NOT EXISTS inventory_service;
CREATE DATABASE IF NOT EXISTS payment_service;

GRANT ALL PRIVILEGES ON order_service.* TO '${MYSQL_USER}'@'%';
GRANT ALL PRIVILEGES ON inventory_service.* TO '${MYSQL_USER}'@'%';
GRANT ALL PRIVILEGES ON payment_service.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
SQL
