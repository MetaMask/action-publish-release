#!/usr/bin/env bash

set -x
set -e
set -o pipefail

RELEASE_VERSION="${1}"

if [[ -z $RELEASE_VERSION ]]; then
  echo "Error: No release version specified."
  exit 1
fi

MAJOR_VERSION_TAG="v${RELEASE_VERSION/\.*/}"

git config user.name github-actions
git config user.email github-actions@github.com

if git show-ref --tags "$MAJOR_VERSION_TAG" --quiet; then
  echo "Tag ${MAJOR_VERSION_TAG} exists, attempting to delete it."
  git tag --delete "$MAJOR_VERSION_TAG"
  git push --delete origin "$MAJOR_VERSION_TAG"
else 
  echo "Tag ${MAJOR_VERSION_TAG} does not exist, creating it from scratch."
fi

git tag "$MAJOR_VERSION_TAG" HEAD
git push --tags
echo "Updated shorthand major version tag."

echo "MAJOR_VERSION_TAG=$MAJOR_VERSION_TAG" >> "$GITHUB_OUTPUT"
