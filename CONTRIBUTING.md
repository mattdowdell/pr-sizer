# Contributing

This repository is a [composite GitHub action][1], with all logic defined in JavaScript using
[`actions/github-script`][2]. This allows the JavaScript ecosystem for GutHub actions to be
leveraged, without having to fully engage with the complexities of the JavaScript build system.
However, it does mean that some dependency versions are locked to those bundled with
`actions/github-script`.

[1]: https://docs.github.com/en/actions/tutorials/create-actions/create-a-composite-action
[2]: https://github.com/actions/github-script

## Reporting Issues

Before submitting a new issue, please search for an existing or similar issue. If found, add your
comments or observations there instead of creating a new issue.

## Pull Requests

Pull requests are always welcome and very much appreciated. However, there are some lightweight
guidelines below to make reviewing easier, faster, smoother, and more consistent.

If a pull request has been waiting too long for a review, please tag the reviewer to draw attention
to it.

### Titles

Pull request titles should be a short summary of the change. All commits in the pull request are
squashed on merge, with the PR title and description being used for the `main` branch commit. Pull
request titles will also be used to create release notes.

### Descriptions

Pull request descriptions should fill out the provided template, replacing the placeholder text.

Please ensure the rationale of the change is included, including the decision making process behind
it. This can be particularly useful if the decision needs to be revisited in the weeks or months
after the change was originally made.

If the template was accidentally deleted, it can be found [here][3].

[3]: ./.github/PULL_REQUEST_TEMPLATE.md

### Size

Ideally, a pull request will focus on a single change. This helps reviewers avoid context switching
in a single review. If the pull request description includes the word "also", it may be worth
splitting the change into 2 or more pull requests. If you are unsure, please ask the reviewers
before splitting.

Pull requests are labelled according to size. Ideally a change will be categorised as small or
medium. If the pull request is categorised as large, extra-large or extra-extra-large, reviewers may
ask that it be split up. However, larger pull requests may still be accepted if there is no good
place to split the change.

## Development

### JavaScript

To improve the consistency and quality of the JavaScript code, [Prettier][4] and [ESLint][5] are run
on all pull requests. To run them locally, [install Bun][6] and run:

```sh
bunx prettier . --write
bunx eslint .
```

[4]: https://prettier.io/
[5]: https://eslint.org/
[6]: https://bun.com/docs/installation

### Actions

To improve the consistency and security of the GitHub action and supporting workflows, [yamlfmt][7]
and [Zizmor][8] are run on all pull requests. To run them locally:

```sh
yamlfmt .
zizmor --pedantic .
```

[7]: https://github.com/google/yamlfmt
[8]: https://docs.zizmor.sh/installation/
