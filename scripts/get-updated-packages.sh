#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

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
  PRIVATE=$(jq .private "$MANIFEST")
  if [[ "$PRIVATE" != "true" ]]; then
    NAME=$(jq --raw-output .name "$MANIFEST")
    LATEST_PACKAGE_VERSION=$(npm view "$NAME" version --workspaces=false || echo "")
    CURRENT_PACKAGE_VERSION=$(jq --raw-output .version "$MANIFEST")

    if [ "$LATEST_PACKAGE_VERSION" != "$CURRENT_PACKAGE_VERSION" ]; then
      toPublish+="\"$NAME\":{\"name\":"\"$NAME\"",\"path\":"\"$location\"",\"version\":"\"$CURRENT_PACKAGE_VERSION"\"},"
    fi
  fi
done< <(echo "$workspaces" | jq --raw-output '"\(.location) \(.name)"')

# if the length of toPublish is greater than the initial length
# trim off the last char (,)
if [[ "${#toPublish}" -gt "$len" ]]; then
  toPublish=${toPublish::-1}
fi

UPDATED_PACKAGES="$toPublish}}"

# echo "$UPDATED_PACKAGES"
echo "::set-output name=UPDATED_PACKAGES::$UPDATED_PACKAGES"
