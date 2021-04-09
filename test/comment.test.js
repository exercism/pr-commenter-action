const comment = require('../lib/comment');

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
      + 'bye',
    );

    expect(comment.assembleComment(['snippet1', 'snippet2'], commentConfig)).toEqual(
      'hello\n\n'
      + 'A list:\n- one\n- two\n- three\n\n'
      + 'Do not forget to be awesome!\n\n'
      + 'bye',
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
      + 'bye',
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
      + 'Do not forget to be awesome!',
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
      + 'Do not forget to be awesome!',
    );
  });
});
