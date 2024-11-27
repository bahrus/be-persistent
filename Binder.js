// @ts-check
/** @import {
 * Actions, PAP, AllProps, AP, BAP, PersistenceRule
 * } from './ts-refs/be-persistent/types.d.ts' 
 * */;

 /**
  * @implements {EventListenerObject}
  */
export class Binder{
    /**
     * @type {PersistenceRule}
     */
    #rule;


    /**
     * @param {BAP} self
     * @param {PersistenceRule} rule 
     * @param {AbortController} ac
     */
    constructor(self, rule, ac){
        this.#rule = rule;
        const {localEvent} = rule;
        const {enhancedElement} = self;
        enhancedElement.addEventListener(localEvent || 'input', this);
        this.handleEvent();
    }

    get location(){
        return location.origin + location.pathname + '?' + location.search;
    }

    handleEvent(){

    }
}