import fs from 'fs';
import * as actionsCore from '@actions/core';
import * as autoChangelog from '@metamask/auto-changelog';
import * as actionUtils from '@metamask/action-utils';
import * as localUtils from './utils';
import { getReleaseNotes, getUpdatedPackages } from './getReleaseNotes';

jest.mock('fs', () => {
  return {
    promises: {
      readFile: jest.fn(),
    },
  };
});

jest.mock('@actions/core', () => {
  return {
    exportVariable: jest.fn(),
  };
});

jest.mock('@metamask/action-utils', () => {
  const actualModule = jest.requireActual('@metamask/action-utils');
  return {
    ...actualModule,
    getPackageManifest: jest.fn(),
    getWorkspaceLocations: jest.fn(),
  };
});

jest.mock('@metamask/auto-changelog', () => {
  return {
    parseChangelog: jest.fn(),
  };
});

jest.mock('./utils', () => {
  return {
    parseEnvironmentVariables: jest.fn(),
  };
});

describe('getUpdatedPackages', () => {
  let parseEnvVariablesMock: jest.SpyInstance;

  beforeEach(() => {
    parseEnvVariablesMock = jest.spyOn(localUtils, 'parseEnvironmentVariables');
  });

  it('should get updated packages', () => {
    const mockUpdatedPackages =
      '{"packages":{"@metamask/snaps-cli":{"name":"@metamask/snaps-cli","path":"packages/cli","version":"0.20.1"},"@metamask/snap-controllers":{"name":"@metamask/snap-controllers","path":"packages/controllers","version":"0.20.1"}}}';

    parseEnvVariablesMock.mockImplementationOnce(() => {
      return {
        updatedPackages: mockUpdatedPackages,
      };
    });

    const updatedPackages = getUpdatedPackages();

    expect(parseEnvVariablesMock).toHaveBeenCalledTimes(1);
    expect(Object.entries(updatedPackages)).toHaveLength(2);
  });
});

describe('getReleaseNotes', () => {
  let parseEnvVariablesMock: jest.SpyInstance;
  let getPackageManifestMock: jest.SpyInstance;
  let getWorkspaceLocationsMock: jest.SpyInstance;
  let readFileMock: jest.SpyInstance;
  let parseChangelogMock: jest.SpyInstance;
  let exportActionVariableMock: jest.SpyInstance;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    parseEnvVariablesMock = jest.spyOn(localUtils, 'parseEnvironmentVariables');
    getPackageManifestMock = jest.spyOn(actionUtils, 'getPackageManifest');
    getWorkspaceLocationsMock = jest.spyOn(
      actionUtils,
      'getWorkspaceLocations',
    );
    readFileMock = jest.spyOn(fs.promises, 'readFile');
    parseChangelogMock = jest.spyOn(autoChangelog, 'parseChangelog');
    exportActionVariableMock = jest.spyOn(actionsCore, 'exportVariable');
  });

  it('should get the release notes for polyrepos', async () => {
    const mockWorkspaceRoot = 'foo/';
    const mockRepoUrl = 'https://github.com/Org/Name';
    const mockVersion = '1.0.0';
    const mockChangelog = 'a changelog';
    const mockReleaseBody = 'a mock release';
    // getStringifiedRelease returns a string whose first line is a markdown
    // e.g. "## 1.0.0\n". This is stripped by getReleaseNotes.
    const mockRelease = `## Header\n${mockReleaseBody}`;

    parseEnvVariablesMock.mockImplementationOnce(() => {
      return {
        releaseVersion: mockVersion,
        repoUrl: mockRepoUrl,
        workspaceRoot: mockWorkspaceRoot,
      };
    });
    getPackageManifestMock.mockImplementationOnce(async () => {
      return { version: mockVersion };
    });
    readFileMock.mockImplementationOnce(async () => mockChangelog);

    const getStringifiedReleaseMock = jest
      .fn()
      .mockImplementation(() => mockRelease);
    parseChangelogMock.mockImplementationOnce(() => {
      return { getStringifiedRelease: getStringifiedReleaseMock };
    });

    await getReleaseNotes();

    // Calls to parse environment variables and the polyrepo package manifest
    expect(parseEnvVariablesMock).toHaveBeenCalledTimes(1);
    expect(getPackageManifestMock).toHaveBeenCalledTimes(1);
    expect(getPackageManifestMock).toHaveBeenCalledWith('foo/');

    // Calls to read and parse the changelog
    expect(readFileMock).toHaveBeenCalledTimes(1);
    expect(readFileMock).toHaveBeenCalledWith('foo/CHANGELOG.md');
    expect(parseChangelogMock).toHaveBeenCalledTimes(1);
    expect(parseChangelogMock).toHaveBeenCalledWith({
      changelogContent: mockChangelog,
      repoUrl: mockRepoUrl,
    });
    expect(getStringifiedReleaseMock).toHaveBeenCalledTimes(1);
    expect(getStringifiedReleaseMock).toHaveBeenCalledWith(mockVersion);

    // Finally, the Action output, as an environment variable
    expect(exportActionVariableMock).toHaveBeenCalledTimes(1);
    expect(exportActionVariableMock).toHaveBeenCalledWith(
      'RELEASE_NOTES',
      `${mockReleaseBody}\n\n`,
    );
  });

  it('should get the release notes for monorepos', async () => {
    const mockWorkspaceRoot = 'foo/';
    const mockRepoUrl = 'https://github.com/Org/Name';
    const mockVersion = '1.0.0';
    const mockWorkspaces = ['a', 'b', 'c'];
    const mockChangelog = 'a changelog';
    const mockVersionStrategy = 'fixed';

    parseEnvVariablesMock.mockImplementationOnce(() => {
      return {
        releaseVersion: mockVersion,
        repoUrl: mockRepoUrl,
        workspaceRoot: mockWorkspaceRoot,
        versionStrategy: mockVersionStrategy,
      };
    });
    getPackageManifestMock.mockImplementationOnce(async () => {
      return {
        version: mockVersion,
        private: true,
        workspaces: [...mockWorkspaces],
      };
    });
    getWorkspaceLocationsMock.mockImplementation(async (arr: string[]) => {
      return arr.map((workspace) => `packages/${workspace}`);
    });

    // One call per workspace
    getPackageManifestMock
      // a
      .mockImplementationOnce(async () => {
        return { name: 'a', version: mockVersion };
      })
      // b
      .mockImplementationOnce(async () => {
        return { name: 'b', version: '0.0.1' }; // should not be updated
      })
      // c
      .mockImplementationOnce(async () => {
        return { name: 'c', version: mockVersion };
      });

    // Return a different changelog for each package/workspace
    readFileMock.mockImplementation(
      async (path: string) =>
        `${mockChangelog} for ${path.charAt(
          path.indexOf('/CHANGELOG.md') - 1,
        )}`,
    );

    const getStringifiedReleaseMockFactory = (workspace: string) => {
      // getStringifiedRelease returns a string whose first line is a markdown
      // e.g. "## 1.0.0\n". This is stripped by getReleaseNotes.
      return (version: string) =>
        `## Header\nrelease ${version} for ${workspace}`;
    };
    parseChangelogMock.mockImplementation(
      ({ changelogContent }: { changelogContent: string }) => {
        return {
          getStringifiedRelease: getStringifiedReleaseMockFactory(
            changelogContent.slice(-1),
          ),
        };
      },
    );

    await getReleaseNotes();

    // Calls to parse environment variables and the root manifest
    expect(parseEnvVariablesMock).toHaveBeenCalledTimes(1);
    expect(getPackageManifestMock).toHaveBeenCalledTimes(4);
    expect(getPackageManifestMock).toHaveBeenNthCalledWith(1, 'foo/');

    // Calls to get the manifest for every package
    expect(getPackageManifestMock).toHaveBeenNthCalledWith(2, 'foo/packages/a');
    expect(getPackageManifestMock).toHaveBeenNthCalledWith(3, 'foo/packages/b');
    expect(getPackageManifestMock).toHaveBeenNthCalledWith(4, 'foo/packages/c');

    // Calls to get and parse the changelogs for every package of the specified
    // release version
    expect(readFileMock).toHaveBeenCalledTimes(2);
    expect(readFileMock).toHaveBeenNthCalledWith(
      1,
      'foo/packages/a/CHANGELOG.md',
    );
    expect(readFileMock).toHaveBeenNthCalledWith(
      2,
      'foo/packages/c/CHANGELOG.md',
    );
    expect(parseChangelogMock).toHaveBeenCalledTimes(2);
    expect(parseChangelogMock).toHaveBeenNthCalledWith(1, {
      changelogContent: 'a changelog for a',
      repoUrl: mockRepoUrl,
    });
    expect(parseChangelogMock).toHaveBeenNthCalledWith(2, {
      changelogContent: 'a changelog for c',
      repoUrl: mockRepoUrl,
    });

    // Finally, the Action output, as an environment variable
    expect(exportActionVariableMock).toHaveBeenCalledTimes(1);
    expect(exportActionVariableMock).toHaveBeenCalledWith(
      'RELEASE_NOTES',
      `## a\n\nrelease 1.0.0 for a\n\n## c\n\nrelease 1.0.0 for c\n\n`,
    );
  });

  it('should fail if the computed release notes are empty', async () => {
    const mockWorkspaceRoot = 'foo/';
    const mockRepoUrl = 'https://github.com/Org/Name';
    const mockVersion = '1.0.0';
    const mockChangelog = 'a changelog';
    const mockRelease = ''; // empty, causing a failure

    parseEnvVariablesMock.mockImplementationOnce(() => {
      return {
        releaseVersion: mockVersion,
        repoUrl: mockRepoUrl,
        workspaceRoot: mockWorkspaceRoot,
      };
    });
    getPackageManifestMock.mockImplementationOnce(async () => {
      return { version: mockVersion };
    });
    readFileMock.mockImplementationOnce(async () => mockChangelog);

    const getStringifiedReleaseMock = jest
      .fn()
      .mockImplementation(() => mockRelease);
    parseChangelogMock.mockImplementationOnce(() => {
      return { getStringifiedRelease: getStringifiedReleaseMock };
    });

    await expect(getReleaseNotes()).rejects.toThrow(
      'The computed release notes are empty.',
    );

    // Calls to parse environment variables and the polyrepo package manifest
    expect(parseEnvVariablesMock).toHaveBeenCalledTimes(1);
    expect(getPackageManifestMock).toHaveBeenCalledTimes(1);
    expect(getPackageManifestMock).toHaveBeenCalledWith('foo/');

    // Calls to read and parse the changelog
    expect(readFileMock).toHaveBeenCalledTimes(1);
    expect(readFileMock).toHaveBeenCalledWith('foo/CHANGELOG.md');
    expect(parseChangelogMock).toHaveBeenCalledTimes(1);
    expect(parseChangelogMock).toHaveBeenCalledWith({
      changelogContent: mockChangelog,
      repoUrl: mockRepoUrl,
    });
    expect(getStringifiedReleaseMock).toHaveBeenCalledTimes(1);
    expect(getStringifiedReleaseMock).toHaveBeenCalledWith(mockVersion);
  });
});
