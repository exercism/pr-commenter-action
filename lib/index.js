const core = require('@actions/core');
const { run } = require('./run');

(async () => {
  try {
    await run();
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
})();
