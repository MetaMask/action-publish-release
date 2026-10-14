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

  const workspacesModule = await import('./get-workspaces');

  return {
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
    const logMock = jest
      .spyOn(console, 'log')
      .mockImplementationOnce(() => undefined);

    await run();

    expect(logMock).toHaveBeenCalledWith(
      '{"location":".","name":"root"}\n{"location":"packages/a","name":null}',
    );
  });

  it('writes thrown errors to stderr and sets a failing exit code', async () => {
    const { workspacesModule, run } = await loadEntryFile();
    const error = new Error('error');
    jest.spyOn(workspacesModule, 'getWorkspaces').mockRejectedValueOnce(error);
    const logMock = jest.spyOn(console, 'log');
    const consoleErrorMock = jest
      .spyOn(console, 'error')
      .mockImplementationOnce(() => undefined);
    const originalExitCode = process.exitCode;

    try {
      await run();

      expect(consoleErrorMock).toHaveBeenCalledWith(error.stack);
      expect(logMock).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(1);
    } finally {
      process.exitCode = originalExitCode;
    }
  });
});
