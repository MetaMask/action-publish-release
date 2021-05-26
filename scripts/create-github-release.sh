#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

RELEASE_VERSION="${1}"
RELEASE_NOTES="${2}"

if [[ -z $RELEASE_VERSION ]]; then
  echo "Error: No release version specified."
  exit 1
fi

if [[ -z $RELEASE_NOTES ]]; then
  echo "Error: No release notes specified."
  exit 1
fi

gh release create \
  --title "$RELEASE_VERSION" \
  --notes "$RELEASE_NOTES" \
  "v$RELEASE_VERSION"
