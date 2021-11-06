# be-persistent

be-persistent is a behavior/decorator alternative to [purr-sist](https://github.com/bahrus/purr-sist)

Example 1:  Default settings;

```html
<input be-persistent>
```

What this does:

Stores input's value in session storage (key is based on location within the dom).

On refreshing the browser, if the input element equals the defaultValue then the value is set from storage, 

Example 2:  Isolated storage -- single element

```html
<input be-persistent='{
    "what": {
        "value": "myInputValue"
    },
    "when": ["change"],
    "where": {
        "IBD":{
            "id": "...",
            "path": "a.b.c"
        }
    }
}'>
```