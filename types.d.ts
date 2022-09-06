import {BeDecoratedProps, MinimalProxy} from 'be-decorated/types';


export interface EndUserProps {
    params?: PersistenceParams;
}
export interface VirtualProps extends EndUserProps,  MinimalProxy{
    
}
export type Proxy = VirtualProps & Element;

export interface ProxyProps extends VirtualProps{
    proxy: Proxy;
}

export type PP = ProxyProps;

export interface Actions{
    intro(proxy: Proxy, target: Element, beDecorProps: BeDecoratedProps): void;

    onParams(pp: PP): void;

}

export interface PersistenceParams<TObjectToPersist = any, TEventMap = any>{
    what?: {[key in keyof TObjectToPersist]: boolean | string  | WhatToPersistCriteria},
    where: PersistenceStorage,
    when?: {[key in keyof TEventMap]: boolean | EventCriteria},
    persistOnUnload?: boolean,
    restoreIf: RestoreCriteria,
    eventToFire?: {
        type: string,
        bubbles: boolean,
        cancelable: boolean,
        composed: boolean,
    }
}

export interface PersistenceStorage{
    sessionStorage?: boolean,
    idb?: boolean,
    autogenId?: boolean,
    hash?: boolean,
}

export interface EventCriteria{}

export interface RestoreCriteria{
    always?: boolean,
}

export interface WhatToPersistCriteria {
    beBeatified: boolean
}