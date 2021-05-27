#!/usr/bin/env bash

set -x
set -e
set -u
set -o pipefail

RELEASE_BRANCH_PREFIX="${1}"

if [[ -z $RELEASE_BRANCH_PREFIX ]]; then
  echo "Error: No release branch prefix specified."
  exit 1
fi

# GITHUB_HEAD_REF is the name of the branch of the closed release PR, per:
# https://docs.github.com/en/actions/reference/environment-variables
# The following expression strips the expected branch prefix from the branch
# name and assigns it to a RELEASE_VERSION. For example, "release-v1.0.0"
# becomes "1.0.0".
RELEASE_VERSION="${GITHUB_HEAD_REF#$RELEASE_BRANCH_PREFIX}"

if [[ -z $RELEASE_VERSION ]] || [[ "$GITHUB_HEAD_REF" == "$RELEASE_VERSION" ]]; then
  echo "Error: Failed to compute release version. Result: ${RELEASE_VERSION}"
  exit 1
fi

echo "::set-output name=RELEASE_VERSION::$RELEASE_VERSION"
