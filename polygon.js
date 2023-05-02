class Polygon {
  /**
   * @param {number} [number]
   */
  constructor(number) {
    // resolution : 0.1
    // property
    this.array = new Array();

    // initialize
    if (number) {
      for (var i = 0; i < number; i++) {
        this.push(0, 0, 0);
      }
    }

    return this;
  }
  // method
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} [off]
   */
  push(x, y, off) {
    var temp = {
      x: Math.floor(x * 10) / 10,
      y: Math.floor(y * 10) / 10,
    };
    if (off != 1) {
      off = 0;
    }
    temp.off = off;
    this.array.push(temp);
  }
  /**
   * @param {number} index
   * @param {number} x
   * @param {number} y
   * @param {number} [off]
   */
  set(index, x, y, off) {
    this.array[index].x = Math.floor(x * 10) / 10;
    this.array[index].y = Math.floor(y * 10) / 10;
    if (off != 1) {
      off = 0;
    }
    this.array[index].off = off;
  }
  reverse() {
    this.array.reverse();
  }
  /**
   * @param {Polygon} poly
   */
  concat(poly) {
    this.array = this.array.concat(poly.array);
  }
  shift() {
    this.array.shift();
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} [off]
   */
  unshift(x, y, off) {
    var temp = {
      x: Math.floor(x * 10) / 10,
      y: Math.floor(y * 10) / 10,
    };
    if (off != 1) {
      off = 0;
    }
    temp.off = off;
    this.array.unshift(temp);
  }
}
exports.Polygon = Polygon;
