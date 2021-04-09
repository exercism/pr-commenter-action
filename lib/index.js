const core = require('@actions/core');
const github = require('@actions/github');

try {
  console.log(`Hello, World!`);
  const payload = JSON.stringify(github.context.payload, undefined, 2)
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}
