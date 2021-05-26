import {
  getStringRecordValue,
  isTruthyString,
  isValidSemver,
} from '@metamask/action-utils';

interface ExpectedProcessEnv extends Partial<Record<string, string>> {
  // The root of the workspace running this action
  GITHUB_WORKSPACE?: string;
  // The owner and repository name, e.g. Octocat/Hello-World
  GITHUB_REPOSITORY?: string;
  // The version to be released
  RELEASE_VERSION?: string;
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

/**
 * Matches valid "Orgname/Reponame" strings.
 *
 * Organization names may only have non-consecutive hyphens and alphanumerical
 * characters, and may not start or end with hyphens. We don't deal with the
 * non-consecutive edge case.
 *
 * Repo names are more permissive, but in practice the URLs will only include
 * alphanumerical characters, hyphens, underscores, and periods.
 */
const githubRepoIdRegEx = /^[\d\w](?:[\d\w-]*[\d\w])*\/[\d\w_.-]+$/iu;

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
  const githubWorkspace = getStringRecordValue(
    'GITHUB_WORKSPACE',
    environmentVariables,
  );
  if (!isTruthyString(githubWorkspace)) {
    throw new Error('process.env.GITHUB_WORKSPACE must be set.');
  }

  const githubRepository = getStringRecordValue(
    'GITHUB_REPOSITORY',
    environmentVariables,
  );
  if (!githubRepoIdRegEx.test(githubRepository)) {
    throw new Error(
      'process.env.GITHUB_REPOSITORY must be a valid GitHub repository identifier.',
    );
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

  return {
    releaseVersion,
    repoUrl: `https://github.com/${githubRepository}`,
    workspaceRoot: githubWorkspace,
  };
}
