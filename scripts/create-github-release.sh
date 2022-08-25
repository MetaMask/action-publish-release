#!/usr/bin/env bash

set -x
set -e
set -o pipefail

if [[ -z $RELEASE_NOTES ]]; then
  echo "Error: RELEASE_NOTES environment variable not set."
  exit 1
fi

if [[ -z $RELEASE_VERSION ]]; then
  echo "Error: No release version specified."
  exit 1
fi

if [[ -z $VERSION_STRATEGY ]]; then
  echo "Error: No version strategy specified."
  exit 1
fi

if [[ -z $UPDATED_PACKAGES ]]; then
  echo "Error: No updated packages specified."
  exit 1
fi

gh release create \
  "v$RELEASE_VERSION" \
  --title "$RELEASE_VERSION" \
  --notes "$RELEASE_NOTES"

if [[ "$(jq 'has("workspaces")' package.json)" = "true" && "$VERSION_STRATEGY" = "independent"  ]]; then
  echo "independent versioning strategy"

  git config user.name github-actions
  git config user.email github-actions@github.com

  while read -r name version; do
    git tag "${name}@${version}" HEAD
    git push --tags
  done< <(echo "$UPDATED_PACKAGES" | jq --raw-output '.packages[] | "\(.name) \(.version)"')
fi
