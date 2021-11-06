import {BeDecoratedProps} from 'be-decorated/types';

export interface BePersistentVirtualProps{

}
export interface BePersistentProps{
    proxy: Element & BePersistentVirtualProps
}

export interface BePersistentActions{
    intro(proxy: Element & BePersistentVirtualProps, target: Element, beDecorProps: BeDecoratedProps): void;
}

export interface PersistenceParams<TObjectToPersist = any, TEventMap = any>{
    what: {[key in keyof TObjectToPersist]: boolean | string},
    where: PersistenceStorage,
    when: (keyof TEventMap)[],
    
}

export interface PersistenceStorage{
    sessionStorage?: boolean
}