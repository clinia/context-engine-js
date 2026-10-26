# Contributing

The code is open. The project is not open to contributions.

**Bug reports and ideas are welcome and read. Pull requests cannot be merged here by anyone.** Everything below is best-effort: this client is free and maintained alongside Clinia's product work, so nothing here commits us to respond, triage or fix on any timeframe.

## Never include patient data

Do not put patient data, protected health information, credentials, tokens, workspace identifiers or internal hostnames in an issue, a screenshot or a pasted log. This applies even when redacted, and even to your own test data if it came from a real record. Reproduce with synthetic data instead.

If you've already posted something you shouldn't have, email <security@clinia.com> instead of just deleting it. Deleted content can persist in caches, notification emails and forks.

## Where to take things

| You have                                     | Go here                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| A bug in the client itself                   | [Issues](../../issues), using the bug template                                                     |
| An idea for the client                       | [Issues](../../issues), as a blank description of what you need                                    |
| A workspace, credential, ingest or API error | <support@clinia.com>. These happen on the service side and can't be diagnosed from this repository |
| A security vulnerability                     | [`SECURITY.md`](SECURITY.md), never a public issue                                                 |

Most misfiled reports belong in the third row. "My ingest failed" or "I get a 401" is almost always the engine or your workspace, not this client. The client sends requests and returns what the API answers.

## Why there are no pull requests

This repository publishes each tagged release of the JavaScript client. The release job replaces `main` wholesale, and the branch rules admit no other writer, so a pull request opened here can't be merged by you or by us. The git history has one commit per release for the same reason.

A pull request opened here will most likely be closed with a pointer to this file. That isn't a rejection of the idea: describe the change in an issue instead.

By submitting a patch or a code suggestion in an issue, you agree it is licensed under Apache-2.0 in accordance with Section 5 of [`LICENSE`](LICENSE). There is no CLA to sign.

## What a good report looks like

- **Say which version.** The client is versioned in lockstep with the engine, so the version tells us which API behaviour you saw. "Latest" doesn't.
- **Include the request and the response status.** Redact tokens and workspace identifiers first.
- **Separate what you saw from what you concluded.**
- **One report per problem.**

## If a fix happens

Any fix is made upstream and appears here in a later release. You can't watch a fix develop, since there's no public branch or review thread. A resolved issue is resolved against a release: "fixed in vX.Y.Z", pointing at the tag and its entry in the [changelog](https://docs.clinia.com/changelog).

There's no `CHANGELOG.md` in this repository. The changelog at <https://docs.clinia.com/changelog> covers the engine and its clients together, one entry per version, written by hand.

## Working on the code locally

Fork it, run it, take it apart. That's what the licence is for. Before you judge whether a change of yours is sound:

```sh
pnpm install
pnpm build
pnpm typecheck
pnpm test
```

The models and resource modules are generated from the Context Engine OpenAPI spec on each release, so a change there belongs in an issue rather than a patch.

## Conduct

[`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) applies to Issues and every other space attached to this repository.
