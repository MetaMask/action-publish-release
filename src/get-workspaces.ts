import fastGlob from 'fast-glob';
import { promises as fs } from 'fs';
import path from 'path';

export type Workspace = {
  /**
   * The path of the workspace, relative to the project root, using forward
   * slashes. The root workspace is `.`.
   */
  location: string;

  /**
   * The name of the workspace, or `null` if its manifest has no name.
   */
  name: string | null;
};

type Manifest = {
  name?: unknown;
  workspaces?: unknown;
};

/**
 * Read and parse the `package.json` file in the given directory.
 *
 * @param directory - The directory containing the manifest.
 * @returns The parsed manifest.
 */
async function readManifest(directory: string): Promise<Manifest> {
  const contents = await fs.readFile(
    path.join(directory, 'package.json'),
    'utf8',
  );

  return JSON.parse(contents);
}

/**
 * Get the workspace patterns from a manifest. Both the array form and the
 * `{ packages: [...] }` form of the `workspaces` field are supported.
 *
 * @param manifest - The parsed manifest.
 * @returns The workspace patterns.
 */
function getPatterns(manifest: Manifest): string[] {
  const { workspaces } = manifest;
  const patterns = Array.isArray(workspaces)
    ? workspaces
    : (workspaces as { packages?: unknown } | null | undefined)?.packages;

  return Array.isArray(patterns)
    ? patterns.filter(
        (pattern): pattern is string => typeof pattern === 'string',
      )
    : [];
}

/**
 * Get the child workspace directories of a workspace. This mirrors how Yarn
 * (`Workspace.setup` in `@yarnpkg/core`) resolves the `workspaces` field: the
 * patterns are expanded with `fast-glob`, sorted, and only directories that
 * contain a `package.json` are kept.
 *
 * @param directory - The directory of the parent workspace.
 * @param manifest - The manifest of the parent workspace.
 * @returns The absolute paths of the child workspaces.
 */
async function getChildDirectories(
  directory: string,
  manifest: Manifest,
): Promise<string[]> {
  const patterns = getPatterns(manifest);
  if (patterns.length === 0) {
    return [];
  }

  const relativeDirectories = await fastGlob(patterns, {
    cwd: directory,
    onlyDirectories: true,
    ignore: ['**/node_modules', '**/.git', '**/.yarn'],
  });

  // `fast-glob` returns results in arbitrary order.
  relativeDirectories.sort();

  const children: string[] = [];
  for (const relativeDirectory of relativeDirectories) {
    const child = path.resolve(directory, relativeDirectory);
    const exists = await fs
      .access(path.join(child, 'package.json'))
      .then(() => true)
      .catch(() => false);

    if (exists) {
      children.push(child);
    }
  }

  return children;
}

/**
 * Get the workspaces of a project, without calling Yarn. The result matches
 * the `location` and `name` fields of `yarn workspaces list --json`, in the
 * same order: the root workspace first, followed by the other workspaces in a
 * depth-first traversal.
 *
 * Unlike Yarn, this does not load any plugins or other repository-controlled
 * code, so it is safe to run in a step that has access to secrets.
 *
 * @param root - The root directory of the project.
 * @returns The workspaces of the project.
 */
export async function getWorkspaces(root: string): Promise<Workspace[]> {
  const projectRoot = path.resolve(root);
  const workspaces: Workspace[] = [];
  const locationsByName = new Map<string, string>();

  // Directories are marked as visited before descending into them, so a
  // workspace matched by multiple parents is only included once, at the
  // position Yarn would include it.
  const visited = new Set<string>([projectRoot]);

  const load = async (directory: string): Promise<void> => {
    const manifest = await readManifest(directory);
    const name = typeof manifest.name === 'string' ? manifest.name : null;
    const location =
      path.relative(projectRoot, directory).split(path.sep).join('/') || '.';

    if (name !== null) {
      const duplicate = locationsByName.get(name);
      if (duplicate !== undefined) {
        throw new Error(
          `Duplicate workspace name ${name}: ${location} conflicts with ${duplicate}.`,
        );
      }

      locationsByName.set(name, location);
    }

    workspaces.push({ location, name });

    const children = (await getChildDirectories(directory, manifest)).filter(
      (child) => !visited.has(child),
    );
    children.forEach((child) => visited.add(child));

    for (const child of children) {
      await load(child);
    }
  };

  await load(projectRoot);
  return workspaces;
}
