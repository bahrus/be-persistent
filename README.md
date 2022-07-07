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

Example 4:  Persist innerHTML:

```html
<form
    action="https://o2h-cw.bahrus.workers.dev/"
    target='[-innerHTML]'
    be-persistent='{
        "where":{
            "idb": true
        },
        "what":{
            "innerHTML": {
                "beBeatified": true
            }
        },
        "persistOnUnload": true
    }' 
    be-reformable='{
        "autoSubmit": false,
        "path": ["", "proxy-to"]
    }'
    be-valued
>
    <label>
        Proxy to: 
        <input required name='proxy-to' type='url'>
    </label>
    <label be-typed be-clonable be-delible></label>
    <button type='submit'>Submit</button>
</form> 
<div -innerHTML></div>

<script type="module" crossorigin="anonymous" >
    import "https://esm.run/be-persistent@0.0.21";
    import "https://esm.run/be-typed@0.0.4";
    import "https://esm.run/be-clonable@0.0.5";
    import "https://esm.run/be-delible@0.0.6";
    import "https://esm.run/be-reformable@0.0.48";
    import "https://esm.run/be-valued@0.0.1"
</script>
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

Example 5:  Persist to url hash

```html
<input be-persistent='{
    "where":{
        "idb": true,
        "hash": true
    }
}'>
```

## Precedence

If multiple locations are selected as far as where to persist data, the data is persisted to all of them.  But as far as restoring state from the persisted data, which one takes precedence?

If IDB is enabled, and the data is found that, that is what takes precedence.  If SessionState is enabled (which it is by default, unless specifically turned off) then it takes precedence.  If hash is enabled, it takes the next precedence.

