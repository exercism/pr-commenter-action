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
  const templateVariablesJSONString = core.getInput('template-variables', { required: false });

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
  const previousComment = await getPreviousPRComment(client, prNumber);

  let templateVariables = {};
  if (templateVariablesJSONString) {
    core.debug('Input template-variables was passed');
    core.debug(templateVariablesJSONString);

    try {
      templateVariables = JSON.parse(templateVariablesJSONString);
    } catch (error) {
      core.warning('Failed to parse template-variables input as JSON. Continuing without template variables.');
    }
  } else {
    core.debug('Input template-variables was not passed');
  }

  const commentConfig = await getCommentConfig(client, configPath, templateVariables);
  const snippetIds = getMatchingSnippetIds(changedFiles, commentConfig);

  if (shouldDeletePreviousComment(previousComment, snippetIds, commentConfig)) {
    core.info('removing previous comment');
    await deleteComment(client, previousComment);
  }

  const commentBody = assembleCommentBody(snippetIds, commentConfig, templateVariables);

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

async function getCommentConfig(client, configurationPath, templateVariables) {
  const configurationContent = await getFileContent(client, configurationPath);
  const configObject = yaml.load(configurationContent);

  // transform object to a map or throw if yaml is malformed:
  const configMap = validateCommentConfig(configObject, templateVariables);
  return configMap;
}

async function getPreviousPRComment(client, prNumber) {
  const comments = await getComments(client, prNumber);
  core.debug(`there are ${comments.length} comments on the PR #${prNumber}`);

  const newestFirst = (c1, c2) => c2.created_at.localeCompare(c1.created_at);
  const sortedComments = comments.sort(newestFirst);
  const previousComment = sortedComments.find((c) => extractCommentMetadata(c.body) !== null);

  if (previousComment) {
    const previousSnippetIds = extractCommentMetadata(previousComment.body);

    core.info(`found previous comment made by pr-commenter: ${previousComment.url}`);
    core.info(`extracted snippet ids from previous comment: ${previousSnippetIds.join(', ')}`);

    return previousComment;
  }

  return null;
}

module.exports = { run };
