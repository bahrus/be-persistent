// @ts-check
/** @import {
 * Actions, PAP, AllProps, AP, BAP, PersistenceRule
 * } from './ts-refs/be-persistent/types.d.ts' 
 * */
 /** @import {USL} from './ts-refs/trans-render/XV/types' */

 /**
  * @implements {EventListenerObject}
  */
export class Binder{
    /**
     * @type {PersistenceRule}
     */
    #rule;

    /**
     * @type {WeakRef<BAP>}
     */
    #selfRef;

    /**
     * @param {BAP} self
     * @param {PersistenceRule} rule 
     * @param {AbortController} ac
     */
    constructor(self, rule, ac){
        this.#rule = rule;
        this.#selfRef = new WeakRef(self);
        const {localEvent} = rule;
        const {enhancedElement} = self;
        enhancedElement.addEventListener(localEvent || 'input', this, {signal: ac.signal});
        this.handleEvent();
    }



    /**
     * 
     * @param {Event=} e 
     */
    async handleEvent(e){
        const rule = this.#rule;
        const self = this.#selfRef.deref();
        if(self === undefined) return;
        const {enhancedElement} = self;
        const {localProp, usl} = rule;
        const {get} = await import('trans-render/XV/get.js');
        const {set} = await import('trans-render/XV/set.js');
        /**
         * @type  {USL}
         */
        let staticUSL = usl || 'sessionStorage://{autoGenId}';
        if(staticUSL.includes('{autoGenId}')){
            const {$hell} = await import('xtal-shell/$hell.js'); //TODO: need a small version of this
            const locationLessPath = $hell.getFullPath(enhancedElement).replaceAll('/', '_slash_');
            const fullPath = cleanse(locationKey) + '__' + cleanse(locationLessPath);
            staticUSL = /** @type {USL} */ (staticUSL.replaceAll('{autoGenId}', fullPath));
        }
        if(e === undefined){
            //initialization
            const currentLocalVal = enhancedElement[localProp || 'value'];
            const currentStoreVal = await get(staticUSL);
            const {breakTie} = await import('trans-render/lib/breakTie.js');
            const bt = breakTie(currentLocalVal, currentStoreVal);
            switch(bt){
                case 'eq':
                    return;
                case 'lhs':
                    await set(staticUSL, currentLocalVal);
                    return;
                case 'rhs':
                    enhancedElement[localProp || 'value'] = currentStoreVal;
                    return; 

            }
        }
        throw 'NI';
    }
}

function cleanse(s){
    return s.replaceAll(':', '_sc_').replaceAll('/', '_slash_');
}

const locationKey  = location.origin + location.pathname + '_q_' + location.search



