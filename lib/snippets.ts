import * as core from '@actions/core';
import { Minimatch, MinimatchOptions } from "minimatch";
import { CommentObject } from "./comment";
import { MatchConfig } from "./config";

type files = (string | MatchConfig)[];

export type Snippet = {
  id: string;
  body: string;
  get(key: 'id' | 'body'): string;
  files: files;
  get(key: 'files'): files;
};

function getMatchingSnippetIds(changedFiles: string[], commentConfig: CommentObject): string[] {
  const snippetIds = commentConfig.get('snippets').reduce<string[]>((acc, snippet): string[] => {
    core.debug(`processing snippet ${snippet.get('id')}`);

    if (checkGlobs(changedFiles, snippet.get('files'), commentConfig.get('globOptions') || {})) {
      return [...acc, snippet.get('id')];
    }
    return acc;
  }, []);

  core.info(`matched snippet ids: ${snippetIds}`);

  return snippetIds;
}

function toMatchConfig(config: string | MatchConfig): MatchConfig {
  if (typeof config === 'string') {
    return {
      any: [config],
    };
  }

  return config;
}

function printPattern(matcher: Minimatch): string {
  return (matcher.negate ? '!' : '') + matcher.pattern;
}

function checkGlobs(changedFiles: string[], globs: (string | MatchConfig)[], opts: MinimatchOptions): boolean {
  for (const glob of globs) {
    core.debug(` checking pattern ${JSON.stringify(glob)}`);
    const matchConfig = toMatchConfig(glob);
    if (checkMatch(changedFiles, matchConfig, opts)) {
      return true;
    }
  }
  return false;
}

function isMatch(changedFile: string, matchers: Minimatch[]): boolean   {
  core.debug(`    matching patterns against file ${changedFile}`);
  for (const matcher of matchers) {
    core.debug(`   - ${printPattern(matcher)}`);
    if (!matcher.match(changedFile)) {
      core.debug(`   ${printPattern(matcher)} did not match`);
      return false;
    }
  }

  core.debug('   all patterns matched');
  return true;
}

// equivalent to "Array.some()" but expanded for debugging and clarity
function checkAny(changedFiles: string[], globs: string[], opts: MinimatchOptions): boolean {
  const matchers = globs.map((g) => new Minimatch(g, opts));
  core.debug('  checking "any" patterns');
  for (const changedFile of changedFiles) {
    if (isMatch(changedFile, matchers)) {
      core.debug(`  "any" patterns matched against ${changedFile}`);
      return true;
    }
  }

  core.debug('  "any" patterns did not match any files');
  return false;
}

// equivalent to "Array.every()" but expanded for debugging and clarity
function checkAll(changedFiles: string[], globs: string[], opts: MinimatchOptions): boolean {
  const matchers = globs.map((g) => new Minimatch(g, opts));
  core.debug(' checking "all" patterns');
  for (const changedFile of changedFiles) {
    if (!isMatch(changedFile, matchers)) {
      core.debug(`  "all" patterns did not match against ${changedFile}`);
      return false;
    }
  }

  core.debug('  "all" patterns matched all files');
  return true;
}

function checkMatch(changedFiles: string[], matchConfig: MatchConfig, opts: MinimatchOptions): boolean {
  if (matchConfig.all !== undefined) {
    if (!checkAll(changedFiles, matchConfig.all, opts)) {
      return false;
    }
  }

  if (matchConfig.any !== undefined) {
    if (!checkAny(changedFiles, matchConfig.any, opts)) {
      return false;
    }
  }

  return true;
}

export { getMatchingSnippetIds };
