const comment = require('../lib/comment');

describe('comment', () => {
  describe('validateCommentConfig', () => {
    test('header, footer, and many snippets', () => {
      const commentConfig = new Map([
        ['header', 'hello'],
        ['footer', 'bye'],
        ['snippets', [
          new Map([
            ['id', 'snippet1'],
            ['body', 'A list:\n- one\n- two\n- three'],
          ]),
          new Map([
            ['id', 'snippet2'],
            ['body', 'Do not forget to be awesome!'],
          ]),
        ]],
      ]);

      expect(comment.assembleComment(['snippet1'], commentConfig)).toEqual(
        'hello\n\n'
        + 'A list:\n- one\n- two\n- three\n\n'
        + 'bye\n\n'
        + '<!-- pr-commenter-metadata: snippet1 -->',
      );

      expect(comment.assembleComment(['snippet1', 'snippet2'], commentConfig)).toEqual(
        'hello\n\n'
        + 'A list:\n- one\n- two\n- three\n\n'
        + 'Do not forget to be awesome!\n\n'
        + 'bye\n\n'
        + '<!-- pr-commenter-metadata: snippet1,snippet2 -->',
      );
    });

    test('no header', () => {
      const commentConfig = new Map([
        ['header', undefined],
        ['footer', 'bye'],
        ['snippets', [
          new Map([
            ['id', 'snippet1'],
            ['body', 'A list:\n- one\n- two\n- three'],
          ]),
          new Map([
            ['id', 'snippet2'],
            ['body', 'Do not forget to be awesome!'],
          ]),
        ]],
      ]);

      expect(comment.assembleComment(['snippet1', 'snippet2'], commentConfig)).toEqual(
        'A list:\n- one\n- two\n- three\n\n'
        + 'Do not forget to be awesome!\n\n'
        + 'bye\n\n'
        + '<!-- pr-commenter-metadata: snippet1,snippet2 -->',
      );
    });

    test('no footer', () => {
      const commentConfig = new Map([
        ['header', 'hello'],
        ['footer', undefined],
        ['snippets', [
          new Map([
            ['id', 'snippet1'],
            ['body', 'A list:\n- one\n- two\n- three'],
          ]),
          new Map([
            ['id', 'snippet2'],
            ['body', 'Do not forget to be awesome!'],
          ]),
        ]],
      ]);

      expect(comment.assembleComment(['snippet1', 'snippet2'], commentConfig)).toEqual(
        'hello\n\n'
        + 'A list:\n- one\n- two\n- three\n\n'
        + 'Do not forget to be awesome!\n\n'
        + '<!-- pr-commenter-metadata: snippet1,snippet2 -->',
      );
    });

    test('no header and no footer', () => {
      const commentConfig = new Map([
        ['header', undefined],
        ['footer', undefined],
        ['snippets', [
          new Map([
            ['id', 'snippet1'],
            ['body', 'A list:\n- one\n- two\n- three'],
          ]),
          new Map([
            ['id', 'snippet2'],
            ['body', 'Do not forget to be awesome!'],
          ]),
        ]],
      ]);

      expect(comment.assembleComment(['snippet1', 'snippet2'], commentConfig)).toEqual(
        'A list:\n- one\n- two\n- three\n\n'
        + 'Do not forget to be awesome!\n\n'
        + '<!-- pr-commenter-metadata: snippet1,snippet2 -->',
      );
    });
  });

  describe('extractCommentMetadata', () => {
    test('finds a single snippet id in the middle of a comment', () => {
      const commentBody = 'hello\nthere\n<!-- pr-commenter-metadata: snippet-abc -->\nblabla';
      const expectedResult = ['snippet-abc'];

      expect(comment.extractCommentMetadata(commentBody)).toEqual(expectedResult);
    });

    test('finds an empty array in the middle of a comment', () => {
      const commentBody = 'hello\nthere\n<!-- pr-commenter-metadata:  -->\nblabla';
      const expectedResult = [];

      expect(comment.extractCommentMetadata(commentBody)).toEqual(expectedResult);
    });

    test('finds a list of snippet ids in the middle of a comment', () => {
      const commentBody = 'hello\nthere\n<!-- pr-commenter-metadata: snippet-abc,snippet8,snippet_9_8,777 -->\nblabla';
      const expectedResult = ['snippet-abc', 'snippet8', 'snippet_9_8', '777'];

      expect(comment.extractCommentMetadata(commentBody)).toEqual(expectedResult);
    });

    test('finds a list of snippet ids at the beginning of a comment', () => {
      const commentBody = '<!-- pr-commenter-metadata: snippet-abc,snippet8,snippet_9_8,777 -->\nblabla';
      const expectedResult = ['snippet-abc', 'snippet8', 'snippet_9_8', '777'];

      expect(comment.extractCommentMetadata(commentBody)).toEqual(expectedResult);
    });

    test('finds a list of snippet ids at the end of a comment', () => {
      const commentBody = 'blabla\nblabla\n<!-- pr-commenter-metadata: snippet-abc,snippet8,snippet_9_8,777 -->';
      const expectedResult = ['snippet-abc', 'snippet8', 'snippet_9_8', '777'];

      expect(comment.extractCommentMetadata(commentBody)).toEqual(expectedResult);
    });

    test('comment does not follow special syntax', () => {
      const commentBody = 'hello\nthere\n<!-- something something, ok?  -->\nblabla';
      const expectedResult = null;

      expect(comment.extractCommentMetadata(commentBody)).toEqual(expectedResult);
    });

    test('when no HTML comments in GH comment body', () => {
      const commentBody = 'hello\nthere\n\nblabla';
      const expectedResult = null;

      expect(comment.extractCommentMetadata(commentBody)).toEqual(expectedResult);
    });
  });
});
