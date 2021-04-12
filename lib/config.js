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

  const allowedOnUpdateValues = ['recreate', 'edit', 'nothing'];
  if (configObject.comment['on-update'] === undefined || configObject.comment['on-update'] === null) {
    configMap.set('onUpdate', allowedOnUpdateValues[0]);
  } else if (allowedOnUpdateValues.includes(configObject.comment['on-update'])) {
    configMap.set('onUpdate', configObject.comment['on-update']);
  } else {
    throw Error(
      `found unexpected value '${configObject.comment['on-update']}' under key '.comment.on-update' (should be one of: ${allowedOnUpdateValues.join(', ')})`,
    );
  }

  if (configObject.comment['glob-options'] && typeof configObject.comment['glob-options'] === 'object') {
    configMap.set('globOptions', configObject.comment['glob-options']);
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

      const isValidMatcher = (matcher) => {
        const isAnyValid = !matcher.any
          || (Array.isArray(matcher.any) && matcher.any.length > 0 && matcher.any.every((f) => typeof f === 'string'));

        const isAllValid = !matcher.all
          || (Array.isArray(matcher.all) && matcher.all.length > 0 && matcher.all.every((f) => typeof f === 'string'));

        const isAtLeastOnePresent = (!!matcher.any || !!matcher.all);

        return typeof matcher === 'string' || (matcher && isAnyValid && isAllValid && isAtLeastOnePresent);
      };
      const isValidFileList = (list) => Array.isArray(list) && list.length > 0;

      if (isValidFileList(snippetObject.files)) {
        const list = snippetObject.files.map((matcher, matcherIndex) => {
          if (isValidMatcher(matcher)) {
            if (typeof matcher === 'string') {
              return matcher;
            }
            const obj = {};
            if (matcher.any) { obj.any = matcher.any; }
            if (matcher.all) { obj.all = matcher.all; }
            return obj;
          }
          throw Error(
            `found unexpected value type under key '.comment.snippets.${index}.files.${matcherIndex}' (should be a string or an object with keys 'all' and/or 'any')`,
          );
        });
        snippetMap.set('files', list);
      } else {
        throw Error(
          `found unexpected value type under key '.comment.snippets.${index}.files' (should be a non-empty array)`,
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
