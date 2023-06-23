import assert from 'assert';
import fs from 'fs';
import * as actionsCore from '@actions/core';
import * as autoChangelog from '@metamask/auto-changelog';
import * as actionUtils from '@metamask/action-utils';
import * as localUtils from './utils';
import * as releaseNotesUtils from './getReleaseNotes';
import { PackageRecord } from './constants';

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

describe('getReleasePackages', () => {
  let parseEnvVariablesMock: jest.SpyInstance;

  beforeEach(() => {
    parseEnvVariablesMock = jest.spyOn(localUtils, 'parseEnvironmentVariables');
  });

  it('should get updated packages', () => {
    parseEnvVariablesMock.mockImplementationOnce(() => {
      return {
        releasePackages:
          '{"packages":{"@metamask/snaps-cli":{"name":"@metamask/snaps-cli","path":"packages/cli","version":"0.20.1"},"@metamask/snap-controllers":{"name":"@metamask/snap-controllers","path":"packages/controllers","version":"0.20.1"}}}',
      };
    });

    const releasePackages = releaseNotesUtils.getReleasePackages();

    expect(parseEnvVariablesMock).toHaveBeenCalledTimes(1);
    expect(Object.entries(releasePackages)).toHaveLength(2);
  });

  it('should error if updated packages are undefined', () => {
    parseEnvVariablesMock.mockImplementationOnce(() => {
      return {
        releasePackages: undefined,
      };
    });

    expect(() => {
      releaseNotesUtils.getReleasePackages();
    }).toThrow('The updated packages are undefined');
    expect(parseEnvVariablesMock).toHaveBeenCalledTimes(1);
  });
});

describe('getReleaseNotes', () => {
  let parseEnvVariablesMock: jest.SpyInstance;
  let getPackageManifestMock: jest.SpyInstance;
  let getWorkspaceLocationsMock: jest.SpyInstance;
  let readFileMock: jest.SpyInstance;
  let parseChangelogMock: jest.SpyInstance;
  let exportActionVariableMock: jest.SpyInstance;
  let getReleasePackagesMock: jest.SpyInstance;
  let entriesMock: jest.SpyInstance;

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
    getReleasePackagesMock = jest.spyOn(
      releaseNotesUtils,
      'getReleasePackages',
    );
    entriesMock = jest.spyOn(Object, 'entries');
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

    await releaseNotesUtils.getReleaseNotes();

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
      mockReleaseBody,
    );
  });

  it('should get the release notes for monorepos (fixed)', async () => {
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
    readFileMock.mockImplementation(async (path: string) => {
      const match = path.match(/^foo\/packages\/([^/]+)\/CHANGELOG.md$/u);
      assert(match, 'Failed to extract package name');
      const packageName = match[1];
      return `${mockChangelog} for ${packageName}`;
    });

    parseChangelogMock.mockImplementation(({ changelogContent }) => {
      return {
        // getStringifiedRelease returns a string whose first line is a markdown
        // e.g. "## 1.0.0\n". This is stripped by getReleaseNotes.
        getStringifiedRelease(version: string) {
          return `## Header\nrelease ${version} for ${changelogContent.slice(
            -1,
          )}`;
        },
      };
    });

    await releaseNotesUtils.getReleaseNotes();

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
      `
## a 1.0.0

release 1.0.0 for a

## c 1.0.0

release 1.0.0 for c
      `.trim(),
    );
  });

  it('should get the release notes for monorepos (independent)', async () => {
    const mockWorkspaceRoot = 'foo/';
    const mockRepoUrl = 'https://github.com/Org/Name';
    const mockVersion = '1.0.0';
    const mockWorkspaces = ['a', 'b', 'c'];
    const mockChangelog = 'a changelog';
    const mockReleaseStrategy = 'independent';

    const packageA: PackageRecord = {
      name: '@metamask/controllers',
      path: 'packages/base-controller',
      version: '0.3.0',
    };

    const packageB: PackageRecord = {
      name: '@metamask/snap-controllers',
      path: 'packages/controller-utils',
      version: '0.7.1',
    };

    const record: Record<string, PackageRecord> = {
      '@metamask/base-controller': packageA,
      '@metamask/controller-utils': packageB,
    };

    getReleasePackagesMock.mockImplementationOnce(() => {
      return record;
    });

    parseEnvVariablesMock.mockImplementationOnce(() => {
      return {
        releaseVersion: mockVersion,
        repoUrl: mockRepoUrl,
        workspaceRoot: mockWorkspaceRoot,
        releaseStrategy: mockReleaseStrategy,
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

    // Return a different changelog for each package/workspace
    readFileMock.mockImplementation(async (path: string) => {
      const match = path.match(/^packages\/([^/]+)\/CHANGELOG.md$/u);
      assert(match, 'Failed to extract package name');
      const packageName = match[1];
      return `${mockChangelog} for ${packageName}`;
    });

    parseChangelogMock.mockImplementation(({ changelogContent }) => {
      const match = changelogContent.match(
        new RegExp(`^${mockChangelog} for (.+)$`, 'u'),
      );
      assert(match, 'Failed to extract package name');
      const packageName = match[1];

      return {
        // getStringifiedRelease returns a string whose first line is a markdown
        // e.g. "## 1.0.0\n". This is stripped by getReleaseNotes.
        getStringifiedRelease(version: string) {
          return `## Header\nrelease ${version} for ${packageName}`;
        },
      };
    });

    await releaseNotesUtils.getReleaseNotes();

    // Calls to parse environment variables and the root manifest
    expect(parseEnvVariablesMock).toHaveBeenCalledTimes(1);
    expect(entriesMock).toHaveBeenCalledTimes(1);
    expect(getReleasePackagesMock).toHaveBeenCalledTimes(1);

    // Calls to get and parse the changelogs for every package of the specified
    // release version
    expect(readFileMock).toHaveBeenCalledTimes(2);
    expect(readFileMock).toHaveBeenNthCalledWith(
      1,
      'packages/base-controller/CHANGELOG.md',
    );
    expect(readFileMock).toHaveBeenNthCalledWith(
      2,
      'packages/controller-utils/CHANGELOG.md',
    );
    expect(parseChangelogMock).toHaveBeenCalledTimes(2);

    // Finally, the Action output, as an environment variable
    expect(exportActionVariableMock).toHaveBeenCalledTimes(1);
    expect(exportActionVariableMock).toHaveBeenCalledWith(
      'RELEASE_NOTES',
      `
## @metamask/base-controller 0.3.0

release 0.3.0 for base-controller

## @metamask/controller-utils 0.7.1

release 0.7.1 for controller-utils
      `.trim(),
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

    await expect(releaseNotesUtils.getReleaseNotes()).rejects.toThrow(
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
