import getLogger from 'debug';
import { DAVCollection } from './davCollection';

const debug = getLogger('tsdav:addressBook');

export class AddressBook extends DAVCollection {}
