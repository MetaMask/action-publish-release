import {
  getStringRecordValue,
  isTruthyString,
  isValidSemver,
} from '@metamask/action-utils';

import {
  GITHUB_WORKSPACE,
  RELEASE_VERSION,
  REPOSITORY_URL,
  GITHUB_WORKSPACE_ERROR,
  RELEASE_VERSION_ERROR,
  REPOSITORY_URL_ERROR,
} from './constants';

interface ExpectedProcessEnv extends Partial<Record<string, string>> {
  // The root of the workspace running this action
  [GITHUB_WORKSPACE]?: string;
  // This is set from the repository `package.json` key: .repository.url
  [REPOSITORY_URL]?: string;
  // The version to be released,
  // this is set from the repository `package.json` key: .version
  [RELEASE_VERSION]?: string;
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
}

const isValidUrl = (str: string): boolean => {
  let url;

  try {
    url = new URL(str);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
};

const removeGitEx = (url: string): string =>
  url.substring(0, url.lastIndexOf('.git'));

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
    GITHUB_WORKSPACE,
    environmentVariables,
  );

  if (!isTruthyString(workspaceRoot)) {
    throw new Error(GITHUB_WORKSPACE_ERROR);
  }

  const releaseVersion = getStringRecordValue(
    RELEASE_VERSION,
    environmentVariables,
  );
  if (!isTruthyString(releaseVersion) || !isValidSemver(releaseVersion)) {
    throw new Error(RELEASE_VERSION_ERROR);
  }

  const repositoryUrl = getStringRecordValue(
    REPOSITORY_URL,
    environmentVariables,
  );

  if (!isValidUrl(repositoryUrl)) {
    throw new Error(REPOSITORY_URL_ERROR);
  }

  const repoUrl = removeGitEx(repositoryUrl);

  return {
    releaseVersion,
    repoUrl,
    workspaceRoot,
  };
}
