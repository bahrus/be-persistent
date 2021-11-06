import { define } from 'be-decorated/be-decorated.js';
import { register } from 'be-hive/register.js';
export class BePersistentController {
    #target;
    intro(proxy, target, beDecorProps) {
        this.#target = target;
        const attr = proxy.getAttribute(`is-${beDecorProps.ifWantsToBe}`).trim();
        const firstChar = attr[0];
        let params;
        if ('[{'.includes(firstChar)) {
            params = JSON.parse(attr);
        }
        else {
            params = {
                what: {
                    value: true,
                },
                when: {
                    input: true,
                },
                where: {
                    sessionStorage: true,
                }
            };
        }
        proxy.params = params;
    }
    async onParams({ params, proxy }) {
        const { what, when, where } = params;
        //persist proxy to storage
        if (where.sessionStorage !== undefined) {
            const ssConfig = where.sessionStorage;
            let fullPath;
            if (typeof ssConfig === 'boolean') {
                const { $hell } = await import('xtal-shell/$hell.js'); //TODO: need a small version of this
                fullPath = $hell.getFullPath(this.#target);
            }
            for (const evtType in when) {
                if (when[evtType]) {
                    proxy.addEventListener(evtType, () => {
                        if (what.value) {
                            if (where.sessionStorage) {
                                sessionStorage.setItem(fullPath, proxy.value);
                            }
                        }
                    });
                }
            }
            //populate proxy with value from sessionStorage
            //written entirely by copilot!
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
