import myJSON from './emc.json' with {type: 'json'};

/** @import {EMC} from './types/mount-observer/types' */;
/** @import {AllProps} from './types/be-persistent/types' */

/**
 * Emoji-shorthand variant of the be-persistent EMC.  Spreads the whole base
 * config (so `customData` comes along) and only overrides `enhKey` / `base`.
 *
 * @type {EMC<any, AllProps> }
 */
const emc = {
    ...myJSON,
    enhConfig: {
        ...myJSON.enhConfig,
        enhKey: '💾',
        withAttrs: {
            ...myJSON.enhConfig.withAttrs,
            base: '💾'
        }
    }
};

export function render(){
    return JSON.stringify(emc, null, 4);
}

console.log(render());
