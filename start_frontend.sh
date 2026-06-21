#!/bin/bash
echo "🚀 Starting UENR STARS Frontend..."
cd "$(dirname "$0")/frontend"
npm install
echo "✅ Frontend ready. Starting on http://localhost:3000"
REACT_APP_API_URL=http://localhost:8000 npm start
