# Better Programmatic Integration Part II

## Bruce's Ask

Continuing on [Part I](./BetterProgrammaticIntegration.md), I have a scenario that will likely require some changes to the TypeScrip project assign-gingerly.  I brought assign-gingerly source code into the parent folder, and update imports.html to point to it.

What I'm finding is that not even the constructor in be-persistent.js is getting invoked with [the out of order example](../demo/Programmatic/devHashDeclarativeOutOfSequence.html).

Here's the key mockup:

```html
<script type=module>
    import {defBePersistent} from '/def.js';
    //only the first call needs to use .set
    //it triggers the attachment of the enhancement.
    input.enh.set.bePersistent.nudge = true;
    input.enh.bePersistent.store = 'locationHash://{autoGenId}';
    await defBePersistent(document.body);
    console.log(input.enh.bePersistent);
</script>
```

The key line is:

```JS
input.enh.set.bePersistent.nudge = true
```

What should happen:

1.  assign-gingerly should note that input.enh.bePersistent is undefined.
2.  It should wait for some sort of promise, via something like

```JS
if(input.enh.bePersistent === undefined){
    input.enh.bePersistent = {};
    input.enh.bePersistent.nudge = true;
    //I don't think whenDefined has been added to enhancementRegistry yet
input.customElementRegistry.enhancementRegistry.whenDefined('bePersistent').then(() => {
    //instantiate spawn class
    //get the current values of input.enh.bePersistent and merge into initVals
    //call constructor
    //replace input.enh.bePersistent with spawned class
})

}
```

Does this make sense?  Let's pause to see if any clarifications are needed or entertaining suggestions for a better way, before proceeding with implementation.  Please list any such discussion below.

---

## Claude's Discussion (no code changed yet, per your ask)

Traced why the constructor never fires: it's exactly the code path you'd
expect. `.enh.set`'s Proxy `get` trap looks up `bePersistent` in
`enhancementRegistry` via `findByEnhKey`, finds nothing (nothing's been
`push`ed yet), and falls through to its "no registry item found" branch —
which just does `self[prop] = self[prop] ?? {}` and returns that plain
object. Nothing ever revisits it once `defBePersistent` finally registers the
config later; the plain placeholder just sits there forever. Your second line
(`input.enh.bePersistent.store = ...`, no `.set`) is a direct property access
on that same container, so it just adds `store` onto the same placeholder —
no trap involved, no surprise there.

Your sketch is the right shape. One correction and one simplification, both
good news:

### `whenDefined` already exists on `EnhancementRegistry` — with a different, narrower meaning

You flagged you didn't think it existed yet — it does, but it's not what your
sketch needs:

```ts
async whenDefined(enhKey: EnhKey): Promise<void> {
    const pending = this.#pendingSetups.get(enhKey);
    if (pending && pending.length > 0) {
        await Promise.all(pending);
    }
}
```

This waits for an *already-registered* item's pending `features` setup
(`_trackSetup`) to finish. If `enhKey` was never `push`ed at all,
`#pendingSetups.get(enhKey)` is `undefined` and this resolves **immediately**
— the opposite of what we want. So we can't add a second method with the same
name; we'd either silently break this one or get confusing "which one wins"
behavior.

Cleanest fix, I think: extend this *existing* `whenDefined` so it also waits
for **initial registration**, not just pending feature setups — i.e. make it
mean "resolves once this key is defined *and* ready," matching
`customElements.whenDefined(name)`'s own contract (that platform method also
covers "not yet defined" transparently). Concretely: if `findByEnhKey(enhKey)`
already returns an item, keep the current pending-features wait; if it
doesn't, first wait for an `EnhancementRegisteredEvent` whose `config` (single
item or array) contains a matching `enhKey`, *then* do the existing
pending-features wait. One method, one coherent meaning, no new name to learn.

### The "spawn + merge + swap" step doesn't need new code — `.get()` already does it

Your pseudocode's last three lines —

```
//instantiate spawn class
//get the current values of input.enh.bePersistent and merge into initVals
//call constructor
//replace input.enh.bePersistent with spawned class
```

— is, line for line, what `ElementEnhancementContainer.get()` already does
today, via the `existingInitVals` check:

```ts
const existingInitVals = self[registryItem.enhKey] &&
    !(self[registryItem.enhKey] instanceof SpawnClass)
    ? self[registryItem.enhKey]
    : undefined;
```

That's precisely "there's a plain object sitting in the enh slot that isn't a
spawned instance yet — treat it as pending initVals." It already merges those
with `attrInitVals`, constructs, and stores the real instance back over the
placeholder. So I don't think the `.set` proxy's fallback branch needs its own
spawn/merge/swap logic at all — it just needs to, in addition to creating the
placeholder, kick off:

```ts
registry.whenDefined(prop).then(() => this.get(prop, mountCtx));
```

and let the existing, already-tested `.get()` do the rest. Much smaller change
than it looked like from the sketch.

### Things worth deciding deliberately, not just discovering later

- **Always-on vs. opt-in.** I'd make this the default behavior of the `.set`
  trap's "not found" branch — it only changes what happens in a case that
  currently just silently fails to ever spawn, so there's no existing
  behavior to disturb.
- **A promise that may never resolve if `bePersistent` is never registered at
  all.** Same shape as `customElements.whenDefined` — an accepted platform
  quirk, not a new one we're introducing, but worth being deliberate that
  that's the tradeoff rather than discovering it later.
- **Multiple `.set` accesses before registration.** If something touches
  `.set.bePersistent` more than once before `defBePersistent` runs, each
  access would queue its own `whenDefined().then(get)`. Not a problem in
  practice — `.get()` already checks the instance cache before constructing,
  so the second resolution is a no-op — but worth confirming that's
  acceptable rather than adding a guard against it.
- **Composes cleanly with Part I.** Once `.get()` actually runs, it goes
  through the exact same constructor → `roundabout()` path as every other
  spawn — so the rescued-props protection and `nudge`'s `propagate` entry from
  Part I apply here too, unchanged. Nothing new needed on that side.

Set up `be-persistent/assign-gingerly` as a junction to
`C:\git\persisting\assign-gingerly` (same pattern as `roundabout-lib` in Part
I) so we're ready to test once we agree on a direction — haven't touched any
of its source yet.

Let me know if the `whenDefined`-extension approach sounds right, or if you'd
rather keep it a distinct method (e.g. `whenRegistered`) to avoid changing an
existing method's contract even though nothing currently depends on the "not
yet registered → resolves immediately" behavior.

## Bruce's Response

Everything you recommend sounds right.  Please proceed with the implementation and add the implementation notes below.

---

## Implementation Notes

### Status

Done, verified end-to-end. `devHashDeclarativeOutOfSequence.html` now works:
headless probe shows the enh slot holds the real spawned instance (not the
plain placeholder), `nudge: true`, `store` correctly set, `resolved:
initialized: true`, `disabled: false`, and the hash correctly written — same
target state as `devHashImperative.html`. Test suites all green:
`assign-gingerly`'s own suite (37 tests × chromium/firefox/webkit = 111) and
`be-persistent`'s (10, chromium — including `Nudge.spec.mjs`, unaffected).

### `assignGingerly.ts`/`.js` — `whenDefined` extended, not duplicated

```ts
async whenDefined(enhKey: EnhKey): Promise<void> {
    if (!this.findByEnhKey(enhKey)) {
        await new Promise<void>((resolve) => {
            const handler = (event: Event) => {
                const config = (event as EnhancementRegisteredEvent).config;
                const items = Array.isArray(config) ? config : [config];
                if (items.some(item => item.enhKey === enhKey)) {
                    this.removeEventListener(EnhancementRegisteredEvent.eventName, handler);
                    resolve();
                }
            };
            this.addEventListener(EnhancementRegisteredEvent.eventName, handler);
        });
    }
    const pending = this.#pendingSetups.get(enhKey);
    if (pending && pending.length > 0) {
        await Promise.all(pending);
    }
}
```

If `enhKey` is already registered, behavior is byte-for-byte what it was
before (falls straight through to the pending-features wait). If it isn't,
waits for an `EnhancementRegisteredEvent` whose `config` (single item or
array — `push` accepts both) contains a matching `enhKey`, then does the same
pending-features wait in case that same `push` also queued `features` setup.

### `object-extension.ts`/`.js` — one addition inside the `.set` proxy's existing fallback

```ts
// No registry item found - create plain object if needed
if (self[prop] === undefined) {
    self[prop] = {};
    const laterRegistry = registry
        ?? (typeof customElements !== 'undefined' ? (customElements as any).enhancementRegistry : undefined);
    laterRegistry?.whenDefined(prop).then(() => self.get(prop));
}
return self[prop];
```

No new spawn/merge/swap logic — `self.get(prop)` is the same `.get()` method
that already had the `existingInitVals` check for exactly this shape (a
non-instance value sitting in the enh slot). Once `whenDefined` resolves,
`.get()` finds the registryItem, sees the plain placeholder isn't a
`SpawnClass` instance, merges it in as initVals, constructs, and overwrites
the slot with the real instance — all pre-existing code, unchanged.

Also added the `?? customElements.enhancementRegistry` fallback here to match
the pattern `Element.prototype.set`'s trap already used a few lines below in
the same file — the `.set` getter's trap didn't have that fallback before;
harmless either way for this demo (`element.customElementRegistry` already
equals the global registry for a plain document element) but now consistent.

### Confirms from Part I discussion, empirically

- The `if (self[prop] === undefined)` guard around the whole block means the
  `whenDefined().then(get)` chain can only ever be kicked off once per prop —
  a second `.set.bePersistent` access before registration would see
  `self[prop]` already `{}` and skip straight to `return self[prop]`. So the
  "multiple queued chains" question from the discussion above turned out to
  be moot by construction, not just harmless.
- Confirmed the "never resolves if never registered" characteristic is real
  and untested here (by design — same as `customElements.whenDefined`, not
  something to add a timeout/warning for unless you want one).

### Not touched

Didn't run `assign-gingerly`'s own `npm run build` (`tsc`) for the same reason
as roundabout in Part I — hand-translated `.ts` to `.js` in the existing
compiled style. Worth diffing against a real `tsc` run before publishing.

## Bruce's Response -- Update README.md or other document

Looks great.  Can you check if the change made to assign-gingerly warrants updating any of assign-gingerly's README.md and/or other docs file(s)?

---

## Implementation Notes

Checked all of `assign-gingerly`'s docs (`README.md`, `AGENTS.md`, `CLAUDE.md`).
`AGENTS.md`/`CLAUDE.md` don't reference `enh.set`, `enhancementRegistry`, or
`whenDefined` at all — nothing to update there. `README.md` did need updating;
it documents the `.set` proxy's "How It Works" list and the previously
undocumented `EnhancementRegistry.whenDefined` in enough detail that leaving
them stale would actively mislead someone reading it.

Two changes, both in the `## Enhanced Element Property Assignment with
enh.set Proxy` section (right where the rest of `.set`'s behavior is already
documented):

1. **Updated the existing "How It Works" step 4** (previously: "Falls back to
   plain objects: If no registry item is found, creates a plain object..." —
   silently stopped there, matching the old behavior). Now notes it also
   calls `whenDefined` and links to the new section.
2. **New section, "Setting Properties Before the Registry Item Exists"**,
   placed immediately after that details block, following the same pattern as
   the existing `enh.whenResolved()` section elsewhere in the doc: a runnable
   example, a `<details><summary>How it works</summary>` numbered breakdown,
   and — since this was the first time `EnhancementRegistry.whenDefined`
   itself got documented at all — an explicit description of its two-part
   behavior (wait for registration, then wait for pending `features` setup),
   the "never resolves if never registered" tradeoff (called out explicitly,
   matching how you wanted it flagged in Part I), and the placeholder's
   limitations while waiting (no reactivity, no `mountCtx`).

Didn't touch the "Testing with `whenDefined`" section near the bottom of the
README — that one's about `ItemscopeRegistry.whenDefined`, a different class
with its own (unrelated, unchanged) `whenDefined`. Left it alone; flagging so
it's clear I didn't miss it, not that I skipped checking it.
