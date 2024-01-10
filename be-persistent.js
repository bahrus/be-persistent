import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
export class BePersistent extends BE {
    static get beConfig() {
        return {
            parse: true,
            primaryProp: 'params',
            isParsedProp: 'isParsed',
        };
    }
    get location() {
        return location.origin + location.pathname + '?' + location.search;
    }
    getWhatToStore(self, params) {
        const { what } = params;
        const { enhancedElement } = self;
        const whatToStore = {};
        for (const key in what) {
            const whatKey = what[key];
            switch (typeof whatKey) {
                case 'string':
                    whatToStore[whatKey] = enhancedElement[key];
                    break;
                case 'boolean':
                    if (whatKey) {
                        whatToStore[key] = enhancedElement[key];
                    }
                    break;
                case 'object':
                    // if(whatKey.beBeatified){
                    //     if(key !== 'innerHTML') throw 'NI'; //Not Implemented
                    //     const val = (<any>enhancedElement)[key];
                    //     const templ = document.createElement('template');
                    //     templ.innerHTML = val;
                    //     const beHive = (enhancedElement.getRootNode() as ShadowRoot).querySelector('be-hive') as Element;
                    //     const clone = templ.content.cloneNode(true);
                    //     const div = document.createElement('div');
                    //     div.appendChild(clone)
                    //     const outerHTML = div.innerHTML;
                    //     whatToStore[key] = outerHTML;
                    // }else{
                    throw 'NI';
                    // }
                    break;
                default:
                    throw 'NI'; //Not Implemented
            }
        }
        return whatToStore;
    }
    setPropsFromStore(self, params, val) {
        const { enhancedElement } = self;
        const { what, eventToFire } = params;
        for (const key in what) {
            const whatKey = what[key];
            switch (typeof whatKey) {
                case 'string':
                    enhancedElement[key] = val[whatKey];
                    break;
                case 'object':
                case 'boolean':
                    if (whatKey) {
                        enhancedElement[key] = val[key];
                    }
                    break;
                default:
                    throw 'NI'; //Not Implemented
            }
        }
        if (eventToFire !== undefined) {
            enhancedElement.dispatchEvent(new Event(eventToFire.type, eventToFire));
        }
    }
    async hydrate(self) {
        const { persistenceParams, enhancedElement } = self;
        for (const params of persistenceParams) {
            const { what, when, where, restoreIf, persistOnUnload, nudge: n } = params;
            //persist proxy to storage
            let fullPath = enhancedElement.id;
            let locationLessPath = enhancedElement.id;
            if (where.autogenId) {
                const { $hell } = await import('xtal-shell/$hell.js'); //TODO: need a small version of this
                locationLessPath = $hell.getFullPath(enhancedElement);
                fullPath = this.location + ':' + locationLessPath;
                if (enhancedElement.id === '')
                    enhancedElement.id = fullPath;
            }
            let restored = false;
            if (where.idb) {
                const { set, get } = await import('idb-keyval/dist/index.js');
                for (const evtType in when) {
                    if (when[evtType]) {
                        enhancedElement.addEventListener(evtType, async () => {
                            const whatToStore = await this.getWhatToStore(self, params);
                            set(fullPath, whatToStore);
                        });
                    }
                }
                if (restoreIf.always) {
                    const val = await get(fullPath);
                    if (val !== undefined) {
                        restored = true;
                        this.setPropsFromStore(self, params, val);
                    }
                }
                if (persistOnUnload) {
                    window.addEventListener('beforeunload', e => {
                        const whatToStore = this.getWhatToStore(self, params);
                        set(fullPath, whatToStore);
                    });
                }
            }
            if (where.sessionStorage) {
                for (const evtType in when) {
                    if (when[evtType]) {
                        enhancedElement.addEventListener(evtType, async () => {
                            const whatToStore = await this.getWhatToStore(self, params);
                            sessionStorage.setItem(fullPath, JSON.stringify(whatToStore));
                        });
                    }
                }
                //populate proxy with value from sessionStorage
                if (restoreIf.always && !restored) {
                    const rawString = sessionStorage.getItem(fullPath);
                    if (rawString !== null) {
                        restored = true;
                        const obj = JSON.parse(rawString);
                        this.setPropsFromStore(self, params, obj);
                    }
                }
                if (persistOnUnload) {
                    window.addEventListener('beforeunload', e => {
                        const whatToStore = this.getWhatToStore(self, params);
                        sessionStorage.setItem(fullPath, JSON.stringify(whatToStore));
                    });
                }
            }
            if (where.hash) {
                for (const evtType in when) {
                    if (when[evtType]) {
                        enhancedElement.addEventListener(evtType, async () => {
                            const whatToStore = await this.getWhatToStore(self, params);
                            const { setItem } = await import('./hash.js');
                            setItem(locationLessPath, whatToStore);
                        });
                    }
                }
                if (restoreIf.always && !restored) {
                    const { getItem } = await import('./hash.js');
                    const obj = getItem(locationLessPath);
                    if (obj !== null)
                        this.setPropsFromStore(self, params, obj);
                }
                if (persistOnUnload) {
                    const { setItem } = await import('./hash.js');
                    window.addEventListener('beforeunload', e => {
                        const whatToStore = this.getWhatToStore(self, params);
                        setItem(locationLessPath, JSON.stringify(whatToStore));
                    });
                }
            }
            if (n) {
                const { nudge } = await import('trans-render/lib/nudge.js');
                nudge(enhancedElement);
            }
        }
        return {
            resolved: true,
        };
    }
    mergeParams(self, x) {
        const { enhancedElement } = this;
        if (enhancedElement instanceof HTMLInputElement || enhancedElement instanceof HTMLTextAreaElement) {
            return {
                ...defaultSettings,
                ...inputSettings,
                ...x,
            };
        }
        return {
            ...defaultSettings,
            ...x,
        };
    }
    async parameterize(self) {
        const { params } = self;
        switch (typeof params) {
            case 'object':
                if (Array.isArray(params)) {
                    return {
                        persistenceParams: params.map(x => this.mergeParams(self, x))
                    };
                }
                return {
                    persistenceParams: [this.mergeParams(self, params)]
                };
            case 'undefined': {
                return {
                    persistenceParams: [this.mergeParams(self, {})]
                };
            }
        }
    }
}
export const tagName = 'be-persistent';
const xe = new XE({
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
const defaultSettings = {
    nudge: true,
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
