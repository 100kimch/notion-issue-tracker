import {
  adjectives,
  breeds,
  colors,
  explainingBodies,
  names,
  sizes,
} from '../constants';

/**
 * a class which makes a pet name with description for using an id.
 * @constant lengths - [breeds, explainingBodies, colors, adjectives, sizes, names]
 * @constant timeMask - sum of lengths
 */
export class PetNameMaker {
  private static mW = 123456789;
  private static mZ = 987654321;
  private static mask = 0xffffffff;
  private static lengths = [21, 3, 25, 25, 10, 500];
  private static timeMask = 196875000;

  public static getName() {
    const timeVal = Math.floor(new Date().getTime() / 1000) % this.timeMask;
    const nums = [];
    let selectedId;

    this.seed(timeVal);
    selectedId = Math.floor(this.random() * this.timeMask);

    for (let i in this.lengths) {
      nums.push(selectedId % this.lengths[i]);
      selectedId = Math.floor(selectedId / this.lengths[i]);
    }

    console.log('picked: ', nums);
    return `${names[nums.pop()!]}, a${sizes[nums.pop()!]} ${
      adjectives[nums.pop()!]
    } ${colors[nums.pop()!]}${explainingBodies[nums.pop()!]} ${
      breeds[nums.pop()!]
    }`;
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
