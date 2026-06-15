import {
  getStringRecordValue,
  isTruthyString,
  isValidSemver,
} from '@metamask/action-utils';
import process from 'node:process';

import { FIXED, INDEPENDENT } from './constants';

type ExpectedProcessEnv = {
  // The root of the workspace running this action
  GITHUB_WORKSPACE?: string;
  // This is set from the repository `package.json` key: .repository.url
  REPOSITORY_URL?: string;
  // The version to be released,
  // this is set from the repository `package.json` key: .version
  RELEASE_VERSION?: string;
  // release strategy
  // this is set from the repository `release.config.json` key: .versioningStrategy
  RELEASE_STRATEGY?: string;
  // this is a json list of the updated packages
  RELEASE_PACKAGES?: string;
} & Partial<Record<string, string>>;

/**
 * Add missing properties to "process.env" interface.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // The module-augmentation pattern requires an interface here, even though
    // the body is empty.
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends ExpectedProcessEnv {}
  }
}

type ParsedEnvironmentVariables = {
  releaseVersion: string;
  repoUrl: string;
  workspaceRoot: string;
  releaseStrategy: string;
  releasePackages: string | undefined;
};

const isValidUrl = (str: string): boolean => {
  let url;

  try {
    url = new URL(str);
  } catch {
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

  const releaseStrategy = getStringRecordValue(
    'RELEASE_STRATEGY',
    environmentVariables,
  );

  if (!fixedOrIndependent(releaseStrategy)) {
    throw new Error(
      `process.env.RELEASE_STRATEGY must be one of "${FIXED}" or "${INDEPENDENT}"`,
    );
  }

  const releasePackages =
    getStringRecordValue('RELEASE_PACKAGES', environmentVariables) || undefined;

  return {
    releaseVersion,
    repoUrl,
    workspaceRoot,
    releaseStrategy,
    releasePackages,
  };
}
