#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

tag="${1:-latest}"

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
    LATEST_PACKAGE_VERSION=$(npm view "$name" --workspaces false --json | jq --raw-output --arg tag "$tag" '.[keys_unsorted[0]]."dist-tags"[$tag]' || echo "")
    if [ "$LATEST_PACKAGE_VERSION" != "$CURRENT_PACKAGE_VERSION" ]; then
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
