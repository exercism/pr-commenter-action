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

  const snippet3Object = {
    id: 'snippet3',
    body: 'there was a wolf...',
    files: [{
      all: ['!static/index.html'],
    }],
  };

  const snippet4Object = {
    id: 'snippet4',
    body: 'something something...',
    files: [{
      any: ['static/*.html', 'static/*.css'],
    }],
  };

  const snippet5Object = {
    id: 'snippet5',
    body: 'something something...',
    files: [{
      all: ['!static/index.html'],
      any: ['static/*.html', 'static/*.css'],
    }],
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

  const snippet3Map = new Map([
    ['id', 'snippet3'],
    ['body', 'there was a wolf...'],
    ['files', [{
      all: ['!static/index.html'],
    }]],
  ]);

  const snippet4Map = new Map([
    ['id', 'snippet4'],
    ['body', 'something something...'],
    ['files', [{
      any: ['static/*.html', 'static/*.css'],
    }]],
  ]);

  const snippet5Map = new Map([
    ['id', 'snippet5'],
    ['body', 'something something...'],
    ['files', [{
      any: ['static/*.html', 'static/*.css'],
      all: ['!static/index.html'],
    }]],
  ]);

  test('valid config', () => {
    const input = {
      comment: {
        'on-update': 'nothing',
        header: 'hello',
        footer: 'bye',
        snippets: [snippet1Object, snippet2Object, snippet3Object, snippet4Object, snippet5Object],
      },
    };

    const output = new Map([
      ['onUpdate', 'nothing'],
      ['header', 'hello'],
      ['footer', 'bye'],
      ['snippets', [snippet1Map, snippet2Map, snippet3Map, snippet4Map, snippet5Map]],
    ]);

    expect(config.validateCommentConfig(input)).toEqual(output);
  });

  test('removes unknown keys', () => {
    const input = {
      comment: {
        'on-update': 'nothing',
        header: 'hello',
        footer: 'bye',
        whaaat: 'dunno',
        id: '342',
        snippets: [snippet1Object, snippet2Object],
      },
    };

    const output = new Map([
      ['onUpdate', 'nothing'],
      ['header', 'hello'],
      ['footer', 'bye'],
      ['snippets', [snippet1Map, snippet2Map]],
    ]);

    expect(config.validateCommentConfig(input)).toEqual(output);
  });

  test('header can be missing', () => {
    const input = {
      comment: {
        'on-update': 'edit',
        footer: 'bye',
        snippets: [snippet2Object],
      },
    };

    const output = new Map([
      ['onUpdate', 'edit'],
      ['header', undefined],
      ['footer', 'bye'],
      ['snippets', [snippet2Map]],
    ]);

    expect(config.validateCommentConfig(input)).toEqual(output);
  });

  test('footer can be missing', () => {
    const input = {
      comment: {
        'on-update': 'edit',
        header: 'hello',
        snippets: [snippet2Object],
      },
    };

    const output = new Map([
      ['onUpdate', 'edit'],
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

  test('on-update must be one of known values', () => {
    const input = {
      comment: {
        'on-update': 'whatever',
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value 'whatever' under key '\.comment\.on-update' \(should be one of: recreate, edit, nothing\)/);
  });

  test('glob-options is an optional', () => {
    const input = {
      comment: {
        'glob-options': {
          dot: true,
          noglobstar: true,
        },
        snippets: [snippet1Object],
      },
    };

    const output = new Map([
      ['onUpdate', 'recreate'],
      ['header', undefined],
      ['footer', undefined],
      ['globOptions', {
        dot: true,
        noglobstar: true,
      }],
      ['snippets', [snippet1Map]],
    ]);

    expect(config.validateCommentConfig(input)).toEqual(output);
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

  test('snippet id can only contain letters, numbers, a dash, and an underscore', () => {
    const input = {
      comment: {
        snippets: [
          {
            id: 'can this have spaces?',
            body: '',
            files: ['foo.txt'],
          },
        ],
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found invalid snippet id 'can this have spaces\?' \(snippet ids must contain only letters, numbers, dashes, and underscores\)/);
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

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets\.0\.files' \(should be a non-empty array\)/);
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

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets\.0\.files' \(should be a non-empty array\)/);
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

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets\.0\.files\.1' \(should be a string or an object with keys 'all' and\/or 'any'\)/);
  });

  test('snippet files `any` key must contain strings', () => {
    const input = {
      comment: {
        snippets: [
          {
            id: 'foo',
            body: 'foo',
            files: [
              { any: [5] },
            ],
          },
        ],
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets\.0\.files\.0' \(should be a string or an object with keys 'all' and\/or 'any'\)/);
  });

  test('snippet files `all` key must contain strings', () => {
    const input = {
      comment: {
        snippets: [
          {
            id: 'foo',
            body: 'foo',
            files: [
              'foo.md',
              'bar.txt',
              { all: [5] },
            ],
          },
        ],
      },
    };

    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets\.0\.files\.2' \(should be a string or an object with keys 'all' and\/or 'any'\)/);
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
