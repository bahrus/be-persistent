// @ts-check
import { resolved, rejected, propInfo} from 'be-enhanced/cc.js';
import { BE } from 'be-enhanced/BE.js';
import {dispatchEvent as de} from 'trans-render/positractions/dispatchEvent.js';

/** @import {BEConfig, IEnhancement, BEAllProps} from './ts-refs/be-enhanced/types.d.ts' */
/** @import {Actions, PAP, AllProps, AP, BAP} from './ts-refs/be-persistent/types.d.ts' */;

/**
 * @implements {Actions}
 * 
 */
class BePersistent extends BE {
    /**
     * @type {BEConfig<BAP, Actions & IEnhancement, any>}
     */
    static config = {
        propInfo: {
            ...propInfo,
            rules: {}
        },
        compacts: {
            when_rules_changes_invoke_hydrate: 0,
        },
        positractions: [resolved, rejected],
        actions: {
            noAttrs: {
                ifNoneOf: ['rules']
            }
        }
    };

    de = de;

    /**
     * 
     * @param {BAP} self 
     */
    async noAttrs(self){
        return /** @type {PAP} */ ({
            rules: [{
                localEvent: 'input',
                localProp: 'value',
                usl: 'sessionStorage://{autogenID}'
            }]
        });
    }

    /**
     * 
     * @param {BAP} self 
     * @returns 
     */
    async hydrate(self){
        return /** @type {PAP} */ ({
            resolved: true
        });
    }
}

await BePersistent.bootUp();
export { BePersistent }

export default BePersistent;