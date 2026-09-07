// @ts-check
import { BeHive, seed } from 'be-hive/be-hive.js';
import { MountObserver } from 'mount-observer/MountObserver.js';
/** @import {EMC} from './ts-refs/trans-render/be/types' */
/** @import {Actions, PAP, AllProps, AP} from './ts-refs/be-persistent/types' */;

const of = String.raw `^[o|O]f `;
const localProp = String.raw `(?<localProp>[\w\:]+)`;
const localPropLocalEvent = String.raw `${localProp}\:\:(?<localEvent>[\w]+)`;
const usl = String.raw `(?<usl>[\w\:\/\?\.\{\}]+)`;
const ofLocalPropUSL = String.raw `${of}${localProp} via ${usl}`;
const ofLocalPropLocalEventUSL = String.raw `${of}${localPropLocalEvent} via ${usl}`;
const viaUSL = String.raw `^[v|V]ia ${usl}`;

/**
 * @type {EMC<any, AP>}
 */
export const emc = {
    base: 'be-persistent',
    enhPropKey: 'bePersistent',
    map: {
        '0.0': {
            instanceOf: 'Object$entences',
            objValMapsTo: '.',
            regExpExts:  {
                rules: [
                    {
                        regExp: ofLocalPropLocalEventUSL,
                        defaultVals: {},
                    },
                    {
                        regExp: ofLocalPropUSL,
                        defaultVals: {},
                    },
                    {
                        regExp: viaUSL,
                        defaultVals: {},
                    }
                ]
            }
        }
    },
    importEnh: async () => {
        const {BePersistent}  = 
        /** @type {{new(): IEnhancement<Element>}} */ 
        /** @type {any} */
        (await import('./be-persistent.js'));
        return BePersistent;
    }
};

const mose = seed(emc);
MountObserver.synthesize(document, BeHive, mose);