# Store Unsafe HTML With Gist

## Bruce's Ask

Please create an equivalent of [StoreUnsafeHTML.html](../demo/StoreUnsafeHTML.html) but using gist.

Please add your implementation notes below.

---

## Implementation Notes

### Status

Done. `npm run test` green — 7 specs, including a new `StoreUnsafeHTMLWithGist`
(stubbed `fetch`) proving the `securitypolicyviolation` opt-in still gates the
write *and* that, with the opt-in, the element's raw `innerHTML` reaches
`POST /gists`. The no-token demo load is quiet (verified — no console error, no
unhandled rejection).

### 1 · One small `Binder.js` change was required

`of unsanitizedInnerHTML` did **not** work with `gist://` as written. The
opt-in handshake (dispatch `securitypolicyviolation` → require
`event.anythingGoes` → remap `unsanitizedInnerHTML` to the real `innerHTML`
property) was nested inside `if(staticUSL.startsWith('locationHash://'))`. For
any other protocol `localProp` stayed the string `'unsanitizedInnerHTML'` —
which is not a DOM property, so hydration read `undefined` and every child edit
fell through to `throw 'NI'`.

Restructured so the `unsanitizedInnerHTML` opt-in runs for **any** protocol,
and only the "raw `innerHTML`/`outerHTML` straight into the URL hash is blocked"
rule stays `locationHash://`-specific:

```js
if(localProp === 'unsanitizedInnerHTML'){
    const evt = new AnythingGoesEvent('securitypolicyviolation');
    enhancedElement.dispatchEvent(evt);
    if(!evt.anythingGoes){ throw 403; }
    localProp = 'innerHTML';
} else if(
    staticUSL.startsWith('locationHash://')
    && (localProp === 'innerHTML' || localProp === 'outerHTML')
){
    throw 'NI';
}
```

Behavior for `locationHash://` is unchanged (the `Nudge` spec and the existing
`StoreUnsafeHTML.html` still work); `of innerHTML via indexedDB://…` /
`sessionStorage://…` (o2h-view, onunload) are untouched — they never entered the
old branch. README "Persist unsafe innerHTML" section updated to say the opt-in
is storage-agnostic, with a `gist://` example.

### 2 · Demo — `demo/StoreUnsafeHTMLWithGist.html`

The `locationHash` original stows raw markup *in the URL*; this one stows it in a
secret gist and keeps only the `#gistID:…` pointer in the URL. Structure mirrors
`demo/StoreToGist.html`:

- `configureGist({ getToken: () => localStorage.getItem('fifteenthGistToken') })`
  in a module script before the `be-hive` import (registry populated before
  hydration). Same token key as `fifteenth/demos/gist.html`, so a token pasted
  there on `http://localhost:8000` carries over. Collapsible token panel with the
  full Route A / Route B walkthrough, auto-collapsing once a token is present.
- The persisted element:
  ```html
  <div id="editor" contenteditable
      💾="of unsanitizedInnerHTML via gist://unsafe-html-demo/markup.html on focusout."
      onsecuritypolicyviolation="event.anythingGoes = true"></div>
  ```
- **`on focusout`, not the default `input`** — a contenteditable fires `input`
  per keystroke, which would be one gist `PATCH` per key; `focusout` bubbles
  (unlike `blur`) so the div's listener catches it and writes once when focus
  leaves. Noted on the page.
- **The region starts empty.** `innerHTML` is `''` on load, so `breakTie` does
  nothing and there's no create-on-load — matches `StoreToGist.html`'s
  "empty field writes nothing". (Kept `contenteditable` on the div itself rather
  than a seed `<span>` child precisely so `innerHTML` can be `''`; a
  `:empty::before` gives the placeholder.) The gist is created on the first
  `focusout` after you type.
- Belt-and-braces: an `unhandledrejection` listener turns a failed gist write
  (no token → 401) into a visible "paste a token, then edit again" line instead
  of a bare console error — be-persistent doesn't await the Binder's write
  promise.
- `gist://<alias>` uses an explicit short alias (`unsafe-html-demo`), not
  `{autoGenId}` — `{autoGenId}` works but produces a huge alias and a huge
  `#gistID:` hash entry.

### 3 · Files

```
Binder.js                                     unsanitizedInnerHTML opt-in made protocol-agnostic
README.md                                     "Persist unsafe innerHTML" — storage-agnostic note + gist example
demo/StoreUnsafeHTMLWithGist.html             new
tests/StoreUnsafeHTMLWithGist.html            new (stubbed api.github.com)
tests/StoreUnsafeHTMLWithGist.spec.mjs        new
```

## Bruce's Response I

Can you please extract this HTML:

```html
<details id="tokenSection" class="card">
        <summary id="tokenSummary">1 · Get a GitHub token with the <code>gist</code> scope</summary>
        ...
</details>
```

to a shareable html file, and use the same server side include approach used for import maps?  Make sure this html file is also include with the node publish (it probably is by default).

More importantly, can you find a way to make either fifteenth, or at least be-persistent access the persisted html using:

[markup.html](https://gist.githubusercontent.com/bahrus/78ec8e0827f6858ad9060f88f22576a0/raw/0c40975a1055e0b0b543b212e73010781577c0b7/markup.html)

rather than 
https://api.github.com/gists/78ec8e0827f6858ad9060f88f22576a0

?

I want to be able to evolve to being able to use import maps and specify a bare import specifier:

bahrus/78ec8e0827f6858ad9060f88f22576a0/raw/0c40975a1055e0b0b543b212e73010781577c0b7/markup.html

---

## Response to Response I

Both done. be-persistent `npm test` green (7); fifteenth `npm test` green (9,
across Chromium/Firefox/WebKit) with the new raw-form assertions.

### Part 1 — token panel extracted to an SSI include

New **`be-persistent/gistTokenPanel.html`** (package root, next to
`imports.html`). It carries the collapsible `#tokenSection` card *and* a small
self-initializing `<script>` that owns `localStorage['fifteenthGistToken']`
(save / clear / state / auto-collapse) plus a scoped `<style>` so the fragment
looks right dropped into any page. Host-page hooks: `window.gistToken()` and a
`gist-token-change` event.

`demo/StoreToGist.html` and `demo/StoreUnsafeHTMLWithGist.html` now just do:

```html
<!-- #include virtual="/gistTokenPanel.html" -->
```

and their bottom scripts lost all the duplicated token logic (kept only the
gist-id line + demo-specific bits).

- **Publish:** `package.json` `"files": ["*.*"]` already globs root-level dotted
  files, so `gistTokenPanel.html` ships with `npm publish` exactly like
  `imports.html`. (The `demo/` and `tests/` dirs are not published — only
  referenced from GitHub — so nothing else needed.)
- **spa-ssi gotcha found & avoided:** `processIncludes` rescans its own spliced
  output and loops forever if the spliced file contains another
  `#include virtual="…"` directive. My first draft had the literal directive in
  the panel's doc-comment as a usage example → server hung. Reworded the comment
  to describe the directive without the matchable syntax; added a note in the
  file. Both demos now serve `200` fast with the panel spliced exactly once
  (verified).

### Part 2 — read via the raw CDN URL: `gist://<owner>/<id>/raw[/<sha>]/<file>`

Added to **`fifteenth/gist.js`** (`gist.ts` + rebuilt). A key whose 3rd
`/`-segment is literally `raw` is treated as the tail of a
`gist.githubusercontent.com` URL:

| USL | effect |
|---|---|
| `get('gist://bahrus/78ec…/raw/0c40…/markup.html')` | `GET https://gist.githubusercontent.com/bahrus/78ec…/raw/0c40…/markup.html` — **no token, no `/gists` JSON envelope, no 5000/h API limit**; `<sha>` pins an immutable revision |
| `get('…/raw/markup.html')` (no sha) | same, latest revision |
| `set('…/raw/markup.html', v)` (no sha) | `PATCH`es the gist via `api.github.com` as usual (needs `getToken`) — read cheap, write normal |
| `set('…/raw/<sha>/markup.html', v)` | throws — can't write a pinned revision |
| chain (`…/markup.html?.a?.b`) | resolves against the raw read |
| 404 | `null` (matches `get`'s contract) |

New config: `configureGist({ rawBaseURL })` (default
`https://gist.githubusercontent.com`) for a mirror/proxy. Verified live: the
`bahrus/78ec…` raw URL returns `200` with `Access-Control-Allow-Origin: *`, so
the browser reads it cross-origin with **no proxy**.

This is the exact shape of the bare specifier you want
(`<owner>/<id>/raw/<sha>/<file>` = the raw path minus the CDN origin); a future
import map maps the prefix and `get()` / `import.meta.resolve` turns the bare
form into the URL. Not built now — no redesign needed when it is.

**Demo of it:** `StoreUnsafeHTMLWithGist.html` gained a *“4 · Load markup from a
raw gist URL”* card — an input pre-filled with your `bahrus/78ec…` USL and a
button that does `get(usl)` (through `fifteenth`, no `api.github.com`) and drops
the result into the editable region; if a token is present it then persists it
to the demo's own gist.

### Heads-up: vendored `fifteenth` is stale

`be-persistent/node_modules/fifteenth` is `0.0.4` — post-jsonblob-removal, but
*before* today's raw-form addition (`grep readRaw node_modules/fifteenth/gist.js`
→ nothing). `fifteenth` is a plain npm dep, not a link, so:

- The be-persistent test suite is unaffected (7/7 green — none of it needs the
  raw form).
- The demo's **“4 · Load markup from a raw gist URL”** card won't work when
  served locally until the dep is refreshed — publish `fifteenth` (→ `0.0.5`)
  and `npm install` here, or `npm link ../fifteenth` for local dev. Until then
  the stale handler treats the raw USL as an alias and the card reports
  "not found (404)".

### Files

```
fifteenth/gist.ts, gist.js                 raw-CDN read form + rawBaseURL config
fifteenth/README.md                        gist section: raw form documented
fifteenth/tests/test-gist.html             stub gist.githubusercontent.com; 6 raw-form assertions

be-persistent/gistTokenPanel.html          new — shareable SSI-include token panel (markup + script + scoped style)
be-persistent/demo/StoreToGist.html        inline panel → #include; token JS removed
be-persistent/demo/StoreUnsafeHTMLWithGist.html   same, + "load from raw gist URL" card
```

## Bruce's Response II

I published a new version of fifteenth ( ==> 0.0.5) and I ran npm run update, and I'm not seeing any impact.  I have a web server running, and am testing with

 http://localhost:8000/demo/StoreUnsafeHTMLWithGist.html#gistID%3Aunsafe-html-demo=071e299786874494809a2ed7412b9382

The only request I see to github is:

https://api.github.com/gists/071e299786874494809a2ed7412b9382

---

## Response to Response II

You're right — nothing changed on that page, and that's on me: what I shipped
was a *new addressing mode*, not a change to how the existing rule reads.

### Why you saw no difference

`https://api.github.com/gists/071e…` is the **alias-form** `💾` rule doing its
normal hydration read: `gist://unsafe-html-demo/markup.html` → alias resolves to
id `071e…` (from your hash) → `GET /gists/071e…`. The raw form I added
(`gist://<owner>/<id>/raw/<sha>/<file>`) only fires when *that* USL is used —
i.e. the demo's card-4 "Load markup" button, not page load. So the update was
installed correctly (`node_modules/fifteenth` is `0.0.5`, `grep readRaw
node_modules/fifteenth/gist.js` now hits); it just wasn't wired into the path
you were watching.

### The fix: `configureGist({ readVia: 'raw' })`

New option in `fifteenth/gist.js`. `readVia: 'raw'` makes ordinary **alias and
`=<id>` reads** fetch the CDN instead of the API:

```
GET https://gist.githubusercontent.com/raw/<id>/markup.html     ← readVia:'raw'
GET https://api.github.com/gists/<id>                            ← readVia:'api' (default)
```

- **Owner-less.** I found (and verified live — `200`, `Access-Control-Allow-Origin: *`)
  that GitHub serves `gist.githubusercontent.com/raw/<id>[/<sha>]/<file>` with
  **no owner segment**, so `readVia:'raw'` needs only the id it already has —
  no extra lookup for `owner.login`.
- **Writes are untouched** — always `api.github.com` (the CDN is read-only, and
  a chained write's read-modify-write still uses the fresh API GET).
- **Caveat:** `gist.githubusercontent.com` is CDN-cached, so right after an edit
  a reload can show the previous markup for a minute or two. `readVia:'api'` is
  always fresh. Documented in the module and the README.

### Demo wired up

`demo/StoreUnsafeHTMLWithGist.html` now calls
`configureGist({ …, readVia: 'raw' })` **by default**, so on your next load the
rule's read-back goes to `gist.githubusercontent.com/raw/071e…/markup.html` —
the request you were looking for. A status line under the intro says which path
is active and links to toggle; `?readVia=api` on the URL flips it back so you
can compare the two in the network tab.

### To see it here

`fifteenth` needs another publish (`0.0.5` → `0.0.6`) with this change, then
`npm run update` in be-persistent again. Until then the demo passes `readVia` to
a `0.0.5` handler that ignores it and keeps reading via the API.

### Tests / status

- `fifteenth`: 2 new `readVia:'raw'` cases (alias read → owner-less CDN url, no
  API GET; `=<id>` read → CDN; write still API; unmapped alias → null, no
  request). `npm test` green — 9 specs ×3 browsers, 20 gist assertions.
- `be-persistent`: `npm test` green — 7. Demo load verified: the read-path line
  renders and toggles, no console errors.

### Files (this round)

```
fifteenth/gist.ts, gist.js       + readVia config; readRaw() gains the owner-less form
fifteenth/README.md              readVia documented
fifteenth/tests/test-gist.html   stub serves owner-less /raw/<id>/…; 2 readVia assertions
be-persistent/demo/StoreUnsafeHTMLWithGist.html   readVia:'raw' default + ?readVia=api toggle + status line
```