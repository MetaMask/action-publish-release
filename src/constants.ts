export const FIXED = 'fixed';
export const INDEPENDENT = 'independent';

export const fixedOrIndependent = (value: string) =>
  value === FIXED || value === INDEPENDENT;

// error messages
export const GITHUB_WORKSPACE_ERROR =
  'process.env.GITHUB_WORKSPACE must be set.';
export const RELEASE_VERSION_ERROR =
  'process.env.RELEASE_VERSION must be a valid SemVer version.';
export const REPOSITORY_URL_ERROR =
  'process.env.REPOSITORY_URL must be a valid URL.';
export const VERSION_STRATEGY_ERROR = `process.env.RELEASE_STRATEGY must be one of "${FIXED}" or "${INDEPENDENT}"`;
export const UPDATED_PACKAGES_ERROR = 'The updated packages are undefined';

// env variables
export const GITHUB_WORKSPACE = 'GITHUB_WORKSPACE';
export const RELEASE_VERSION = 'RELEASE_VERSION';
export const REPOSITORY_URL = 'REPOSITORY_URL';
export const VERSION_STRATEGY = 'VERSION_STRATEGY';
export const UPDATED_PACKAGES = 'UPDATED_PACKAGES';

export const HTTPS = `https`;
export const GIT_EXT = '.git';

export const MOCK_UPDATED_PACAKGES =
  '{"packages":{"@metamask/snaps-cli":{"name":"@metamask/snaps-cli","path":"packages/cli","version":"0.20.1"},"@metamask/snap-controllers":{"name":"@metamask/snap-controllers","path":"packages/controllers","version":"0.20.1"}}}';
