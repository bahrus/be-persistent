import { register } from 'be-hive/register.js';
import { tagName } from './be-persistent.js';
import './be-persistent.js';
const ifWantsToBe = 'persistent';
const upgrade = '*';
register(ifWantsToBe, upgrade, tagName);
