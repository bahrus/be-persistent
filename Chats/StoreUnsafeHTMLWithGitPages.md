# Store Unsafe HTML With Git Pages

## Bruce's Ask

Now that we've created [an additional](https://github.com/bahrus/fifteenth#github-pages-githubpages) persistence mechanism, what wiring is needed in be-persistent to support that, if any?

Can you please add that additional wiring and add mention the option in all the appropriate places like README.md.  Please add your implementation notes below.

## Claude's Implementation Notes

**Short answer to "what wiring is needed": none, in be-persistent's own code.**
`Binder.js` (`Binder.js:84-108`) hands every USL straight to `fifteenth`'s
`get`/`set`, which consult `fifteenth`'s shared `protocolRegistry` for any
scheme beyond the built-in browser stores — the exact same path `gist://`
already goes through. There is nothing in `Binder` or `be-persistent.js` that
special-cases a protocol name (the one place that *does* — the
`locationHash://` + raw-`innerHTML` block, `Binder.js:70-77` — only fires for
`locationHash`, since that's the one store whose content sits in a shareable
URL; a remote store like `gist://`/`githubpages://` never needed it). So
`githubpages://` "just works" through `Binder` the moment something registers
it — the actual work was making sure that something is available, then
proving it and documenting it.

### The one real piece of "wiring": the `fifteenth` dependency

`be-persistent/node_modules/fifteenth` was a real npm install of `fifteenth@0.0.7`
— published *before* `githubpages://` existed, so `fifteenth/githubpages.js`
simply wasn't there. Checked the registry before assuming I'd need to hack
around it:

```
curl https://registry.npmjs.org/fifteenth/latest → version 0.0.8
```

`0.0.8` is already published and does contain the finished `githubpages.js`
(verified by downloading the tarball and grepping for the `readVia ?? 'api'`
default and the `cache: 'no-store'` fixes from the fifteenth chat — both
present). So this was a plain dependency bump, not a vendoring hack:

- `package.json` / `package-lock.json`: `"fifteenth": "0.0.7"` → `"0.0.8"`
  (exact pin, matching this repo's existing convention — `npm install fifteenth@0.0.8`
  initially rewrote it to `^0.0.8`; re-pinned and re-ran `npm install` to keep
  the lockfile in sync).
- `node_modules/fifteenth` now genuinely carries `githubpages.ts`/`.js`, its
  `package.json` `exports` entry, and the `index.ts`/`.js` re-exports — nothing
  copied by hand.

### New files

- **`githubPagesTokenPanel.html`** (new, parity with `gistTokenPanel.html`) —
  the one real difference from the gist panel: a `githubpages://` USL bakes
  the **owner** (and, for a non-default repo, a `repo:<name>` segment)
  straight into the string — there's no server-assigned id to hide it behind
  the way gist's alias→id store does. So this panel persists `owner` and
  `repo` to `localStorage` alongside the token
  (`fifteenthGitHubPagesOwner` / `…Repo` / `…Token` — the token key matches
  `fifteenth`'s own `demos/githubpages.html`, so a token pasted there carries
  over). Exposes `window.githubPagesOwner()` / `…Repo()` / `…Token()` and a
  `github-pages-config-change` event.
- **`demo/StoreToGitHubPages.html`** (new, parity with `StoreToGist.html`) —
  two `💾`ed fields at `be-persistent-demo/greeting.json` and
  `…/notes.json`. Folder-organized paths in a real repo, unlike gist's two
  files crammed into one flat gist — the original complaint that started the
  `githubpages://` design chat.
- **`demo/StoreUnsafeHTMLWithGitPages.html`** (new, parity with
  `StoreUnsafeHTMLWithGist.html`) — same `of unsanitizedInnerHTML` handshake,
  markup at `be-persistent-demo/markup.html`. Section 5 swaps gist's
  "raw CDN, no token" read demo for the githubpages equivalent: reading any
  public `githubpages://` path needs no token either, demonstrated against
  this very repo's own `githubpages://bahrus/repo:be-persistent/README.md`.
  Also has the `?readVia=raw` toggle the gist demo has, updated for the new
  default (`'api'` is now the baseline — see the fifteenth chat — so this one
  opts *into* `'raw'` instead of out of it).

**Why `document.write` instead of a static attribute:** unlike every existing
demo (`gist://`'s alias, `locationHash://`'s key, …), the owner has to be known
*before* the `💾` markup can even be written — there's no "create with a
placeholder, fix it up later" for the address itself. Both new demo pages
render a `<script>` right where the persisted field(s) go that reads
`window.githubPagesOwner()`/`…Repo()` and either `document.write`s the real
`💾` markup (classic inline script → runs synchronously during parsing, well
before the deferred `be-hive/be-hive.js` module hydrates anything) or a
"configure the owner above, then reload" placeholder. Verified both branches
render correctly and throw no console errors (a throwaway Playwright script,
not committed) before writing this up.

### Tests

**`tests/StoreToGitHubPages.html`/`.spec.mjs`** and
**`tests/StoreUnsafeHTMLWithGitPages.html`/`.spec.mjs`** (new, parity with the
gist wiring tests) — stub `fetch` for `api.github.com/repos/.../contents/...`
(and the `GET /repos/<owner>/<repo>` default-branch lookup) instead of
`/gists`, same "no real GitHub call, deterministic" approach already used for
`gist://`. Full suite: **9/9 Playwright green** (5 pre-existing + `gist://`'s 2
+ `githubpages://`'s 2 new ones).

One self-caught bug worth naming: my first cut of `StoreToGitHubPages.html`'s
"empty field wrote nothing" assertion matched *any* call touching that file's
path, not just a `PUT` — and hydration's own reconciliation `GET`s the store
value for every rule, including the blank one, so the test failed against
correct behavior. Restricted the check to `method === 'PUT'` (mirroring how
the gist test already scoped its own check to `method === 'POST'`) and it went
green.

### README.md

- New **"Store to GitHub Pages"** section, right after "Store to a GitHub
  Gist" — same shape (opt-in call, one-line example, addressing note, demo
  link), explicitly calling out the no-alias/id-store difference and the
  `readVia: 'api'` default.
- **"Persist unsafe innerHTML"** section now shows the `githubpages://` form
  alongside the existing `gist://` one, linking the new demo.
