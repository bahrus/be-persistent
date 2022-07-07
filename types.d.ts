import {BeDecoratedProps} from 'be-decorated/types';

export interface BePersistentVirtualProps{
    params: PersistenceParams;
}
export interface BePersistentProps extends BePersistentVirtualProps{
    proxy: Element & BePersistentVirtualProps;
}

export interface BePersistentActions{
    intro(proxy: Element & BePersistentVirtualProps, target: Element, beDecorProps: BeDecoratedProps): void;

    onParams(self: this): void;

    finale(proxy: Element & BePersistentVirtualProps, target: Element, beDecorProps: BeDecoratedProps): void;
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