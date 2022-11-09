#!/usr/bin/env bash

set -x
set -e
set -o pipefail

npm_registry_uri_fragment=${NPM_REGISTRY_URI_FRAGMENT:-//registry.npmjs.org/}

# Set registry
npm config set registry "https:$npm_registry_uri_fragment"
yarn config set npmPublishRegistry "https:$npm_registry_uri_fragment"

if [[ -n $NPM_TOKEN ]]; then
  # Set token
  npm config set "$npm_registry_uri_fragment:_authToken" "$NPM_TOKEN"
  yarn config set npmAuthToken "$NPM_TOKEN"
fi
