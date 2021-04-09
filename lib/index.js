import * as core from '@actions/core';
import * as github from '@actions/github';
import * as yaml from 'js-yaml';
import { validateCommentConfig } from './config';
import { getMatchingSnippetIds } from './snippets';
import { assembleComment, extractCommentMetadata } from './comment';

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

    core.debug(`fetching changed files for pr #${prNumber}`);
    const changedFiles = await getChangedFiles(client, prNumber);
    const commentConfig = await getCommentConfig(client, configPath);

    // TODO: fetch previously added comment if exists
    // check snippet ids included in the comment

    const snippetIds = getMatchingSnippetIds(changedFiles, commentConfig);

    const { comment, previousSnippetIds } = await getPreviousPRComment(client, prNumber);

    if (comment) {
      core.debug('removing previous comment');
    }

    if (snippetIds.length > 0) {
      if (!!previousSnippetIds && previousSnippetIds.join(',') !== snippetIds.join(',')) {
        const commentBody = assembleComment(snippetIds, commentConfig);

        await client.issues.createComment({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          issue_number: prNumber,
          body: commentBody,
        });
      } else {
        core.debug('snippet ids are identical as in the previous PR comment made by this action, not creating a PR comment');
      }
    } else {
      core.debug('snippet ids array is empty, not creating a PR comment');
    }
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

async function getPreviousPRComment(client, prNumber) {
  const { data: comments } = await client.issues.listComments({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: prNumber,
  });

  const botComments = comments.filter((c) => c.user.type === 'Bot');
  const comment = botComments.find((c) => extractCommentMetadata(c.body) !== null);

  if (comment) {
    const previousSnippetIds = extractCommentMetadata(comment.body);

    core.debug(`found previous a comment made by pr-commenter: ${comment.url}`);
    core.debug(`extracted snippet ids from previous comment: ${previousSnippetIds.join(', ')}`);

    return {
      comment,
      previousSnippetIds,
    };
  }

  return {
    comment: null,
    previousSnippetIds: null,
  };
}

run();
