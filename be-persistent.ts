import {BE, propDefaults, propInfo} from 'be-enhanced/BE.js';
import {BEConfig} from 'be-enhanced/types';
import {XE} from 'xtal-element/XE.js';
import {Actions, AllProps, AP, PAP, ProPAP, POA} from './types';

export class BePersistent extends BE<AP, Actions> implements Actions{

}

export interface BePersistent extends AllProps{}

export const tagName = 'be-persistent';

const xe = new XE<AP, Actions>({
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
