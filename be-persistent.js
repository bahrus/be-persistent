// @ts-check
/** @import {Actions, PAP, AllProps, AP, ProPAP, PersistenceRule} from './types/be-persistent/types' */;
/** @import {RoundaboutOptions} from './types/roundabout/types' */;
/** @import {ElementEnhancementGateway, SpawnContext} from './types/assign-gingerly/types' */;
/** @import {EMC} from './types/mount-observer/types' */;
/** @import {RAConfig} from './types/roundabout/types' */;

/**
 * @implements {Actions}
 */
class BePersistent {

    /**
     * @this {AllProps & Actions}
     * @param {Element & ElementEnhancementGateway} enhancedElement
     * @param {SpawnContext} ctx
     * @param {PAP} initVals
     */
    constructor(enhancedElement, ctx, initVals){
        this.init(this, enhancedElement, ctx, initVals);
    }

    /**
     * @param {AllProps} self
     * @param {Element & ElementEnhancementGateway} enhancedElement
     * @param {SpawnContext} ctx
     * @param {PAP} initVals
     */
    async init(self, enhancedElement, ctx, initVals){
        const {customData} = /** @type {EMC<any, AllProps, Element, RAConfig<AllProps, Actions>>} */ (ctx.emc);
        /**
         * @type {RoundaboutOptions}
         */
        const raOptions = {
            ...customData,
            vm: self,
            initialPropVals: {
                enhancedElement,
                ...customData?.defaultPropVals,
                ...initVals
            }
        };
        (await import('roundabout-lib/roundabout.js')).roundabout(raOptions);
        self.initialized = true;
    }

    /**
     * @type {AbortController | undefined}
     */
    #ac;

    /**
     * @param {AP} self
     * @returns {ProPAP}
     */
    async hydrate(self){
        const {persistenceRules, enhancedElement} = self;
        if(persistenceRules === undefined || enhancedElement === undefined) return {};

        // Tear down any listeners from a previous hydrate pass.
        if(this.#ac !== undefined) this.#ac.abort();
        this.#ac = new AbortController();

        /** @type {PersistenceRule[]} */
        const rules = [];
        for(const statement of persistenceRules.statements){
            if(statement.value !== undefined) rules.push(statement.value);
        }
        // Empty attribute (`<input be-persistent>`): fall back to the single
        // default rule the legacy `noAttrs` action used to synthesize.
        if(rules.length === 0){
            rules.push({localProp: 'value', localEvent: 'input', usl: 'sessionStorage://{autoGenId}'});
        }

        const {Binder} = await import('be-persistent/Binder.js');
        for(const rule of rules){
            new Binder(self, rule, this.#ac);
        }
        return {resolved: true};
    }
}

export { BePersistent }
