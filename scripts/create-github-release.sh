#!/usr/bin/env bash

set -x
set -e
set -o pipefail

script_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

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

gh release create \
  "v$RELEASE_VERSION" \
  --title "$RELEASE_VERSION" \
  --notes "$RELEASE_NOTES"

if [[ "$(jq 'has("workspaces")' package.json)" = "true" && "$VERSION_STRATEGY" = "independent"  ]]; then
  echo "independent versioning strategy"
  # todo: iterate over $UPDATED_PACKAGES instead
  yarn workspaces foreach --no-private --verbose exec "$script_path/tag.sh"
fi
