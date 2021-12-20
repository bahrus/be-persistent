import {BeDecoratedProps} from 'be-decorated/types';

export interface BePersistentVirtualProps{
    params: PersistenceParams;
}
export interface BePersistentProps extends BePersistentVirtualProps{
    proxy: Element & BePersistentVirtualProps
}

export interface BePersistentActions{
    intro(proxy: Element & BePersistentVirtualProps, target: Element, beDecorProps: BeDecoratedProps): void;

    onParams(self: this): void;
}

export interface PersistenceParams<TObjectToPersist = any, TEventMap = any>{
    what?: {[key in keyof TObjectToPersist]: boolean | string},
    where: PersistenceStorage,
    when?: {[key in keyof TEventMap]: boolean | EventCriteria},
    restoreIf: RestoreCriteria,
}

export interface PersistenceStorage{
    sessionStorage?: boolean,
    idb?: boolean,
    autogenId?: boolean,
}

export interface EventCriteria{}

export interface RestoreCriteria{
    always?: boolean,
}