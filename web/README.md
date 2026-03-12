# ClawCraft Next/Desktop

Next.js App Router + React + Tailwind desktop/web client.

## Package managers

This project supports both `npm` and `bun`.

Install dependencies with either:

```bash
npm install
```

or:

```bash
bun install
```

The repo keeps both lockfiles:

- `package-lock.json`
- `bun.lock`

## Web dev

```bash
npm run dev
```

or:

```bash
bun run dev
```

## Electron dev

```bash
npm run dev:desktop
```

or:

```bash
bun run dev:desktop
```

This starts Next.js and launches Electron against the dev server on `http://127.0.0.1:3000`.

## Web build

```bash
npm run build
```

or:

```bash
bun run build
```

## Type check

```bash
npm run typecheck
```

or:

```bash
bun run typecheck
```

## Desktop package

```bash
npm run build:desktop
```

or:

```bash
bun run build:desktop
```

Desktop artifacts are emitted to `release/`.

## Desktop runtime files

When running the packaged Electron app, ClawCraft creates:

- a desktop config file for Gateway settings
- a local resources directory for imported assets
- a desktop log file

These paths are shown in the in-app side panel and can be opened directly from the desktop UI.
