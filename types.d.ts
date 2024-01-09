import { ActionOnEventConfigs } from "trans-render/froop/types";
import {IBE} from 'be-enhanced/types';

export interface EndUserProps extends IBE {
    params?: PersistenceParams | Array<PersistenceParams>;
}
export interface AllProps extends EndUserProps{
    isParsed?: boolean,
    persistenceParams?: Array<PersistenceParams>
}


export type AP = AllProps;

export type PAP = Partial<AP>;

export type ProPAP = Promise<PAP>;

export type POA = [PAP | undefined, ActionOnEventConfigs<PAP, Actions>];

export interface Actions{
    //intro(proxy: Proxy, target: Element, beDecorProps: BeDecoratedProps): void;

    hydrate(self: this): ProPAP;
    parameterize(self: this): ProPAP
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