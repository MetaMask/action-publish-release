#!/usr/bin/env bash

set -x
set -e
set -o pipefail

if [[ -z $NPM_TOKEN ]]; then
  echo "Error: NPM_TOKEN environment variable not set."
  exit 1
fi

npm config set //registry.npmjs.org/:_authToken ${NPM_TOKEN}
npm publish
