//@ts-check

/** @import {EMC} from './types/mount-observer/types' */;
/** @import {AllProps, Actions} from './types/be-persistent/types' */
/** @import {RAConfig} from './types/roundabout/types' */
/** @import {PatternConfig} from './types/nested-regex-groups/types' */

/**
 * Flat-structure patterns for `parse-grouped-capture-statements`.
 * Ordered most-specific first — the first match wins.  A missing statement
 * (empty attribute) yields an empty `statements` array, handled by `hydrate`.
 *
 * The DOM event that triggers a save is specified in one of two ways, matching
 * the sibling packages:
 *   - `@<event>` suffixed onto the property, à la
 *     [`be-switched`](https://github.com/bahrus/be-switched#specifying-event-names)
 *     (`of value@keyup via ...`);
 *   - a trailing `on <event>` clause, à la
 *     [`do-inc`](https://github.com/bahrus/do-inc#specifying-the-event-to-trigger-increment)
 *     (`of value via ... on keyup`).
 * When neither is given the event defaults to `input` (in `Binder`).
 * Event names may contain hyphens (`on weight-change`).
 *
 * The legacy `<prop>::<event>` form is gone with no fallback — `localProp` no
 * longer admits `:`, so a stray `::` statement simply fails to match.
 *
 * @type {PatternConfig[]}
 */
const parsePatterns = [
    {
        name: 'ofLocalPropAtLocalEventViaUSL',
        pattern: String.raw`^[oO]f (?<localProp>[\w]+)@(?<localEvent>[\w-]+) via (?<usl>\S+)$`,
        description: 'of <prop>@<event> via <usl>'
    },
    {
        name: 'ofLocalPropViaUSLOnLocalEvent',
        pattern: String.raw`^[oO]f (?<localProp>[\w]+) via (?<usl>\S+) on (?<localEvent>[\w-]+)$`,
        description: 'of <prop> via <usl> on <event>'
    },
    {
        name: 'ofLocalPropViaUSL',
        pattern: String.raw`^[oO]f (?<localProp>[\w]+) via (?<usl>\S+)$`,
        description: 'of <prop> via <usl>'
    },
    {
        name: 'viaUSLOnLocalEvent',
        pattern: String.raw`^[vV]ia (?<usl>\S+) on (?<localEvent>[\w-]+)$`,
        description: 'via <usl> on <event>'
    },
    {
        name: 'viaUSL',
        pattern: String.raw`^[vV]ia (?<usl>\S+)$`,
        description: 'via <usl>'
    }
];

/**
 * @type {EMC<any, AllProps, Element, RAConfig<AllProps, Actions> >}
 */
export const emc = {
    enhConfig: {
        enhKey: 'bePersistent',
        spawn: 'be-persistent/be-persistent.js',
        withAttrs: {
            base: 'be-persistent',
            _base: {
                mapsTo: 'persistenceRules',
                parser: 'parse-grouped-capture-statements',
                instanceOf: 'Array',
                parserConfig: parsePatterns
            },
            // Opt-in: `<input disabled be-persistent="…" be-persistent-nudge>`.
            // Presence re-enables the element once its value is rehydrated.
            nudge: '${base}-nudge',
            _nudge: {
                instanceOf: 'Boolean'
            }
        }
    },
    customData: {
        weakRef: {
            properties: ['enhancedElement']
        },
        actions: {
            hydrate: {
                ifKeyIn: ['persistenceRules', 'initialized'],
                ifAllOf: ['enhancedElement', 'initialized']
            }
        }
    }
};

export function render(){
    return JSON.stringify(emc, null, 4);
}

console.log(render());
