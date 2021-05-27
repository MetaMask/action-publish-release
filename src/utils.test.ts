import { parseEnvironmentVariables } from './utils';

describe('parseEnvironmentVariables', () => {
  let originalGithubWorkspace: string | undefined,
    originalGithubRepository: string | undefined;

  // In CI, some of these are set.
  beforeAll(() => {
    originalGithubWorkspace = process.env.GITHUB_WORKSPACE;
    originalGithubRepository = process.env.GITHUB_REPOSITORY;
    delete process.env.GITHUB_WORKSPACE;
    delete process.env.GITHUB_REPOSITORY;
  });

  afterAll(() => {
    if ('GITHUB_WORKSPACE' in process.env) {
      process.env.GITHUB_WORKSPACE = originalGithubWorkspace;
    }
    if ('GITHUB_REPOSITORY' in process.env) {
      process.env.GITHUB_REPOSITORY = originalGithubRepository;
    }
  });

  it('successfully parses valid environment variables', () => {
    expect(
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        GITHUB_REPOSITORY: 'Org/Name',
        RELEASE_VERSION: '1.0.0',
      }),
    ).toStrictEqual({
      releaseVersion: '1.0.0',
      repoUrl: 'https://github.com/Org/Name',
      workspaceRoot: 'foo',
    });
  });

  it('throws if GITHUB_WORKSPACE is invalid', () => {
    const errorMessage = 'process.env.GITHUB_WORKSPACE must be set.';

    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: '',
        GITHUB_REPOSITORY: 'Org/Name',
        RELEASE_VERSION: '1.0.0',
      }),
    ).toThrow(errorMessage);
    expect(() => parseEnvironmentVariables()).toThrow(errorMessage);
  });

  it('throws if GITHUB_REPOSITORY is invalid', () => {
    const errorMessage =
      'process.env.GITHUB_REPOSITORY must be a valid GitHub repository identifier.';

    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        GITHUB_REPOSITORY: '',
        RELEASE_VERSION: '1.0.0',
      }),
    ).toThrow(errorMessage);
    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        GITHUB_REPOSITORY: 'Org/',
        RELEASE_VERSION: '1.0.0',
      }),
    ).toThrow(errorMessage);
    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        GITHUB_REPOSITORY: '/Name',
        RELEASE_VERSION: '1.0.0',
      }),
    ).toThrow(errorMessage);
  });

  it('throws if RELEASE_VERSION is invalid', () => {
    const errorMessage =
      'process.env.RELEASE_VERSION must be a valid SemVer version.';

    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        GITHUB_REPOSITORY: 'Org/Name',
        RELEASE_VERSION: '',
      }),
    ).toThrow(errorMessage);
    expect(() =>
      parseEnvironmentVariables({
        GITHUB_WORKSPACE: 'foo',
        GITHUB_REPOSITORY: 'Org/Name',
        RELEASE_VERSION: 'kaplar',
      }),
    ).toThrow(errorMessage);
  });
});
