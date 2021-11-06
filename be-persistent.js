import { define } from 'be-decorated/be-decorated.js';
import { register } from 'be-hive/register.js';
export class BePersistentController {
    intro(proxy, target, beDecorProps) {
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
    onParams({ params, proxy }) {
        const { what, when, where } = params;
        for (const evtType in when) {
            if (when[evtType]) {
                proxy.addEventListener(evtType, () => {
                    if (what.value) {
                        if (where.sessionStorage) {
                            sessionStorage.setItem(proxy.id, proxy.value);
                        }
                    }
                });
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
                ifAllOf: ['params']
            },
        }
    },
    complexPropDefaults: {
        controller: BePersistentController
    }
});
register(ifWantsToBe, upgrade, tagName);
