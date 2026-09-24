import  'assign-gingerly/object-extension.js';

/**
 * 
 * @param {Element | undefined} ref 
 */
export async function defBePersistent(ref){
    const {BePersistent} = await import('./be-persistent.js');
    const {default: emc} = await import('./emc.json', {with: {type: 'json'}});
    const {enhConfig} = emc;
    console.log({emc, enhConfig});
    enhConfig.spawn = BePersistent;
    enhConfig.customData = emc.customData;
    //enhConfig.emc = emc;
    const registry = ref?.customElementRegistry ?? customElements;
    const {enhancementRegistry} = registry;
    //Object.assign(emc, enhConfig);
    enhancementRegistry.push(enhConfig);
    const {default: emc2} = await import('./emc.json', {with: {type: 'json'}});
    console.log(emc === emc2);

}