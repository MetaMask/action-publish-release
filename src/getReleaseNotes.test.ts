import { getReleaseNotes } from './getReleaseNotes';

describe('getReleaseNotes', () => {
  it('should not throw', async () => {
    expect(async () => await getReleaseNotes()).not.toThrow();
  });
});
