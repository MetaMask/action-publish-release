import {
  error as logError,
  setFailed as setActionToFailed,
} from '@actions/core';
import { getReleaseNotes } from './getReleaseNotes';

getReleaseNotes().catch((error) => {
  // istanbul ignore else
  if (error.stack) {
    logError(error.stack);
  }
  setActionToFailed(error);
});
