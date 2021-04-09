import * as core from '@actions/core';
import * as github from '@actions/github';
import * as yaml from 'js-yaml';
import { validateCommentConfig } from './config';
import { getMatchingSnippetIds } from './snippets';

async function run() {
  try {
    const token = core.getInput('github-token', { required: true });
    const configPath = core.getInput('config-file', { required: true });

    const prNumber = getPrNumber();
    if (!prNumber) {
      // eslint-disable-next-line no-console
      console.log('Could not get pull request number from context, exiting');
      return;
    }

    // eslint-disable-next-line new-cap
    const client = new github.getOctokit(token);

    const { data: pullRequest } = await client.pulls.get({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      pull_number: prNumber,
    });

    core.debug(`fetching changed files for pr #${prNumber}`);
    const changedFiles = await getChangedFiles(client, prNumber);
    const commentConfig = await getCommentConfig(client, configPath);

    // TODO: fetch previously added comment if exists
    // check snippet ids included in the comment

    const snippetIds = getMatchingSnippetIds(changedFiles, commentConfig);
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

function getPrNumber() {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }

  return pullRequest.number;
}

async function getChangedFiles(client, prNumber) {
  const listFilesOptions = client.pulls.listFiles.endpoint.merge({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber,
  });

  const listFilesResponse = await client.paginate(listFilesOptions);
  const changedFiles = listFilesResponse.map((f) => f.filename);

  core.debug('found changed files:');
  for (const file of changedFiles) {
    core.debug(`  ${file}`);
  }

  return changedFiles;
}

async function getCommentConfig(client, configurationPath) {
  const configurationContent = await fetchContent(client, configurationPath);
  const configObject = yaml.load(configurationContent);

  // transform object to a map or throw if yaml is malformed:
  return validateCommentConfig(configObject);
}

async function fetchContent(client, repoPath) {
  const response = await client.repos.getContent({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: repoPath,
    ref: github.context.sha,
  });

  return Buffer.from(response.data.content, response.data.encoding).toString();
}

//
// async function addLabels(client, prNumber, labels) {
//   await client.issues.addLabels({
//     owner: github.context.repo.owner,
//     repo: github.context.repo.repo,
//     issue_number: prNumber,
//     labels: labels
//   });
// }
//
// async function removeLabels(client, prNumber, labels) {
//   await Promise.all(
//     labels.map(label =>
//       client.issues.removeLabel({
//         owner: github.context.repo.owner,
//         repo: github.context.repo.repo,
//         issue_number: prNumber,
//         name: label
//       })
//     )
//   );
// }

run();
