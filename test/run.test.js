const core = require('@actions/core');
const github = require('@actions/github');
const localGithub = require('../lib/github');
const comment = require('../lib/comment');

const { run } = require('../lib/run');

const fakePRNumber = 432;

jest.mock('@actions/core');
jest.mock('@actions/github', () => ({
  ...jest.requireActual('@actions/github'),
  getOctokit: jest.fn().mockImplementation(() => ({ name: 'fake-client' })),
  context: { payload: { pull_request: { number: fakePRNumber } } },
}));

jest.mock('../lib/github');

describe('run', () => {
  test('fully-mocked recreating a comment happy path', async () => {
    const fakeToken = 'github-token-123456';
    const fakeConfigPath = 'foo/config-file.yml';
    const fakeConfig = 'comment:\n'
      + '  on-update: recreate\n'
      + '  header: Hello!\n'
      + '  footer: Bye!\n'
      + '  snippets:\n'
      + '    - id: snippet1\n'
      + '      body: This is snippet 1\n'
      + '      files:\n'
      + '        - any: ["*.md"]\n'
      + '          all: ["!CONTRIBUTING.md"]\n'
      + '    - id: snippet2\n'
      + '      body: This is snippet 2\n'
      + '      files:\n'
      + '        - vendor/**.js\n'
      + '        - static/**.js\n'
      + '    - id: snippet3\n'
      + '      body: This is snippet 3\n'
      + '      files:\n'
      + '        - static/**.css\n';

    core.getInput.mockImplementation((argument) => {
      if (argument === 'github-token') {
        return fakeToken;
      }

      if (argument === 'config-file') {
        return 'foo/config-file.yml';
      }

      return null;
    });

    const previousComment = {
      user: { type: 'Bot' },
      created_at: '2020-01-03',
      body: comment.commentMetadata(['snippet3']),
      url: 'previous-comment-url',
    };

    const existingPRComments = [
      { user: { type: 'user' } },
      { user: { type: 'Bot' }, created_at: '2020-01-02' },
      previousComment,
      { user: { type: 'Bot' }, created_at: '2020-01-01' },
    ];

    const commentBody = `${'Hello!\n\n'
      + 'This is snippet 1\n\n'
    + 'This is snippet 3\n\n'
    + 'Bye!\n\n'}${
      comment.commentMetadata(['snippet1', 'snippet3'])}`;

    localGithub.getChangedFiles.mockResolvedValue(['static/foo.html', 'README.md', 'static/foo.css']);
    localGithub.getFileContent.mockResolvedValue(fakeConfig);
    localGithub.getComments.mockResolvedValue(existingPRComments);

    await run();

    expect(github.getOctokit).toHaveBeenCalledTimes(1);
    expect(github.getOctokit.mock.calls[0][0]).toEqual(fakeToken);

    expect(localGithub.getChangedFiles).toHaveBeenCalledTimes(1);
    expect(localGithub.getChangedFiles).toHaveBeenCalledWith({ name: 'fake-client' }, fakePRNumber);

    expect(localGithub.getFileContent).toHaveBeenCalledTimes(1);
    expect(localGithub.getFileContent).toHaveBeenCalledWith({ name: 'fake-client' }, fakeConfigPath);

    expect(localGithub.getComments).toHaveBeenCalledTimes(1);
    expect(localGithub.getComments).toHaveBeenCalledWith({ name: 'fake-client' }, fakePRNumber);

    expect(localGithub.deleteComment).toHaveBeenCalledTimes(1);
    expect(localGithub.deleteComment).toHaveBeenCalledWith({ name: 'fake-client' }, previousComment);

    expect(localGithub.deleteComment).toHaveBeenCalledTimes(1);
    expect(localGithub.deleteComment).toHaveBeenCalledWith({ name: 'fake-client' }, previousComment);

    expect(localGithub.createComment).toHaveBeenCalledTimes(1);
    expect(localGithub.createComment).toHaveBeenCalledWith({ name: 'fake-client' }, fakePRNumber, commentBody);

    expect(localGithub.editComment).toHaveBeenCalledTimes(0);
  });
});
