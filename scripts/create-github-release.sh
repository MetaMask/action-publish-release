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

if [[ -z $VERSIONING_STRATEGY ]]; then
  echo "Error: No versioning strategy specified."
  exit 1
fi

IS_MONOREPO_WITH_INDEPENDENT_RELEASES=0
IS_MONOREPO_WITH_INDEPENDENT_VERSIONS=0

if [[ "$(jq 'has("workspaces")' package.json)" = "true" ]]; then
  if [[ "$VERSIONING_STRATEGY" = "independent" ]]; then
    IS_MONOREPO_WITH_INDEPENDENT_VERSIONS = 1
    if [[ "$RELEASE_STRATEGY" = "independent" ]]; then
      IS_MONOREPO_WITH_INDEPENDENT_RELEASES = 1
    fi
  elif [[ "$RELEASE_STRATEGY" = "independent" ]]; then
    echo "Warning: Using release strategy of combined instead of independent, since versioning strategy is set to fixed."
  fi
fi

if [[ $IS_MONOREPO_WITH_INDEPENDENT_VERSIONS -eq 1 && -z $RELEASE_PACKAGES ]]; then
  echo "Error: No updated packages specified."
  exit 1
fi

if [[ $IS_MONOREPO_WITH_INDEPENDENT_RELEASES ]]; then
  echo "independent release strategy"

  while read -r name version; do
    PACKAGE_RELEASE_NOTES = $(echo "$RELEASE_NOTES" | jq --arg keyvar "$name" '.[$keyvar]')
    gh release create \
      "${name}@${version}" \
      --notes "$PACKAGE_RELEASE_NOTES"
  done< <(echo "$RELEASE_PACKAGES" | jq --raw-output '.packages[] | "\(.name) \(.version)"')
else
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
fi
