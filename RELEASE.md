# How to make a release

1. Update the version in `CHANGELOG.md` and `package.json`.
2. Make a build with `npm run build`. It should produce a new `dist/index.js` file. It needs to be committed in.
3. Commit the above changes and tag the release with `git commit -m 'vX.Y.Z'`, `git tag -a -m 'vX.Y.Z'`, `git push --follow-tags`.
