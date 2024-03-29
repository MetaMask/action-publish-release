import { FIXED, INDEPENDENT } from './constants';
import { parseEnvironmentVariables } from './utils';

describe('parseEnvironmentVariables', () => {
  let originalGithubWorkspace: string | undefined;

  // In CI, some of these are set.
  beforeAll(() => {
    originalGithubWorkspace = process.env.GITHUB_WORKSPACE;
    delete process.env.GITHUB_WORKSPACE;
  });

  afterAll(() => {
    if ('GITHUB_WORKSPACE' in process.env) {
      process.env.GITHUB_WORKSPACE = originalGithubWorkspace;
    }
  });

  it('successfully parses valid environment variables', () => {
    expect(
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        REPOSITORY_URL: 'https://github.com/MetaMask/snaps-skunkworks.git',
        RELEASE_VERSION: '1.0.0',
        RELEASE_STRATEGY: 'fixed',
      }),
    ).toStrictEqual({
      releaseVersion: '1.0.0',
      repoUrl: 'https://github.com/MetaMask/snaps-skunkworks',
      workspaceRoot: 'foo',
      releaseStrategy: 'fixed',
      releasePackages: undefined,
    });
  });

  it('throws if GITHUB_WORKSPACE is invalid', () => {
    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: '',
        REPOSITORY_URL: 'https://github.com/MetaMask/snaps-skunkworks.git',
        RELEASE_VERSION: '1.0.0',
      }),
    ).toThrow('process.env.GITHUB_WORKSPACE must be set.');
    expect(() => parseEnvironmentVariables()).toThrow(
      'process.env.GITHUB_WORKSPACE must be set.',
    );
  });

  it('throws if REPOSITORY_URL is invalid', () => {
    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        REPOSITORY_URL: 'MetaMask/snaps-skunkworks',
        RELEASE_VERSION: '1.0.0',
      }),
    ).toThrow('process.env.REPOSITORY_URL must be a valid URL.');
  });

  it('throws if RELEASE_VERSION is invalid', () => {
    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        REPOSITORY_URL: 'https://github.com/MetaMask/snaps-skunkworks.git',
        RELEASE_VERSION: '',
      }),
    ).toThrow('process.env.RELEASE_VERSION must be a valid SemVer version.');
    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        REPOSITORY_URL: 'https://github.com/MetaMask/snaps-skunkworks.git',
        RELEASE_VERSION: 'kaplar',
      }),
    ).toThrow('process.env.RELEASE_VERSION must be a valid SemVer version.');
  });

  it('throws if RELEASE_STRATEGY is invalid', () => {
    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        REPOSITORY_URL: 'https://github.com/MetaMask/snaps-skunkworks.git',
        RELEASE_VERSION: '1.0.0',
        RELEASE_STRATEGY: 'lol',
      }),
    ).toThrow(
      `process.env.RELEASE_STRATEGY must be one of "${FIXED}" or "${INDEPENDENT}"`,
    );
  });
});
