import {
  adjectives,
  breeds,
  colors,
  explainingBodies,
  explaininglegs,
  names,
  sizes,
} from '../constants';

export class PetNameMaker {
  private static mW = 123456789;
  private static mZ = 987654321;
  private static mask = 0xffffffff;
  private static scope =
    sizes.length *
    adjectives.length *
    colors.length *
    explainingBodies.length *
    explaininglegs.length *
    breeds.length *
    names.length;
  private static sizes = [9, 25, 10, 3, 25, 3, 100];

  public static getName() {
    let timeVal = new Date().getTime() >> 8;
    console.log(timeVal, this.scope);
    for (let i in this.sizes) {
      console.log('val: ', timeVal % this.sizes[i]);
      timeVal = timeVal / this.sizes[i];
      console.log('sizes: ', this.sizes[i], timeVal);
    }
    console.log('final: ', timeVal);
    return new Date().getTime() / 10;
  }

  public static seed(i: number) {
    this.mW = (123456789 + i) & this.mask;
    this.mZ = (987654321 - i) & this.mask;
  }

  public static random() {
    this.mZ = (36969 * (this.mZ & 65535) + (this.mZ >> 16)) & this.mask;
    this.mW = (18000 * (this.mW & 65535) + (this.mW >> 16)) & this.mask;
    var result = ((this.mZ << 16) + (this.mW & 65535)) >>> 0;
    result /= 4294967296;
    return result;
  }
}
