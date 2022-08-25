import { promises as fs } from 'fs';
import pathUtils from 'path';
import { exportVariable as exportActionVariable } from '@actions/core';
import {
  getPackageManifest,
  getWorkspaceLocations,
  ManifestFieldNames,
  MonorepoPackageManifest,
  validateMonorepoPackageManifest,
  validatePackageManifestVersion,
  validatePolyrepoPackageManifest,
} from '@metamask/action-utils';
import { parseChangelog } from '@metamask/auto-changelog';
import { parseEnvironmentVariables } from './utils';

export const getUpdatedPackages = (): Record<
  string,
  Record<string, string>
> => {
  const { updatedPackages } = parseEnvironmentVariables();

  if (updatedPackages === undefined) {
    throw new Error('The updated packages are undefined');
  } else {
    const { packages } = JSON.parse(updatedPackages);
    return packages;
  }
};

/**
 * Action entry function. Gets the release notes for use in a GitHub release.
 * Works for both monorepos and polyrepos.
 *
 * @see getMonorepoReleaseNotes - For details on monorepo workflow.
 * @see getPackageManifest - For details on polyrepo workflow.
 */
export async function getReleaseNotes() {
  const { releaseVersion, repoUrl, workspaceRoot, versionStrategy } =
    parseEnvironmentVariables();

  const rawRootManifest = await getPackageManifest(workspaceRoot);
  const rootManifest = validatePackageManifestVersion(
    rawRootManifest,
    workspaceRoot,
  );

  let releaseNotes: string;
  if (ManifestFieldNames.Workspaces in rootManifest) {
    console.log(
      'Project appears to have workspaces. Applying monorepo workflow.',
    );

    releaseNotes = await getMonorepoReleaseNotes(
      releaseVersion,
      repoUrl,
      workspaceRoot,
      validateMonorepoPackageManifest(rootManifest, workspaceRoot),
      versionStrategy,
    );
  } else {
    console.log(
      'Project does not appear to have any workspaces. Applying polyrepo workflow.',
    );

    releaseNotes = await getPackageReleaseNotes(
      releaseVersion,
      repoUrl,
      workspaceRoot,
    );
  }

  releaseNotes = releaseNotes.trim();
  if (!releaseNotes) {
    throw new Error('The computed release notes are empty.');
  }
  exportActionVariable('RELEASE_NOTES', releaseNotes.concat('\n\n'));
}

/**
 * Gets the combined release notes for all packages in the monorepo that are
 * included in the current release.
 *
 * A package is assumed to be included in the release if the version in its
 * manifest is equal to the specified release version.
 *
 * @param releaseVersion - The version of the release.
 * @param repoUrl - The GitHub repository HTTPS URL.
 * @param workspaceRoot - The GitHub Actions workspace root directory.
 * @param rootManifest - The parsed package.json file of the root directory.
 * @returns The release notes for all packages included in the release.
 */
async function getMonorepoReleaseNotes(
  releaseVersion: string,
  repoUrl: string,
  workspaceRoot: string,
  rootManifest: MonorepoPackageManifest,
  versioningStrategy: string,
): Promise<string> {
  const workspaceLocations = await getWorkspaceLocations(
    rootManifest.workspaces,
    workspaceRoot,
  );

  let releaseNotes = '';

  if (versioningStrategy === 'fixed') {
    for (const workspaceLocation of workspaceLocations) {
      const completeWorkspacePath = pathUtils.join(
        workspaceRoot,
        workspaceLocation,
      );

      const rawPackageManifest = await getPackageManifest(
        completeWorkspacePath,
      );
      const { name: packageName, version: packageVersion } =
        validatePolyrepoPackageManifest(
          rawPackageManifest,
          completeWorkspacePath,
        );

      if (packageVersion === releaseVersion) {
        releaseNotes = releaseNotes.concat(
          `## ${packageName}\n\n`,
          await getPackageReleaseNotes(
            releaseVersion,
            repoUrl,
            completeWorkspacePath,
          ),
          '\n\n',
        );
      }
    }
  } else {
    for (const [packageName, value] of Object.entries(getUpdatedPackages())) {
      const { path } = value;
      releaseNotes = releaseNotes.concat(
        `## ${packageName}\n\n`,
        await getPackageReleaseNotes(releaseVersion, repoUrl, path),
        '\n\n',
      );
    }
  }

  return releaseNotes;
}

/**
 * Uses
 * [`@metamask/auto-changelog`](https://npmjs.com/package/@metamask/auto-changelog)
 * to get the change entries for the specified release.
 *
 * @param releaseVersion - The version of the release.
 * @param repoUrl - The GitHub repository HTTPS URL.
 * @param packagePath - The path to the package.
 * @returns The release notes for the package.
 */
async function getPackageReleaseNotes(
  releaseVersion: string,
  repoUrl: string,
  packagePath: string,
): Promise<string> {
  const changelogContent = (
    await fs.readFile(pathUtils.join(packagePath, 'CHANGELOG.md'))
  ).toString();
  const changelog = parseChangelog({
    changelogContent,
    repoUrl,
  });

  // Return the stringified release without the first line, which is a markdown
  // header with the release version, e.g. "## 1.0.0\n".
  return (
    changelog
      .getStringifiedRelease(releaseVersion)
      // Strip the release markdown header.
      .split('\n')
      .slice(1)
      .join('\n')
  );
}
