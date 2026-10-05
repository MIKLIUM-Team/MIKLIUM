# AI Agent Guidelines

This document contains rules and preferences for AI assistants working on the MIKLIUM repository.

## Rules

- **Relative Paths**: Always prefer relative links and paths when possible, rather than absolute URLs or repository-root-relative links (unless explicitly required for web deployment contexts).
- **Language**: All code, comments, documentation, commit messages, and API messages must be written in English only.

## Sources Of Truth

Read these before changing code, docs, or frontend:

- [Project Structure](../STRUCTURE.md) — repository layout, API folder anatomy, file templates, routing, CI/CD, naming conventions.
- [Contributing](../CONTRIBUTING.md) — mandatory testing, branch and pull request flow.
- [Design Guidelines](https://miklium-team.github.io/MIKLIUM/docs/DESIGN_GUIDELINES.html) and its source [DESIGN_GUIDELINES.html](../DESIGN_GUIDELINES.html) with [webpage/css/style.css](../../webpage/css/style.css) — design tokens, components, and ready-made blocks. Do not use hardcoded colors or fonts; use CSS variables and the `.glass-card` system.

## API Development

- One API per folder under `api/` using `kebab-case` (for example `shortcut-info`).
- Every API folder must contain `index.js` / `index.py`, `README.md`, and `config.toml`.
- Every JSON response must contain a boolean `success` field: `{ "success": true, ... }` or `{ "success": false, "error": "..." }`.
- Every handler must set `Access-Control-Allow-Origin: *` and answer `OPTIONS` preflight requests.
- JSON response keys use `camelCase` (for example `maxResults`, `includeInfo`).
- `config.toml` must define both `[playground]` (playground form) and `[test]` (CI tests) sections, with at least one success case and one error case.
- No API keys or authentication for users; keep APIs free and open.
- Test every change locally before opening a pull request.

## Documentation

- Each `api/*/README.md` is the single source of API documentation. Follow the template in [Project Structure](../STRUCTURE.md): `About`, `Request Body` with `GET` and `POST`, `Code Examples` (JavaScript, Python, cURL), `API Responses` (`Success`, `Error`), and `What Services Does This API Use?` when third-party services are used.
- Keep the `Navigation` section in sync with all headings and anchors.
- Never edit generated files manually: `docs/APIDOCS.md` is concatenated by CI from all `api/*/README.md` files, and marked sections of the root `README.md` are generated from API and featured-project data. Editing them by hand will be overwritten.

## Frontend Development

- Follow the HTML page template in [Project Structure](../STRUCTURE.md): global `<nav>` with desktop and mobile blocks, `data-page` highlighting, mobile toggle script, and `<main>` layout with `calc(var(--nav-height) + 48px)` top padding.
- Use CSS variables from `webpage/css/style.css` for colors, typography, spacing, and radii. Use standard components (badges, alerts, code blocks, forms) from the Design Guidelines.
- Keep pages responsive; grids collapse to one column under `700px`.
