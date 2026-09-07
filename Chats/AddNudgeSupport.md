# Add Nudge Support

## Bruce's Ask

From what I can tell from existing examples, there appears at one point to have been an expectation that [nudge](https://github.com/bahrus/assign-gingerly/blob/baseline/handlers/nudge.ts) was applied in order to enable input elements after hydrating.

Since that got lost in the mix of multiple factorings, let's make it opt in:

```html
<input disabled be-persistent="via locationHash://{autoGenId}." be-persistent-nudge value="hello">
```