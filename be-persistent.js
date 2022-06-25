import { define } from 'be-decorated/be-decorated.js';
import { register } from 'be-hive/register.js';
import { nudge } from 'trans-render/lib/nudge.js';
import { mergeDeep } from 'trans-render/lib/mergeDeep.js';
import { camelToLisp } from 'trans-render/lib/camelToLisp.js';
const defaultSettings = {
    where: {
        sessionStorage: true,
        autogenId: true,
    },
    restoreIf: {
        always: true,
    }
};
const inputSettings = {
    ...defaultSettings,
    what: {
        value: true,
    },
    when: {
        input: true,
    },
    eventToFire: {
        type: 'input',
        bubbles: true,
        cancelable: true,
        composed: true,
    }
};
export class BePersistentController {
    #target;
    intro(proxy, target, beDecorProps) {
        this.#target = target;
        const attr = proxy.getAttribute(`is-${beDecorProps.ifWantsToBe}`).trim();
        let params;
        if (attr !== '') {
            params = { ...defaultSettings };
            const firstChar = attr[0];
            if ('[{'.includes(firstChar)) {
                //params = Object.assign(params, JSON.parse(attr));
                params = mergeDeep(params, JSON.parse(attr));
            }
            else {
                params.what = {
                    [attr]: true,
                };
                params.when = {
                    [camelToLisp(attr) + '-changed']: true,
                };
            }
        }
        else {
            if (target.localName === 'input') {
                params = { ...inputSettings };
            }
            else {
                throw 'NI'; //Not Implemented
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
        const { what, eventToFire } = params;
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
        if (eventToFire !== undefined) {
            proxy.dispatchEvent(new Event(eventToFire.type, eventToFire));
        }
    }
    async onParams({ params, proxy }) {
        const { what, when, where, restoreIf, persistOnUnload } = params;
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
            if (persistOnUnload) {
                window.addEventListener('beforeunload', e => {
                    const whatToStore = this.getWhatToStore(this);
                    set(fullPath, whatToStore);
                });
            }
        }
        else if (where.sessionStorage !== undefined) {
            for (const evtType in when) {
                if (when[evtType]) {
                    proxy.addEventListener(evtType, () => {
                        const whatToStore = this.getWhatToStore(this);
                        sessionStorage.setItem(fullPath, JSON.stringify(whatToStore));
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
            if (persistOnUnload) {
                window.addEventListener('beforeunload', e => {
                    const whatToStore = this.getWhatToStore(this);
                    sessionStorage.setItem(fullPath, JSON.stringify(whatToStore));
                });
            }
        }
        nudge(this.#target);
    }
    finale(proxy, target, beDecorProps) {
        console.log('in finale');
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
            finale: 'finale',
            virtualProps: ['params']
        },
        actions: {
            onParams: {
                ifAllOf: ['params'],
            },
        }
    },
    complexPropDefaults: {
        controller: BePersistentController
    }
});
register(ifWantsToBe, upgrade, tagName);
