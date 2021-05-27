import * as actionsCore from '@actions/core';
import * as actionModule from './getReleaseNotes';

jest.mock('@actions/core', () => {
  return {
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
    const setFailedMock = jest.spyOn(actionsCore, 'setFailed');

    import('.');
    await new Promise<void>((resolve) => {
      setImmediate(() => {
        expect(getReleaseNotesMock).toHaveBeenCalledTimes(1);
        expect(setFailedMock).toHaveBeenCalledTimes(1);
        expect(setFailedMock).toHaveBeenCalledWith(new Error('error'));
        resolve();
      });
    });
  });
});
