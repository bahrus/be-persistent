import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import {Actions, PP, Proxy, VirtualProps, PersistenceParams} from './types';
import {register} from 'be-hive/register.js';
import {nudge} from 'trans-render/lib/nudge.js';
import {mergeDeep} from 'trans-render/lib/mergeDeep.js';
import {camelToLisp} from 'trans-render/lib/camelToLisp.js';
import {beatify} from 'be-hive/beatify.js';

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


export class BePersistent extends EventTarget implements Actions {
    intro(proxy: Proxy, target: Element, beDecorProps: BeDecoratedProps){
        const attr = proxy.getAttribute(`is-${beDecorProps.ifWantsToBe}`)!.trim();
        let params: PersistenceParams = target.localName === 'input' ? {...inputSettings} : {...defaultSettings};
        if(attr !== ''){
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
            if(target.localName !== 'input'){
                throw 'NI';//Not Implemented
            }
        }
        proxy.params = params;
    }

    getWhatToStore({params, proxy}: PP){
        const {what} = params!;
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
                case 'object':
                    if(whatKey.beBeatified){
                        if(key !== 'innerHTML') throw 'NI'; //Not Implemented
                        const val = (<any>proxy)[key];
                        const templ = document.createElement('template');
                        templ.innerHTML = val;
                        
                        const beHive = (proxy.getRootNode() as ShadowRoot).querySelector('be-hive') as Element;
                        beatify(templ.content, beHive);
                        const clone = templ.content.cloneNode(true);
                        const div = document.createElement('div');
                        div.appendChild(clone)
                        const outerHTML = div.innerHTML;
                        whatToStore[key] = outerHTML;
                    }else{
                        throw 'NI';
                    }
                    break;
                default:
                    throw 'NI';//Not Implemented
            }

        }
        return whatToStore;
    }

    setPropsFromStore({params, proxy}: PP, val: any){
        const {what, eventToFire} = params!;
        for(const key in what){
            const whatKey = what[key];
            switch(typeof whatKey){
                case 'string':
                    (<any>proxy)[key] = val[whatKey] ;
                    break;
                case 'object':
                case 'boolean':
                    if(whatKey){
                        (<any>proxy)[key] = val[key]; 
                    }
                    break;
                default:
                    throw 'NI';//Not Implemented
            }

        }
        if(eventToFire !== undefined){
            proxy.dispatchEvent(new Event(eventToFire.type, eventToFire));
        }
    }

    get location(){
        return location.origin + location.pathname + '?' + location.search;
    }

    async onParams(pp: PP){
        const {params, proxy, self} = pp;
        const {what, when, where, restoreIf, persistOnUnload} = params!;
        //persist proxy to storage
        let fullPath = proxy.id;
        let locationLessPath = proxy.id;
        if(where.autogenId){
            const {$hell} = await import('xtal-shell/$hell.js'); //TODO: need a small version of this
            locationLessPath = $hell.getFullPath(self);
            fullPath = this.location + ':' + locationLessPath;
            if(proxy.id === '') proxy.id = fullPath;
        }
        let restored = false;
        if(where.idb){
            const {set, get} = await import('idb-keyval/dist/index.js');
            for(const evtType in when){
                if(when[evtType]){
                    proxy.addEventListener(evtType, async () => {
                        const whatToStore = await this.getWhatToStore(pp);
                        set(fullPath, whatToStore);
                    });
                }
            }
            if(restoreIf.always){
                const val = await get(fullPath);
                if(val !== undefined){
                    restored = true;
                    this.setPropsFromStore(pp, val);
                }
            }
            if(persistOnUnload){
                window.addEventListener('beforeunload', e => {
                    const whatToStore = this.getWhatToStore(pp);
                    set(fullPath, whatToStore);
                });
            }
        }
        if(where.sessionStorage){
            for(const evtType in when){
                if(when[evtType]){
                    proxy.addEventListener(evtType, async () => {
                        const whatToStore = await this.getWhatToStore(pp);
                        sessionStorage.setItem(fullPath!, JSON.stringify(whatToStore));
                    });
                }
            }
            //populate proxy with value from sessionStorage
            if(restoreIf.always && !restored){
                const rawString = sessionStorage.getItem(fullPath!);
                if(rawString !== null){
                    restored = true;
                    const obj = JSON.parse(rawString!);
                    this.setPropsFromStore(pp, obj);
                }
                
            }
            if(persistOnUnload){
                window.addEventListener('beforeunload', e => {
                    const whatToStore = this.getWhatToStore(pp);
                    sessionStorage.setItem(fullPath!, JSON.stringify(whatToStore));
                });
            }
        }
        if(where.hash){
            
            for(const evtType in when){
                if(when[evtType]){
                    proxy.addEventListener(evtType, async  () => {
                        const whatToStore = await this.getWhatToStore(pp);
                        const {setItem} = await import('./hash.js');
                        setItem(locationLessPath, whatToStore);
                    })
                }
            }
            if(restoreIf.always && !restored){
                const {getItem} = await import('./hash.js');
                const obj = getItem(locationLessPath);
                if(obj !== null) this.setPropsFromStore(pp, obj);
            }
            if(persistOnUnload){
                const {setItem} = await import('./hash.js');
                window.addEventListener('beforeunload', e => {
                    const whatToStore = this.getWhatToStore(pp);
                    setItem(locationLessPath, JSON.stringify(whatToStore));
                });
            }
        }

        nudge(self);
        proxy.resolved = true;
    }

}


const tagName = 'be-persistent';
const ifWantsToBe = 'persistent';
const upgrade = '*';

define<VirtualProps & BeDecoratedProps<VirtualProps, Actions>, Actions>({
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
            },
        }
    },
    complexPropDefaults:{
        controller: BePersistent
    }
});
register(ifWantsToBe, upgrade, tagName);