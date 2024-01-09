import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
export class BePersistent extends BE {
    static get beConfig() {
        return {
            parse: true,
            primaryProp: 'to',
            isParsedProp: 'isParsed',
        };
    }
    async hydrate(self) {
        const { persistenceParams } = self;
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
