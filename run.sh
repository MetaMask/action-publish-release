export PREFIX=${1}
export NEW_VERSION="${GITHUB_HEAD_REF#$PREFIX}"
export RELEASE_BODY="$(awk -v version="${NEW_VERSION}" -f ${2}/scripts/show-changelog.awk CHANGELOG.md)"

hub release create \
    --message "Version ${NEW_VERSION}" \
    --message "${RELEASE_BODY}" \
    --commitish "$GITHUB_SHA" \
    "v${NEW_VERSION}"
