import {
  GITHUB_WORKSPACE_ERROR,
  RELEASE_VERSION_ERROR,
  REPOSITORY_URL_ERROR,
} from './constants';
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
      }),
    ).toStrictEqual({
      releaseVersion: '1.0.0',
      repoUrl: 'https://github.com/MetaMask/snaps-skunkworks',
      workspaceRoot: 'foo',
    });
  });

  it('throws if GITHUB_WORKSPACE is invalid', () => {
    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: '',
        REPOSITORY_URL: 'https://github.com/MetaMask/snaps-skunkworks.git',
        RELEASE_VERSION: '1.0.0',
      }),
    ).toThrow(GITHUB_WORKSPACE_ERROR);
    expect(() => parseEnvironmentVariables()).toThrow(GITHUB_WORKSPACE_ERROR);
  });

  it('throws if REPOSITORY_URL is invalid', () => {
    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        REPOSITORY_URL: 'MetaMask/snaps-skunkworks',
        RELEASE_VERSION: '1.0.0',
      }),
    ).toThrow(REPOSITORY_URL_ERROR);
  });

  it('throws if RELEASE_VERSION is invalid', () => {
    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        REPOSITORY_URL: 'https://github.com/MetaMask/snaps-skunkworks.git',
        RELEASE_VERSION: '',
      }),
    ).toThrow(RELEASE_VERSION_ERROR);
    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        REPOSITORY_URL: 'https://github.com/MetaMask/snaps-skunkworks.git',
        RELEASE_VERSION: 'kaplar',
      }),
    ).toThrow(RELEASE_VERSION_ERROR);
  });
});
