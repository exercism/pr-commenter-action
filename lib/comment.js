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
  ];

  strings = strings.filter((s) => !!s);
  return strings.join('\n\n');
}

module.exports = { assembleComment };
