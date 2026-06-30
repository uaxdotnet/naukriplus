#!/bin/bash
VERSION=$(grep '"version"' manifest.json | sed 's/.*"version": "\([^"]*\)".*/\1/')
ZIP="naukriplus_v${VERSION}.zip"

echo "Packaging NaukriPlus v${VERSION}..."

zip -r "$ZIP" \
  manifest.json \
  naukriplus.js \
  naukriplus.inject.js \
  icons/icon.svg \
  icons/icon.png \
  icons/icon128.png \
  screenshots/screenshot1.png \
  -x "*.DS_Store" -x "__MACOSX/*"

echo "Done: $ZIP"
ls -lh "$ZIP"
