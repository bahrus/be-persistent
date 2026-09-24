# Better Programmatic Integration

## Bruce's Ask

I realized that I kind of messed up with the approach I've taken [with](../types/NewEnhancementInstructions.md) [enhancements](../types/EnhancementConversionInstructions.md).

[assign-gingerly](https://github.com/bahrus/assign-gingerly) took the very conscious decision to provide equal if not better ways of assigning enhancements without attributes, almost treating attributes like an "afterthought", knowing that the lure of attributes is like a drug that is hard to resist. 

Nevertheless, in a push to get the mount-observer and declarative JSON configuration working, I lost sight of my own goal, and literally made an own goal.  So I'd like to urgently address this.

I'm starting to work on a [document to rectify the situation](../types/ImportantEnhancementAddendum.md), starting with be-persistent.

I realize that first we need  to reorganize be-persistent's API to be more programmatic friendly.

The current typings for be-persistent are too intimately tied to parsing the string attribute.  But we should also be able to support:

```JS
persistenceEnhancement.store = 'sessionStorage://{autoGenId}';
```

which is equivalent to:

```JS
persistenceEnhancement.store = 
{
    localProp: 'value', //default
    localEvent: 'input', //default
    usl: 'sessionStorage://{autoGenId}'
};
```

which is equivalent to:

```JS
persistenceEnhancement.store = [
    {
        localProp: 'value', //default
        localEvent: 'input', //default
        usl: 'sessionStorage://{autoGenId}'
    }
];
```

i.e. store (I'm open to a better name) should support a string, or object, or array.

What I'd like to happen is that after parsing the attribute, there should be a way to transfer the parsed statement to the store property, and persistenceRules property should only be used for purposes of parsing the attribute.

I think for a full solution, we will need to make further adjustments, as deep as to assignGingerly.

I will likely bring in the assignGingerly package source code into this root folder so we can make the needed across the full life cycle to make programmatic integration more seamless.

Let's focus first on getting the API of be-persistent to be more programmatic friendly.  Let me know below what clarifications are needed.  If you have some preliminary thoughts on what else is needed to make programmatic integration easier, I'm certainly interested in that as well.

---

## Implementation Notes

### Status

Done. `npm run test` green — 10 specs (9 existing + a new `ProgrammaticStore`
proving the JS-only path). No clarification was blocking, so I went with the
name `store` exactly as you wrote it in the ask, and made the calls below —
flag anything you'd rather have differently.

### The shape

`persistenceRules` is now attribute-parsing-only, per the ask. `store` —
`string | PersistenceRule | PersistenceRule[]` — is the property `hydrate`
actually reads, and the one programmatic callers assign:

```js
persistenceEnhancement.store = 'sessionStorage://{autoGenId}';                        // shorthand
persistenceEnhancement.store = { localProp: 'value', localEvent: 'input', usl: '…' }; // single rule
persistenceEnhancement.store = [{ localProp: 'value', localEvent: 'input', usl: '…' }]; // array
```

A new `onPersistenceRulesChange(self)` method transfers the parsed attribute
into `store` (including the empty-attribute default-rule fallback that used
to live inline in `hydrate`). It's wired as a **compact**
(`when_persistenceRules_changes_call_onPersistenceRulesChange` in
`emc.mjs`), not an action — per the conversion guide's compact/action
conflict rule, a method can't be both. `hydrate`'s gating moved from
`persistenceRules` to `store` (`ifKeyIn: ['store', 'initialized']`), so
reassigning `store` at any time — not just at spawn — tears down the old
listeners and rehydrates against the new rule(s), symmetric to how an
attribute change already behaved.

`types/be-persistent/types.d.ts`: added `PersistenceRuleConfig` (the union
type), moved `store` into `EndUserProps`, moved `persistenceRules` into
`AllProps` (marked internal-only in its doc comment), and added
`onPersistenceRulesChange` to `Actions`.

### One correction to the addendum's sketch

`types/ImportantEnhancementAddendum.md`'s example has `emc.spawn =
BePersistent`, but `emc`'s actual shape (confirmed against `emc.mjs` and
`EMC` in `types/mount-observer/types.d.ts`) nests it at
`emc.enhConfig.spawn`. Used the corrected form in the README's new
"Programmatic attachment" section.

### Untested: the `enh.get(emc)` imperative-spawn call itself

The addendum's snippet spawns via `oInput.enh.get(emc)` with a live class
reference (`emc.enhConfig.spawn = BePersistent`) instead of the usual
JSON-config + mount-observer attribute-driven path. I didn't exercise that
call in the new test — since you mentioned assign-gingerly itself needs
deeper changes for this to be seamless, I didn't want to lock in test
coverage against a spawn path that's still in flux there. Instead
`tests/ProgrammaticStore.html` spawns the normal way (bare `be-persistent`
attribute) and then reassigns `.store` directly on the live instance
(`subject.enh.bePersistent`), which exercises exactly the deliverable here —
`store`'s three shapes and its re-hydration on reassignment — without
depending on the unfinished piece. Worth a follow-up test once the
assign-gingerly side of imperative attachment is settled.

### One timing thing worth knowing for any follow-up tests

`init()` calls `roundabout(raOptions)` without awaiting it, then immediately
sets `self.initialized = true`. That's pre-existing, not something I
touched, and roundabout tolerates it (a value set before its accessor exists
gets captured as the accessor's initial storage — same trick noted in
`compacts.js` for "set via a feature lazy getter before roundabout wired
up"). But it means a *property change event* for `store` only fires once
roundabout's accessor is actually live. My first draft of the new test
polled for `subject.enh?.bePersistent` existing and assigned `store`
immediately — too early, since the enhancement instance is registered on
`element.enh` before roundabout finishes wiring accessors, so the plain
assignment landed as an inert own-property that never triggered `hydrate`.
Fixed by polling for `enh.resolved === true` (i.e. the attribute-driven
default hydrate has already completed) before reassigning `store`
programmatically.

## Bruce's Response

I got be-persistent to work programmatically.  Before documenting the approach to be cloned across many scenarios, I wanted to get your suggestions, if any, on how things can be improved.

Changes I made:

1.  I defined [def](/be-persistent/def.js).  It's fairly formulaic, but a bit of a mind twister.

2.  I modified [be-persistent.js](/be-persistent/be-persistent.js):

Added an extra await:

```JS
await (await import('roundabout-lib/roundabout.js')).roundabout(raOptions);
```

Added a mind twisting ||:

```JS
const {customData} = /** @type {EMC<any, AllProps, Element, RAConfig<AllProps, Actions>>} */ (ctx.emc || ctx.config);
```

3.  The [demo page](/be-persistent/demo/Programmatic/devHash.html)

```html
<input id="input" disabled value="hello">
<script type=module>
    import {defBePersistent} from '/def.js';
    await defBePersistent(document.body);
    input.enh.set.bePersistent.nudge = true;
    input.enh.set.bePersistent.store = 'locationHash://{autoGenId}';
    console.log(input.enh.bePersistent);
</script>
```

Any suggestions on making this more seamless?

---

## Claude's Suggestions

Ran it before commenting: headless Chromium against your actual
`demo/Programmatic/devHash.html`, reading real state back out afterward.
Result: `resolved: true`, `initialized: true`, `nudge: true`, `store:
'locationHash://{autoGenId}'`, `disabled: false`, and `location.hash`
correctly carrying `input=hello`. It works. One thing below is a real
finding though, not just a style note.

### The extra `await` is load-bearing, not cosmetic

Traced why: `enh.set.bePersistent.nudge = true` runs **synchronously**,
right after the Proxy's `get` trap constructs the instance — before `init()`
has yielded even once, so `roundabout()` hasn't started converting any
property to a getter/setter yet. That assignment lands as a plain own-data
property. Same for the `store =` line right after.

Roundabout has a documented rescue for exactly this ("value set via a
feature lazy getter before roundabout wired up" — see the comment in
`compacts.js`): when it later converts a property to an accessor, it reads
the *current* value first and uses that as the accessor's initial storage.
So `nudge`/`store`'s **values** survive — confirmed empirically above. But
that rescue never dispatches a `PropertyChangeEvent`, because there's
nothing listening yet at assignment time. A property set that way can never,
by itself, trigger a reaction.

So why does `hydrate` fire at all? Because of your added `await`. Before it,
`self.initialized = true` ran immediately after calling (not awaiting)
`roundabout(raOptions)` — before setup, same problem as `nudge`/`store`.
With the `await`, that line now runs *after* `setupPropagatorAndProperties`
has already converted `initialized` to a real accessor (it's the last thing
`init()` itself does, from the inside, after every internal `await` has
resolved) — so it's a genuine, live property change. `hydrate`'s
`ifKeyIn: ['store', 'initialized']` catches it, conditions are met, and it
runs — picking up whatever value `store` already holds, rescued or not.

In other words: the imperative path currently hydrates *only* because
`initialized` happens to be (a) set from inside the class after real setup
completes, and (b) listed in `hydrate`'s `ifKeyIn`. That's correct for
`be-persistent` today, but it's an easy thing for a future clone to get
wrong — a class that gates its main action on a different prop, or doesn't
have an analogous "last thing I do is flip a monitored flag" step, would
silently never hydrate when spawned this way. Worth being deliberate about
that pattern when you write up the doc to clone from, rather than relying on
each class rediscovering it. (For what it's worth: reassigning `store` again
*after* the instance is already resolved — like my own `ProgrammaticStore`
test does — doesn't have this problem at all; by then the accessor exists
and every set is fully live.)

If you want to close this systemically rather than document around it: have
`convertPropertyToGetterSetter`'s rescue path fire a `PropertyChangeEvent`
for the captured value too (oldValue `undefined` → the rescued value),
instead of only seeding storage silently. That would make *any*
imperatively-pre-set property correctly wake dependent actions/compacts, not
just whichever one the class author happens to set last from the inside.
Bigger blast radius (touches `roundabout-lib`, not `assign-gingerly`), so
flagging as an option rather than doing it here.

### `def.js`

- The dangling second `import('./emc.json', ...)` at the end (`emc2`,
  unused) — looks like you were already probing whether repeat imports
  return the same object. Confirmed: they do (same specifier, same module
  cache), so it's safe to delete now.
- `enhConfig.spawn = BePersistent; enhConfig.customData = emc.customData;`
  mutates the *cached* JSON module's live object in place — every future
  `import('./emc.json', ...)` anywhere in the page returns that same,
  now-mutated object. Calling `defBePersistent` twice confirmed this is
  currently harmless (`enhancementRegistry`'s `#items` is a `Set`, so
  re-pushing the identical object reference is a no-op — still 1 item after
  a second call), but it's harmless *because* two separate facts happen to
  line up (module-cache identity + Set dedup), not because it's designed to
  be idempotent. A future refactor that builds a fresh object per call
  (`{...emc.enhConfig, spawn: BePersistent, customData: emc.customData}`)
  would be equally correct and not depend on that coincidence — worth
  considering when you generalize this into the shared helper.
- Worth calling out explicitly wherever this pattern gets documented:
  `customData` has to be copied onto `enhConfig` by hand because the
  registry only stores `enhConfig`, not the full `emc` object. Skip it and
  roundabout gets no `actions`/`compacts`/`weakRef` at all — same silent
  failure mode as the already-documented "spread `...myJSON`" emoji-shorthand
  pitfall in the conversion guide. This is exactly the kind of thing that
  deserves a line in whatever doc you clone this pattern from.

### `ctx.emc || ctx.config`

This one's necessary, not a workaround to remove later — `enh.get()` passes
`ctx.emc` (from `mountCtx?.emc`) but the `enh.set` proxy's spawn path only
ever builds `ctx = { config: registryItem }`, no `emc` slot at all. Every
class spawned through `.enh.set` needs this fallback. Since every class will
need it identically, consider a one-line shared export
(`assign-gingerly/getEmc.js`: `export const getEmc = ctx => ctx.emc ??
ctx.config;`) so it's written once — and if the two ctx shapes ever converge,
there's one place to delete it instead of N.

### Async readiness

`ElementEnhancementContainer` already has `whenResolved(registryItem)` —
`await input.enh.whenResolved('bePersistent')` would be the seamless
alternative to `waitForTimeout`/polling for consumers. It requires the
spawned instance to be an `EventTarget` dispatching its configured lifecycle
event (`'resolved'` by default — which already matches `be-persistent`'s own
`resolved` prop naming). `BePersistent` doesn't extend `EventTarget` today,
so calling it before the instance resolves would throw. Making enhancement
classes extend `EventTarget` and dispatch `resolved`/`dispose` would give
consumers (and tests) a real await-able signal instead of guessing at
timeouts — and would double as the way to avoid the "set right after spawn"
race entirely, for the common case of "wait until first hydrate is done,
then configure it."

