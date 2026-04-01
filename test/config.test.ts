import * as config from '../lib/config';
import {Config} from "../lib/config";

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

  const snippet1Map = new Map<string, unknown>([
    ['id', 'snippet1'],
    ['body', 'let me tell you something...'],
    ['files', ['/foo/bar.txt', '/foo/baz/*']],
  ]);

  const snippet2Map = new Map<string, unknown>([
    ['id', 'snippet2'],
    ['body', 'once upon a time...'],
    ['files', ['/pizzazz/**/*.html']],
  ]);

  const snippet3Map = new Map<string, unknown>([
    ['id', 'snippet3'],
    ['body', 'there was a wolf...'],
    ['files', [{
      all: ['!static/index.html'],
    }]],
  ]);

  const snippet4Map = new Map<string, unknown>([
    ['id', 'snippet4'],
    ['body', 'something something...'],
    ['files', [{
      any: ['static/*.html', 'static/*.css'],
    }]],
  ]);

  const snippet5Map = new Map<string, unknown>([
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
        'on-create': 'nothing',
        'on-update': 'nothing',
        header: 'hello',
        footer: 'bye',
        snippets: [snippet1Object, snippet2Object, snippet3Object, snippet4Object, snippet5Object],
      },
    } as Config;

    const output = new Map<string, unknown>([
      ['onCreate', 'nothing'],
      ['onUpdate', 'nothing'],
      ['header', 'hello'],
      ['footer', 'bye'],
      ['snippets', [snippet1Map, snippet2Map, snippet3Map, snippet4Map, snippet5Map]],
    ]);

    expect(config.validateCommentConfig(input)).toEqual(output);
  });

  test('removes unknown keys', () => {
    // @ts-expect-error: Intentional type violation for testing
    const input = {
      comment: {
        'on-update': 'nothing',
        header: 'hello',
        footer: 'bye',
        whaaat: 'dunno',
        id: '342',
        snippets: [snippet1Object, snippet2Object],
      },
    } as Config;

    const output = new Map<string, unknown>([
      ['onCreate', 'create'],
      ['onUpdate', 'nothing'],
      ['header', 'hello'],
      ['footer', 'bye'],
      ['snippets', [snippet1Map, snippet2Map]],
    ]);

    expect(config.validateCommentConfig(input)).toEqual(output);
  });

  test('on-create can be missing', () => {
    const input = {
      comment: {
        'on-update': 'edit',
        header: 'hi',
        footer: 'bye',
        snippets: [snippet2Object],
      },
    } as Config;

    const output = new Map<string, unknown>([
      ['onCreate', 'create'],
      ['onUpdate', 'edit'],
      ['header', 'hi'],
      ['footer', 'bye'],
      ['snippets', [snippet2Map]],
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

    const output = new Map<string, unknown>([
      ['onCreate', 'create'],
      ['onUpdate', 'edit'],
      ['header', undefined],
      ['footer', 'bye'],
      ['snippets', [snippet2Map]],
    ]);

    // @ts-expect-error: Intentional type violation for testing
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

    const output = new Map<string, unknown>([
      ['onCreate', 'create'],
      ['onUpdate', 'edit'],
      ['header', 'hello'],
      ['footer', undefined],
      ['snippets', [snippet2Map]],
    ]);

    // @ts-expect-error: Intentional type violation for testing
    expect(config.validateCommentConfig(input)).toEqual(output);
  });

  test('header must be a string', () => {
    const input = {
      comment: {
        header: 2,
      },
    };

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type 'number' under key '\.comment\.header' \(should be a string\)/);
  });

  test('footer must be a string', () => {
    const input = {
      comment: {
        footer: 2,
      },
    };

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type 'number' under key '\.comment\.footer' \(should be a string\)/);
  });

  test('on-create must be one of known values', () => {
    const input = {
      comment: {
        'on-create': 'sup',
      },
    };

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value 'sup' under key '\.comment\.on-create' \(should be one of: create, nothing\)/);
  });

  test('on-create must be one a string', () => {
    const input = {
      comment: {
        'on-create': [],
      },
    };

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type 'object' under key '\.comment\.on-create' \(should be a string\)/);
  });

  test('on-create can be a mustache template', () => {
    const input = {
      comment: {
        'on-create': '{{ onCreate }}',
        header: 'hi',
        footer: 'bye',
        snippets: [snippet2Object],
      },
    } as Config;

    const templateVariables = { onCreate: 'nothing' };

    const output = new Map<string, unknown>([
      ['onCreate', 'nothing'],
      ['onUpdate', 'recreate'],
      ['header', 'hi'],
      ['footer', 'bye'],
      ['snippets', [snippet2Map]],
    ]);

    expect(config.validateCommentConfig(input, templateVariables)).toEqual(output);
  });

  test('on-create must be one of known values after rendering the mustache template', () => {
    const input = {
      comment: {
        'on-create': '{{ onCreate }}',
      },
    };

    const templateVariables = { onCreate: '1234' };

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input, templateVariables)).toThrow(/found unexpected value '1234' under key '\.comment\.on-create' \(should be one of: create, nothing\)/);
  });

  test('on-update must be one of known values', () => {
    const input = {
      comment: {
        'on-update': 'whatever',
      },
    };

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value 'whatever' under key '\.comment\.on-update' \(should be one of: recreate, edit, nothing\)/);
  });

  test('on-update must be one a string', () => {
    const input = {
      comment: {
        'on-update': 123,
      },
    };

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type 'number' under key '\.comment\.on-update' \(should be a string\)/);
  });

  test('on-update can be a mustache template', () => {
    const input = {
      comment: {
        'on-update': '{{ onUpdate }}',
        header: 'hi',
        footer: 'bye',
        snippets: [snippet2Object],
      },
    } as Config;

    const templateVariables = { onUpdate: 'nothing' };

    const output = new Map<string, unknown>([
      ['onCreate', 'create'],
      ['onUpdate', 'nothing'],
      ['header', 'hi'],
      ['footer', 'bye'],
      ['snippets', [snippet2Map]],
    ]);

    expect(config.validateCommentConfig(input, templateVariables)).toEqual(output);
  });

  test('on-update must be one of known values after rendering the mustache template', () => {
    const input = {
      comment: {
        'on-update': '{{ onUpdate }}',
      },
    };

    const templateVariables = { onUpdate: 'cat' };

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input, templateVariables)).toThrow(/found unexpected value 'cat' under key '\.comment\.on-update' \(should be one of: recreate, edit, nothing\)/);
  });

  test('glob-options is optional', () => {
    const input = {
      comment: {
        'glob-options': {
          dot: true,
          noglobstar: true,
        },
        snippets: [snippet1Object],
      },
    };

    const output = new Map<string, unknown>([
      ['onCreate', 'create'],
      ['onUpdate', 'recreate'],
      ['header', undefined],
      ['footer', undefined],
      ['globOptions', {
        dot: true,
        noglobstar: true,
      }],
      ['snippets', [snippet1Map]],
    ]);

    // @ts-expect-error: Intentional type violation for testing
    expect(config.validateCommentConfig(input)).toEqual(output);
  });

  test('snippets is required', () => {
    const input = {
      comment: {},
    };

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets' \(should be a non-empty array\)/);
  });

  test('snippets must be an array', () => {
    const input = {
      comment: {
        snippets: 2,
      },
    };

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input)).toThrow(/found unexpected value type under key '\.comment\.snippets' \(should be a non-empty array\)/);
  });

  test('snippets must be a non-empty array', () => {
    const input = {
      comment: {
        snippets: [],
      },
    };

    // @ts-expect-error: Intentional type violation for testing
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

    // @ts-expect-error: Intentional type violation for testing
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

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input)).toThrow(/found invalid snippet id 'can this have spaces\?' \(snippet ids must contain only letters, numbers, dashes, and underscores\)/);
  });

  test('snippet id can be a mustache template', () => {
    const input = {
      comment: {
        snippets: [
          {
            id: 'snippet-{{ date }}',
            body: 'something something...',
            files: ['foo.txt'],
          },
        ],
      },
    };

    const templateVariables = { date: '2021-08-27' };

    const snippets = [new Map<string, unknown>([
      ['id', 'snippet-2021-08-27'],
      ['body', 'something something...'],
      ['files', ['foo.txt']],
    ])];

    const expected = new Map<string, unknown>([
      ['footer', undefined],
      ['header', undefined],
      ['onCreate', 'create'],
      ['onUpdate', 'recreate'],
      ['snippets', snippets],
    ]);

    // @ts-expect-error: Intentional type violation for testing
    expect(config.validateCommentConfig(input, templateVariables)).toEqual(expected);
  });

  test('snippet id can only contain letters, numbers, a dash, and an underscore after rendering the mustache template', () => {
    const input = {
      comment: {
        snippets: [
          {
            id: 'snippet-{{ date }}',
            body: '',
            files: ['foo.txt'],
          },
        ],
      },
    };

    const templateVariables = { date: '2021 08 27' };

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input, templateVariables)).toThrow(/found invalid snippet id 'snippet-2021 08 27' \(snippet ids must contain only letters, numbers, dashes, and underscores\)/);
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

    // @ts-expect-error: Intentional type violation for testing
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

    // @ts-expect-error: Intentional type violation for testing
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

    // @ts-expect-error: Intentional type violation for testing
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

    // @ts-expect-error: Intentional type violation for testing
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

    // @ts-expect-error: Intentional type violation for testing
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

    // @ts-expect-error: Intentional type violation for testing
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

    // @ts-expect-error: Intentional type violation for testing
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

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input)).toThrow(/found duplicate snippet id 'foo'/);
  });

  test('snippet ids must be unique after mustache templates are rendered', () => {
    const input = {
      comment: {
        snippets: [
          {
            id: 'snippet-{{ number }}',
            body: '',
            files: ['foo.txt'],
          },
          {
            id: 'snippet-{{ id }}',
            body: '',
            files: ['foo.txt'],
          },
        ],
      },
    };

    const variableTemplates = { number: 5, id: 5 };

    // @ts-expect-error: Intentional type violation for testing
    expect(() => config.validateCommentConfig(input, variableTemplates)).toThrow(/found duplicate snippet id 'snippet-5'/);
  });
});
