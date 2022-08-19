# MetaMask/action-publish-release

## Description

This Action creates a GitHub release when a release PR is merged.
A "release PR" is a PR whose branch is named with a particular prefix, followed by a SemVer version.
The release title will simply be the SemVer version of the release, and the release body will be the change entries of the release from the repository's [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)-compatible changelog.

Designed for use with [MetaMask/action-create-release-pr](https://github.com/MetaMask/action-create-release-pr) and (optionally) [MetaMask/action-npm-publish](https://github.com/MetaMask/action-npm-publish)

### Monorepos

For monorepos, this Action will populate the release body with the change entries of the release from the changelogs of every released package.
A package is assumed to be part of the release if its version is the same as the released version when this Action runs.

## Usage

To create a GitHub release whenever a PR created by `MetaMask/action-create-release-pr` is merged, add the following workflow to your repository at `.github/workflows/publish-release.yml`:

```yaml
name: Publish Release

on:
  pull_request:
    types: [closed]

jobs:
  publish-release:
    permissions:
      contents: write
    # The second argument to startsWith() must match the release-branch-prefix
    # input to this Action. Here, we use the default, "release/".
    if: |
      github.event.pull_request.merged == true &&
      startsWith(github.event.pull_request.head.ref, 'release/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          # We check out the release pull request's base branch, which will be
          # used as the base branch for all git operations.
          ref: ${{ github.event.pull_request.base.ref }}
      - name: Get Node.js version
        id: nvm
        run: echo ::set-output name=NODE_VERSION::$(cat .nvmrc)
      - uses: actions/setup-node@v2
        with:
          node-version: ${{ steps.nvm.outputs.NODE_VERSION }}
      - uses: MetaMask/action-publish-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Optionally, if you wish to automatically publish your repository/module to npm, that can be accomplish by utilizing [MetaMask/action-is-release](https://github.com/MetaMask/action-is-release) and [MetaMask/action-npm-publish](https://github.com/MetaMask/action-npm-publish) with the following configuration:

```yaml
name: Publish Release

on:
  push:
    branches: [main]

jobs:
  is-release:
    # release merge commits come from github-actions
    if: startsWith(github.event.commits[0].author.name, 'github-actions')
    outputs:
      IS_RELEASE: ${{ steps.is-release.outputs.IS_RELEASE }}
    runs-on: ubuntu-latest
    steps:
      - uses: MetaMask/action-is-release@v1.0
        id: is-release

  publish-release:
    permissions:
      contents: write
    if: needs.is-release.outputs.IS_RELEASE == 'true'
    runs-on: ubuntu-latest
    needs: is-release
    steps:
      - uses: actions/checkout@v2
        with:
          ref: ${{ github.sha }}
      - name: Get Node.js version
        id: nvm
        run: echo ::set-output name=NODE_VERSION::$(cat .nvmrc)
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: ${{ steps.nvm.outputs.NODE_VERSION }}
      - uses: MetaMask/action-publish-release@v2.0.0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - name: Install
        run: |
          yarn install
          yarn build
      - uses: actions/cache@v3
        id: restore-build
        with:
          path: ./dist
          key: ${{ github.sha }}

  # Optionally perform a dry-run publish to review
  publish-npm-dry-run:
    runs-on: ubuntu-latest
    needs: publish-release
    steps:
      - uses: actions/checkout@v2
        with:
          ref: ${{ github.sha }}
      - uses: actions/cache@v3
        id: restore-build
        with:
          path: ./dist
          key: ${{ github.sha }}
        # Set `ignore-scripts` to skip `prepublishOnly` because the release was built already in the previous job
      - run: npm config set ignore-scripts true
      - name: Dry Run Publish
        # omit npm-token token to perform dry run publish
        uses: MetaMask/action-npm-publish@v1.1.0

  publish-npm:
    environment: npm-publish
    runs-on: ubuntu-latest
    needs: publish-npm-dry-run
    steps:
      - uses: actions/checkout@v2
        with:
          ref: ${{ github.sha }}
      - uses: actions/cache@v3
        id: restore-build
        with:
          path: ./dist
          key: ${{ github.sha }}
        # Set `ignore-scripts` to skip `prepublishOnly` because the release was built already in the previous job
      - run: npm config set ignore-scripts true
      - name: Publish
        uses: MetaMask/action-npm-publish@v1.1.0
        with:
          npm-token: ${{ secrets.NPM_TOKEN }}
```

## Contributing

### Setup

- Install [Node.js](https://nodejs.org) version 12
  - If you are using [nvm](https://github.com/creationix/nvm#installation) (recommended) running `nvm use` will automatically choose the right node version for you.
- Install [Yarn v1](https://yarnpkg.com/en/docs/install)
- Run `yarn setup` to install dependencies and run any requried post-install scripts
  - **Warning**: Do not use the `yarn` / `yarn install` command directly. Use `yarn setup` instead. The normal install command will skip required post-install scripts, leaving your development environment in an invalid state.

### Testing and Linting

Run `yarn test` to run the tests once. To run tests on file changes, run `yarn test:watch`.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and fix any automatically fixable issues.
