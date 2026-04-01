import * as Mustache from 'mustache';
import { CommentObject } from './comment';
import { Snippet } from "./snippets";

export type MatchConfig = {
  any?: string[];
  all?: string[];
};

export type TemplateVariables = {
  [key: string]: unknown;
}

export type Config = {
  comment: CommentConfig;
};

export interface CommentConfig extends CommentObject {
  header: string | null;
  footer: string | null;
  snippets: Snippet[];
  'on-create'?: string | null;
  'on-update'?: string | null;
  'glob-options'?: object;
}

function validateCommentConfig(configObject: Config, templateVariables?: TemplateVariables): CommentObject {
  const configMap: CommentObject = new Map();
  const comment: CommentConfig = configObject.comment;

  if (typeof comment !== 'object') {
    throw Error(
      `found unexpected value type '${typeof comment}' under key '.comment' (should be an object)`,
    );
  }

  if (comment.header === undefined || comment.header === null || typeof comment.header === 'string') {
    configMap.set('header', comment.header);
  } else {
    throw Error(
      `found unexpected value type '${typeof comment.header}' under key '.comment.header' (should be a string)`,
    );
  }

  const allowedOnCreateValues = ['create', 'nothing'];
  if (comment['on-create'] === undefined || comment['on-create'] === null) {
    configMap.set('onCreate', allowedOnCreateValues[0]);
  } else if (typeof comment['on-create'] === 'string') {
    const onCreate = Mustache.render(comment['on-create'], templateVariables);

    if (allowedOnCreateValues.includes(onCreate)) {
      configMap.set('onCreate', onCreate);
    } else {
      throw Error(
        `found unexpected value '${onCreate}' under key '.comment.on-create' (should be one of: ${allowedOnCreateValues.join(', ')})`,
      );
    }
  } else {
    throw Error(
      `found unexpected value type '${typeof comment['on-create']}' under key '.comment.on-create' (should be a string)`,
    );
  }

  const allowedOnUpdateValues = ['recreate', 'edit', 'nothing'];
  if (comment['on-update'] === undefined || comment['on-update'] === null) {
    configMap.set('onUpdate', allowedOnUpdateValues[0]);
  } else if (typeof comment['on-update'] === 'string') {
    const onUpdate = Mustache.render(comment['on-update'], templateVariables);

    if (allowedOnUpdateValues.includes(onUpdate)) {
      configMap.set('onUpdate', onUpdate);
    } else {
      throw Error(
        `found unexpected value '${onUpdate}' under key '.comment.on-update' (should be one of: ${allowedOnUpdateValues.join(', ')})`,
      );
    }
  } else {
    throw Error(
      `found unexpected value type '${typeof comment['on-update']}' under key '.comment.on-update' (should be a string)`,
    );
  }

  if (comment['glob-options'] && typeof comment['glob-options'] === 'object') {
    configMap.set('globOptions', comment['glob-options']);
  }

  if (comment.footer === undefined || comment.footer === null || typeof comment.footer === 'string') {
    configMap.set('footer', comment.footer);
  } else {
    throw Error(
      `found unexpected value type '${typeof comment.footer}' under key '.comment.footer' (should be a string)`,
    );
  }

  if (Array.isArray(comment.snippets) && comment.snippets.length > 0) {
    configMap.set('snippets', comment.snippets.map((snippetObject, index) => {
      const snippetMap = new Map<string, unknown>();

      if (typeof snippetObject.id === 'string') {
        const id = Mustache.render(snippetObject.id, templateVariables);
        const regex = /^[A-Za-z0-9\-_,]*$/;
        if (regex.exec(id)) {
          snippetMap.set('id', id);
        } else {
          throw Error(
            `found invalid snippet id '${id}' (snippet ids must contain only letters, numbers, dashes, and underscores)`,
          );
        }
      } else {
        throw Error(
          `found unexpected value type '${typeof snippetObject.id}' under key '.comment.snippets.${index}.id' (should be a string)`
        );
      }

      if (typeof snippetObject.body === 'string') {
        snippetMap.set('body', snippetObject.body);
      } else {
        throw Error(
            `found unexpected value type '${typeof snippetObject.body}' under key '.comment.snippets.${index}.body' (should be a string)`,
        );
      }

      const isValidMatcher = (matcher: string | MatchConfig): boolean => {
        if (typeof matcher !== "string") {
          const isAnyValid = !(matcher.any) || (Array.isArray(matcher.any) && matcher.any.length > 0 && matcher.any.every((f) => typeof f === 'string'));

          const isAllValid = !(matcher.all) || (Array.isArray(matcher.all) && matcher.all.length > 0 && matcher.all.every((f) => typeof f === 'string'));

          const isAtLeastOnePresent = ((Boolean(matcher.any)) || (Boolean(matcher.all)));

          return isAnyValid && isAllValid && isAtLeastOnePresent;
        }

        return true;
      };
      const isValidFileList = (list: (string | MatchConfig)[]): boolean => Array.isArray(list) && list.length > 0;

      if (isValidFileList(snippetObject.files)) {
        const list = snippetObject.files.map((matcher, matcherIndex) => {
          if (isValidMatcher(matcher)) {
            if (typeof matcher === 'string') {
              return matcher;
            }
            const obj: MatchConfig = {};
            if (matcher.any) {
              obj.any = matcher.any;
            }
            if (matcher.all) {
              obj.all = matcher.all;
            }
            return obj;
          } else {
            throw Error(
                `found unexpected value type under key '.comment.snippets.${index}.files.${matcherIndex}' (should be a string or an object with keys 'all' and/or 'any')`,
            );
          }
        });
        snippetMap.set('files', list);
      } else {
        throw Error(
          `found unexpected value type under key '.comment.snippets.${index}.files' (should be a non-empty array)`,
        );
      }

      return snippetMap;
    }));

    const snippetIds = (configMap.get('snippets')).map((s) => s.get('id'));
    snippetIds.forEach((value: string, index: number, self: string[]) => {
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

export { validateCommentConfig };
