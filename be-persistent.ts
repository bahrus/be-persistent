import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import {BePersistentActions, BePersistentProps, BePersistentVirtualProps, PersistenceParams} from './types';
import {register} from 'be-hive/register.js';

const defaultSettings: PersistenceParams = {
  what:{
      value: true,
  },
  when:{
      input: true,
  },
  where:{
      sessionStorage: true,
      autogenId: true,
  }
}
export class BePersistentController implements BePersistentActions {
    #target: Element | undefined;
    intro(proxy: Element & BePersistentVirtualProps, target: Element, beDecorProps: BeDecoratedProps){
        this.#target = target;
        const attr = proxy.getAttribute(`is-${beDecorProps.ifWantsToBe}`)!.trim();
        let params: PersistenceParams = {...defaultSettings};
        if(attr !== ''){
            const firstChar = attr[0];
            if('[{'.includes(firstChar)){
                params = Object.assign(params, JSON.parse(attr));
            } else {
                params.what.value = attr;
            }
        }
        proxy.params = params;
    }



    async onParams({params, proxy}: this){
        const {what, when, where} = params;
        //persist proxy to storage
        let fullPath = proxy.id;
        if(where.autogenId){
            const {$hell} = await import('xtal-shell/$hell.js'); //TODO: need a small version of this
            fullPath = $hell.getFullPath(this.#target!);
            if(proxy.id === '') proxy.id = fullPath;
        }
        if(where.sessionStorage !== undefined){

            for(const evtType in when){
                if(when[evtType]){
                    proxy.addEventListener(evtType, () => {
                        if(what.value){
                            if(where.sessionStorage){
                                sessionStorage.setItem(fullPath!, (<any>proxy).value);
                            }
                        }
                    });
                }
            }
            //populate proxy with value from sessionStorage
            //written entirely by copilot!
            if(what.value && where.sessionStorage){
                const value = sessionStorage.getItem(fullPath!);
                if(value){
                    (<any>proxy).value = value;
                }
            }
        }

        
    }
}

export interface BePersistentController extends BePersistentProps{}

const tagName = 'be-persistent';
const ifWantsToBe = 'persistent';
const upgrade = '*';

define<
    BePersistentProps & BeDecoratedProps<BePersistentProps, BePersistentActions>,
    BePersistentActions
>({
    config:{
        tagName,
        propDefaults:{
            upgrade,
            ifWantsToBe,
            noParse: true,
            forceVisible: true,
            intro: 'intro',
            virtualProps: ['params']
        },
        actions:{
            onParams: {
                ifAllOf: ['params'],
                async: true,
            },
        }
    },
    complexPropDefaults:{
        controller: BePersistentController
    }
});
register(ifWantsToBe, upgrade, tagName);