#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

RELEASE_BRANCH_PREFIX="${1}"
RELEASE_NOTES="${2}"

if [[ -z $RELEASE_BRANCH_PREFIX ]]; then
  echo "Error: No release branch prefix specified."
  exit 1
fi

if [[ -z $RELEASE_NOTES ]]; then
  echo "Error: No release notes specified."
  exit 1
fi

NEW_VERSION="${GITHUB_HEAD_REF#$RELEASE_BRANCH_PREFIX}"

gh release create \
  --title "$NEW_VERSION" \
  --notes "$RELEASE_NOTES" \
  "$NEW_VERSION"
