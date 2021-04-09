const config = require('../lib/config');

describe('validateCommentConfig', () => {
  const snippet1Object = {
    id: 'snippet1',
    body: 'let me tell you something...',
    files: [
      '/foo/bar.txt',
      '/foo/baz/*',
    ],
  };

  const snippet2Object = {
    id: 'snippet2',
    body: 'once upon a time...',
    files: [
      '/pizzazz/**/*.html',
    ],
  };

  const snippet1Map = new Map([
    ['id', 'snippet1'],
    ['body', 'let me tell you something...'],
    ['files', ['/foo/bar.txt', '/foo/baz/*']],
  ]);

  const snippet2Map = new Map([
    ['id', 'snippet2'],
    ['body', 'once upon a time...'],
    ['files', ['/pizzazz/**/*.html']],
  ]);

  test('valid config', () => {
    const input = {
      comment: {
        header: 'hello',
        footer: 'bye',
        snippets: [snippet1Object, snippet2Object],
      },
    };

    const output = new Map([
      ['header', 'hello'],
      ['footer', 'bye'],
      ['snippets', [snippet1Map, snippet2Map]],
    ]);

    expect(config.validateCommentConfig(input)).toEqual(output);
  });

  test('removes unknown keys', () => {
    const input = {
      comment: {
        header: 'hello',
        footer: 'bye',
        whaaat: 'dunno',
        id: '342',
        snippets: [snippet1Object, snippet2Object],
      },
    };

    const output = new Map([
      ['header', 'hello'],
      ['footer', 'bye'],
      ['snippets', [snippet1Map, snippet2Map]],
    ]);

    expect(config.validateCommentConfig(input)).toEqual(output);
  });

  test('header can be missing', () => {
    const input = {
      comment: {
        footer: 'bye',
        snippets: [snippet2Object],
      },
    };

    const output = new Map([
      ['header', undefined],
      ['footer', 'bye'],
      ['snippets', [snippet2Map]],
    ]);

    expect(config.validateCommentConfig(input)).toEqual(output);
  });

  test('footer can be missing', () => {
    const input = {
      comment: {
        header: 'hello',
        snippets: [snippet2Object],
      },
    };

    const output = new Map([
      ['header', 'hello'],
      ['footer', undefined],
      ['snippets', [snippet2Map]],
    ]);

    expect(config.validateCommentConfig(input)).toEqual(output);
  });

  test('header must be a string', () => {
    const input = {
      comment: {
        header: 2,
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type 'number' under key '\.comment\.header' \(should be a string\)/);
  });

  test('footer must be a string', () => {
    const input = {
      comment: {
        footer: 2,
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type 'number' under key '\.comment\.footer' \(should be a string\)/);
  });

  test('snippets is required', () => {
    const input = {
      comment: {},
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets' \(should be a non-empty array\)/);
  });

  test('snippets must be an array', () => {
    const input = {
      comment: {
        snippets: 2,
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets' \(should be a non-empty array\)/);
  });

  test('snippets must be a non-empty array', () => {
    const input = {
      comment: {
        snippets: [],
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets' \(should be a non-empty array\)/);
  });

  test('snippet id is required', () => {
    const input = {
      comment: {
        snippets: [
          {
            body: '',
            files: ['foo.txt'],
          },
        ],
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type 'undefined' under key '\.comment\.snippets\.0\.id' \(should be a string\)/);
  });

  test('error message uses the correct snippet index', () => {
    const input = {
      comment: {
        snippets: [
          {
            id: 'snippet1',
            body: '',
            files: ['foo.txt'],
          },
          {
            body: '',
            files: ['foo.txt'],
          },
          {
            id: 'snippet3',
            body: '',
            files: ['foo.txt'],
          },
        ],
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type 'undefined' under key '\.comment\.snippets\.1\.id' \(should be a string\)/);
  });

  test('snippet body is required', () => {
    const input = {
      comment: {
        snippets: [
          {
            id: 'foo',
            files: ['foo.txt'],
          },
        ],
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type 'undefined' under key '\.comment\.snippets\.0\.body' \(should be a string\)/);
  });

  test('snippet files is required', () => {
    const input = {
      comment: {
        snippets: [
          {
            id: 'foo',
            body: 'foo',
          },
        ],
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets\.0\.files' \(should be a non-empty array of strings\)/);
  });

  test('snippet files cannot be empty', () => {
    const input = {
      comment: {
        snippets: [
          {
            id: 'foo',
            body: 'foo',
            files: [],
          },
        ],
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets\.0\.files' \(should be a non-empty array of strings\)/);
  });

  test('snippet files must contain strings', () => {
    const input = {
      comment: {
        snippets: [
          {
            id: 'foo',
            body: 'foo',
            files: ['bar', 4],
          },
        ],
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets\.0\.files' \(should be a non-empty array of strings\)/);
  });

  test('snippet ids must be unique', () => {
    const input = {
      comment: {
        snippets: [
          {
            id: 'foo',
            body: '',
            files: ['foo.txt'],
          },
          {
            id: 'foo',
            body: '',
            files: ['foo.txt'],
          },
        ],
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found duplicate snippet id 'foo'/);
  });
});
