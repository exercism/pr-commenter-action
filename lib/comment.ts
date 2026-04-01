import * as Mustache from 'mustache';
import {MinimatchOptions} from 'minimatch/dist/esm';
import { Snippet } from './snippets';
import { TemplateVariables } from "./config";

export type Comment = {
  id: number;
  url: string;
  created_at: string;
  body?: string;
  body_text?: string;
  body_html?: string;
}

export interface CommentObject extends Map<string, unknown>{
  get(key: 'header' | 'footer' | 'onCreate' | 'onUpdate'): string;
  get(key: 'snippets'): Snippet[],
  get(key: 'on-create' | 'on-update' | 'globOptions'): Map<string, unknown>[];
  get(key: 'globOptions'): MinimatchOptions | undefined;
}

function commentMetadata(snippetIds: string[]): string {
  return `<!-- pr-commenter-metadata: ${snippetIds.join(',')} -->`;
}

function extractCommentMetadata(commentBody: string): string[] | null {
  // snippet id regex plus a comma
  const regex = /<!-- pr-commenter-metadata: ([A-Za-z0-9\-_,]*) -->/;
  const match = regex.exec(commentBody);

  if (match) {
    return match[1].split(',').map((s: string) => s.trim()).filter((s) => s !== '');
  }
  return null;
}

function assembleCommentBody(
    snippetIds: string[],
    commentConfig: CommentObject,
    templateVariables:  TemplateVariables = {}): string {
  let strings = [
    commentConfig.get('header'),
    ...(commentConfig.get('snippets')).map(snippet => {
      if (snippetIds.includes(snippet.get('id'))) {
        return snippet.get('body');
      }
      return null;
    }),
    commentConfig.get('footer'),
    commentMetadata(snippetIds),
  ];

  strings = strings.filter((s) => Boolean(s));

  const rawCommentBody = strings.join('\n\n');

  return Mustache.render(rawCommentBody, templateVariables);
}

function newCommentDifferentThanPreviousComment(previousComment: Comment, snippetIds: string[]): boolean {
  const previousSnippetIds = (previousComment.body != null) ? extractCommentMetadata(previousComment.body) : null;

  return previousSnippetIds !== null && previousSnippetIds.join(',') !== snippetIds.join(',');
}

function newCommentWouldHaveContent(snippetIds: string[]): boolean {
  return snippetIds.length > 0;
}

function shouldPostNewComment(
    previousComment: Comment | null,
    snippetIds: string[],
    commentConfig: CommentObject
): boolean {
  const isNotEmpty = newCommentWouldHaveContent(snippetIds);
  const isCreating = !previousComment && commentConfig.get('onCreate') === 'create';
  const isUpdating = !!previousComment
    && commentConfig.get('onUpdate') === 'recreate'
    && newCommentDifferentThanPreviousComment(previousComment, snippetIds);

  return isNotEmpty && (isCreating || isUpdating);
}

function shouldDeletePreviousComment(
    previousComment: Comment | null,
    snippetIds: string[],
    commentConfig: CommentObject
): boolean {
  return !!previousComment && (
    shouldPostNewComment(previousComment, snippetIds, commentConfig)
    || (!newCommentWouldHaveContent(snippetIds) && commentConfig.get('onUpdate') !== 'nothing')
  );
}

function shouldEditPreviousComment(
    previousComment: Comment | null,
    snippetIds: string[],
    commentConfig: CommentObject
): boolean {
  return newCommentWouldHaveContent(snippetIds) && (
    !!previousComment
      && commentConfig.get('onUpdate') === 'edit'
      && newCommentDifferentThanPreviousComment(previousComment, snippetIds)
  );
}

export {
  commentMetadata,
  assembleCommentBody,
  extractCommentMetadata,
  shouldPostNewComment,
  shouldDeletePreviousComment,
  shouldEditPreviousComment,
};
