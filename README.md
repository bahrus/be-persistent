# be-persistent (💾)

<p align="center">
<img src="https://github.com/bahrus/be-persistent/raw/baseline/9bhbww.jpg" alt="Where are my cookies?" width="400" style="max-width: 100%;">
</p>



[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/be-persistent?style=for-the-badge)](https://bundlephobia.com/result?p=be-persistent)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/be-persistent?compression=gzip">
[![NPM version](https://badge.fury.io/js/be-persistent.png)](http://badge.fury.io/js/be-persistent)


be-persistent is a behavior/decorator/enhancement alternative to [purr-sist](https://github.com/bahrus/purr-sist).  

## Default settings

```html
<input be-persistent>
```

What this does:

Stores input's value in session storage (key is based on location within the DOM), but can also be specified.

The syntax above is short-hand for:

## Explicit Default Settings

```html
<input be-persistent="of value::input via sessionStorage://{autoGenId}.">
```

The fragment "of value::input" is assumed if not provided.

Also, the event "::input" is assumed if not provided.

The end of the statement above: "sessionStorage://{autoGenId}" is based on the [Uniform Storage Path](https://github.com/bahrus/trans-render/wiki/VIIII.--Uniform-Storage-Path) vernacular.

We can apply multiple statemtns within the be-persistent attribute, separated by the "period".  Each sentence can start with "of" or "Of".

## Emoji alternative

```html
<input 💾="of value::input via sessionStorage://{autoGenId}.">
```



## Store to IDB

```html
<input 💾="via indexedDB://myDB/myStore/{autoGenId}.">
```

## Store to a cookie

```html
<input 💾="via cookie://{autoGenId}.">
```

## Store to location.hash

```html
<input 💾="via locationHash://{autoGenId}.">
```

## Persist unsafe innerHTML

There are certain, limited circumstances, where we want to throw security to the dogs, and provide a convenient way of creating "virtual web pages embedded in the url".  Here's how we do this:

```html
<div 💾="of unsanitizedInnerHTML via locationHash://{autoGenId}"
    onsecuritypolicyviolation="event.anythingGoes = true">
    <span conteneditable></span>
</div>
```


On refreshing the browser, the inner content's edits are retained.

## Persist safe inner HTML

We make use of trusted types [TODO]


## Viewing Your Element Locally

Any web server that can serve static files will do, but...

1.  Install git.
2.  Fork/clone this repo.
3.  Install node.js
4.  Install Python 3 or later
5.  Open command window to folder where you cloned this repo.
6.  > npm install
7.  > npm run serve
8.  Open http://localhost:8000/demo/ in a modern browser.

## Running Tests

```
> npm run test
```

## Using from ESM Module:

```JavaScript
import 'be-persistent/be-persistent.js';
```

## Using from CDN:

```html
<script type=module crossorigin=anonymous>
    import 'https://esm.run/be-persistent';
</script>
```



