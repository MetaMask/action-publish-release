export PREFIX=${1}
export NEW_VERSION="${GITHUB_HEAD_REF#$PREFIX}"
export RELEASE_BODY="$(awk -v version="${NEW_VERSION}" -f scripts/show-changelog.awk CHANGELOG.md)"

yarn install
yarn build
pushd build

hub release create \
    --message "Version ${NEW_VERSION}" \
    --message "${RELEASE_BODY}" \
    --commitish "$GITHUB_SHA" \
    "${NEW_VERSION}"
