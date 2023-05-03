class Buhin {
  constructor() {
    // property
    /** @type {Record<string, string>} */
    // set __proto__ to null to avoid prototype pollution
    this.hash = { __proto__: null };

    // initialize
    // no operation
    return this;
  }
  // method
  /**
   * @param {string} name
   * @param {string} data
   */
  push(name, data) {
    this.hash[name] = data;
  }
  /**
   * @param {string} name
   * @param {string} data
   */
  set(name, data) {
    this.hash[name] = data;
  }
  /**
   * @param {string} name 
   */
  has(name) {
    return name in this.hash;
  }
  /**
   * @param {string} name
   */
  search(name) {
    if (this.hash[name]) {
      return this.hash[name];
    }
    return ""; // no data
  }
}
exports.Buhin = Buhin;
