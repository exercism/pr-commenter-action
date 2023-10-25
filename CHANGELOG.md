# Changelog

## Unreleased

## 1.5.1 (2023-10-25)

- Bump Node version to 20.

## 1.5.0 (2023-09-14)

- Add support for using a remote config-file (stored in another GitHub repository).

## 1.4.0 (2022-12-16)

- Add a new config option `.comment.on-create`.
- Add support for Mustache templates in the config option `.comment.on-update`.

## 1.3.1 (2022-11-25)

- Bump Node version to 16.

## 1.3.0 (2021-09-12)

- Add support for Mustache templates in snippet ids. This allows more control over when a comment will be recreated. 
- When looking for a previous comment made by this action, do not filter out non-bot users. This allows the action to correctly update or recreate comments when used with a token belonging to a real user.

## 1.2.0 (2021-07-31)

- Add support for Mustache templates in comments.

## 1.1.0 (2021-04-12)

- Add a new config option `.comment.glob-options` which forwards options to the glob matching library. This allows for example to turn off case-sensitivity of the globs or also match hidden files and directories with `**`. 

## 1.0.0 (2021-04-11)

- Initial release
