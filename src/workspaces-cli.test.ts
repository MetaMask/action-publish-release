jest.mock('@actions/core', () => {
  return {
    error: jest.fn(),
    setFailed: jest.fn(),
  };
});

jest.mock('./get-workspaces', () => {
  return {
    getWorkspaces: jest.fn(),
  };
});

/**
 * Load fresh instances of the mocked modules and the entry file. The entry file
 * runs as a side effect of being imported, so the module registry has to be
 * reset for each test.
 *
 * @returns The mocked modules.
 */
async function loadEntryFile() {
  jest.resetModules();

  const actionsCore = await import('@actions/core');
  const workspacesModule = await import('./get-workspaces');

  return {
    actionsCore,
    workspacesModule,
    run: async () => {
      await import('./workspaces-cli');
      await new Promise<void>((resolve) => setImmediate(resolve));
    },
  };
}

describe('get workspaces entry file', () => {
  it('prints the workspaces as newline-delimited JSON', async () => {
    const { workspacesModule, run } = await loadEntryFile();
    jest.spyOn(workspacesModule, 'getWorkspaces').mockResolvedValueOnce([
      { location: '.', name: 'root' },
      { location: 'packages/a', name: null },
    ]);
    const writeMock = jest
      .spyOn(process.stdout, 'write')
      .mockImplementationOnce(() => true);

    await run();

    expect(writeMock).toHaveBeenCalledWith(
      '{"location":".","name":"root"}\n{"location":"packages/a","name":null}\n',
    );
  });

  it('catches thrown errors', async () => {
    const { actionsCore, workspacesModule, run } = await loadEntryFile();
    jest
      .spyOn(workspacesModule, 'getWorkspaces')
      .mockRejectedValueOnce(new Error('error'));
    const logErrorMock = jest.spyOn(actionsCore, 'error');
    const setFailedMock = jest.spyOn(actionsCore, 'setFailed');

    await run();

    expect(logErrorMock).toHaveBeenCalledTimes(1);
    expect(setFailedMock).toHaveBeenCalledTimes(1);
    expect(setFailedMock).toHaveBeenCalledWith(new Error('error'));
  });
});
