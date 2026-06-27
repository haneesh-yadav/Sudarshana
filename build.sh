#!/usr/bin/env bash
set -e

echo "==> Lint..."
npm run lint

echo "==> Tests..."
npm run test

echo "==> Frontend build..."
npm run build

echo ""
echo "All checks passed."
