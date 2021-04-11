const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');
const { validateCommentConfig } = require('./config');
const { getMatchingSnippetIds } = require('./snippets');

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
    core.info('removing previous comment');
    await deleteComment(client, previousComment);
  }

  const commentBody = assembleCommentBody(snippetIds, commentConfig);

  if (shouldEditPreviousComment(previousComment, snippetIds, commentConfig)) {
    core.info('updating previous comment');
    await editComment(client, previousComment, commentBody);
  }

  if (shouldPostNewComment(previousComment, snippetIds, commentConfig)) {
    core.info('creating a new comment');
    await createComment(client, prNumber, commentBody);
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
  const configMap = validateCommentConfig(configObject);
  return configMap;
}

async function getPreviousPRComment(client, prNumber) {
  const comments = await getComments(client, prNumber);

  const newestFirst = (c1, c2) => c2.created_at.localeCompare(c1.created_at);
  const botComments = comments.filter((c) => c.user.type === 'Bot').sort(newestFirst);
  const previousComment = botComments.find((c) => extractCommentMetadata(c.body) !== null);

  if (previousComment) {
    const previousSnippetIds = extractCommentMetadata(previousComment.body);

    core.info(`found previous comment made by pr-commenter: ${previousComment.url}`);
    core.info(`extracted snippet ids from previous comment: ${previousSnippetIds.join(', ')}`);

    return previousComment;
  }

  return null;
}

module.exports = { run };
