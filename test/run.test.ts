import * as core from '@actions/core';
import * as github from '@actions/github';
import * as localGithub from '../lib/github';
import * as comment from '../lib/comment';

import { run } from '../lib/run';

const fakePRNumber = 432;

jest.mock('@actions/core');
jest.mock('@actions/github', () => ({
  ...jest.requireActual('@actions/github'),
  getOctokit: jest.fn().mockImplementation(() => ({ name: 'fake-client' })),
  context: { payload: { pull_request: { number: fakePRNumber } } },
}));

jest.mock('../lib/github');

describe('run', (): void => {
  beforeEach(() => {
    github.context.payload = { pull_request: { number: fakePRNumber } }; // Ensure the mock context is correct
  });

  test('fully-mocked recreating a comment happy path', async (): Promise<void> => {
    const fakeToken = 'github-token-123456';
    const fakeConfigPath = 'foo/config-file.yml';
    const fakeConfig = 'comment:\n'
      + '  on-update: recreate\n'
      + '  header: Hello {{name}}!\n'
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

    (core.getInput as jest.Mock).mockImplementation((argument: string): string | null => {
      if (argument === 'github-token') {
        return fakeToken;
      }

      if (argument === 'config-file') {
        return 'foo/config-file.yml';
      }

      if (argument === 'template-variables') {
        return '{"name": "Bob"}';
      }

      return null;
    });

    const previousComment = {
      created_at: '2020-01-03',
      body: comment.commentMetadata(['snippet3']),
      url: 'previous-comment-url',
    };

    const existingPRComments = [
      { created_at: '2020-01-02' },
      previousComment,
      { created_at: '2020-01-01' },
    ];

    const commentBody = `${'Hello Bob!\n\n'
      + 'This is snippet 1\n\n'
    + 'This is snippet 3\n\n'
    + 'Bye!\n\n'}${
      comment.commentMetadata(['snippet1', 'snippet3'])}`;

    (localGithub.getChangedFiles as jest.Mock).mockResolvedValue(['static/foo.html', 'README.md', 'static/foo.css']);
    (localGithub.getFileContent as jest.Mock).mockResolvedValue(fakeConfig);
    (localGithub.getComments as jest.Mock).mockResolvedValue(existingPRComments);

    await run();

    expect(github.getOctokit).toHaveBeenCalledTimes(1);
    expect((github.getOctokit as jest.Mock).mock.calls[0][0]).toEqual(fakeToken);

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
