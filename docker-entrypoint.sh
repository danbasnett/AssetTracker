#!/bin/sh
set -e

echo "Waiting for database..."
until npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  sleep 1
done

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting Asset Tracker..."
exec node server.mjs
