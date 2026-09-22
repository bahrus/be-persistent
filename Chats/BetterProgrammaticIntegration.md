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