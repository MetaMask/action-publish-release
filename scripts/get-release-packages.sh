#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

# ============================================================================
# This script determines which packages to publish in a monorepo. It filters
# the collection of package metadata passed in to include just the packages to
# be published, then prints that filtered list.
#
# A package will be published if it cannot be found on the npm registry at the
# current version.
# ============================================================================

# JSON string of packages to publish
# shape is as follows:
# {
#   "packages": {
#     "@metamask/snaps-cli": {
#       "name": "@metamask/snaps-cli",
#       "path": "packages/cli",
#       "version": "0.19.2"
#     },
#     "@metamask/snap-controllers": {
#       "name": "@metamask/snap-controllers",
#       "path": "packages/controllers",
#       "version": "0.19.2"
#     }
#   }
# }
toPublish="{\"packages\":{"
# store initial length of toPublish
len="${#toPublish}"

workspaces=$(yarn workspaces list --verbose --json)

while read -r location name; do
  MANIFEST="$location/package.json"
  read -r PRIVATE CURRENT_PACKAGE_VERSION < <(jq --raw-output '.private, .version' "$MANIFEST" | xargs)
  if [[ "$PRIVATE" != "true" ]]; then
    # Get the package name as a way to test whether this version is published already
    PUBLISHED_PACKAGE_NAME=$(npm view "$name@$CURRENT_PACKAGE_VERSION" name || echo '')
    # If the package name is not set, it implies this version has not been published yet
    if [ -z "$PUBLISHED_PACKAGE_NAME" ]; then
      toPublish+="\"$name\":{\"name\":"\"$name\"",\"path\":"\"$location\"",\"version\":"\"$CURRENT_PACKAGE_VERSION"\"},"
    fi
  fi
done< <(echo "$workspaces" | jq --raw-output '"\(.location) \(.name)"')

# if the length of toPublish is greater than the initial length
# trim off the last char (,)
if [[ "${#toPublish}" -gt "$len" ]]; then
  toPublish=${toPublish::-1}
fi

RELEASE_PACKAGES="$toPublish}}"

# echo "$RELEASE_PACKAGES"
echo "RELEASE_PACKAGES=$RELEASE_PACKAGES" >> "$GITHUB_OUTPUT"
