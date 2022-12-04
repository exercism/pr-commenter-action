const Mustache = require('mustache');

function commentMetadata(snippetIds) {
  return `<!-- pr-commenter-metadata: ${snippetIds.join(',')} -->`;
}

function extractCommentMetadata(commentBody) {
  // snippet id regex plus a comma
  const regex = /<!-- pr-commenter-metadata: ([A-Za-z0-9\-_,]*) -->/;
  const match = regex.exec(commentBody);

  if (match) {
    return match[1].split(',').map((s) => s.trim()).filter((s) => s !== '');
  }
  return null;
}

function assembleCommentBody(snippetIds, commentConfig, templateVariables = {}) {
  let strings = [
    commentConfig.get('header'),
    ...commentConfig.get('snippets').map((snippet) => {
      if (snippetIds.includes(snippet.get('id'))) {
        return snippet.get('body');
      }
      return null;
    }),
    commentConfig.get('footer'),
    commentMetadata(snippetIds),
  ];

  strings = strings.filter((s) => !!s);

  const rawCommentBody = strings.join('\n\n');

  return Mustache.render(rawCommentBody, templateVariables);
}

function newCommentDifferentThanPreviousComment(previousComment, snippetIds) {
  const previousSnippetIds = extractCommentMetadata(previousComment.body);

  return previousSnippetIds.join(',') !== snippetIds.join(',');
}

function newCommentWouldHaveContent(snippetIds) {
  return snippetIds.length > 0;
}

function shouldPostNewComment(previousComment, snippetIds, commentConfig) {
  const isNotEmpty = newCommentWouldHaveContent(snippetIds);
  const isCreating = !previousComment && commentConfig.get('onCreate') === 'create';
  const isUpdating = !!previousComment
    && commentConfig.get('onUpdate') === 'recreate'
    && newCommentDifferentThanPreviousComment(previousComment, snippetIds);

  return isNotEmpty && (isCreating || isUpdating);
}

function shouldDeletePreviousComment(previousComment, snippetIds, commentConfig) {
  return !!previousComment && (
    shouldPostNewComment(previousComment, snippetIds, commentConfig)
    || (!newCommentWouldHaveContent(snippetIds) && commentConfig.get('onUpdate') !== 'nothing')
  );
}

function shouldEditPreviousComment(previousComment, snippetIds, commentConfig) {
  return newCommentWouldHaveContent(snippetIds) && (
    !!previousComment
      && commentConfig.get('onUpdate') === 'edit'
      && newCommentDifferentThanPreviousComment(previousComment, snippetIds)
  );
}

module.exports = {
  commentMetadata,
  assembleCommentBody,
  extractCommentMetadata,
  shouldPostNewComment,
  shouldDeletePreviousComment,
  shouldEditPreviousComment,
};
