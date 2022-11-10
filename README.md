# action-publish-release

This is a GitHub action that creates a GitHub release for a project that represents a single NPM package (in the case of a polyrepo) or a collection of packages (in the case of a monorepo).

- For a polyrepo package, the action will set the title of the GitHub release to the version of the package specified in `package.json`, and it will set the body of the release to the section of the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)-compatible changelog within the project that matches the version.

- For a monorepo, the action will first determine the set of packages included in the release by choosing each workspace package (the set of packages matched via the `workspaces` field in `package.json`, recursively) whose version specified in its `package.json` is different from its published version on NPM. It will then set the title of the GitHub release to the version of the root package specified in `package.json`, and it will construct the body of the release by stitching together the sections within the changelogs of each package obtained in the previous step.

Designed for use with [`action-npm-publish`](https://github.com/MetaMask/action-npm-publish) and (indirectly) [`action-create-release-pr`](https://github.com/MetaMask/action-create-release-pr).

## Usage

### Quick start

If you're in a hurry, take a look at the [`publish-release` workflow](https://github.com/MetaMask/metamask-module-template/blob/main/.github/workflows/publish-release.yml) from the [module template](https://github.com/MetaMask/metamask-module-template), which uses this action along with [`action-npm-publish`](https://github.com/MetaMask/action-npm-publish) to create a GitHub release whenever a release commit is merged. (A release commit is a commit that changes the version of the primary package within the project, whether that is the sole package in the case of a polyrepo package or the root package in the case of a monorepo.)

### Basic example

Add the following to a job's list of steps:

```yaml
- uses: MetaMask/action-publish-release@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## API

### Outputs

- **`release-version`**. The version associated with the new release, derived from the primary package's version.

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

### Release & Publishing

The project follows a similar release process as other projects in the MetaMask organization. The GitHub Action [`action-create-release-pr`](https://github.com/MetaMask/action-create-release-pr) is used alongside this very action to automate the release process; see that repository for more information about how it works.

1. Choose a release version.

   - The release version should be chosen according to SemVer. Analyze the changes to see whether they include any breaking changes, new features, or deprecations, then choose the appropriate SemVer version. See [the SemVer specification](https://semver.org/) for more information.

2. If this release is backporting changes onto a previous release, then ensure there is a major version branch for that version (e.g. `1.x` for a `v1` backport release).

   - The major version branch should be set to the most recent release with that major version. For example, when backporting a `v1.0.2` release, you'd want to ensure there was a `1.x` branch that was set to the `v1.0.1` tag.

3. Trigger the [`workflow_dispatch`](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#workflow_dispatch) event [manually](https://docs.github.com/en/actions/managing-workflow-runs/manually-running-a-workflow) for the `Create Release Pull Request` action to create the release PR.

   - For a backport release, the base branch should be the major version branch that you ensured existed in step 2. For a normal release, the base branch should be the main branch for that repository (which should be the default value).
   - This should trigger the [`action-create-release-pr`](https://github.com/MetaMask/action-create-release-pr) workflow to create the release PR.

4. Update the changelog to move each change entry into the appropriate change category ([See here](https://keepachangelog.com/en/1.0.0/#types) for the full list of change categories, and the correct ordering), and edit them to be more easily understood by users of the package.

   - Generally any changes that don't affect consumers of the package (e.g. lockfile changes or development environment changes) are omitted. Exceptions may be made for changes that might be of interest despite not having an effect upon the published package (e.g. major test improvements, security improvements, improved documentation, etc.).
   - Try to explain each change in terms that users of the package would understand (e.g. avoid referencing internal variables/concepts).
   - Consolidate related changes into one change entry if it makes it easier to explain.
   - Run `yarn auto-changelog validate --rc` to check that the changelog is correctly formatted.

5. Review and QA the release.

   - If changes are made to the base branch, the release branch will need to be updated with these changes and review/QA will need to restart again. As such, it's probably best to avoid merging other PRs into the base branch while review is underway.

6. Squash & Merge the release.

   - This should trigger this very action to tag the final release commit and publish the release on GitHub.
   - This also triggers a custom step to ensure that a tag representing the latest major version of this action exists.
