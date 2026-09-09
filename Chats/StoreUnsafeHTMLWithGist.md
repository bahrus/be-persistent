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

