import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import {BePersistentActions, BePersistentProps, BePersistentVirtualProps, PersistenceParams} from './types';
import {register} from 'be-hive/register.js';
import {nudge} from 'trans-render/lib/nudge.js';
import {mergeDeep} from 'trans-render/lib/mergeDeep.js';
import {camelToLisp} from 'trans-render/lib/camelToLisp.js'

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
}


export class BePersistentController implements BePersistentActions {
    #target: Element | undefined;
    intro(proxy: Element & BePersistentVirtualProps, target: Element, beDecorProps: BeDecoratedProps){
        this.#target = target;
        const attr = proxy.getAttribute(`is-${beDecorProps.ifWantsToBe}`)!.trim();
        let params: PersistenceParams;
        if(attr !== ''){
            params = {...defaultSettings};
            const firstChar = attr[0];
            if('[{'.includes(firstChar)){
                //params = Object.assign(params, JSON.parse(attr));
                params = mergeDeep(params, JSON.parse(attr));
            } else {
                params.what = {
                    [attr]: true,
                };
                params.when = {
                    [camelToLisp(attr) + '-changed']: true,
                }
            }
        }else{
            if(target.localName === 'input'){
                params = {...inputSettings};
            }else{
                throw 'NI';//Not Implemented
            }
        }
        proxy.params = params;
    }

    getWhatToStore({params, proxy}: this){
        const {what} = params;
        const whatToStore: any = {};
        for(const key in what){
            const whatKey = what[key];
            switch(typeof whatKey){
                case 'string':
                    whatToStore[whatKey] = (<any>proxy)[key];
                    break;
                case 'boolean':
                    if(whatKey){
                        whatToStore[key] = (<any>proxy)[key];
                    }
                    break;
                default:
                    throw 'NI';//Not Implemented
            }

        }
        return whatToStore;
    }

    setPropsFromStore({params, proxy}: this, val: any){
        const {what} = params;
        for(const key in what){
            const whatKey = what[key];
            switch(typeof whatKey){
                case 'string':
                    (<any>proxy)[key] = val[whatKey] ;
                    break;
                case 'boolean':
                    if(whatKey){
                        (<any>proxy)[key] = val[key]; 
                    }
                    break;
                default:
                    throw 'NI';//Not Implemented
            }

        }
    }

    async onParams({params, proxy}: this){
        const {what, when, where, restoreIf} = params;
        //persist proxy to storage
        let fullPath = proxy.id;
        
        if(where.autogenId){
            const {$hell} = await import('xtal-shell/$hell.js'); //TODO: need a small version of this
            fullPath = $hell.getFullPath(this.#target!);
            if(proxy.id === '') proxy.id = fullPath;
        }
        if(where.idb !== undefined){
            const {set, get} = await import('idb-keyval/dist/index.js');
            for(const evtType in when){
                if(when[evtType]){
                    proxy.addEventListener(evtType, () => {
                        const whatToStore = this.getWhatToStore(this);
                        set(fullPath, whatToStore);
                    });
                }
            }
            if(restoreIf.always){
                const val = await get(fullPath);
                if(val !== undefined){
                    this.setPropsFromStore(this, val);
                }
            }
        }else if(where.sessionStorage !== undefined){
            for(const evtType in when){
                if(when[evtType]){
                    proxy.addEventListener(evtType, () => {
                        const whatToStore = this.getWhatToStore(this);
                        //if(where.sessionStorage){
                        sessionStorage.setItem(fullPath!, JSON.stringify(whatToStore));
                        //}
                    });
                }
            }
            //populate proxy with value from sessionStorage
            if(restoreIf.always){
                const rawString = sessionStorage.getItem(fullPath!);
                if(rawString !== null){
                    const obj = JSON.parse(rawString!);
                    this.setPropsFromStore(this, obj);
                }
                
            }
        }

        nudge(this.#target!);
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