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
                usl: 'sessionStorage://{autoGenId}'
            }]
        });
    }

    /**
     * @type {AbortController}
     */
    #ac;

    /**
     * 
     * @param {BAP} self 
     * @returns 
     */
    async hydrate(self){
        const {rules} = self;
        if(this.#ac !== undefined){
            this.#ac.abort();
        }
        this.#ac = new AbortController();
        const {Binder} = await import('./Binder.js');
        for(const rule of rules){
            new Binder(self, rule, this.#ac);
        }
        return /** @type {PAP} */ ({
            resolved: true
        });
    }

    /**
     * 
     * @param {Element} el 
     */
    async detach(el){
        this.#ac.abort();
        await super.detach(el);
    }
}

await BePersistent.bootUp();
export { BePersistent }
