// @ts-check

/**
 * Build a location-independent DOM path for `el`, walking up to `<body>`.
 *
 * Condensed port of `xtal-shell`'s `$hell.getFullPath` — the legacy
 * implementation depended on that whole package (with heavy import-time side
 * effects) just for this one function.  The token format aims to match the
 * legacy output for the common cases (`/input`, `/div[2]`, `/span#"my-id"`);
 * for deeply nested / ambiguous DOM structures it may diverge — see
 * `Chats/Conversion.md`.
 *
 * @param {Element} el
 * @returns {string}
 */
export function getFullPath(el){
    /** @type {string[]} */
    const segs = [];
    /** @type {Element | null} */
    let cur = el;
    while(cur && cur.tagName !== 'BODY'){
        segs.push(tokenFor(cur));
        const parent = cur.parentNode;
        cur = parent && parent.nodeType === 11
            ? /** @type {any} */ (parent).host
            : /** @type {Element | null} */ (parent);
    }
    segs.reverse();
    return '/' + segs.join('/');
}

/**
 * @param {Element} el
 * @returns {string}
 */
function tokenFor(el){
    const name = el.tagName.toLowerCase();
    if(el.id){
        let id = el.id;
        if(/[[\]#/]/.test(id)) id = '"' + id + '"';
        return name + '#' + id;
    }
    const parent = el.parentElement;
    if(!parent) return name;
    const sameTag = Array.from(parent.children).filter(c => c.tagName === el.tagName && !c.id);
    if(sameTag.length <= 1) return name;
    return name + '[' + sameTag.indexOf(el) + ']';
}

/** @param {string} s */
const cleanse = s => s.replaceAll(':', '_sc_').replaceAll('/', '_slash_');

/**
 * Full `{autoGenId}` replacement for `el`: a cleansed key for the current
 * page location, joined by `__` to the cleansed, location-independent DOM path.
 *
 * @param {Element} el
 * @returns {string}
 */
export function getAutoGenId(el){
    const locationKey = location.origin + location.pathname + '_q_' + location.search;
    const locationLessPath = getFullPath(el).replaceAll('/', '_slash_');
    return cleanse(locationKey) + '__' + cleanse(locationLessPath);
}
