import {
  error as logError,
  setFailed as setActionToFailed,
} from '@actions/core';
import { getReleaseNotes } from './getReleaseNotes';

getReleaseNotes().catch((error) => {
  logError(error?.stack || 'The error has no stack.');
  setActionToFailed(error);
});
