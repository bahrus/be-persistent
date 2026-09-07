# Demo Page With Gist

## Bruce's Ask

I've updated the fifteenth dependency, which now has support for [persistence via gists](../../fifteenth/README.md#github-gists-gist).  Note also [the demo page](../../fifteenth/demos/gist.html).

Can you please

1.  Make sure be-persistent supports the gist protocol.
2.  Create a demo page in be-persistent/demo that integrates the gist protocol support?

Can it use the same local storage token I already stored today, if I run the be-persistent demo page from the same locahost:8000 as I did when I tested gist.html above?

---

## Implementation Notes

### Status

Done. `npm run test` green — 6 specs, including a new `StoreToGist` spec (stubbed
`fetch`) that proves an element value flows through be-persistent → `fifteenth`'s
`set` → the registered `gist` writer → `POST /gists`.

### 1 · Does be-persistent already support `gist://`? Yes — no core change.

`Binder.handleEvent` (`Binder.js`) never inspects the scheme; it hands the
resolved USL straight to `fifteenth`'s `get` / `set` (lazy `import()`).  Those,
in turn, fall through to `fifteenth/protocolRegistry.js` for any scheme not in
the built-in bag:

```js
// fifteenth/get.js
const handler = protocols[protocol] ?? getProtocolReader(protocol);
// fifteenth/set.js
const registered = getProtocolWriter(protocol);
```

`gist://` is **opt-in**: `fifteenth/gist.js`'s `configureGist()` is what calls
`registerProtocol('gist', …)`.  `protocolRegistry.js` holds a module-level
`Map`, and be-persistent's import map (`imports.html`) points
`fifteenth/` at one location (`/node_modules/fifteenth/`), so the page's
`configureGist` and `Binder`'s `get`/`set` share the *same* registry instance.
One `configureGist()` call on the page is therefore the whole of "teaching
be-persistent the gist protocol" — nothing in this package had to change.

Verified: `be-persistent/node_modules/fifteenth` is `0.0.2` (has `gist.js`,
exports `configureGist`), on the same `assign-gingerly@0.0.96` as the
`fifteenth` working copy.

README gains a **"Store to a GitHub Gist"** section next to the other
`## Store to …` entries.

### 2 · Demo page — `demo/StoreToGist.html`

Same skeleton as the other `Store to …` demos (`imports.html` include, `<be-hive>`
block, `💾.json` EMC) plus:

- A `<script type=module>` that calls `configureGist({ getToken, public:false,
  description })` **placed textually before the `be-hive` import** — module
  scripts run in document order, so the registry is populated before hydration
  ever touches storage.
- Two enhanced fields writing into one secret gist, one file each:
  `💾="of value via gist://be-persistent-demo/greeting.json on change."` and the
  same for `notes.json`.  `on change` (not the default `input`) so a network
  round-trip isn't fired per keystroke.
- A token panel (paste / save / clear / status) and a "Forget gist id" button
  that clears the `#gistID:…` hash pointer.
- `idStore` left at its `locationHash` default, so the gist id rides in the URL
  and a reload reuses the same gist.

### 3 · Re-using today's token — yes, with two conditions

`localStorage` is partitioned by **origin** (scheme + host + port), not by path,
so `/demos/gist.html` and `/demo/StoreToGist.html` see the same store *iff* both
are served from `http://localhost:8000`.

1. **Same origin / port.** `npm run serve` (both repos use `spa-ssi`) takes port
   `8000` — but `getAvailablePort(8000)` falls back to another port if `8000` is
   busy.  Stop the `fifteenth` server first so the be-persistent one actually
   binds `8000`.
2. **Same key.** `demos/gist.html` stores the token under
   `localStorage['fifteenthGistToken']`.  `demo/StoreToGist.html` deliberately
   reads that exact key in its `getToken`, so a token pasted into the
   `fifteenth` demo today is picked up here with no re-paste.  (The token panel
   is still there for a fresh browser / cleared storage.)

If you serve the demo any other way (a different port, `127.0.0.1` vs
`localhost`, `file://`), it's a different origin and the token won't carry over —
just paste it again.

## Bruce's Response I

When I load page http://localhost:8000/demo/StoreToGist.html

I see the following console.loog's:

```
gist.js:133  POST https://api.github.com/gists 422 (Unprocessable Content)
createGist @ gist.js:133
await in createGist
(anonymous) @ gist.js:179
ensureId @ gist.js:182
await in ensureId
(anonymous) @ gist.js:213
Promise.then
(anonymous) @ aliasStore.js:67
write @ gist.js:203
set @ set.js:127
handleEvent @ Binder.js:92
await in handleEvent
Binder @ Binder.js:42
(anonymous) @ be-persistent.js:76
hydrate @ be-persistent.js:76
await in hydrate
executeAction @ actions.js:321
evaluateAndExecuteAction @ actions.js:161
reactionFn @ actions.js:68
processPropertyChangeInternal @ RoundaboutManager.js:120
handlePropertyChange @ RoundaboutManager.js:98
propagator.addEventListener.signal @ RoundaboutManager.js:82
set @ PropagatorSetup.js:382
assignGingerly @ assignGingerly.js:1249
roundabout @ roundabout.js:16
await in roundabout
init @ be-persistent.js:43
await in init
BePersistent @ be-persistent.js:20
get @ object-extension.js:153
handleMount @ EMCScript.js:174
await in handleMount
do @ EMCScript.js:127
#handleMatch @ MountObserver.js:613
(anonymous) @ MountObserver.js:457
#processNode @ MountObserver.js:451
observe @ MountObserver.js:332
await in observe
createObserverEntry @ RegistryMountCoordinator.js:62
await in createObserverEntry
getOrInsertObserverEntry @ RegistryMountCoordinator.js:88
value @ ElementMountExtension.js:91
mount @ EMCScript.js:100
await in mount
EvtRt @ EvtRt.js:12
EMCScriptHandler @ EMCScript.js:15
#handleMatch @ MountObserver.js:608
(anonymous) @ MountObserver.js:457
#processNode @ MountObserver.js:451
observe @ MountObserver.js:332
await in observe
value @ ElementMountExtension.js:68
#activateHandlers @ Synthesizer.js:102
await in #activateHandlers
connectedCallback @ Synthesizer.js:73
(anonymous) @ be-hive.js:4
[NEW] Explain Console errors by using Copilot in Edge: click  to explain an error. Learn moreDon’t show again
gist.js:143 Uncaught (in promise) Error: gist POST → 422 — { "message": "Validation Failed", "errors": [ { "resource": "Gist", "code": "missing_field", "field": "files" } ], "documentation_url": "https://docs.github.com/v3/gists/#create-a-gist", "status": "42
    at createGist (gist.js:143:15)
    at async gist.js:179:28
createGist @ gist.js:143
await in createGist
(anonymous) @ gist.js:179
ensureId @ gist.js:182
await in ensureId
(anonymous) @ gist.js:213
Promise.then
(anonymous) @ aliasStore.js:67
write @ gist.js:203
set @ set.js:127
handleEvent @ Binder.js:92
await in handleEvent
Binder @ Binder.js:42
(anonymous) @ be-persistent.js:76
hydrate @ be-persistent.js:76
await in hydrate
executeAction @ actions.js:321
evaluateAndExecuteAction @ actions.js:161
reactionFn @ actions.js:68
processPropertyChangeInternal @ RoundaboutManager.js:120
handlePropertyChange @ RoundaboutManager.js:98
propagator.addEventListener.signal @ RoundaboutManager.js:82
set @ PropagatorSetup.js:382
assignGingerly @ assignGingerly.js:1249
roundabout @ roundabout.js:16
await in roundabout
init @ be-persistent.js:43
await in init
BePersistent @ be-persistent.js:20
get @ object-extension.js:153
handleMount @ EMCScript.js:174
await in handleMount
do @ EMCScript.js:127
#handleMatch @ MountObserver.js:613
(anonymous) @ MountObserver.js:457
#processNode @ MountObserver.js:451
observe @ MountObserver.js:332
await in observe
createObserverEntry @ RegistryMountCoordinator.js:62
await in createObserverEntry
getOrInsertObserverEntry @ RegistryMountCoordinator.js:88
value @ ElementMountExtension.js:91
mount @ EMCScript.js:100
await in mount
EvtRt @ EvtRt.js:12
EMCScriptHandler @ EMCScript.js:15
#handleMatch @ MountObserver.js:608
(anonymous) @ MountObserver.js:457
#processNode @ MountObserver.js:451
observe @ MountObserver.js:332
await in observe
value @ ElementMountExtension.js:68
#activateHandlers @ Synthesizer.js:102
await in #activateHandlers
connectedCallback @ Synthesizer.js:73
(anonymous) @ be-hive.js:4
gist.js:133  POST https://api.github.com/gists 422 (Unprocessable Content)
createGist @ gist.js:133
await in createGist
(anonymous) @ gist.js:179
ensureId @ gist.js:182
await in ensureId
(anonymous) @ gist.js:213
Promise.then
(anonymous) @ aliasStore.js:67
write @ gist.js:203
set @ set.js:127
handleEvent @ Binder.js:92
await in handleEvent
Binder @ Binder.js:42
(anonymous) @ be-persistent.js:76
hydrate @ be-persistent.js:76
await in hydrate
executeAction @ actions.js:321
evaluateAndExecuteAction @ actions.js:161
reactionFn @ actions.js:68
processPropertyChangeInternal @ RoundaboutManager.js:120
handlePropertyChange @ RoundaboutManager.js:98
propagator.addEventListener.signal @ RoundaboutManager.js:82
set @ PropagatorSetup.js:382
assignGingerly @ assignGingerly.js:1249
roundabout @ roundabout.js:16
await in roundabout
init @ be-persistent.js:43
await in init
BePersistent @ be-persistent.js:20
get @ object-extension.js:153
handleMount @ EMCScript.js:174
await in handleMount
do @ EMCScript.js:127
#handleMatch @ MountObserver.js:613
(anonymous) @ MountObserver.js:457
#processNode @ MountObserver.js:451
observe @ MountObserver.js:332
await in observe
createObserverEntry @ RegistryMountCoordinator.js:62
await in createObserverEntry
getOrInsertObserverEntry @ RegistryMountCoordinator.js:88
value @ ElementMountExtension.js:91
mount @ EMCScript.js:100
await in mount
EvtRt @ EvtRt.js:12
EMCScriptHandler @ EMCScript.js:15
#handleMatch @ MountObserver.js:608
(anonymous) @ MountObserver.js:457
#processNode @ MountObserver.js:451
observe @ MountObserver.js:332
await in observe
value @ ElementMountExtension.js:68
#activateHandlers @ Synthesizer.js:102
await in #activateHandlers
connectedCallback @ Synthesizer.js:73
(anonymous) @ be-hive.js:4
gist.js:143 Uncaught (in promise) Error: gist POST → 422 — { "message": "Validation Failed", "errors": [ { "resource": "Gist", "code": "missing_field", "field": "files" } ], "documentation_url": "https://docs.github.com/v3/gists/#create-a-gist", "status": "42
    at createGist (gist.js:143:15)
    at async gist.js:179:28
createGist @ gist.js:143
await in createGist
(anonymous) @ gist.js:179
ensureId @ gist.js:182
await in ensureId
(anonymous) @ gist.js:213
Promise.then
(anonymous) @ aliasStore.js:67
write @ gist.js:203
set @ set.js:127
handleEvent @ Binder.js:92
await in handleEvent
Binder @ Binder.js:42
(anonymous) @ be-persistent.js:76
hydrate @ be-persistent.js:76
await in hydrate
executeAction @ actions.js:321
evaluateAndExecuteAction @ actions.js:161
reactionFn @ actions.js:68
processPropertyChangeInternal @ RoundaboutManager.js:120
handlePropertyChange @ RoundaboutManager.js:98
propagator.addEventListener.signal @ RoundaboutManager.js:82
set @ PropagatorSetup.js:382
assignGingerly @ assignGingerly.js:1249
roundabout @ roundabout.js:16
await in roundabout
init @ be-persistent.js:43
await in init
BePersistent @ be-persistent.js:20
get @ object-extension.js:153
handleMount @ EMCScript.js:174
await in handleMount
do @ EMCScript.js:127
#handleMatch @ MountObserver.js:613
(anonymous) @ MountObserver.js:457
#processNode @ MountObserver.js:451
observe @ MountObserver.js:332
await in observe
createObserverEntry @ RegistryMountCoordinator.js:62
await in createObserverEntry
getOrInsertObserverEntry @ RegistryMountCoordinator.js:88
value @ ElementMountExtension.js:91
mount @ EMCScript.js:100
await in mount
EvtRt @ EvtRt.js:12
EMCScriptHandler @ EMCScript.js:15
#handleMatch @ MountObserver.js:608
(anonymous) @ MountObserver.js:457
#processNode @ MountObserver.js:451
observe @ MountObserver.js:332
await in observe
value @ ElementMountExtension.js:68
#activateHandlers @ Synthesizer.js:102
await in #activateHandlers
connectedCallback @ Synthesizer.js:73
(anonymous) @ be-hive.js:4

```

Is this something that can / should be fixed?

---

## Response to Response I

Yes — fixed in `be-persistent`.

### Root cause

Both demo fields start empty. On hydration `Binder`'s initial reconciliation
pass compares the element value (`''`) with the stored value (`null`, alias
unmapped) and `breakTie('', null)` returned `'lhs'` — "the element has the more
specific value, push it to the store". So `be-persistent` fired
`set('gist://be-persistent-demo/greeting.json', '')` (and the same for
`notes.json`) before you typed anything.

`fifteenth/gist.js` turned that into `POST /gists` with
`files: { "greeting.json": { content: "" } }`, and **GitHub's Gist API rejects a
file whose content is the empty string** — `422 { code: "missing_field", field:
"files" }`. Nothing was wrong with the token or the wiring; it was a create with
no real payload.

### Fix (`Binder.js`)

`breakTie` now treats `''` the same as `undefined` / `null` — "nothing":

```js
const blank = v => v === undefined || v === null || v === '';
if(blank(rhs)) return blank(lhs) ? 'eq' : 'lhs';
if(blank(lhs)) return 'rhs';
```

So an empty element value is never pushed to an empty store on hydration. That
write was always a no-op for the structured browser stores; now it's skipped
entirely, which also keeps `gist://` from issuing a doomed empty create. A
server-rendered `<input value="hello">` still seeds the store as before (its
value isn't blank). Existing specs stay green (all use `value=test`); a new
assertion in `tests/StoreToGist.html` proves an empty field triggers **no**
`POST /gists`.

The gist is now created the first time you type a real value into a field and
blur it. `demo/StoreToGist.html` gained a line saying so.

### Not changed (but could be)

`fifteenth/gist.js` still *would* `POST` / `PATCH` empty content if some other
caller handed it `''` — the 422 is guaranteed whenever it does. A defensive
guard there (skip or reject a write whose serialized content is empty) would
belong in `fifteenth`, not here. Say the word and I'll add it.

## Bruce's Response II

Please add the guard to fifteenth/gist.js

Also, I really like the thorough explanation of obtaining the gist token found in [gist.html](/fifteenth/demos/gist.html).  Can you apply the same to [StoreToGist.html?](/be-persistent/demo/StoreToGist.html)?

---

## Response to Response II

Both done.

### Guard in `fifteenth/gist.js` (+ `gist.ts`, rebuilt via `npm run build`)

New `gistContent(value)` helper wraps `serialize` and throws when the result
would be an empty string (`''`, `undefined`, or anything that `JSON.stringify`s
to `undefined`):

```js
function gistContent(value) {
    const content = serialize(value);
    if (typeof content !== 'string' || content === '') {
        throw new Error('gist write: a gist file cannot be empty — refusing to write '
            + (value === undefined ? 'undefined' : JSON.stringify(value))
            + ' (GitHub 422s an empty create and treats an empty update as deleting the file)');
    }
    return content;
}
```

`createGist` and `patchGist` now call `gistContent(value)` instead of
`serialize(value)`, so the check fires **before** `fetch` — no doomed request,
no accidental file deletion on PATCH (GitHub reads empty `content` on update as
"remove this file"). The throw rejects the `write` promise with a clear message.
The accessor-chain path is unaffected — it always serializes an object
(`{}` at minimum).

- `gist.ts` module-doc Notes gained a bullet about the constraint.
- `tests/test-gist.html` gained a case: an empty create rejects and issues no
  POST / records no alias; an empty update rejects and leaves the existing file
  intact. `npm test` green — 12 specs across chromium/firefox/webkit.

This is defense-in-depth: `be-persistent`'s `breakTie` fix already stops *it*
from ever calling `set(gist://…, '')`, but any other caller now gets a useful
error instead of a GitHub 422 / silent delete.

### Token instructions ported into `demo/StoreToGist.html`

Replaced the one-paragraph token card with the full treatment from
`fifteenth/demos/gist.html`:

- **Route A — classic token** (`<details open>`, recommended): the
  pre-filled `tokens/new?scopes=gist` link, the manual menu path as a fallback,
  expiration, the single `gist` checkbox, `ghp_…`.
- **Route B — fine-grained token** (`<details>`): the
  `personal-access-tokens/new` path, the callout that **“Account permissions”**
  only appears after picking a Resource owner and sits below all the Repository
  permissions, *Gists → Read and write*, `github_pat_…`, plus the org-opt-in
  caveat.
- "Revoke it any time" footer link to `github.com/settings/tokens`.

Adapted the intro to call out that the key is `fifteenthGistToken` — the same
one `demos/gist.html` writes — so a token pasted there on
`http://localhost:8000` is already picked up here. Cards are now numbered
**1 · token**, **2 · persisted fields**, **3 · the gist**; added the `details` /
`summary` / `.note` / `kbd` CSS the ported markup needs.