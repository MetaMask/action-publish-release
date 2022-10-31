# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.2]
### Changed
- Resolve GitHub action deprecation warnings ([#55](https://github.com/MetaMask/action-publish-release/pull/55))

## [2.0.1]
### Changed
- Bump actions, removing deprecation warning ([#53](https://github.com/MetaMask/action-publish-release/pull/53))
- Get version and repository info from package.json, improving compatibility with forked repositories. ([#49](https://github.com/MetaMask/action-publish-release/pull/49))

## [2.0.0]
### Changed
- **BREAKING:** Use the version in `package.json` to determine the release version instead of the name of the release branch ([#46](https://github.com/MetaMask/action-publish-release/pull/46))
  - Projects that use this action should no longer pass a `release-branch-prefix` input. Additionally, they should make sure that when a release branch is merged, the version of the package (or root package in the case of a monorepo) is updated to the desired release version.

## [1.0.3]
### Changed
- Bump `@metamask/auto-changelog` from `2.3.0` to `2.4.0` ([#34](https://github.com/MetaMask/action-publish-release/pull/34))

## [1.0.2]
### Changed
- Improve usage documentation ([#30](https://github.com/MetaMask/action-publish-release/pull/30))

### Fixed
- Error logging on Action failure ([#31](https://github.com/MetaMask/action-publish-release/pull/31))

## [1.0.1]
### Added
- `release-version` output ([#28](https://github.com/MetaMask/action-publish-release/pull/28))
  - This outputs the version of the GitHub release, once it has been created.

## [1.0.0]
### Uncategorized
- First stable release

### Changed
- Default release branch prefix ([#22](https://github.com/MetaMask/action-publish-release/pull/22))
  - The default prefix is now `release/`, matching [`action-create-release-pr@v1`](https://github.com/MetaMask/action-create-release-pr).

### Fixed
- Faulty usage instructions in readme ([#21](https://github.com/MetaMask/action-publish-release/pull/21))

## [0.1.0]
### Changed
- **(BREAKING)** Rename `branch-prefix` input to `release-branch-prefix` ([#15](https://github.com/MetaMask/action-publish-release/pull/15))
  - This matches the name of the corresponding input to [MetaMask/action-create-release-pr@v0.1.0](https://github.com/MetaMask/action-create-release-pr).

## [0.0.7]
### Changed
- **(BREAKING)** Change release branch prefix from 'release-v' to 'automation_release-' ([#12](https://github.com/MetaMask/action-publish-release/pull/12))
- Use `@lavamoat/allow-scripts` for dependency lifecycle scripts ([#11](https://github.com/MetaMask/action-publish-release/pull/11))

### Fixed
- Changelog updating in monorepos and repositories with merge commits ([#10](https://github.com/MetaMask/action-publish-release/pull/10))
  - Done by updating `@metamask/auto-changelog` to `2.3.0`. See [MetaMask/auto-changelog#87](https://github.com/MetaMask/auto-changelog/pull/87) for details.

## [0.0.6]
### Changed
- Strip changelog release headers from release notes ([#8](https://github.com/MetaMask/action-publish-release/pull/8))

## [0.0.5]
### Changed
- **(BREAKING)** Output release notes to an environment variable ([#6](https://github.com/MetaMask/action-publish-release/pull/6))
  - They were previously output to an Action output.

## [0.0.4]
### Changed
- **(BREAKING)** Re-implement in TypeScript, add monorepo support ([#4](https://github.com/MetaMask/action-publish-release/pull/4))

## [0.0.3]
### Changed
- Update repository git tags

## [0.0.2]
### Changed
- Add path as argument to `run.sh`

## [0.0.1]
### Uncategorized
- Initial release

[Unreleased]: https://github.com/MetaMask/action-publish-release/compare/v2.0.2...HEAD
[2.0.2]: https://github.com/MetaMask/action-publish-release/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/MetaMask/action-publish-release/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/MetaMask/action-publish-release/compare/v1.0.3...v2.0.0
[1.0.3]: https://github.com/MetaMask/action-publish-release/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/MetaMask/action-publish-release/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/MetaMask/action-publish-release/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/MetaMask/action-publish-release/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/MetaMask/action-publish-release/compare/v0.0.7...v0.1.0
[0.0.7]: https://github.com/MetaMask/action-publish-release/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/MetaMask/action-publish-release/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/MetaMask/action-publish-release/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/MetaMask/action-publish-release/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/MetaMask/action-publish-release/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/MetaMask/action-publish-release/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/MetaMask/action-publish-release/releases/tag/v0.0.1
