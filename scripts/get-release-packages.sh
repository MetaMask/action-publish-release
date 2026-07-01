#!/usr/bin/env bash

set -e
set -u
set -o pipefail

if [ "$RUNNER_DEBUG" = "1" ]; then
  set -x
fi

# ============================================================================
# This script determines which packages are part of the current release in a
# monorepo. A package is considered part of the release if no git tag of the
# form "<name>@<version>" already exists for its current manifest version.
# Private packages and packages at version "0.0.0" are skipped.
#
# Tag existence is queried via the GitHub API, so the workflow does not need
# to fetch tags locally or use a deep checkout.
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

# Repository to look up release tags in. Defaults to the current workflow's
# repository; can be overridden via the RELEASE_TAGS_REPOSITORY env var
# (used by the integration tests to point at a fixture repo, since GitHub
# Actions does not allow overriding GITHUB_REPOSITORY at the step level).
TAGS_REPOSITORY="${RELEASE_TAGS_REPOSITORY:-$GITHUB_REPOSITORY}"

while read -r location name; do
  MANIFEST="$location/package.json"
  read -r PRIVATE CURRENT_PACKAGE_VERSION < <(jq --raw-output '.private, .version' "$MANIFEST" | xargs)
  if [[ "$PRIVATE" != "true" && "$CURRENT_PACKAGE_VERSION" != '0.0.0' ]]; then
    # Skip the package if a release tag already exists for its current
    # version. A non-existent tag (404) means this version has not been
    # released yet, so include it.
    if ! gh api "repos/$TAGS_REPOSITORY/git/ref/tags/$name@$CURRENT_PACKAGE_VERSION" --silent 2>/dev/null; then
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
