# be-persistent (💾)

<p align="center">
<img src="https://github.com/bahrus/be-persistent/raw/baseline/9bhbww.jpg" alt="Where are my cookies?" width="400" style="max-width: 100%;">
</p>



[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/be-persistent?style=for-the-badge)](https://bundlephobia.com/result?p=be-persistent)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/be-persistent?compression=gzip">
[![NPM version](https://badge.fury.io/js/be-persistent.png)](http://badge.fury.io/js/be-persistent)
[![Playwright Tests](https://github.com/bahrus/be-persistent/actions/workflows/CI.yml/badge.svg?branch=baseline)](https://github.com/bahrus/be-persistent/actions/workflows/CI.yml)


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
<input be-persistent="of value@input via sessionStorage://{autoGenId}.">
```

The fragment "of value" is assumed if not provided.

Also, the event "input" is assumed if not provided.

The end of the statement above: "sessionStorage://{autoGenId}" is a [Uniform Storage Locator](https://github.com/bahrus/fifteenth#readme), resolved by the [`fifteenth`](https://github.com/bahrus/fifteenth) package.  `{autoGenId}` is expanded at runtime to a location-independent DOM path so each element gets its own stable key.

We can apply multiple statemtns within the be-persistent attribute, separated by the "period".  Each sentence can start with "of" or "Of".

## Specifying the event name

The DOM event that triggers a save is spelled the same two ways the sibling
packages allow.  Attach it to the property with `@`, the way
[`be-switched`](https://github.com/bahrus/be-switched#specifying-event-names) does:

```html
<input be-persistent="of value@change via sessionStorage://{autoGenId}.">
```

...or trail an `on <event>` clause, the way
[`do-inc`](https://github.com/bahrus/do-inc#specifying-the-event-to-trigger-increment) does:

```html
<input be-persistent="of value via sessionStorage://{autoGenId} on change.">
```

Both forms are equivalent, and `on my-custom-event` / `@my-custom-event` (hyphens
allowed) work for any event name.  The old `::` separator is no longer supported.

## Emoji alternative

```html
<input 💾="of value@input via sessionStorage://{autoGenId}.">
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



## Viewing Locally

Any web server that serves static files with server-side includes will do but...

1. Install git
2. Fork/clone this repo
3. Install node.js
4. Open command window to folder where you cloned this repo
5. > git submodule add https://github.com/bahrus/types.git types
6. > git submodule update --init --recursive
7. > npm install
8. > npm run build
9. > npm run serve
10. Open http://localhost:8000/demo/ in a modern browser (Chrome 146+ — JSON module imports with type assertion are required)

## Running Tests

```
> npm run test
```


