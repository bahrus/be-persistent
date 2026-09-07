# Conversion

## Bruce's Ask

Please follow the directions of [Enhancement Conversion Instructions](../types/EnhancementConversionInstructions.md) to convert the legacy code in the legacy folder of be-persistent and the ts-refs/be-persistent folder to the new approach.

Please provide your implementation notes below, including any gaps you encountered in attempting to convert the code.

Note that I have opened a root folder that contains the fifteenth package source code, that is designed to replace trans-render/XV

---

## Implementation Notes

### Status

Conversion complete. `npm install`, `npm run build`, and `npm run test` all succeed.
All 3 Playwright tests pass against Chromium (default settings, explicit settings,
emoji shorthand) — the enhancement genuinely round-trips a value to
`sessionStorage` through the new be-hive → mount-observer → roundabout → `Binder`
pipeline.

### What each step produced

| Step | Result |
|------|--------|
| 1. Types → `types` submodule | Copied `ts-refs/be-persistent/types.d.ts` → `types/be-persistent/types.d.ts`; deleted the `ts-refs/` folder (it was a plain tracked folder here, **not** a git submodule — no `.gitmodules` entry). |
| 2. Archive legacy | Already done in a prior pass — `legacy/` already held `be-persistent.js`, `Binder.js`, `emc.js`, `💾.js`. Left untouched. |
| 3. package.json | Dropped `be-enhanced`, `trans-render`, `xtal-shell`, `ssi-server`. Added `assign-gingerly` (0.0.96), `be-hive`, `fifteenth`, `mount-observer`, `nested-regex-groups`, `roundabout-lib`; dev-dep `spa-ssi`. `build` script added. `serve` now `node ./node_modules/spa-ssi/serve.js` (was `python3 ssi_server.py`). Ran `npm run update` — `ncu` reported everything already latest; pinned each dep to its exact installed point version. |
| 4. imports.html | Rewritten to the modern import-map shape (`be-persistent/` → `/`, deps → `/node_modules/...`), plus `fifteenth/`, `roundabout-lib/`, `nested-regex-groups/`, `id-generation/`. |
| 5. Coding standards | `.kiro/steering/coding-standards.md` created verbatim from the instructions. |
| 6. Standalone types | Removed the `trans-render`/`be-enhanced` imports and `IEnhancement`/`BAP`/`USL`. `enhancedElement` added to `AllProps`; `BAP`→`AP`; `PersistenceRule.usl` retyped `USL`→`string`. |
| 7. emc.mjs | New build-time config. `enhKey: 'bePersistent'` (legacy `enhPropKey` verbatim). Uses the **custom-parser** path (Step 7a) — see below. `customData` carries `weakRef.properties: ['enhancedElement']` and the `hydrate` action gated with the `initialized` pattern. `propInfo`/`propDefaults`/`positractions` dropped. |
| 7a. Custom parser | `parse-grouped-capture-statements` (flat structure — `PersistenceRule` has no nested props). The 3 legacy `regExpExts` regexes became 3 `PatternConfig` entries (`of <prop>::<event> via <usl>` / `of <prop> via <usl>` / `via <usl>`), most-specific first. |
| 8. File nesting | `.vscode/settings.json` created. |
| 8a. Auto-build hook | `.kiro/hooks/auto-build-config.kiro.hook` watching `emc.mjs` + `💾.mjs`. |
| 9. Modern class | `be-persistent.js` rewritten — plain class, constructor → `init`, `roundabout-lib/roundabout.js`, `customData` read from `ctx.emc` (no `emc.json` import), `self.initialized = true` after `roundabout(...)`. `bootUp()` / `BE` / positraction imports removed. |
| 10. Emoji variant | `💾.mjs` → `💾.json`. Spreads `...myJSON` at top level so `customData` carries over. `build` script emits both JSONs. |
| 11. Tests / demos | Test + demo HTML switched to the `<be-hive><script type=emc-parser>` + `<script type=emc src="be-persistent/emc.json" wait-for-parsers=...>` pattern. `playwright.config.ts` → Chromium only. `.github/workflows/CI.yml` → `submodules: recursive`, drop Python, add `npm run build`, install only `chromium`. Added an `EmojiAlternative` test to exercise `💾.json`. |

### Architectural decisions specific to be-persistent

- **`Binder.js` kept as a peer module.** It is an implementation helper, not
  legacy-architecture boilerplate, so it survives largely intact. `hydrate`
  still tears down the previous `AbortController` and spawns one `Binder` per
  rule. It is exported via the package (`be-persistent/Binder.js`) and imported
  through the import map.
- **`persistenceRules` shape.** Following be-bound (the closest converted
  reference — also a binding enhancement), the parsed prop is
  `StatementsResult<PersistenceRule>` with `instanceOf: 'Array'` and
  `mapsTo: 'persistenceRules'`. `hydrate` reads `.statements[].value`.
- **`noAttrs` action removed.** The legacy `noAttrs` (which synthesized a
  default rule when the attribute had no value) is now handled inside `hydrate`:
  an empty attribute parses to `{ success: true, statements: [] }`, and `hydrate`
  pushes the same default rule (`value` / `input` /
  `sessionStorage://{autoGenId}`) — mirroring the do-toggle "infer when
  `statements.length === 0`" lesson.
- **`initialized` gate.** `hydrate` is gated
  `ifKeyIn: ['persistenceRules','initialized']`,
  `ifAllOf: ['enhancedElement','initialized']` — the three-peat recipe — so it
  runs exactly once, after every attribute-derived prop is populated.

### Gaps / carry-overs / behavior changes

1. **`{autoGenId}` — no modern replacement for `xtal-shell/$hell.getFullPath`.**
   The legacy key was `cleanse(location…) + '__' + cleanse($hell.getFullPath(el))`.
   `$hell` is a heavy module with import-time side effects (scans `<head>` for
   iframes, sets `window.$hell`, adds `popstate`/`history` listeners, console
   logging) — pulling it into the modern build was not acceptable, and nothing
   in `be-hive` / `assign-gingerly` / `inferencer` / `id-generation` produces a
   DOM path. **Resolution:** ported a condensed `getFullPath` into a new
   `getAutoGenId.js`. It reproduces the legacy token format for the common cases
   (`/input`, `/div[2]`, `/span#"id"`) — verified against the existing test
   keys — but the legacy `$hell.getList` de-duplication/indexing logic is only
   approximated, so for deeply nested or tag-ambiguous DOM structures the
   generated key **may differ** from the old one. Consequence: values persisted
   by the legacy version under complex selectors will not be found by the
   converted version (fresh key). A dedicated tiny path-id package would be the
   right long-term fix.

2. **USL read/write moved to `fifteenth`.** `trans-render/XV/{get,set}.js` →
   `fifteenth/{get,set}.js` (same `(usl, val, ctx?)` signature). **Behavior
   change to note:** `fifteenth`'s `set` broadcasts
   `window.postMessage([usp])` (or `[usp, usl]` with a `?.` chain) — a plain
   `Array` of path strings — whereas `trans-render/XV` posted a `Set`. Any
   external `message` listener that was keyed on the old `Set` payload must be
   updated. be-persistent itself does not listen, so nothing inside this repo
   changed.

3. **`assign-gingerly` version.** `fifteenth@0.0.1` needs
   `assign-gingerly@0.0.96` (for `parseProtocolRef`). Here that happens to be
   satisfied cleanly — `roundabout-lib@0.0.36`, `mount-observer@0.1.53` and
   `be-hive@0.1.18` all resolve happily alongside `assign-gingerly@0.0.96`, and
   `ncu` leaves it alone. It is pinned exactly in `dependencies` per the Step 9
   note; if a future `npm run update` bumps `assign-gingerly` past what
   `roundabout-lib`/`mount-observer` pin, the flat import map will only serve
   one copy and the pin must be reconciled by hand.

4. **`inferencer` / the `infer` pattern was *not* adopted.** The instructions
   recommend replacing hard-coded element inspection with
   `(await infer(el)).eventType` / `.valueProperty`. Legacy be-persistent only
   ever used the literals `'value'` / `'input'`, so `Binder` keeps
   `rule.localProp || 'value'` and `rule.localEvent || 'input'` for exact
   behavior parity and one fewer dependency. Migrating `Binder` (and the
   empty-attribute default) to `infer` — which would transparently handle
   `<input type=checkbox>` (`checked`), `<select>` (`change`), contentEditable,
   etc. — is a clean, recommended follow-up.

5. **`positractions` (`resolved` / `rejected` events) dropped** per Step 7.
   `hydrate` still returns `{ resolved: true }` and `resolved?: boolean` stays
   on `AllProps`, but the legacy behavior of *dispatching* `resolved`/`rejected`
   DOM events on completion is gone. Re-add via a `compacts`
   `when_resolved_changes_dispatch` entry if a consumer depended on it.

6. **`locationHash` storage format.** `fifteenth`'s `locationHash` protocol
   stores values as `URLSearchParams` entries on `location.hash` keyed by the
   USP key, and holds plain strings only (an accessor chain is rejected). This
   is the sensible modern behavior but is not guaranteed byte-identical to what
   `trans-render/XV` wrote, so an existing hash-persisted page may not restore
   from a pre-conversion URL. The `unsanitizedInnerHTML` +
   `onsecuritypolicyviolation="event.anythingGoes = true"` escape hatch is
   preserved unchanged in `Binder.js` but is **not** covered by an automated
   test (needs a real browser reload cycle) — `demo/StoreUnsafeHTML.html` is the
   manual check.

7. **Stale demo files left as-is.** `demo/dev.html`, `demo/devHash.html`,
   `demo/devIDB.html`, `demo/onunload.html`, `demo/onunloadIDB.html`,
   `demo/o2h-view.html` predate even the legacy `emc.js` (they import a
   non-existent `../behivior.js` and use a JSON `be-persistent='{…}'` attribute
   syntax that the legacy parser never supported). They were out of scope for a
   like-for-like conversion and would need to be rewritten from their intent,
   not translated. The 7 demos that used `/emc.js` or `/💾.js` were converted;
   `demo/StoreToLocationHash.html` also had a copy-paste bug (`cookie://`) which
   was fixed to `locationHash://`.

8. **`@this` on the constructor** in `be-persistent.js` reproduces the Step 9 /
   be-clonable boilerplate verbatim; `tsc --strict` flags it (`TS2681`) but the
   reference projects carry the same line, so it was kept for consistency with
   the documented pattern.

### Files added / changed

```
added:    types/be-persistent/types.d.ts   (from ts-refs, then modernized)
added:    emc.mjs, emc.json
added:    💾.mjs, 💾.json
added:    be-persistent.js                 (new root — modern class)
added:    Binder.js                        (new root — modern helper)
added:    getAutoGenId.js                  (new — {autoGenId} / getFullPath port)
added:    .kiro/steering/coding-standards.md
added:    .kiro/hooks/auto-build-config.kiro.hook
added:    .vscode/settings.json
added:    tests/EmojiAlternative.html, tests/EmojiAlternative.spec.mjs
changed:  package.json, imports.html, README.md, playwright.config.ts
changed:  .github/workflows/CI.yml
changed:  tests/DefaultSettings.html, tests/ExplicitDefaultSettings.html
changed:  demo/{DefaultSettings,ExplicitDefaultSettings,EmojiAlternative,
           StoreToCookie,StoreToIDB,StoreToLocationHash,StoreUnsafeHTML}.html
removed:  ts-refs/
```
