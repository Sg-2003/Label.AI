#!/bin/bash
set -e
echo "==> Installing client dependencies..."
npm install --prefix client
echo "==> Building client..."
npm run build --prefix client
echo "==> Build complete!"
