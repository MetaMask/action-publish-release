/**
 * Add missing properties to "process.env" interface.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      // The root of the workspace running this action
      GITHUB_WORKSPACE: string;
    }
  }
}

export const WORKSPACE_ROOT = process.env.GITHUB_WORKSPACE;

const TWO_SPACES = '  ';

/**
 * @param value - The value to test.
 * @returns Whether the value is a non-empty string.
 */
export function isTruthyString(value: unknown): value is string {
  return Boolean(value) && typeof value === 'string';
}

/**
 * @param numTabs - The number of tabs to return. A tab consists of two spaces.
 * @param prefix - The prefix to prepend to the returned string, if any.
 * @returns A string consisting of the prefix, if any, and the requested number
 * of tabs.
 */
export function tabs(numTabs: number, prefix?: string): string {
  if (!Number.isInteger(numTabs) || numTabs < 1) {
    throw new Error('Expected positive integer.');
  }

  const firstTab = prefix ? `${prefix}${TWO_SPACES}` : TWO_SPACES;

  if (numTabs === 1) {
    return firstTab;
  }
  return firstTab + new Array(numTabs).join(TWO_SPACES);
}
