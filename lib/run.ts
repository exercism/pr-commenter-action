import * as core from '@actions/core';
import * as github from '@actions/github';
import * as yaml from 'js-yaml';
import { Comment, CommentObject } from './comment';
import { Config,  TemplateVariables, validateCommentConfig } from './config';
import { getMatchingSnippetIds } from './snippets';
import { OctokitClient } from './github';
import {
  assembleCommentBody,
  extractCommentMetadata,
  shouldPostNewComment,
  shouldDeletePreviousComment,
  shouldEditPreviousComment,
} from './comment';

import {
  deleteComment,
  editComment,
  createComment,
  getChangedFiles,
  getFileContent,
  getComments,
} from './github';

async function run(): Promise<void> {
  try {
    const token = core.getInput('github-token', {required: true});
    const configPath = core.getInput('config-file', {required: true});
    const templateVariablesJSONString = core.getInput('template-variables', {required: false});

    const prNumber = getPrNumber();
    if (prNumber === undefined) {
      console.log('Could not get pull request number from context, exiting');
      return;
    }

    // eslint-disable-next-line new-cap
    const client = github.getOctokit(token);

    core.debug(`fetching changed files for pr #${prNumber}`);
    const changedFiles = await getChangedFiles(client, prNumber);
    const previousComment = await getPreviousPRComment(client, prNumber);

    let templateVariables: TemplateVariables = {};
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

    const commentConfig = (await getCommentConfig(client, configPath, templateVariables));
    const snippetIds = getMatchingSnippetIds(changedFiles, commentConfig);

    if (previousComment && shouldDeletePreviousComment(previousComment, snippetIds, commentConfig)) {
      core.info('removing previous comment');
      await deleteComment(client, previousComment);
    }

    const commentBody = assembleCommentBody(snippetIds, commentConfig, templateVariables);

    if (previousComment && shouldEditPreviousComment(previousComment, snippetIds, commentConfig)) {
      core.info('updating previous comment');
      await editComment(client, previousComment, commentBody);
    }

    if (shouldPostNewComment(previousComment, snippetIds, commentConfig)) {
      core.info('creating a new comment');
      await createComment(client, prNumber, commentBody);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.error(error);
      core.setFailed((error).message);
    }
  }
}

function getPrNumber(): number | undefined {
  const pullRequest = github.context.payload.pull_request;
  if (!pullRequest) {
    return undefined;
  }

  return pullRequest.number;
}

async function getCommentConfig(client: OctokitClient, configurationPath: string, templateVariables: TemplateVariables): Promise<CommentObject> {
  const configurationContent = await getFileContent(client, configurationPath);
  const configObject = yaml.load(configurationContent) as Config;

  // transform object to a map or throw if yaml is malformed:
  return validateCommentConfig(configObject, templateVariables);
}

async function getPreviousPRComment(client: OctokitClient, prNumber: number): Promise<Comment | null> {
  const comments = await getComments(client, prNumber);
  core.debug(`there are ${comments.length} comments on the PR #${prNumber}`);

  const newestFirst = (a: Comment, b: Comment): number => b.created_at.localeCompare(a.created_at);
  const sortedComments = comments.sort(newestFirst);
  const previousComment = sortedComments.find((c) => c.body != null && extractCommentMetadata(c.body) !== null);

  if (previousComment?.body != null) {
    const previousSnippetIds = extractCommentMetadata(previousComment.body);

    if (previousSnippetIds) {
      core.info(`found previous comment made by pr-commenter: ${previousComment.url}`);
      core.info(`extracted snippet ids from previous comment: ${previousSnippetIds.join(', ')}`);
    }
  }

  return previousComment ?? null;
}

export { run };
