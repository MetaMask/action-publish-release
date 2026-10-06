import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { getWorkspaces } from './get-workspaces';

/**
 * Create a temporary project from a map of manifest locations to manifests.
 * Locations are relative to the project root, and `.` is the root manifest.
 *
 * @param manifests - The manifests to write.
 * @returns The path of the project root.
 */
async function createProject(
  manifests: Record<string, unknown>,
): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workspaces-test-'));

  for (const [location, manifest] of Object.entries(manifests)) {
    const directory = path.join(root, location);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      path.join(directory, 'package.json'),
      JSON.stringify(manifest),
    );
  }

  return root;
}

describe('getWorkspaces', () => {
  const roots: string[] = [];

  const setup = async (manifests: Record<string, unknown>) => {
    const root = await createProject(manifests);
    roots.push(root);
    return root;
  };

  afterEach(async () => {
    await Promise.all(
      roots
        .splice(0)
        .map(async (root) => fs.rm(root, { recursive: true, force: true })),
    );
  });

  it('returns only the root workspace if there are no workspaces', async () => {
    const root = await setup({ '.': { name: 'root' } });

    expect(await getWorkspaces(root)).toStrictEqual([
      { location: '.', name: 'root' },
    ]);
  });

  it('returns a null name for workspaces without a name', async () => {
    const root = await setup({
      '.': { workspaces: ['packages/*'] },
      'packages/a': { name: 123 },
    });

    expect(await getWorkspaces(root)).toStrictEqual([
      { location: '.', name: null },
      { location: 'packages/a', name: null },
    ]);
  });

  it('supports the array form of the workspaces field', async () => {
    const root = await setup({
      '.': { name: 'root', workspaces: ['packages/*'] },
      'packages/a': { name: '@scope/a' },
      'packages/b': { name: '@scope/b' },
    });

    expect(await getWorkspaces(root)).toStrictEqual([
      { location: '.', name: 'root' },
      { location: 'packages/a', name: '@scope/a' },
      { location: 'packages/b', name: '@scope/b' },
    ]);
  });

  it('supports the object form of the workspaces field', async () => {
    const root = await setup({
      '.': { name: 'root', workspaces: { packages: ['packages/*'] } },
      'packages/a': { name: '@scope/a' },
    });

    expect(await getWorkspaces(root)).toStrictEqual([
      { location: '.', name: 'root' },
      { location: 'packages/a', name: '@scope/a' },
    ]);
  });

  it.each([
    ['null', null],
    ['a string', 'packages/*'],
    ['an object without packages', {}],
    ['an object with invalid packages', { packages: 'packages/*' }],
    ['an array of non-strings', [1, null, {}]],
    ['an empty array', []],
  ])(
    'ignores the workspaces field if it is %s',
    async (_description, value) => {
      const root = await setup({
        '.': { name: 'root', workspaces: value },
        'packages/a': { name: '@scope/a' },
      });

      expect(await getWorkspaces(root)).toStrictEqual([
        { location: '.', name: 'root' },
      ]);
    },
  );

  it('ignores non-string patterns but keeps valid ones', async () => {
    const root = await setup({
      '.': { name: 'root', workspaces: [1, 'packages/*'] },
      'packages/a': { name: '@scope/a' },
    });

    expect(await getWorkspaces(root)).toStrictEqual([
      { location: '.', name: 'root' },
      { location: 'packages/a', name: '@scope/a' },
    ]);
  });

  it('sorts workspaces by location', async () => {
    const root = await setup({
      '.': { name: 'root', workspaces: ['packages/*'] },
      'packages/c': { name: 'c' },
      'packages/a': { name: 'a' },
      'packages/b': { name: 'b' },
    });

    const workspaces = await getWorkspaces(root);

    expect(workspaces.map(({ name }) => name)).toStrictEqual([
      'root',
      'a',
      'b',
      'c',
    ]);
  });

  it('skips directories without a manifest', async () => {
    const root = await setup({
      '.': { name: 'root', workspaces: ['packages/*'] },
      'packages/a': { name: 'a' },
    });
    await fs.mkdir(path.join(root, 'packages', 'empty'));

    expect(await getWorkspaces(root)).toStrictEqual([
      { location: '.', name: 'root' },
      { location: 'packages/a', name: 'a' },
    ]);
  });

  it('ignores `node_modules`, `.git`, and `.yarn` directories', async () => {
    const root = await setup({
      '.': { name: 'root', workspaces: ['**'] },
      'packages/a': { name: 'a' },
      'packages/a/node_modules/dependency': { name: 'dependency' },
      '.git/hooks': { name: 'git' },
      '.yarn/cache': { name: 'yarn' },
    });

    expect(await getWorkspaces(root)).toStrictEqual([
      { location: '.', name: 'root' },
      { location: 'packages/a', name: 'a' },
    ]);
  });

  it('supports negated patterns', async () => {
    const root = await setup({
      '.': { name: 'root', workspaces: ['packages/*', '!packages/b'] },
      'packages/a': { name: 'a' },
      'packages/b': { name: 'b' },
    });

    expect(await getWorkspaces(root)).toStrictEqual([
      { location: '.', name: 'root' },
      { location: 'packages/a', name: 'a' },
    ]);
  });

  it('traverses nested workspaces depth-first', async () => {
    const root = await setup({
      '.': { name: 'root', workspaces: ['packages/*'] },
      'packages/a': { name: 'a', workspaces: ['nested/*'] },
      'packages/a/nested/x': { name: 'x' },
      'packages/b': { name: 'b' },
    });

    const workspaces = await getWorkspaces(root);

    expect(workspaces).toStrictEqual([
      { location: '.', name: 'root' },
      { location: 'packages/a', name: 'a' },
      { location: 'packages/a/nested/x', name: 'x' },
      { location: 'packages/b', name: 'b' },
    ]);
  });

  it('includes a workspace matched by multiple parents once, at the first level it is matched', async () => {
    const root = await setup({
      '.': { name: 'root', workspaces: ['packages/*'] },
      'packages/a': { name: 'a', workspaces: ['../b'] },
      'packages/b': { name: 'b' },
    });

    expect(await getWorkspaces(root)).toStrictEqual([
      { location: '.', name: 'root' },
      { location: 'packages/a', name: 'a' },
      { location: 'packages/b', name: 'b' },
    ]);
  });

  it('throws if two workspaces have the same name', async () => {
    const root = await setup({
      '.': { name: 'root', workspaces: ['packages/*'] },
      'packages/a': { name: 'duplicate' },
      'packages/b': { name: 'duplicate' },
    });

    await expect(getWorkspaces(root)).rejects.toThrow(
      'Duplicate workspace name duplicate: packages/b conflicts with packages/a',
    );
  });

  it('throws if the root manifest does not exist', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workspaces-test-'));
    roots.push(root);

    await expect(getWorkspaces(root)).rejects.toThrow('ENOENT');
  });
});
