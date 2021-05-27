import { setFailed as setActionToFailed } from '@actions/core';
import { getReleaseNotes } from './getReleaseNotes';

getReleaseNotes().catch((error) => {
  setActionToFailed(error);
});
