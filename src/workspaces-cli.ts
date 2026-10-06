import { error as logError, setFailed } from '@actions/core';
import process from 'process';

import { getWorkspaces } from './get-workspaces';

/**
 * Print the workspaces of the project in the current directory to stdout, as
 * newline-delimited JSON objects with `location` and `name` properties. This is
 * the same shape as `yarn workspaces list --json`.
 */
async function main() {
  const workspaces = await getWorkspaces(process.cwd());
  const output = workspaces
    .map(({ location, name }) => JSON.stringify({ location, name }))
    .join('\n');

  process.stdout.write(`${output}\n`);
}

main().catch((error) => {
  // istanbul ignore else
  if (error.stack) {
    logError(error.stack);
  }

  setFailed(error);
});
