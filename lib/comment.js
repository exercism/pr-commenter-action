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

function assembleComment(snippetIds, commentConfig) {
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

  return strings.join('\n\n');
}

module.exports = { assembleComment, extractCommentMetadata };
