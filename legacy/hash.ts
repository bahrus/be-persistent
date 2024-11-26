import {Hashit} from 'trans-render/lib/Hashit.js';
const open = '6ab07062-ae74-4b42-';
const close = '-a323-3bbcd5758757';
const hashit = new Hashit(open, close);

export function setItem(id: string, obj: any){
    
    location.hash  = hashit.stringify(id, obj);
}

export function getItem(id: string){
    return hashit.parse(id);
}