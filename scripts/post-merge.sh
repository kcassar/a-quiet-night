#!/bin/bash
set -e

# Install dependencies for all sub-packages after a task merge.
npm install --prefix server
npm install --prefix client
