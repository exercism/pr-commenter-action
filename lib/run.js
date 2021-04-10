import * as core from '@actions/core';
import * as github from '@actions/github';
import * as yaml from 'js-yaml';
import { validateCommentConfig } from './config';
import { getMatchingSnippetIds } from './snippets';

const {
  assembleCommentBody,
  extractCommentMetadata,
  shouldPostNewComment,
  shouldDeletePreviousComment,
  shouldEditPreviousComment,
} = require('./comment');

const {
  deleteComment,
  editComment,
  createComment,
  getChangedFiles,
  getFileContent,
  getComments,
} = require('./github');

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

    const snippetIds = getMatchingSnippetIds(changedFiles, commentConfig);
    const previousComment = await getPreviousPRComment(client, prNumber);

    if (shouldDeletePreviousComment(previousComment, snippetIds, commentConfig)) {
      core.debug('removing previous comment');
      await deleteComment(client, previousComment);
    }

    const commentBody = assembleCommentBody(snippetIds, commentConfig);

    if (shouldEditPreviousComment(previousComment, snippetIds, commentConfig)) {
      core.debug('updating previous comment');
      await editComment(client, previousComment, commentBody);
    }

    if (shouldPostNewComment(previousComment, snippetIds, commentConfig)) {
      core.debug('creating a new comment');
      await createComment(client, prNumber, commentBody);
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

async function getCommentConfig(client, configurationPath) {
  const configurationContent = await getFileContent(client, configurationPath);
  const configObject = yaml.load(configurationContent);

  // transform object to a map or throw if yaml is malformed:
  return validateCommentConfig(configObject);
}

async function getPreviousPRComment(client, prNumber) {
  const comments = getComments(client, prNumber);

  const newestFirst = (c1, c2) => c2.created_at.localeCompare(c1.created_at);
  const botComments = comments.filter((c) => c.user.type === 'Bot').sort(newestFirst);
  const previousComment = botComments.find((c) => extractCommentMetadata(c.body) !== null);

  if (previousComment) {
    const previousSnippetIds = extractCommentMetadata(previousComment.body);

    core.debug(`found previous comment made by pr-commenter: ${previousComment.url}`);
    core.debug(`extracted snippet ids from previous comment: ${previousSnippetIds.join(', ')}`);

    return previousComment;
  }

  return null;
}

module.exports = { run };
