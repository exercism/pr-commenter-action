const snippets = require('../lib/snippets');

jest.mock('@actions/core');

describe('getMatchingSnippetIds', () => {
  test('no matches', () => {
    const config = new Map([
      ['snippets', [
        new Map([
          ['id', 'snippet1'],
          ['files', ['foo/**/*.txt']]
        ])
      ]]
    ])
    const changedFiles = ['foo/bar/baz.html', 'foo/bar.html', 'notfoo/foo/banana.txt']
    const expectedResult = []

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config)
    expect(actualResult).toEqual(expectedResult)
  })

  test('a match, one pattern', () => {
    const config = new Map([
      ['snippets', [
        new Map([
          ['id', 'snippet1'],
          ['files', ['foo/**/*.txt']]
        ])
      ]]
    ])
    const changedFiles = ['foo/bar/baz.txt', 'foo/bar.html', 'notfoo/foo/banana.txt']
    const expectedResult = ['snippet1']

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config)
    expect(actualResult).toEqual(expectedResult)
  })

  test('single * does not match nested dirs', () => {
    const config = new Map([
      ['snippets', [
        new Map([
          ['id', 'snippet1'],
          ['files', ['*.txt']]
        ])
      ]]
    ])
    const changedFiles = ['foo/bar.txt', 'foo/bar/baz.txt']
    const expectedResult = []

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config)
    expect(actualResult).toEqual(expectedResult)
  })

  test('double ** matches files in root dir', () => {
    const config = new Map([
      ['snippets', [
        new Map([
          ['id', 'snippet1'],
          ['files', ['**/*.txt']]
        ])
      ]]
    ])
    const changedFiles = ['bar.txt']
    const expectedResult = ['snippet1']

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config)
    expect(actualResult).toEqual(expectedResult)
  })

  test('a match, many patterns', () => {
    const config = new Map([
      ['snippets', [
        new Map([
          ['id', 'snippet1'],
          ['files', ['README.md', 'foo/*.html', 'foo/**/*.txt']]
        ])
      ]]
    ])
    const changedFiles = ['foo/bar/baz.txt', 'foo/bar.html', 'notfoo/foo/banana.txt']
    const expectedResult = ['snippet1']

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config)
    expect(actualResult).toEqual(expectedResult)
  })

  test('a match, many patterns, many snippets', () => {
    const config = new Map([
      ['snippets', [
        new Map([
          ['id', 'snippet1'],
          ['files', ['README.md']]
        ]),
        new Map([
          ['id', 'snippet2'],
          ['files', ['**/*.html', '**/*.css']]
        ]),
        new Map([
          ['id', 'snippet3'],
          ['files', ['foo/**/*']]
        ])
      ]]
    ])
    const changedFiles = ['bar/1.txt', 'bar/2.txt', 'bar/index.html']
    const expectedResult = ['snippet2']

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config)
    expect(actualResult).toEqual(expectedResult)
  })

  test('a match, many patterns, many snippets - the match matches multiple patterns', () => {
    const config = new Map([
      ['snippets', [
        new Map([
          ['id', 'snippet1'],
          ['files', ['README.md']]
        ]),
        new Map([
          ['id', 'snippet2'],
          ['files', ['**/*.html', '**/*.css']]
        ]),
        new Map([
          ['id', 'snippet3'],
          ['files', ['foo/**/*']]
        ])
      ]]
    ])
    const changedFiles = ['foo/index.html']
    const expectedResult = ['snippet2', 'snippet3']

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config)
    expect(actualResult).toEqual(expectedResult)
  })

  test('many matches, many patterns, many snippets', () => {
    const config = new Map([
      ['snippets', [
        new Map([
          ['id', 'snippet1'],
          ['files', ['README.md']]
        ]),
        new Map([
          ['id', 'snippet2'],
          ['files', ['**/*.html', '**/*.css']]
        ]),
        new Map([
          ['id', 'snippet3'],
          ['files', ['foo/**/*']]
        ])
      ]]
    ])
    const changedFiles = ['README.md', 'bar/1.txt', 'bar/2.txt', 'foo/HELLO.md']
    const expectedResult = ['snippet1', 'snippet3']

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config)
    expect(actualResult).toEqual(expectedResult)
  })

  test('snippets are always returned in the same order as they are in the config', () => {
    const config = new Map([
      ['snippets', [
        new Map([
          ['id', 'snippet1'],
          ['files', ['README.md']]
        ]),
        new Map([
          ['id', 'snippet2'],
          ['files', ['**/*.md']]
        ]),
        new Map([
          ['id', 'snippet3'],
          ['files', ['foo/**/*']]
        ])
      ]]
    ])
    const changedFiles = ['foo/HELLO.txt', 'README.md']
    const expectedResult = ['snippet1', 'snippet2', 'snippet3']

    const actualResult = snippets.getMatchingSnippetIds(changedFiles, config)
    expect(actualResult).toEqual(expectedResult)
  })
})
