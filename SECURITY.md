# Security Policy

## Reporting a vulnerability

Email **<security@clinia.com>**. Do not open a public issue or pull request for a suspected vulnerability.

Include the affected version, what an attacker can do, and the steps to reproduce it. A proof of concept helps, and so does telling us what you're unsure about.

**Do not include patient data or protected health information in a report**, real or derived from a real record. If you found a live credential or token, tell us where it is instead of pasting it.

You can write in English or French.

## What to expect

Reports are read and handled on a best-effort basis. This client is free and maintained alongside Clinia's product work, so this policy carries no response-time commitment, no service level, and no undertaking that a report is investigated or fixed. The disclaimer in [`LICENSE`](LICENSE) applies to this policy too.

We'd appreciate a chance to release a fix before you publish details, though that is a request, not a condition. There is no bug bounty programme.

## Scope

**In scope:** the `@clinia/context-engine-js` package: request handling, the OAuth client-credentials flow, token caching and its dependency surface as declared here.

**Out of scope for this repository:** the hosted Clinia Context Engine, the workspace API, the Clinia Console and the authorization server. Report those to the same address; they're handled under Clinia's product security process, so say which you believe you've found.

## Versions

Only the most recent release is looked at. A fix lands in a new release, and nothing is backported. The client is versioned in lockstep with the engine, so upgrading is the only path forward.

## Using the client safely

- Keep the OAuth client secret on the server side. Never ship it in a browser bundle or a mobile app.
- Scope credentials to what you need: read-only unless you ingest data or create patients.
