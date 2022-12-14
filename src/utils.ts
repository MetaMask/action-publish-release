import {
  getStringRecordValue,
  isTruthyString,
  isValidSemver,
} from '@metamask/action-utils';

import { FIXED, INDEPENDENT } from './constants';

interface ExpectedProcessEnv extends Partial<Record<string, string>> {
  // The root of the workspace running this action
  GITHUB_WORKSPACE?: string;
  // This is set from the repository `package.json` key: .repository.url
  REPOSITORY_URL?: string;
  // The version to be released,
  // this is set from the repository `package.json` key: .version
  RELEASE_VERSION?: string;
  // version strategy
  // this is set from the repository `release.config.json` key: .versioningStrategy
  VERSION_STRATEGY?: string;
  // release strategy
  // this is set from the repository `release.config.json` key: .releasingStrategy
  RELEASE_STRATEGY?: string;
  // this is a json list of the updated packages
  RELEASE_PACKAGES?: string;
}

/**
 * Add missing properties to "process.env" interface.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends ExpectedProcessEnv {}
  }
}

interface ParsedEnvironmentVariables {
  releaseVersion: string;
  repoUrl: string;
  workspaceRoot: string;
  versionStrategy: string;
  releasePackages: string | undefined;
}

const isValidUrl = (str: string): boolean => {
  let url;

  try {
    url = new URL(str);
  } catch (_) {
    return false;
  }

  return url.protocol === `https:`;
};

const removeGitEx = (url: string): string =>
  url.substring(0, url.lastIndexOf('.git'));

const fixedOrIndependent = (value: string) =>
  value === FIXED || value === INDEPENDENT;

/**
 * Utility function for parsing expected environment variables.
 *
 * We parameterize process.env for testing purposes.
 *
 * @param environmentVariables - The environment variables to parse.
 * @returns The parsed environment variables.
 */
export function parseEnvironmentVariables(
  environmentVariables: ExpectedProcessEnv = process.env,
): ParsedEnvironmentVariables {
  const workspaceRoot = getStringRecordValue(
    'GITHUB_WORKSPACE',
    environmentVariables,
  );

  if (!isTruthyString(workspaceRoot)) {
    throw new Error('process.env.GITHUB_WORKSPACE must be set.');
  }

  const releaseVersion = getStringRecordValue(
    'RELEASE_VERSION',
    environmentVariables,
  );
  if (!isTruthyString(releaseVersion) || !isValidSemver(releaseVersion)) {
    throw new Error(
      'process.env.RELEASE_VERSION must be a valid SemVer version.',
    );
  }

  const repositoryUrl = getStringRecordValue(
    'REPOSITORY_URL',
    environmentVariables,
  );

  if (!isValidUrl(repositoryUrl)) {
    throw new Error('process.env.REPOSITORY_URL must be a valid URL.');
  }

  const repoUrl = removeGitEx(repositoryUrl);

  const versionStrategy = getStringRecordValue(
    'VERSION_STRATEGY',
    environmentVariables,
  );

  if (!fixedOrIndependent(versionStrategy)) {
    throw new Error(
      `process.env.VERSION_STRATEGY must be one of "${FIXED}" or "${INDEPENDENT}"`,
    );
  }

  const releasePackages =
    getStringRecordValue('RELEASE_PACKAGES', environmentVariables) || undefined;

  return {
    releaseVersion,
    repoUrl,
    workspaceRoot,
    versionStrategy,
    releasePackages,
  };
}
