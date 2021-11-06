import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import {BePersistentActions, BePersistentProps, BePersistentVirtualProps, PersistenceParams} from './types';
import {register} from 'be-hive/register.js';

export class BePersistentController implements BePersistentActions {
    intro(proxy: Element & BePersistentVirtualProps, target: Element, beDecorProps: BeDecoratedProps){
        const attr = proxy.getAttribute(`is-${beDecorProps.ifWantsToBe}`)!.trim();
        const firstChar = attr[0];
        let params: PersistenceParams;
        if('[{'.includes(firstChar)){
            params = JSON.parse(attr);
        } else {
            params = {
                what:{
                    value: true,
                },
                when:{
                    input: true,
                },
                where:{
                    sessionStorage: true,
                }
            }
        }
        proxy.params = params;
    }

    onParams({params, proxy}: this){
        const {what, when, where} = params;
        for(const evtType in when){
            if(when[evtType]){
                proxy.addEventListener(evtType, () => {
                    if(what.value){
                        if(where.sessionStorage){
                            sessionStorage.setItem(proxy.id, (<any>proxy).value);
                        }
                    }
                });
            }
        }
        //populate proxy with value from sessionStorage
        //written entirely by copilot!
        if(what.value && where.sessionStorage){
            const value = sessionStorage.getItem(proxy.id);
            if(value){
                (<any>proxy).value = value;
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
                ifAllOf: ['params']
            },
        }
    },
    complexPropDefaults:{
        controller: BePersistentController
    }
});
register(ifWantsToBe, upgrade, tagName);