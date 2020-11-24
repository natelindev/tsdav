import { DAVObject } from './davObject';

export class VCard extends DAVObject {
  addressBook: string;

  addressData: string;

  constructor(options: VCard) {
    super(options);
    if (options) {
      this.addressBook = options.addressBook;
      this.addressData = options.addressData;
    }
  }
}
