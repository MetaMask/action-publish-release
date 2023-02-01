# MetaMask/action-publish-release

## Description

This action creates a [GitHub release](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) for a project that represents a single NPM package (in the case of a polyrepo) or a collection of packages (in the case of a monorepo).

- For polyrepo packages, the action will set the title of the release to the version of the package specified in `package.json` and the body of the release to the section of the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)-compatible changelog within the project that corresponds to the version.

- For monorepos, the action will first determine the set of workspace packages included in the release by selecting each workspace package whose version as specified in its respective `package.json` is different from its published version. It will then set the title of the release to the version of the root package specified in `package.json` and it will construct the body of the release by stitching together the sections within the changelogs of each workspace package obtained in the previous step.

This action assumes that Yarn is installed and that the package is using Yarn v3. It may fail for other Yarn versions or other package managers.

Designed for use with [MetaMask/action-create-release-pr](https://github.com/MetaMask/action-create-release-pr) and (optionally) [MetaMask/action-npm-publish](https://github.com/MetaMask/action-npm-publish).

## Usage

To create a GitHub release whenever a PR created by `MetaMask/action-create-release-pr` is merged, add the following workflow to your repository:

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
        run: echo "NODE_VERSION=$(cat .nvmrc)" >> "$GITHUB_OUTPUT"
      - uses: actions/setup-node@v2
        with:
          node-version: ${{ steps.nvm.outputs.NODE_VERSION }}
      - uses: MetaMask/action-publish-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

If you wish to automatically publish your package to NPM, that can be accomplished by utilizing [MetaMask/action-is-release](https://github.com/MetaMask/action-is-release) and [MetaMask/action-npm-publish](https://github.com/MetaMask/action-npm-publish) with the following workflow. Note that this requires you add an `npm-publish` environment to your repository and set the `NPM_TOKEN` environment variable within that environment to your NPM token:

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
        run: echo "NODE_VERSION=$(cat .nvmrc)" >> "$GITHUB_OUTPUT"
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
        # omit npm-token to perform dry run publish
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

Finally, if you are making changes to the workflow(s) in your repository and need to test that your package still gets published correctly, you can configure the action to use your own NPM registry instead of the official one. For instance, here is a workflow file that uses [Gemfury](https://gemfury.com/help/npm-registry/):

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
        run: echo "NODE_VERSION=$(cat .nvmrc)" >> "$GITHUB_OUTPUT"
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
        uses: MetaMask/action-npm-publish@v1.1.0
        with:
          # omit npm-token to perform dry run publish
          npm-registry-uri-fragment: //npm.fury.io/your-username-goes-here/

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
          npm-registry-uri-fragment: //npm.fury.io/your-username-goes-here/
          npm-token: ${{ secrets.NPM_TOKEN }}
```

## API

### Inputs

- **`npm-registry`** _(optional; defaults to whatever Yarn's `npmPublishRegistry` option defaults to)_. The URL of the NPM registry that Yarn commands will use to access packages.
- **`npm-token`** _(optional)_. The auth token associated with the registry that Yarn commands will use to access and publish packages.

### Outputs

- **`release-version`**. The version of the release.

## Contributing

### Setup

- Install [Node.js](https://nodejs.org) version 14
  - If you are using [nvm](https://github.com/creationix/nvm#installation) (recommended) running `nvm use` will automatically choose the right node version for you.
- Install [Yarn v1](https://yarnpkg.com/en/docs/install)
- Run `yarn setup` to install dependencies and run any requried post-install scripts
  - **Warning**: Do not use the `yarn` / `yarn install` command directly. Use `yarn setup` instead. The normal install command will skip required post-install scripts, leaving your development environment in an invalid state.

### Testing and Linting

Run `yarn test` to run the tests once. To run tests on file changes, run `yarn test:watch`.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and fix any automatically fixable issues.
