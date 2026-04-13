#!/bin/bash
echo "Building Nakama modules..."
npx esbuild src/tictactoe.ts \
  --bundle=false \
  --platform=node \
  --target=es5 \
  --outdir=modules
echo "Build complete! Check modules/tictactoe.js"