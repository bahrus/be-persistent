// @ts-check
import { BeHive, seed } from 'be-hive/be-hive.js';
import { MountObserver } from 'mount-observer/MountObserver.js';
/** @import {EMC} from './ts-refs/trans-render/be/types' */
/** @import {Actions, PAP, AllProps, AP} from './ts-refs/be-literate/types' */;

/**
 * @type {EMC<any, AP>}
 */
export const emc = {
    base: 'be-persistent',
    enhPropKey: 'bePersistent',
    map: {

    },
    importEnh: async () => {
        const BePersistent  = 
        /** @type {{new(): IEnhancement<Element>}} */ 
        /** @type {any} */
        (await import('./be-persistent.js'));
        return BePersistent;
    }
};

const mose = seed(emc);
MountObserver.synthesize(document, BeHive, mose);