import { define } from 'be-decorated/be-decorated.js';
import { register } from 'be-hive/register.js';
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
                params = Object.assign(params, JSON.parse(attr));
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
    async onParams({ params, proxy }) {
        const { what, when, where } = params;
        //persist proxy to storage
        let fullPath = proxy.id;
        if (where.autogenId) {
            const { $hell } = await import('xtal-shell/$hell.js'); //TODO: need a small version of this
            fullPath = $hell.getFullPath(this.#target);
            if (proxy.id === '')
                proxy.id = fullPath;
        }
        if (where.sessionStorage !== undefined) {
            for (const evtType in when) {
                if (when[evtType]) {
                    proxy.addEventListener(evtType, () => {
                        const whatToStore = this.getWhatToStore(this);
                        if (where.sessionStorage) {
                            sessionStorage.setItem(fullPath, JSON.stringify(whatToStore));
                        }
                    });
                }
            }
            //populate proxy with value from sessionStorage
            if (what.value && where.sessionStorage) {
                const value = sessionStorage.getItem(fullPath);
                if (value) {
                    proxy.value = value;
                }
            }
        }
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
            forceVisible: true,
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
