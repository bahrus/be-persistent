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