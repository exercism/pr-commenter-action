const core = require('@actions/core');
const { run } = require('./run');

try {
  run();
} catch (error) {
  core.error(error);
  core.setFailed(error.message);
}
