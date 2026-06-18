#!/bin/bash
set -e

# Install dependencies for all sub-packages after a task merge.
# NODE_ENV=development ensures devDependencies (tsx, vite, etc.) are included.
NODE_ENV=development npm install
NODE_ENV=development npm install --prefix server
NODE_ENV=development npm install --prefix client
