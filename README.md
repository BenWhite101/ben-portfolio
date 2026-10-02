# ben.frontend portfolio

Static site built with [Eleventy](https://www.11ty.dev/) (v3) and Sass.

## Structure

- `index.html` — page content (front matter sets `layout`, `title`, `description`)
- `_includes/` — `layout.html` plus the `head`, `header`, `footer` and `typepick` partials (Liquid)
- `assets/scss/style.scss` — **edit this**; it compiles to `assets/css/style.css` on every build
- `assets/js/main.js` — site scripts
- `assets/img/`, `assets/fonts/` — copied straight through to `_site/` if you add them

## Commands

```sh
npm install      # first time only
npm start        # dev server with live reload at http://localhost:8080
npm run build    # build to _site/
```

## Netlify

`netlify.toml` builds with `npx @11ty/eleventy` and publishes `_site`.
