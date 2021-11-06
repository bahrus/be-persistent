# be-persistent

be-persistent is a behavior/decorator alternative to [purr-sist](https://github.com/bahrus/purr-sist)

Example 1:  Default settings;

```html
<input be-persistent>
```

What this does:

Stores input's value in session storage (key is based on location within the DOM).

The syntax above is short-hand for:

```html
<input be-persistent='{
    "what":{
        "value": true
    },
    "when":{
        "input": true
    },
    "where":{
        "sessionStorage": true,
        "autogenId": true,
    },
    "restoreIf":{
        "always": true,
    }
}'>
```

On refreshing the browser, the input's value will be retained.

Example 2:  Criteria [TODO]

```html
<input be-persistent='{
    "restoreIf":{
        "value":{
            "eq": "defaultValue"
        }
    }
}'>
```

Example 3:  IBD [TODO]

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

Example 3:  Criteria