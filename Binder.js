// @ts-check
/** @import {AP, PersistenceRule} from './types/be-persistent/types' */;

/**
 * Wires one {@link PersistenceRule} to the enhanced element: it listens for the
 * rule's DOM event and writes the element's property to the rule's USL, and on
 * construction reconciles the element's current value with whatever is already
 * stored.
 *
 * @implements {EventListenerObject}
 */
export class Binder {
    /**
     * @type {PersistenceRule}
     */
    #rule;

    /**
     * @type {WeakRef<AP>}
     */
    #selfRef;

    /**
     * Resolves once the constructor's initial reconciliation pass has finished
     * (value read from / written to storage).  Consumers awaiting hydration
     * completion — e.g. the `nudge` opt-in — key off this.
     * @type {Promise<void>}
     */
    whenHydrated;

    /**
     * @param {AP} self
     * @param {PersistenceRule} rule
     * @param {AbortController} ac
     */
    constructor(self, rule, ac){
        this.#rule = rule;
        this.#selfRef = new WeakRef(self);
        const {localEvent} = rule;
        const {enhancedElement} = self;
        enhancedElement.addEventListener(localEvent || 'input', this, {signal: ac.signal});
        this.whenHydrated = this.handleEvent();
    }

    /**
     * @param {Event=} e
     */
    async handleEvent(e){
        const rule = this.#rule;
        const self = this.#selfRef.deref();
        if(self === undefined) return;
        const enhancedElement = /** @type {any} */ (self.enhancedElement);
        let {localProp, usl} = rule;

        /** @type {string} */
        let staticUSL = usl || 'sessionStorage://{autoGenId}';

        if(staticUSL.startsWith('locationHash://')){
            switch(localProp){
                case 'innerHTML':
                case 'outerHTML':
                    throw 'NI';
                case 'unsanitizedInnerHTML': {
                    const evt = new AnythingGoesEvent('securitypolicyviolation');
                    enhancedElement.dispatchEvent(evt);
                    if(!evt.anythingGoes){
                        throw 403;
                    }
                    localProp = 'innerHTML';
                    break;
                }
            }
        }

        if(staticUSL.includes('{autoGenId}')){
            const {getAutoGenId} = await import('be-persistent/getAutoGenId.js');
            staticUSL = staticUSL.replaceAll('{autoGenId}', getAutoGenId(enhancedElement));
        }

        const {get} = await import('fifteenth/get.js');
        const {set} = await import('fifteenth/set.js');
        const prop = localProp || 'value';

        if(e === undefined){
            // Initialization: whichever side has the "more specific" value wins.
            const currentLocalVal = enhancedElement[prop];
            const currentStoreVal = await get(staticUSL);
            switch(breakTie(currentLocalVal, currentStoreVal)){
                case 'eq':
                    return;
                case 'lhs':
                    await set(staticUSL, currentLocalVal);
                    return;
                case 'rhs':
                    enhancedElement[prop] = currentStoreVal;
                    return;
            }
        }

        if(
            e.target === enhancedElement
            || (prop === 'innerHTML' && e.target && enhancedElement.contains(/** @type {Node} */(e.target)))
        ){
            await set(staticUSL, enhancedElement[prop]);
            return;
        }
        throw 'NI';
    }
}

/**
 * Decide which of two values is "more meaningful" so initial reconciliation
 * doesn't clobber real data with a default.  Type specificity ranks
 * object > function > symbol > bigint > number > boolean > string > null > undefined;
 * within a type the longer string representation wins; equal values → no action.
 *
 * Replaces the legacy `trans-render/lib/breakTie.js` import (no modern drop-in).
 *
 * @param {any} lhs local (element) value
 * @param {any} rhs stored value
 * @returns {'eq' | 'lhs' | 'rhs'}
 */
function breakTie(lhs, rhs){
    if(lhs === rhs) return 'eq';
    if(rhs === undefined || rhs === null) return (lhs === undefined || lhs === null) ? 'eq' : 'lhs';
    if(lhs === undefined || lhs === null) return 'rhs';
    const rank = /** @param {any} v */ v => {
        switch(typeof v){
            case 'object': return 8;
            case 'function': return 7;
            case 'symbol': return 6;
            case 'bigint': return 5;
            case 'number': return 4;
            case 'boolean': return 3;
            case 'string': return 2;
            default: return 1;
        }
    };
    const rl = rank(lhs), rr = rank(rhs);
    if(rl !== rr) return rl > rr ? 'lhs' : 'rhs';
    const sl = String(lhs), sr = String(rhs);
    if(sl === sr) return 'eq';
    return sl.length >= sr.length ? 'lhs' : 'rhs';
}

class AnythingGoesEvent extends SecurityPolicyViolationEvent {
    /**
     * @type {boolean}
     */
    anythingGoes = false;
}
