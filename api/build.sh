#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

python manage.py collectstatic --no-input

python manage.py migrate

DJANGO_SUPERUSER_PASSWORD=12345678 python manage.py createsuperuser --noinput --username Sazio --email sazio@admin.com

python manage.py seed_data