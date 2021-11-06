import {define, BeDecoratedProps} from 'be-decorated/be-decorated.js';
import {BePersistentActions, BePersistentProps, BePersistentVirtualProps, PersistenceParams} from './types';

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
                    "value": true,
                },
                when:['input'],
                where:{
                    sessionStorage: true,
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
            intro: 'intro'
        }
    },
    complexPropDefaults:{
        controller: BePersistentController
    }
});