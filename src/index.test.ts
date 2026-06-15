import * as actionsCore from '@actions/core';

import * as actionModule from './getReleaseNotes';

jest.mock('@actions/core', () => {
  return {
    error: jest.fn(),
    setFailed: jest.fn(),
  };
});

jest.mock('./getReleaseNotes', () => {
  return {
    getReleaseNotes: jest.fn(),
  };
});

describe('main entry file', () => {
  it('calls getReleaseNotes and catches thrown errors', async () => {
    const getReleaseNotesMock = jest
      .spyOn(actionModule, 'getReleaseNotes')
      .mockImplementationOnce(async () => {
        throw new Error('error');
      });
    const logErrorMock = jest.spyOn(actionsCore, 'error');
    const setFailedMock = jest.spyOn(actionsCore, 'setFailed');

    // The module body invokes `getReleaseNotes().catch(...)` as a side
    // effect; we intentionally do not await it so the rejection can settle
    // on the next tick (captured by the setImmediate below).
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    import('.');
    await new Promise<void>((resolve) => {
      setImmediate(() => {
        expect(getReleaseNotesMock).toHaveBeenCalledTimes(1);
        expect(logErrorMock).toHaveBeenCalledTimes(1);
        expect(setFailedMock).toHaveBeenCalledTimes(1);
        expect(setFailedMock).toHaveBeenCalledWith(new Error('error'));
        resolve();
      });
    });
  });
});
