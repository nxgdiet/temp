#!/bin/sh

echo "🚀 Starting TokenRivals WebSocket Server..."
echo "📋 Environment variables:"
echo "  - PORT: $PORT"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - PWD: $(pwd)"
echo "  - Files in current directory:"
ls -la

echo "📦 Installing dependencies..."
npm install

echo "🎯 Starting server..."
exec node server.js 