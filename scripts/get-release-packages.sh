#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

# ============================================================================
# This script determines which packages are part of the current release in a
# monorepo. A package is considered part of the release if its version in the
# current commit differs from its version in the parent commit (this also
# covers brand-new packages, which have no previous version). Private packages
# and packages at version "0.0.0" are skipped.
#
# The previous manifest is fetched via the GitHub contents API so this works
# even when the repository is checked out at the default shallow depth.
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

# PARENT_REPOSITORY and PARENT_SHA can be overridden via environment variables
# to point the previous-manifest lookup at a different repo or commit. This is
# primarily a hook for the integration tests in this repo; in normal use the
# parent commit of the workflow's SHA is used.
PARENT_REPOSITORY="${PARENT_REPOSITORY:-$GITHUB_REPOSITORY}"
if [[ -z "${PARENT_SHA:-}" ]]; then
  PARENT_SHA=$(gh api "repos/$GITHUB_REPOSITORY/commits/$GITHUB_SHA" --jq '.parents[0].sha')
fi

while read -r location name; do
  MANIFEST="$location/package.json"
  read -r PRIVATE CURRENT_PACKAGE_VERSION < <(jq --raw-output '.private, .version' "$MANIFEST" | xargs)
  if [[ "$PRIVATE" != "true" && "$CURRENT_PACKAGE_VERSION" != '0.0.0' ]]; then
    # Fetch the manifest at the parent commit. A missing file (e.g. a new
    # package) yields an empty previous version, which will differ from the
    # current version and so the package will be included.
    PREVIOUS_PACKAGE_VERSION=$(gh api "repos/$PARENT_REPOSITORY/contents/$MANIFEST?ref=$PARENT_SHA" --jq '.content' 2>/dev/null | base64 -d 2>/dev/null | jq --raw-output '.version' 2>/dev/null || echo '')
    if [[ "$PREVIOUS_PACKAGE_VERSION" != "$CURRENT_PACKAGE_VERSION" ]]; then
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
