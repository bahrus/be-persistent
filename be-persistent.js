import { BE, propDefaults, propInfo } from 'be-enhanced/BE.js';
import { XE } from 'xtal-element/XE.js';
export class BePersistent extends BE {
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
            hydrate: 'on',
            findTarget: 'to'
        }
    },
    superclass: BePersistent
});
