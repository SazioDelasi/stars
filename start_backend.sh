#!/bin/bash
echo "🚀 Starting UENR STARS Backend..."
cd "$(dirname "$0")/backend"
pip install -r requirements.txt --break-system-packages -q
python manage.py migrate
python seed_data.py 2>/dev/null || echo "(seed already done)"
echo "✅ Backend ready. Starting server on http://localhost:8000"
python manage.py runserver 0.0.0.0:8000
