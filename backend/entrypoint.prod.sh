#!/bin/sh
# Production entrypoint: backend (project2-backend).
# Runs migrations + collectstatic, then serves via gunicorn.
set -e

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 2 \
  --timeout 60 \
  --access-logfile - \
  --error-logfile -
