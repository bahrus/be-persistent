//@ts-check

/** @import {EMC} from './types/mount-observer/types' */;
/** @import {AllProps, Actions} from './types/be-persistent/types' */
/** @import {RAConfig} from './types/roundabout/types' */
/** @import {PatternConfig} from './types/nested-regex-groups/types' */

/**
 * Flat-structure patterns for `parse-grouped-capture-statements`.
 * Ported from the legacy `emc.js` `regExpExts.rules` regexes.  Ordered
 * most-specific first — the first match wins.  A missing statement (empty
 * attribute) yields an empty `statements` array, handled by `hydrate`.
 *
 * @type {PatternConfig[]}
 */
const parsePatterns = [
    {
        name: 'ofLocalPropLocalEventViaUSL',
        pattern: String.raw`^[oO]f (?<localProp>[\w:]+)::(?<localEvent>\w+) via (?<usl>\S+)$`,
        description: 'of <prop>::<event> via <usl>'
    },
    {
        name: 'ofLocalPropViaUSL',
        pattern: String.raw`^[oO]f (?<localProp>[\w:]+) via (?<usl>\S+)$`,
        description: 'of <prop> via <usl>'
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
