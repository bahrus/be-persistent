import { define } from 'be-decorated/be-decorated.js';
import { register } from 'be-hive/register.js';
import { nudge } from 'trans-render/lib/nudge.js';
import { mergeDeep } from 'trans-render/lib/mergeDeep.js';
const defaultSettings = {
    what: {
        value: true,
    },
    when: {
        input: true,
    },
    where: {
        sessionStorage: true,
        autogenId: true,
    },
    restoreIf: {
        always: true,
    }
};
export class BePersistentController {
    #target;
    intro(proxy, target, beDecorProps) {
        this.#target = target;
        const attr = proxy.getAttribute(`is-${beDecorProps.ifWantsToBe}`).trim();
        let params = { ...defaultSettings };
        if (attr !== '') {
            const firstChar = attr[0];
            if ('[{'.includes(firstChar)) {
                //params = Object.assign(params, JSON.parse(attr));
                params = mergeDeep(params, JSON.parse(attr));
            }
            else {
                params.what.value = attr;
            }
        }
        proxy.params = params;
    }
    getWhatToStore({ params, proxy }) {
        const { what } = params;
        const whatToStore = {};
        for (const key in what) {
            const whatKey = what[key];
            switch (typeof whatKey) {
                case 'string':
                    whatToStore[whatKey] = proxy[key];
                    break;
                case 'boolean':
                    if (whatKey) {
                        whatToStore[key] = proxy[key];
                    }
                    break;
                default:
                    throw 'NI'; //Not Implemented
            }
        }
        return whatToStore;
    }
    setPropsFromStore({ params, proxy }, val) {
        const { what } = params;
        for (const key in what) {
            const whatKey = what[key];
            switch (typeof whatKey) {
                case 'string':
                    proxy[key] = val[whatKey];
                    break;
                case 'boolean':
                    if (whatKey) {
                        proxy[key] = val[key];
                    }
                    break;
                default:
                    throw 'NI'; //Not Implemented
            }
        }
    }
    async onParams({ params, proxy }) {
        const { what, when, where, restoreIf } = params;
        //persist proxy to storage
        let fullPath = proxy.id;
        if (where.autogenId) {
            const { $hell } = await import('xtal-shell/$hell.js'); //TODO: need a small version of this
            fullPath = $hell.getFullPath(this.#target);
            if (proxy.id === '')
                proxy.id = fullPath;
        }
        if (where.idb !== undefined) {
            const { set, get } = await import('idb-keyval/dist/index.js');
            for (const evtType in when) {
                if (when[evtType]) {
                    proxy.addEventListener(evtType, () => {
                        const whatToStore = this.getWhatToStore(this);
                        set(fullPath, whatToStore);
                    });
                }
            }
            if (restoreIf.always) {
                const val = await get(fullPath);
                if (val !== undefined) {
                    this.setPropsFromStore(this, val);
                }
            }
        }
        else if (where.sessionStorage !== undefined) {
            for (const evtType in when) {
                if (when[evtType]) {
                    proxy.addEventListener(evtType, () => {
                        const whatToStore = this.getWhatToStore(this);
                        //if(where.sessionStorage){
                        sessionStorage.setItem(fullPath, JSON.stringify(whatToStore));
                        //}
                    });
                }
            }
            //populate proxy with value from sessionStorage
            if (restoreIf.always) {
                const rawString = sessionStorage.getItem(fullPath);
                if (rawString !== null) {
                    const obj = JSON.parse(rawString);
                    this.setPropsFromStore(this, obj);
                }
            }
        }
        nudge(this.#target);
    }
}
const tagName = 'be-persistent';
const ifWantsToBe = 'persistent';
const upgrade = '*';
define({
    config: {
        tagName,
        propDefaults: {
            upgrade,
            ifWantsToBe,
            noParse: true,
            intro: 'intro',
            virtualProps: ['params']
        },
        actions: {
            onParams: {
                ifAllOf: ['params'],
                async: true,
            },
        }
    },
    complexPropDefaults: {
        controller: BePersistentController
    }
});
register(ifWantsToBe, upgrade, tagName);
