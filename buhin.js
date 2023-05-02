class Buhin {
  constructor(number) {
    // property
    this.hash = {};

    // initialize
    // no operation
    return this;
  }
  // method
  push(name, data) {
    this.hash[name] = data;
  }
  set(name, data) {
    this.hash[name] = data;
  }
  search(name) {
    if (this.hash[name]) {
      return this.hash[name];
    }
    return ""; // no data
  }
}
exports.Buhin = Buhin;
