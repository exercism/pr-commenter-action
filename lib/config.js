function validateCommentConfig(configObject) {
  const configMap = new Map();

  if (typeof configObject.comment !== 'object') {
    throw Error(
      `found unexpected value type '${typeof configObject.comment}' under key '.comment' (should be an object)`,
    );
  }

  if (configObject.comment.header === undefined || configObject.comment.header === null || typeof configObject.comment.header === 'string') {
    configMap.set('header', configObject.comment.header);
  } else {
    throw Error(
      `found unexpected value type '${typeof configObject.comment.header}' under key '.comment.header' (should be a string)`,
    );
  }

  if (configObject.comment.footer === undefined || configObject.comment.footer === null || typeof configObject.comment.footer === 'string') {
    configMap.set('footer', configObject.comment.footer);
  } else {
    throw Error(
      `found unexpected value type '${typeof configObject.comment.footer}' under key '.comment.footer' (should be a string)`,
    );
  }

  if (Array.isArray(configObject.comment.snippets) && configObject.comment.snippets.length > 0) {
    configMap.set('snippets', configObject.comment.snippets.map((snippetObject, index) => {
      const snippetMap = new Map();

      if (typeof snippetObject.id === 'string') {
        const regex = /^[A-Za-z0-9\-_,]*$/;
        if (regex.exec(snippetObject.id)) {
          snippetMap.set('id', snippetObject.id);
        } else {
          throw Error(
            `found invalid snippet id '${snippetObject.id}' (snippet ids must contain only letters, numbers, dashes, and underscores)`,
          );
        }
      } else {
        throw Error(
          `found unexpected value type '${typeof snippetObject.id}' under key '.comment.snippets.${index}.id' (should be a string)`,
        );
      }

      if (typeof snippetObject.body === 'string') {
        snippetMap.set('body', snippetObject.body);
      } else {
        throw Error(
          `found unexpected value type '${typeof snippetObject.body}' under key '.comment.snippets.${index}.body' (should be a string)`,
        );
      }

      if (Array.isArray(snippetObject.files) && snippetObject.files.length > 0 && snippetObject.files.every((f) => typeof f === 'string')) {
        snippetMap.set('files', snippetObject.files);
      } else {
        throw Error(
          `found unexpected value type under key '.comment.snippets.${index}.files' (should be a non-empty array of strings)`,
        );
      }

      return snippetMap;
    }));

    const snippetIds = configMap.get('snippets').map((s) => s.get('id'));
    snippetIds.forEach((value, index, self) => {
      if (self.indexOf(value) !== index) {
        throw Error(
          `found duplicate snippet id '${value}'`,
        );
      }
    });
  } else {
    throw Error(
      'found unexpected value type under key \'.comment.snippets\' (should be a non-empty array)',
    );
  }

  return configMap;
}

module.exports = { validateCommentConfig };
