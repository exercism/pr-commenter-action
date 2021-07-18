const comment = require('../lib/comment');

describe('comment', () => {
  describe('assembleCommentBody', () => {
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

      expect(comment.assembleCommentBody(['snippet1'], commentConfig)).toEqual(
        'hello\n\n'
        + 'A list:\n- one\n- two\n- three\n\n'
        + 'bye\n\n'
        + '<!-- pr-commenter-metadata: snippet1 -->',
      );

      expect(comment.assembleCommentBody(['snippet1', 'snippet2'], commentConfig)).toEqual(
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

      expect(comment.assembleCommentBody(['snippet1', 'snippet2'], commentConfig)).toEqual(
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

      expect(comment.assembleCommentBody(['snippet1', 'snippet2'], commentConfig)).toEqual(
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

      expect(comment.assembleCommentBody(['snippet1', 'snippet2'], commentConfig)).toEqual(
        'A list:\n- one\n- two\n- three\n\n'
        + 'Do not forget to be awesome!\n\n'
        + '<!-- pr-commenter-metadata: snippet1,snippet2 -->',
      );
    });

    test('supports Mustache templates', () => {
      const commentConfig = new Map([
        ['header', 'hello {{user.firstName}}'],
        ['footer', 'bye {{user.firstName}}'],
        ['snippets', [
          new Map([
            ['id', 'snippet1'],
            ['body', 'A list:\n- one\n- two\n{{#shouldIncludeThirdItem}}- three\n{{/shouldIncludeThirdItem}}'],
          ]),
        ]],
      ]);

      const templateVariables = {
        user: {
          firstName: 'Alice',
        },
        shouldIncludeThirdItem: false,
      };

      expect(comment.assembleCommentBody(['snippet1'], commentConfig, templateVariables)).toEqual(
        'hello Alice\n\n'
        + 'A list:\n- one\n- two\n\n'
        + 'bye Alice\n\n'
        + '<!-- pr-commenter-metadata: snippet1 -->',
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

  describe('comment create/delete/edit logic', () => {
    test('no previous comment, no snippets detected', () => {
      const previousComment = undefined;
      const snippetIds = [];

      let commentConfig = new Map([['onUpdate', 'recreate']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);

      commentConfig = new Map([['onUpdate', 'edit']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);

      commentConfig = new Map([['onUpdate', 'nothing']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
    });

    test('no previous comment, some snippets detected', () => {
      const previousComment = undefined;
      const snippetIds = ['snippet1', 'snippet2'];

      let commentConfig = new Map([['onUpdate', 'recreate']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(true);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);

      commentConfig = new Map([['onUpdate', 'edit']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(true);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);

      commentConfig = new Map([['onUpdate', 'nothing']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(true);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
    });

    test('a previous comment with exactly the same snippets', () => {
      const previousComment = { body: comment.commentMetadata(['snippet1', 'snippet2']) };
      const snippetIds = ['snippet1', 'snippet2'];

      let commentConfig = new Map([['onUpdate', 'recreate']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);

      commentConfig = new Map([['onUpdate', 'edit']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);

      commentConfig = new Map([['onUpdate', 'nothing']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
    });

    test('a previous comment with different snippets', () => {
      const previousComment = { body: comment.commentMetadata(['snippet2']) };
      const snippetIds = ['snippet1', 'snippet2'];

      let commentConfig = new Map([['onUpdate', 'recreate']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(true);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(true);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);

      commentConfig = new Map([['onUpdate', 'edit']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(true);

      commentConfig = new Map([['onUpdate', 'nothing']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
    });

    test('a previous comment, new comment would have no snippets', () => {
      const previousComment = { body: comment.commentMetadata(['snippet2']) };
      const snippetIds = [];

      let commentConfig = new Map([['onUpdate', 'recreate']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(true);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);

      commentConfig = new Map([['onUpdate', 'edit']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(true);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);

      commentConfig = new Map([['onUpdate', 'nothing']]);

      expect(comment.shouldPostNewComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldDeletePreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
      expect(comment.shouldEditPreviousComment(previousComment, snippetIds, commentConfig))
        .toEqual(false);
    });
  });
});
