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

if [[ -z $RELEASE_STRATEGY ]]; then
  echo "Error: No version strategy specified."
  exit 1
fi

IS_MONOREPO_WITH_INDEPENDENT_VERSIONS=$(test "$(jq 'has("workspaces")' package.json)" = "true" && "$RELEASE_STRATEGY" = "independent")

if [[ $IS_MONOREPO_WITH_INDEPENDENT_VERSIONS && -z $RELEASE_PACKAGES ]]; then
  echo "Error: No updated packages specified."
  exit 1
fi

gh release create \
  "v$RELEASE_VERSION" \
  --title "$RELEASE_VERSION" \
  --notes "$RELEASE_NOTES"

if [[ $IS_MONOREPO_WITH_INDEPENDENT_VERSIONS ]]; then
  echo "independent versioning strategy"

  git config user.name github-actions
  git config user.email github-actions@github.com

  while read -r name version; do
    git tag "${name}@${version}" HEAD
    git push --tags
  done< <(echo "$RELEASE_PACKAGES" | jq --raw-output '.packages[] | "\(.name) \(.version)"')
fi
