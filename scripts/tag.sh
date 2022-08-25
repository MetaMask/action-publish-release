#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

NAME=$(jq --raw-output .name "package.json")
VERSION=$(jq --raw-output .version "package.json")

git config user.name github-actions
git config user.email github-actions@github.com

echo "${NAME}@${VERSION}"
git tag "${NAME}@${VERSION}" HEAD
git push --tags
