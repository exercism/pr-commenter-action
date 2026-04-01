import * as core from '@actions/core';
import { run } from './run';

(async (): Promise<void> => {
  try {
    await run();
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.error(error);
      core.setFailed(error.message);
    }
  }
})();
