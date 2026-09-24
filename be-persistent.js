// @ts-check
/** @import {Actions, PAP, AllProps, AP, ProPAP, PersistenceRule, PersistenceRuleConfig} from './types/be-persistent/types' */;
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
     * Transfers the attribute-parsed `persistenceRules` into `store` — the
     * property `hydrate` and all programmatic callers read. Invoked by the
     * `when_persistenceRules_changes_call_onPersistenceRulesChange` compact,
     * never called directly and never listed as an action (see the
     * compact/action conflict note in the enhancement-conversion guide).
     * @param {AP} self
     * @returns {PAP}
     */
    onPersistenceRulesChange(self){
        const {persistenceRules} = self;
        if(persistenceRules === undefined) return {};

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
        return {store: rules};
    }

    /**
     * @param {AP} self
     * @returns {ProPAP}
     */
    async hydrate(self){
        const {store, enhancedElement} = self;
        if(store === undefined || enhancedElement === undefined) return {};

        // Tear down any listeners from a previous hydrate pass.
        if(this.#ac !== undefined) this.#ac.abort();
        this.#ac = new AbortController();

        const rules = normalizeStore(store);

        const {Binder} = await import('be-persistent/Binder.js');
        const binders = rules.map(rule => new Binder(self, rule, this.#ac));

        // `be-persistent-nudge` opt-in: once every rule has reconciled the
        // element with its stored value, decrement the element's `disabled`
        // counter (via `assign-gingerly`'s `nudge`) so an input that was
        // disabled purely to block edits pre-hydration becomes usable.
        if(self.nudge){
            await Promise.all(binders.map(b => b.whenHydrated));
            const {nudge} = await import('assign-gingerly/handlers/nudge.js');
            nudge(enhancedElement);
        }
        return {resolved: true};
    }
}

export { BePersistent }

/**
 * Normalizes the three shapes `store` accepts into a flat rule array: a bare
 * USL string is shorthand for `{usl}` (`localProp`/`localEvent` default),
 * a single rule becomes a one-element array, and an array passes through.
 * @param {PersistenceRuleConfig} store
 * @returns {PersistenceRule[]}
 */
function normalizeStore(store){
    if(typeof store === 'string') return [{usl: store}];
    if(Array.isArray(store)) return store;
    return [store];
}
