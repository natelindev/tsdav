import { DAVAddressBook } from './davAddressBook';
import { DAVObject } from './davObject';

export class DAVVCard extends DAVObject {
  addressBook: DAVAddressBook;

  addressData: any;

  constructor(options?: DAVVCard) {
    super(options);
    if (options) {
      this.addressBook = options.addressBook;
      this.addressData = options.addressData;
    }
  }
}
