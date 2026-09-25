import  'assign-gingerly/object-extension.js';

/**
 * 
 * @param {Element | undefined} ref 
 */
export async function defBePersistent(ref){
    const {default: emc} = await import('./emc.json', {with: {type: 'json'}});
    return await push(ref, emc);
    
}

// export async function defEmoji(ref){
//     const {default: emc} = await import('./emc-emoji.json', {with: {type: 'json'}});
//     await push(ref, emc);
// }

async function push(ref, emc){
    const {BePersistent} = await import('./be-persistent.js');
    const {enhConfig} = emc;
    enhConfig.spawn = BePersistent;
    enhConfig.customData = emc.customData;
    const registry = ref?.customElementRegistry ?? customElements;
    const {enhancementRegistry} = registry;
    enhancementRegistry.push(enhConfig);
    return enhConfig;
}