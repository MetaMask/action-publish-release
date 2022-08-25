#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

NAME=$(jq --raw-output .name "package.json")
VERSION=$(jq --raw-output .version "package.json")

echo "$NAME@$VERSION"
