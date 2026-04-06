# Blizt

Blizt (pronounced "Blizt") is a tiny Node.js web engine that creates and builds static HTML sites with its own `.bs` page format.

## Install

```bash
npm install -g blizt
```

For local testing from the repo on Windows, `npm install -g .` may try to symlink the project directory and fail with `EISDIR`. Use a tarball install instead:

```bash
npm pack
npm install -g .\blizt-0.1.0.tgz
```

You can also run it with `npx` after publishing:

```bash
npx blizt create my-site
```

## Commands

```bash
blizt create my-site
blizt build
blizt serve production
blizt serve dev
blizt watch
blizt clean
blizt templates
blizt info
```

## What `create` makes

`blizt create` generates a project with this shape:

```text
my-site/
  blizt.config.json
  package.json
  src/
    pages/
      index.bs
      about.bs
    public/
      robots.txt
    styles.css
```

## How the engine works

- Pages in `src/pages` can be `.bs` or `.html`
- Every page becomes an `.html` file in `dist`
- `src/public` is copied straight into `dist`
- `src/styles.css` is copied to `dist/styles.css`
- `serve production` serves the built site
- `serve dev` rebuilds before requests
- `watch` rebuilds on source changes

## `.bs` format

Use metadata lines at the top, then simple content blocks:

```text
@title Home
@description Fast pages with Blizt

h1: Build fast
p: Write pages in the Blizt Site format.
li: First point
li: Second point
quote: Keep the syntax tiny.
```

Inline helpers:

- `[code:dist]`
- `[strong:important]`
- `[em:subtle]`
- `[link:Docs|/about.html]`
- `[br]`

## Command ideas

- `blizt new page contact`
- `blizt deploy`
- `blizt lint`
- `blizt plugin add sitemap`

## Example workflow

```bash
npx blizt create my-site
cd my-site
npx blizt build
npx blizt serve dev
```
