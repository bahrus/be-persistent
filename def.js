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
    const registry = ref?.customElementRegistry ?? customElements;
    const {enhancementRegistry} = registry;
    enhancementRegistry.push(emc);
}