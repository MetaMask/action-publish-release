#!/usr/bin/env bash

set -x
set -e
set -o pipefail

if [[ -z $RELEASE_NOTES ]]; then
  echo "Error: RELEASE_NOTES environment variable not set."
  exit 1
fi

RELEASE_VERSION="${1}"

if [[ -z $RELEASE_VERSION ]]; then
  echo "Error: No release version specified."
  exit 1
fi

gh release create \
  "v$RELEASE_VERSION" \
  --title "$RELEASE_VERSION" \
  --notes "$RELEASE_NOTES"
