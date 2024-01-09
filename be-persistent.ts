import {BE, propDefaults, propInfo} from 'be-enhanced/BE.js';
import {BEConfig} from 'be-enhanced/types';
import {XE} from 'xtal-element/XE.js';
import {Actions, AllProps, AP, PAP, ProPAP, POA, PersistenceParams} from './types';

export class BePersistent extends BE<AP, Actions> implements Actions{
    static  override get beConfig(){
        return {
            parse: true,
            primaryProp: 'to',
            isParsedProp: 'isParsed',
        } as BEConfig;
    }

    async hydrate(self: this): ProPAP{
        const {persistenceParams} = self;
        return {
            resolved: true,
        }
    }

    mergeParams(self: this, x: PersistenceParams): PersistenceParams{
        const {enhancedElement} = this;
        if(enhancedElement instanceof HTMLInputElement || enhancedElement instanceof HTMLTextAreaElement){
            return {
                ...defaultSettings,
                ...inputSettings,
                ...x,
            }
        }
        return {
            ...defaultSettings,
            ...x,
        }
    }

    async parameterize(self: this): ProPAP {
        const {params} = self;
        switch(typeof params){
            case 'object':
                if(Array.isArray(params)){
                    return {
                        persistenceParams: params.map(x => this.mergeParams(self, x))
                    }
                }
                return {
                    persistenceParams: [this.mergeParams(self, params)]
                }
            case 'undefined':{
                return {
                    persistenceParams:  [this.mergeParams(self, {} as PersistenceParams)]
                };
            }
        }

    }
}

export interface BePersistent extends AllProps{}

export const tagName = 'be-persistent';

const xe = new XE<AP, Actions>({
    config: {
        tagName,
        isEnh: true,
        propDefaults: {
            ...propDefaults,
        },
        propInfo: {
            ...propInfo
        },
        actions: {
            parameterize: 'isParsed',
            hydrate: 'persistenceParams'
        }
    },
    superclass: BePersistent
});

const defaultSettings: PersistenceParams = {
    where:{
        sessionStorage: true,
        autogenId: true,
    },
    restoreIf:{
        always: true,
    }
  }
  
  const inputSettings: PersistenceParams = {
      ...defaultSettings,
      what:{
          value: true,
      },
      when:{
          input: true,
      },
      eventToFire:{
          type: 'input',
          bubbles: true,
          cancelable: true,
          composed: true,
      }
  }
