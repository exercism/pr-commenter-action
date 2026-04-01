import * as snippets from '../lib/snippets';
import {CommentConfig} from "../lib/config";

jest.mock('@actions/core');

describe('getMatchingSnippetIds', () => {
  test('no matches', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', ['foo/**/*.txt']],
        ]),
      ]],
    ]) as CommentConfig;
    const changedFiles = ['foo/bar/baz.html', 'foo/bar.html', 'notfoo/foo/banana.txt'];
    const expectedResult: unknown = [];

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config);
    expect(actualResult).toEqual(expectedResult);
  });

  test('a match, one pattern', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', ['foo/**/*.txt']],
        ]),
      ]],
    ]) as CommentConfig;
    const changedFiles = ['foo/bar/baz.txt', 'foo/bar.html', 'notfoo/foo/banana.txt'];
    const expectedResult = ['snippet1'];

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config);
    expect(actualResult).toEqual(expectedResult);
  });

  test('negated pattern - at least one changed file must not match', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', ['!**/*.txt']],
        ]),
      ]],
    ]) as CommentConfig;

    let actualResult = snippets.getMatchingSnippetIds(['foo/bar.txt', 'foo/bar/baz.txt'], config);
    expect(actualResult).toEqual([]);

    actualResult = snippets.getMatchingSnippetIds(['foo/bar.html', 'foo/bar/baz.txt'], config);
    expect(actualResult).toEqual(['snippet1']);
  });

  test('single * does not match nested dirs', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', ['*.txt']],
        ]),
      ]],
    ]) as CommentConfig;
    const changedFiles = ['foo/bar.txt', 'foo/bar/baz.txt'];
    const expectedResult: unknown = [];

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config);
    expect(actualResult).toEqual(expectedResult);
  });

  test('double ** matches files in root dir', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', ['**/*.txt']],
        ]),
      ]],
    ]) as CommentConfig;
    const changedFiles = ['bar.txt'];
    const expectedResult: unknown = ['snippet1'];

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config);
    expect(actualResult).toEqual(expectedResult);
  });

  test('* does not match hidden files by default, unless an option is passed', () => {
    let config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', ['*.txt']],
        ]),
      ]],
    ]) as CommentConfig;
    let changedFiles = ['.hidden.txt'];
    let expectedResult: unknown = [];

    let actualResult = snippets.getMatchingSnippetIds(changedFiles, config);
    expect(actualResult).toEqual(expectedResult);

    config = config.set('globOptions', { dot: true });

    changedFiles = ['.hidden.txt'];
    expectedResult = ['snippet1'];

    actualResult = snippets.getMatchingSnippetIds(changedFiles, config);
    expect(actualResult).toEqual(expectedResult);
  });

  test('a match, many patterns', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', ['README.md', 'foo/*.html', 'foo/**/*.txt']],
        ]),
      ]],
    ]) as CommentConfig;
    const changedFiles = ['foo/bar/baz.txt', 'foo/bar.html', 'notfoo/foo/banana.txt'];
    const expectedResult: unknown = ['snippet1'];

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config);
    expect(actualResult).toEqual(expectedResult);
  });

  test('a match, many patterns, many snippets', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', ['README.md']],
        ]),
        new Map<string, unknown>([
          ['id', 'snippet2'],
          ['files', ['**/*.html', '**/*.css']],
        ]),
        new Map<string, unknown>([
          ['id', 'snippet3'],
          ['files', ['foo/**/*']],
        ]),
      ]],
    ]) as CommentConfig;
    const changedFiles = ['bar/1.txt', 'bar/2.txt', 'bar/index.html'];
    const expectedResult: unknown = ['snippet2'];

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config);
    expect(actualResult).toEqual(expectedResult);
  });

  test('a match, many patterns, many snippets - the match matches multiple patterns', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', ['README.md']],
        ]),
        new Map<string, unknown>([
          ['id', 'snippet2'],
          ['files', ['**/*.html', '**/*.css']],
        ]),
        new Map<string, unknown>([
          ['id', 'snippet3'],
          ['files', ['foo/**/*']],
        ]),
      ]],
    ]) as CommentConfig;
    const changedFiles = ['foo/index.html'];
    const expectedResult: unknown = ['snippet2', 'snippet3'];

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config);
    expect(actualResult).toEqual(expectedResult);
  });

  test('many matches, many patterns, many snippets', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', ['README.md']],
        ]),
        new Map<string, unknown>([
          ['id', 'snippet2'],
          ['files', ['**/*.html', '**/*.css']],
        ]),
        new Map<string, unknown>([
          ['id', 'snippet3'],
          ['files', ['foo/**/*']],
        ]),
      ]],
    ]) as CommentConfig;
    const changedFiles = ['README.md', 'bar/1.txt', 'bar/2.txt', 'foo/HELLO.md'];
    const expectedResult: unknown = ['snippet1', 'snippet3'];

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config);
    expect(actualResult).toEqual(expectedResult);
  });

  test('snippets are always returned in the same order as they are in the config', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', ['README.md']],
        ]),
        new Map<string, unknown>([
          ['id', 'snippet2'],
          ['files', ['**/*.md']],
        ]),
        new Map<string, unknown>([
          ['id', 'snippet3'],
          ['files', ['foo/**/*']],
        ]),
      ]],
    ]) as CommentConfig;
    const changedFiles = ['foo/HELLO.txt', 'README.md'];
    const expectedResult: unknown = ['snippet1', 'snippet2', 'snippet3'];

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config);
    expect(actualResult).toEqual(expectedResult);
  });

  test('patterns using the "all" option - ALL changed files must match ALL of the patterns', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', [{ all: ['**/*.html', 'static/*'] }]],
        ]),
      ]],
    ]) as CommentConfig;

    expect(snippets.getMatchingSnippetIds(['static/index.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/about.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/index.html', 'static/about.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/index.css'], config)).toEqual([]);
    expect(snippets.getMatchingSnippetIds(['static/index.html', 'static/about.html', 'static/index.css'], config)).toEqual([]);
  });

  test('negated pattern using the "all" option - NONE changed files can match', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', [{ all: ['!**/*.css'] }]],
        ]),
      ]],
    ]) as CommentConfig;

    expect(snippets.getMatchingSnippetIds(['static/index.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/about.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/index.html', 'static/about.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/index.css'], config)).toEqual([]);
    expect(snippets.getMatchingSnippetIds(['static/index.html', 'static/about.html', 'static/index.css'], config)).toEqual([]);
  });

  test('patterns using the "any" option - ONE of the changed files must match ALL of the patterns', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', [{ any: ['**/*.html', 'static/*'] }]],
        ]),
      ]],
    ]) as CommentConfig;

    expect(snippets.getMatchingSnippetIds(['static/index.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/index.css'], config)).toEqual([]);
    expect(snippets.getMatchingSnippetIds(['lib/index.html'], config)).toEqual([]);
    expect(snippets.getMatchingSnippetIds(['static/index.html', 'static/index.css'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['lib/index.html', 'static/index.css'], config)).toEqual([]);
  });

  test('patterns using both the "all" and "any" option', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', [
            {
              any: ['**/foo/**/*', '**/index.*'],
              all: ['**/*.html', 'static/**/*'],
            },
          ]],
        ]),
      ]],
    ]) as CommentConfig;

    expect(snippets.getMatchingSnippetIds(['static/foo/index.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/foo/bar/index.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/foo/about.html'], config)).toEqual([]);
    expect(snippets.getMatchingSnippetIds(['static/page.html'], config)).toEqual([]);
    expect(snippets.getMatchingSnippetIds(['static/foo/index.html', 'static/page.html'], config)).toEqual(['snippet1']);
  });

  test('patterns using both the "all" and "any" option or a simple matcher', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', [
            'README.md',
            {
              any: ['**/foo/**/*', '**/index.*'],
              all: ['**/*.html', 'static/**/*'],
            },
          ]],
        ]),
      ]],
    ]) as CommentConfig;

    expect(snippets.getMatchingSnippetIds(['static/foo/index.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/foo/bar/index.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/FOO/bar/index.html'], config)).toEqual([]);
    expect(snippets.getMatchingSnippetIds(['static/foo/about.html'], config)).toEqual([]);
    expect(snippets.getMatchingSnippetIds(['static/page.html'], config)).toEqual([]);
    expect(snippets.getMatchingSnippetIds(['static/foo/index.html', 'static/page.html'], config)).toEqual(['snippet1']);

    expect(snippets.getMatchingSnippetIds(['README.md'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['README.html'], config)).toEqual([]);
    expect(snippets.getMatchingSnippetIds(['static/page.html', 'README.md'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/page.html', 'README.html'], config)).toEqual([]);
  });

  test('patterns using the "all" and "any" option can be modified with globOptions', () => {
    const config = new Map([
      ['snippets', [
        new Map<string, unknown>([
          ['id', 'snippet1'],
          ['files', [
            {
              any: ['**/foo/**/*', '**/index.*'],
              all: ['**/*.html', 'static/**/*'],
            },
          ]],
        ]),
      ]],
      ['globOptions', { nocase: true }],
    ]) as CommentConfig;

    expect(snippets.getMatchingSnippetIds(['static/foo/bar/index.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/FOO/bar/index.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/foo/about.html'], config)).toEqual([]);
    expect(snippets.getMatchingSnippetIds(['static/FOO/about.html'], config)).toEqual([]);
    expect(snippets.getMatchingSnippetIds(['static/foo/index.html', 'static/page.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/FOO/index.html', 'static/page.html'], config)).toEqual(['snippet1']);
    expect(snippets.getMatchingSnippetIds(['static/FOO/index.html', 'STATIC/page.html'], config)).toEqual(['snippet1']);
  });
});
