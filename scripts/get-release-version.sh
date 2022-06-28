#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

RELEASE_VERSION=$(jq --raw-output .version package.json)
echo "::set-output name=RELEASE_VERSION::$RELEASE_VERSION"
