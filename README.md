# ClientRescue — free client-message generator

A single-page, dependency-free web tool that writes the message you have been
avoiding: a late delivery, an unpaid invoice, a scope-creep request, a free
revision demand, or a rescheduled appointment.

- **5 situations × 3 tones (calm / firm / short) × 2 languages (English, 한국어) = 30 templates**
- Runs 100% in the browser. No server, no API keys, no analytics, no cookies,
  no fonts or scripts fetched from a CDN. It works from a USB stick or offline.
- Copy buttons write straight to the clipboard (with a `document.execCommand`
  fallback for `file://` contexts, where the Clipboard API is unavailable).

## Files

```
site/
  index.html      markup + copy that does not change per language
  styles.css      all styling, self-hosted variable fonts in fonts/
  app.js          UI strings, 30 templates, template engine, DOM wiring
  fonts/          Inter, Fraunces, JetBrains Mono (Latin subsets, woff2)
  favicon.svg     the little "C" mark
  og-image.png    social preview image (1200×630)
  .nojekyll       tells GitHub Pages not to run Jekyll
```

`app.js` exports `CR.generate({scenario, tone, lang, client, project, amount, days, date, sender})`,
so the templates can be reused from any script without the UI. Every field is
optional; the engine degrades to a sentence that still reads correctly.

## Run it locally

```bash
# any static file server, or just open the file
python3 -m http.server 8000 --directory site
# then open http://localhost:8000
```

Opening `site/index.html` directly with a `file://` URL also works.

## Publish on GitHub Pages (free, 2 minutes)

1. Create a public repository named `clientrescue` (or `<username>.github.io`).
2. Copy the **contents** of `site/` to the repository root:
   ```bash
   cd site && git init && git add . && git commit -m "ClientRescue" \
     && git branch -M main \
     && git remote add origin https://github.com/<username>/clientrescue.git \
     && git push -u origin main
   ```
3. Repository → **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
4. In a minute or two the tool is live at
   `https://<username>.github.io/clientrescue/`.

If you name the repo `<username>.github.io` instead, the site lands at
`https://<username>.github.io/` with no subfolder.

## The Gumroad link

The bottom CTA card in `index.html` points at the live product page:

```html
<!-- index.html, the CTA card -->
<a class="btn cta-btn" href="https://fatheroar.gumroad.com/l/awkward-client-rescue" target="_blank" rel="noopener" ...>
```

That is the only outbound link on the page; change the `href` if the product
moves. The `id="gumroad-playbook"` on the card is just an in-page anchor.

## Editing the copy

- UI labels: `UI.en` / `UI.ko` at the top of `app.js`.
- Templates: `SCENARIOS[i].tpl[lang][tone].body`, an array of paragraphs.
  A paragraph is either a plain string or `{ if: 'days', text: '…' }`, which is
  shown only when that field was filled. `{ if: 'date', text: '…', alt: '…' }`
  shows `alt` when the date is empty.
- Placeholders: `{client} {project} {amount} {days} {date} {sender}`.
  Empty brackets such as `({amount})` disappear automatically, so a sentence
  with an optional amount still reads correctly when the amount is blank.
- After editing, run the tests (below) so no template regresses.

## Tests

This repository holds only the published site, so the test scripts are not part
of it. They live in the development package next to this folder and are run from
there:

```bash
node tests/verify.js            # 542 assertions over all 30 templates
python3 tests/run_verify.py     # same file, executed with an embedded JS engine
LD_LIBRARY_PATH=… python3 tests/site_check.py   # headless-browser UI check
```

Nothing here needs them to run: `app.js` is standalone and the site works from a
plain static server.

`verify.js` runs the real `app.js` over every scenario × tone × language with
full input, empty input, one-field-at-a-time input and hostile input, and fails
on `undefined`, `null`, `NaN`, unresolved `{placeholders}`, double spaces,
empty brackets, duplicate output, or a tone that is not actually shorter.

`site_check.py` loads `index.html` in headless Chromium and checks 68 things:
no console errors, fonts loaded, all 5 scenarios and 3 tones produce text in
both languages, the copy button and toast work, the example and clear buttons
work, the `mailto:` link is built, and no layout overflows or overlaps at
1440 / 1024 / 768 / 390 px. Screenshots land in `../verification/screenshots/`.

## Licence

The code and the copy are yours to use, edit and sell.
