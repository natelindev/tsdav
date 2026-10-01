# Website

This website is built using [Docusaurus 3](https://docusaurus.io/), a modern static website generator.

## Installation

```console
pnpm install
```

## Local Development

```console
pnpm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```console
pnpm build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

```console
GIT_USER=<Your GitHub username> USE_SSH=true pnpm deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

Run `pnpm test` and `pnpm typecheck` here before building. The repository root also provides
`pnpm test:examples`, `pnpm test:consumer`, and `pnpm check:dependencies`.

The Knip configuration retains Docusaurus type packages required by the inherited TypeScript
configuration, React Router types used by those aliases, and the virtual `@docusaurus/router` module.
