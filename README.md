# be-persistent

be-persistent is a behavior/decorator alternative to [purr-sist](https://github.com/bahrus/purr-sist).  

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

Example 2:  Store to IDB

```html
<input be-persistent='{
    "where":{
        "idb": true
    }
}'>
```

Example 3:  Persist on unload

```html
<div contenteditable=true be-persistent='{
    "what":{
        "innerText": true
    },
    "persistOnUnload": true
}'>hello</div>
```

On refreshing the browser, the input's value is retained.

Example tbd:  Criteria [TODO]

```html
<input be-persistent='{
    "restoreIf":{
        "value":{
            "eq": "defaultValue"
        }
    }
}'>
```

Example tbd:  IBD [TODO]

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