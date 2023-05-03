const { isCrossWithOthers, isCrossBoxWithOthers } = require("./2d");
const { Buhin } = require("./buhin");
const { get_candidate, divide_curve, find_offcurve } = require("./curve");
const { Polygon } = require("./polygon");
const { Polygons } = require("./polygons");

class Kage {
  /**
   * @param {number} [size]
   */
  constructor(size) {
    //properties
    this.kShotai = this.kMincho;

    this.kRate = 100;

    if (size == 1) {
      this.kMinWidthY = 1.2;
      this.kMinWidthT = 3.6;
      this.kWidth = 3;
      this.kKakato = 1.8;
      this.kL2RDfatten = 1.1;
      this.kMage = 6;
      this.kUseCurve = 0;

      this.kAdjustKakatoL = ([8, 5, 3, 1, 0]); // for KAKATO adjustment 000,100,200,300,400
      this.kAdjustKakatoR = ([4, 3, 2, 1]); // for KAKATO adjustment 000,100,200,300
      this.kAdjustKakatoRangeX = 12; // check area width
      this.kAdjustKakatoRangeY = ([1, 11, 14, 18]); // 3 steps of checking
      this.kAdjustKakatoStep = 3; // number of steps

      this.kAdjustUrokoX = ([14, 12, 9, 7]); // for UROKO adjustment 000,100,200,300
      this.kAdjustUrokoY = ([7, 6, 5, 4]); // for UROKO adjustment 000,100,200,300
      this.kAdjustUrokoLength = ([13, 21, 30]); // length for checking
      this.kAdjustUrokoLengthStep = 3; // number of steps
      this.kAdjustUrokoLine = ([13, 15, 18]); // check for crossing. corresponds to length
    } else {
      this.kMinWidthY = 2;
      this.kMinWidthU = 2;
      this.kMinWidthT = 6;
      this.kWidth = 5;
      this.kKakato = 3;
      this.kL2RDfatten = 1.1;
      this.kMage = 10;
      this.kUseCurve = 0;

      this.kAdjustKakatoL = ([14, 9, 5, 2, 0]); // for KAKATO adjustment 000,100,200,300,400
      this.kAdjustKakatoR = ([8, 6, 4, 2]); // for KAKATO adjustment 000,100,200,300
      this.kAdjustKakatoRangeX = 20; // check area width
      this.kAdjustKakatoRangeY = ([1, 19, 24, 30]); // 3 steps of checking
      this.kAdjustKakatoStep = 3; // number of steps

      this.kAdjustUrokoX = ([24, 20, 16, 12]); // for UROKO adjustment 000,100,200,300
      this.kAdjustUrokoY = ([12, 11, 9, 8]); // for UROKO adjustment 000,100,200,300
      this.kAdjustUrokoLength = ([22, 36, 50]); // length for checking
      this.kAdjustUrokoLengthStep = 3; // number of steps
      this.kAdjustUrokoLine = ([22, 26, 30]); // check for crossing. corresponds to length

      this.kAdjustUroko2Step = 3;
      this.kAdjustUroko2Length = 40;

      this.kAdjustTateStep = 4;

      this.kAdjustMageStep = 5;
    }

    this.kBuhin = new Buhin();

    return this;
  }
  // method
  /**
   * @param {Polygons} polygons
   * @param {string} buhin
   */
  makeGlyph(polygons, buhin) {
    var glyphData = this.kBuhin.search(buhin);
    this.makeGlyphFromKage(polygons, glyphData, buhin);
  }
  /**
   * @param {Polygons} polygons
   * @param {string} data
   * @param {string} [name]
  */
  makeGlyphFromKage(polygons, data, name) {
    if (data != "") {
      const strokes = this.getEachStrokes(data, name);
      this.makeGlyphFromStrokes(polygons, strokes);
    }
  }
  /**
   * @param {Polygons} polygons
   * @param {number[][]} strokes
   */
  makeGlyphFromStrokes(polygons, strokes) {
    var strokesArray = this.adjustKirikuchi(this.adjustUroko2(this.adjustUroko(this.adjustKakato(this.adjustTate(this.adjustMage(this.adjustHane(strokes)))))));
    for (var i = 0; i < strokesArray.length; i++) {
      dfDrawFont(this, polygons,
        strokesArray[i][0],
        strokesArray[i][1],
        strokesArray[i][2],
        strokesArray[i][3],
        strokesArray[i][4],
        strokesArray[i][5],
        strokesArray[i][6],
        strokesArray[i][7],
        strokesArray[i][8],
        strokesArray[i][9],
        strokesArray[i][10]);
    }
  }
  /**
   * @param {string} glyphData
   *  Glyph data.
   * @param {string} [name]
   *  Name of the glyph. Used for memoization.
   * @param {Record<string, number[][]>} [visited]
   *  Memoized data. Also used for preventing infinite loop.
   * @returns {number[][]}
   */
  getEachStrokes(glyphData, name, visited) {
    if (name == null) {
      name = "";
    }
    if (visited == null) {
      visited = { __proto__: null };
    }
    if (name in visited) {
      return visited[name];
    }
    // Set empty array to prevent infinite loop.
    // This array will be overwritten later.
    visited[name] = [];

    // Split glyph data into strokes.
    var strokesArray = new Array();
    var strokes = glyphData.split("$");

    for (var i = 0; i < strokes.length; i++) {
      var columns = strokes[i].split(":");
      // Check if the stroke is a reference.
      // If not, add the stroke to the array.
      if (Math.floor(Number(columns[0])) != 99) {
        strokesArray.push([
          Math.floor(Number(columns[0])),
          Math.floor(Number(columns[1])),
          Math.floor(Number(columns[2])),
          Math.floor(Number(columns[3])),
          Math.floor(Number(columns[4])),
          Math.floor(Number(columns[5])),
          Math.floor(Number(columns[6])),
          Math.floor(Number(columns[7])),
          Math.floor(Number(columns[8])),
          Math.floor(Number(columns[9])),
          Math.floor(Number(columns[10]))
        ]);
      } else {
        // Get KAGE data of reference.
        var buhin = this.kBuhin.search(columns[7]);
        if (buhin != "") {
          // Add strokes of reference to the array.
          strokesArray = strokesArray.concat(
            this.getEachStrokesOfBuhin(buhin,
              Math.floor(Number(columns[3])),
              Math.floor(Number(columns[4])),
              Math.floor(Number(columns[5])),
              Math.floor(Number(columns[6])),
              Math.floor(Number(columns[1])),
              Math.floor(Number(columns[2])),
              Math.floor(Number(columns[9])),
              Math.floor(Number(columns[10])),
              columns[7],
              visited
            )
          );
        }
      }
    }
    visited[name] = strokesArray;
    return strokesArray;
  }
  /**
   * @param {string} name
   */
  getAllBuhin(name) {
    const visited = { __proto__: null };
    const buhin = [];
    this.visitAllBuhin(name, visited);
    for (const key in visited) {
      buhin.push(key);
    }
    return buhin;
  }
  /**
   * @param {string} name
   */
  getAllBuhinNotFound(name) {
    /** @type {Record<string, boolean | null>} */
    const visited = { __proto__: null };
    const buhinNotFound = [];
    this.visitAllBuhin(name, visited);
    for (const key in visited) {
      if (visited[key] === false) {
        buhinNotFound.push(key);
      }
    }
    return buhinNotFound;
  }
  /**
   * Visit all buhin.
   * The result is stored in visited.
   * visited[name] is true if the buhin is found.
   * visited[name] is false if the buhin is not found.
   * visited[name] is null if the buhin is invalid.
   * Invalid buhin is buhin that has infinite loop or that is empty.
   *
   * @param {string} name
   * @param {Record<string, boolean | null>} visited
   */
  visitAllBuhin(name, visited) {
    if (name in visited) {
      return;
    }
    visited[name] = null;
    if (!this.kBuhin.has(name)) {
      visited[name] = false;
      return;
    }
    var glyphData = this.kBuhin.search(name);
    if (!glyphData) {
      return;
    }
    var strokes = glyphData.split("$");
    for (var i = 0; i < strokes.length; i++) {
      var columns = strokes[i].split(":");
      if (Math.floor(Number(columns[0])) == 99) {
        this.visitAllBuhin(columns[7], visited);
      }
    }
    visited[name] = true;
  }
  /**
   * @param {string} buhin
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {number} sx
   * @param {number} sy
   * @param {number} sx2
   * @param {number} sy2
   * @param {string} [name]
   * @param {Record<string, number[][]>} [visited]
   */
  getEachStrokesOfBuhin(buhin, x1, y1, x2, y2, sx, sy, sx2, sy2, name, visited) {
    var temp = this.getEachStrokes(buhin, name, visited);
    return this.stretchBuhin(temp, x1, y1, x2, y2, sx, sy, sx2, sy2);
  }
  /**
   * @param {number[][]} buhinStrokes
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {number} sx
   * @param {number} sy
   * @param {number} sx2
   * @param {number} sy2
   */
  stretchBuhin(buhinStrokes, x1, y1, x2, y2, sx, sy, sx2, sy2) {
    var temp = buhinStrokes;
    var result = new Array();
    var box = this.getBox(temp);
    if (sx != 0 || sy != 0) {
      if (sx > 100) {
        sx -= 200;
      } else {
        sx2 = 0;
        sy2 = 0;
      }
    }
    for (var i = 0; i < temp.length; i++) {
      if (sx != 0 || sy != 0) {
        temp[i][3] = this.stretch(sx, sx2, temp[i][3], box.minX, box.maxX);
        temp[i][4] = this.stretch(sy, sy2, temp[i][4], box.minY, box.maxY);
        temp[i][5] = this.stretch(sx, sx2, temp[i][5], box.minX, box.maxX);
        temp[i][6] = this.stretch(sy, sy2, temp[i][6], box.minY, box.maxY);
        temp[i][7] = this.stretch(sx, sx2, temp[i][7], box.minX, box.maxX);
        temp[i][8] = this.stretch(sy, sy2, temp[i][8], box.minY, box.maxY);
        temp[i][9] = this.stretch(sx, sx2, temp[i][9], box.minX, box.maxX);
        temp[i][10] = this.stretch(sy, sy2, temp[i][10], box.minY, box.maxY);
      }
      result.push([temp[i][0],
      temp[i][1],
      temp[i][2],
      x1 + temp[i][3] * (x2 - x1) / 200,
      y1 + temp[i][4] * (y2 - y1) / 200,
      x1 + temp[i][5] * (x2 - x1) / 200,
      y1 + temp[i][6] * (y2 - y1) / 200,
      x1 + temp[i][7] * (x2 - x1) / 200,
      y1 + temp[i][8] * (y2 - y1) / 200,
      x1 + temp[i][9] * (x2 - x1) / 200,
      y1 + temp[i][10] * (y2 - y1) / 200]);
    }
    return result;
  }
  /**
   * @param {number[][]} sa
   */
  adjustHane(sa) {
    for (var i = 0; i < sa.length; i++) {
      if ((sa[i][0] == 1 || sa[i][0] == 2 || sa[i][0] == 6) && sa[i][2] == 4) {
        var lpx; // lastPointX
        var lpy; // lastPointY
        if (sa[i][0] == 1) {
          lpx = sa[i][5];
          lpy = sa[i][6];
        } else if (sa[i][0] == 2) {
          lpx = sa[i][7];
          lpy = sa[i][8];
        } else {
          lpx = sa[i][9];
          lpy = sa[i][10];
        }
        var mn = Infinity; // mostNear
        if (lpx + 18 < 100) {
          mn = lpx + 18;
        }
        for (var j = 0; j < sa.length; j++) {
          if (i != j && sa[j][0] == 1 && sa[j][3] == sa[j][5] && sa[j][3] < lpx && sa[j][4] <= lpy && sa[j][6] >= lpy) {
            if (lpx - sa[j][3] < 100) {
              mn = Math.min(mn, lpx - sa[j][3]);
            }
          }
        }
        if (mn != Infinity) {
          sa[i][2] += 700 - Math.floor(mn / 15) * 100; // 0-99 -> 0-700
        }
      }
    }
    return sa;
  }
  /**
   * @param {number[][]} strokesArray
   */
  adjustUroko(strokesArray) {
    for (var i = 0; i < strokesArray.length; i++) {
      if (strokesArray[i][0] == 1 && strokesArray[i][2] == 0) { // no operation for TATE
        for (var k = 0; k < this.kAdjustUrokoLengthStep; k++) {
          var tx, ty, tlen;
          if (strokesArray[i][4] == strokesArray[i][6]) { // YOKO
            tx = strokesArray[i][5] - this.kAdjustUrokoLine[k];
            ty = strokesArray[i][6] - 0.5;
            tlen = strokesArray[i][5] - strokesArray[i][3];
          } else {
            var rad = Math.atan((strokesArray[i][6] - strokesArray[i][4]) / (strokesArray[i][5] - strokesArray[i][3]));
            tx = strokesArray[i][5] - this.kAdjustUrokoLine[k] * Math.cos(rad) - 0.5 * Math.sin(rad);
            ty = strokesArray[i][6] - this.kAdjustUrokoLine[k] * Math.sin(rad) - 0.5 * Math.cos(rad);
            tlen = Math.sqrt((strokesArray[i][6] - strokesArray[i][4]) * (strokesArray[i][6] - strokesArray[i][4]) +
              (strokesArray[i][5] - strokesArray[i][3]) * (strokesArray[i][5] - strokesArray[i][3]));
          }
          if (tlen < this.kAdjustUrokoLength[k] ||
            isCrossWithOthers(strokesArray, i, tx, ty, strokesArray[i][5], strokesArray[i][6])) {
            strokesArray[i][2] += (this.kAdjustUrokoLengthStep - k) * 100;
            k = Infinity;
          }
        }
      }
    }
    return strokesArray;
  }
  /**
   * @param {number[][]} strokesArray
   */
  adjustUroko2(strokesArray) {
    for (var i = 0; i < strokesArray.length; i++) {
      if (strokesArray[i][0] == 1 && strokesArray[i][2] == 0 && strokesArray[i][4] == strokesArray[i][6]) {
        var pressure = 0;
        for (var j = 0; j < strokesArray.length; j++) {
          if (i != j && (
            (strokesArray[j][0] == 1 && strokesArray[j][4] == strokesArray[j][6] &&
              !(strokesArray[i][3] + 1 > strokesArray[j][5] || strokesArray[i][5] - 1 < strokesArray[j][3]) &&
              Math.abs(strokesArray[i][4] - strokesArray[j][4]) < this.kAdjustUroko2Length) ||
            (strokesArray[j][0] == 3 && strokesArray[j][6] == strokesArray[j][8] &&
              !(strokesArray[i][3] + 1 > strokesArray[j][7] || strokesArray[i][5] - 1 < strokesArray[j][5]) &&
              Math.abs(strokesArray[i][4] - strokesArray[j][6]) < this.kAdjustUroko2Length)
          )) {
            pressure += Math.pow(this.kAdjustUroko2Length - Math.abs(strokesArray[i][4] - strokesArray[j][6]), 1.1);
          }
        }
        var result = Math.min(Math.floor(pressure / this.kAdjustUroko2Length), this.kAdjustUroko2Step) * 100;
        if (strokesArray[i][2] < result) {
          strokesArray[i][2] = strokesArray[i][2] % 100 + Math.min(Math.floor(pressure / this.kAdjustUroko2Length), this.kAdjustUroko2Step) * 100;
        }
      }
    }
    return strokesArray;
  }
  /**
   * @param {number[][]} strokesArray
   */
  adjustTate(strokesArray) {
    for (var i = 0; i < strokesArray.length; i++) {
      if ((strokesArray[i][0] == 1 || strokesArray[i][0] == 3 || strokesArray[i][0] == 7) && strokesArray[i][3] == strokesArray[i][5]) {
        for (var j = 0; j < strokesArray.length; j++) {
          if (i != j && (strokesArray[j][0] == 1 || strokesArray[j][0] == 3 || strokesArray[j][0] == 7) && strokesArray[j][3] == strokesArray[j][5] &&
            !(strokesArray[i][4] + 1 > strokesArray[j][6] || strokesArray[i][6] - 1 < strokesArray[j][4]) &&
            Math.abs(strokesArray[i][3] - strokesArray[j][3]) < this.kMinWidthT * this.kAdjustTateStep) {
            strokesArray[i][1] += (this.kAdjustTateStep - Math.floor(Math.abs(strokesArray[i][3] - strokesArray[j][3]) / this.kMinWidthT)) * 1000;
            if (strokesArray[i][1] > this.kAdjustTateStep * 1000) {
              strokesArray[i][1] = strokesArray[i][1] % 1000 + this.kAdjustTateStep * 1000;
            }
          }
        }
      }
    }
    return strokesArray;
  }
  /**
   * @param {number[][]} strokesArray
   */
  adjustMage(strokesArray) {
    for (var i = 0; i < strokesArray.length; i++) {
      if ((strokesArray[i][0] == 3) && strokesArray[i][6] == strokesArray[i][8]) {
        for (var j = 0; j < strokesArray.length; j++) {
          if (i != j && (
            (strokesArray[j][0] == 1 && strokesArray[j][4] == strokesArray[j][6] &&
              !(strokesArray[i][5] + 1 > strokesArray[j][5] || strokesArray[i][7] - 1 < strokesArray[j][3]) &&
              Math.abs(strokesArray[i][6] - strokesArray[j][4]) < this.kMinWidthT * this.kAdjustMageStep) ||
            (strokesArray[j][0] == 3 && strokesArray[j][6] == strokesArray[j][8] &&
              !(strokesArray[i][5] + 1 > strokesArray[j][7] || strokesArray[i][7] - 1 < strokesArray[j][5]) &&
              Math.abs(strokesArray[i][6] - strokesArray[j][6]) < this.kMinWidthT * this.kAdjustMageStep)
          )) {
            strokesArray[i][2] += (this.kAdjustMageStep - Math.floor(Math.abs(strokesArray[i][6] - strokesArray[j][6]) / this.kMinWidthT)) * 1000;
            if (strokesArray[i][2] > this.kAdjustMageStep * 1000) {
              strokesArray[i][2] = strokesArray[i][2] % 1000 + this.kAdjustMageStep * 1000;
            }
          }
        }
      }
    }
    return strokesArray;
  }
  /**
   * @param {number[][]} strokesArray
   */
  adjustKirikuchi(strokesArray) {
    for (var i = 0; i < strokesArray.length; i++) {
      if (strokesArray[i][0] == 2 && strokesArray[i][1] == 32 &&
        strokesArray[i][3] > strokesArray[i][5] &&
        strokesArray[i][4] < strokesArray[i][6]) {
        for (var j = 0; j < strokesArray.length; j++) { // no need to skip when i == j
          if (strokesArray[j][0] == 1 &&
            strokesArray[j][3] < strokesArray[i][3] && strokesArray[j][5] > strokesArray[i][3] &&
            strokesArray[j][4] == strokesArray[i][4] && strokesArray[j][4] == strokesArray[j][6]) {
            strokesArray[i][1] = 132;
            j = strokesArray.length;
          }
        }
      }
    }
    return strokesArray;
  }
  /**
   * @param {number[][]} strokesArray
   */
  adjustKakato(strokesArray) {
    for (var i = 0; i < strokesArray.length; i++) {
      if (strokesArray[i][0] == 1 &&
        (strokesArray[i][2] == 13 || strokesArray[i][2] == 23)) {
        for (var k = 0; k < this.kAdjustKakatoStep; k++) {
          if (isCrossBoxWithOthers(strokesArray, i,
            strokesArray[i][5] - this.kAdjustKakatoRangeX / 2,
            strokesArray[i][6] + this.kAdjustKakatoRangeY[k],
            strokesArray[i][5] + this.kAdjustKakatoRangeX / 2,
            strokesArray[i][6] + this.kAdjustKakatoRangeY[k + 1])
            || strokesArray[i][6] + this.kAdjustKakatoRangeY[k + 1] > 200 // adjust for baseline
            || strokesArray[i][6] - strokesArray[i][4] < this.kAdjustKakatoRangeY[k + 1] // for thin box
          ) {
            strokesArray[i][2] += (3 - k) * 100;
            k = Infinity;
          }
        }
      }
    }
    return strokesArray;
  }
  /**
   * @param {number[][]} strokes
   */
  getBox(strokes) {
    var a = {
      minX: 200,
      minY: 200,
      maxX: 0,
      maxY: 0
    };

    for (var i = 0; i < strokes.length; i++) {
      if (strokes[i][0] == 0) { continue; }
      a.minX = Math.min(a.minX, strokes[i][3]);
      a.maxX = Math.max(a.maxX, strokes[i][3]);
      a.minY = Math.min(a.minY, strokes[i][4]);
      a.maxY = Math.max(a.maxY, strokes[i][4]);
      a.minX = Math.min(a.minX, strokes[i][5]);
      a.maxX = Math.max(a.maxX, strokes[i][5]);
      a.minY = Math.min(a.minY, strokes[i][6]);
      a.maxY = Math.max(a.maxY, strokes[i][6]);
      if (strokes[i][0] == 1) { continue; }
      if (strokes[i][0] == 99) { continue; }
      a.minX = Math.min(a.minX, strokes[i][7]);
      a.maxX = Math.max(a.maxX, strokes[i][7]);
      a.minY = Math.min(a.minY, strokes[i][8]);
      a.maxY = Math.max(a.maxY, strokes[i][8]);
      if (strokes[i][0] == 2) { continue; }
      if (strokes[i][0] == 3) { continue; }
      if (strokes[i][0] == 4) { continue; }
      a.minX = Math.min(a.minX, strokes[i][9]);
      a.maxX = Math.max(a.maxX, strokes[i][9]);
      a.minY = Math.min(a.minY, strokes[i][10]);
      a.maxY = Math.max(a.maxY, strokes[i][10]);
    }
    return a;
  }
  /**
   * @param {number} dp
   * @param {number} sp
   * @param {number} p
   * @param {number} min
   * @param {number} max
   */
  stretch(dp, sp, p, min, max) {
    var p1, p2, p3, p4;
    if (p < sp + 100) {
      p1 = min;
      p3 = min;
      p2 = sp + 100;
      p4 = dp + 100;
    } else {
      p1 = sp + 100;
      p3 = dp + 100;
      p2 = max;
      p4 = max;
    }
    return Math.floor(((p - p1) / (p2 - p1)) * (p4 - p3) + p3);
  }
  /**
   * Get a Glyph object of name.
   * @param {string} name
   */
  glyph(name) {
    return new Glyph(this, name);
  }
}

Kage.prototype.kMincho = 0;
Kage.prototype.kGothic = 1;

exports.Kage = Kage;

class Glyph {
  /**
   * @param {Kage} kage
   * @param {string} name
   */
  constructor(kage, name) {
    this.kage = kage;
    this.name = name;
  }
  /**
   * Set KAGE data to glyph.
   * @param {string} data 
   */
  setData(data) {
    this.kage.kBuhin.push(this.name, data);
  }
  /**
   * Get KAGE data of glyph.
   */
  getData() {
    return this.kage.kBuhin.search(this.name) || undefined;
  }
  polygons() {
    const polygons = new Polygons();
    this.kage.makeGlyph(polygons, this.name);
    return polygons;
  }
  components() {
    return this.kage.getAllBuhin(this.name);
  }
  componentsNotFound() {
    return this.kage.getAllBuhinNotFound(this.name);
  }
  strokes() {
    const data = this.getData()
    if (!data) {
      return [];
    }
    return this.kage.getEachStrokes(data, this.name).map(function (stroke) {
      return stroke.filter(function (value) {
        return !Number.isNaN(value);
      });
  });
  }
}
exports.Glyph = Glyph

// kagecd

/**
 * @param {Kage} kage
 * @param {Polygons} polygons
 * @param {number} x1
 * @param {number} y1
 * @param {number} sx1
 * @param {number} sy1
 * @param {number} sx2
 * @param {number} sy2
 * @param {number} x2
 * @param {number} y2
 * @param {number} ta1
 * @param {number} ta2
 */
function cdDrawCurveU(kage, polygons, x1, y1, sx1, sy1, sx2, sy2, x2, y2, ta1, ta2) {
  var rad, t;
  var x, y, v;
  var ix, iy, ia, ib, ir;
  var tt;
  var delta;
  var deltad;
  var XX, XY, YX, YY;
  var poly, poly2;
  var hosomi;

  const a1 = ta1 % 1000;
  const a2 = ta2 % 100;
  const opt1 = Math.floor((ta1 % 10000) / 1000);
  const opt2 = Math.floor((ta2 % 1000) / 100);
  const opt3 = Math.floor(ta1 / 10000);
  const opt4 = Math.floor(ta2 / 1000);

  if (kage.kShotai == kage.kMincho) { // mincho
    const kMinWidthT = kage.kMinWidthT - opt1 / 2;
    const kMinWidthT2 = kage.kMinWidthT - opt4 / 2;

    switch (a1 % 100) {
      case 0:
      case 7:
      case 27:
        delta = -1 * kage.kMinWidthY * 0.5;
        break;
      case 1:
      case 2: // ... must be 32
      case 6:
      case 22:
      case 32: // changed
        delta = 0;
        break;
      case 12:
        //case 32:
        delta = kage.kMinWidthY;
        break;
      default:
        break;
    }

    if (x1 == sx1) {
      if (y1 < sy1) { y1 = y1 - delta; }
      else { y1 = y1 + delta; }
    }
    else if (y1 == sy1) {
      if (x1 < sx1) { x1 = x1 - delta; }
      else { x1 = x1 + delta; }
    }
    else {
      rad = Math.atan((sy1 - y1) / (sx1 - x1));
      if (x1 < sx1) { v = 1; } else { v = -1; }
      x1 = x1 - delta * Math.cos(rad) * v;
      y1 = y1 - delta * Math.sin(rad) * v;
    }

    switch (a2 % 100) {
      case 0:
      case 1:
      case 7:
      case 9:
      case 15: // it can change to 15->5
      case 14: // it can change to 14->4
      case 17: // no need
      case 5:
        delta = 0;
        break;
      case 8: // get shorten for tail's circle
        delta = -1 * kMinWidthT * 0.5;
        break;
      default:
        break;
    }

    if (sx2 == x2) {
      if (sy2 < y2) { y2 = y2 + delta; }
      else { y2 = y2 - delta; }
    }
    else if (sy2 == y2) {
      if (sx2 < x2) { x2 = x2 + delta; }
      else { x2 = x2 - delta; }
    }
    else {
      rad = Math.atan((y2 - sy2) / (x2 - sx2));
      if (sx2 < x2) { v = 1; } else { v = -1; }
      x2 = x2 + delta * Math.cos(rad) * v;
      y2 = y2 + delta * Math.sin(rad) * v;
    }

    var cornerOffset = 0;
    function hypot() {
      return Math.sqrt(arguments[0] * arguments[0] + arguments[1] * arguments[1]);
    }
    var contourLength = hypot(sx1 - x1, sy1 - y1) + hypot(sx2 - sx1, sy2 - sy1) + hypot(x2 - sx2, y2 - sy2);
    if ((a1 == 22 || a1 == 27) && a2 == 7 && contourLength < 100) {
      cornerOffset = (kMinWidthT > 6) ? (kMinWidthT - 6) * ((100 - contourLength) / 100) : 0;
      x1 += cornerOffset;
    }

    hosomi = 0.5;
    if (Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) < 50) {
      hosomi += 0.4 * (1 - Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) / 50);
    }

    //---------------------------------------------------------------

    poly = new Polygon();
    poly2 = new Polygon();

    if (sx1 == sx2 && sy1 == sy2) { // Spline
      if (kage.kUseCurve) {
        // generating fatten curve -- begin
        var kage2 = new Kage();
        kage2.kMinWidthY = kage.kMinWidthY;
        kage2.kMinWidthT = kMinWidthT;
        kage2.kWidth = kage.kWidth;
        kage2.kKakato = kage.kKakato;
        kage2.kRate = 10;

        var curve = /** @type {[[number, number][], [number, number][]]} */ (new Array(2)); // L and R
        get_candidate(kage2, curve, a1, a2, x1, y1, sx1, sy1, x2, y2, opt3, opt4);

        var dcl12_34 = /** @type {[[number, number][], [number, number][]]} */ (new Array(2));
        var dcr12_34 = /** @type {[[number, number][], [number, number][]]} */ (new Array(2));
        var dpl12_34 = /** @type {[number[], number[]]} */ (new Array(2));
        var dpr12_34 = /** @type {[number[], number[]]} */ (new Array(2));
        divide_curve(kage2, x1, y1, sx1, sy1, x2, y2, curve[0], dcl12_34, dpl12_34);
        divide_curve(kage2, x1, y1, sx1, sy1, x2, y2, curve[1], dcr12_34, dpr12_34);

        var ncl1 = new Array(7);
        var ncl2 = new Array(7);
        find_offcurve(kage2, dcl12_34[0], dpl12_34[0][2], dpl12_34[0][3], ncl1);
        find_offcurve(kage2, dcl12_34[1], dpl12_34[1][2], dpl12_34[1][3], ncl2);

        poly.push(ncl1[0], ncl1[1]);
        poly.push(ncl1[2], ncl1[3], 1);
        poly.push(ncl1[4], ncl1[5]);
        poly.push(ncl2[2], ncl2[3], 1);
        poly.push(ncl2[4], ncl2[5]);

        poly2.push(dcr12_34[0][0][0], dcr12_34[0][0][1]);
        poly2.push(dpr12_34[0][2] - (ncl1[2] - dpl12_34[0][2]), dpl12_34[0][3] - (ncl1[3] - dpl12_34[0][3]), 1);
        poly2.push(dcr12_34[0][dcr12_34[0].length - 1][0], dcr12_34[0][dcr12_34[0].length - 1][1]);
        poly2.push(dpr12_34[1][2] - (ncl2[2] - dpl12_34[1][2]), dpl12_34[1][3] - (ncl2[3] - dpl12_34[1][3]), 1);
        poly2.push(dcr12_34[1][dcr12_34[1].length - 1][0], dcr12_34[1][dcr12_34[1].length - 1][1]);

        poly2.reverse();
        poly.concat(poly2);
        polygons.push(poly);
        // generating fatten curve -- end
      } else {
        for (tt = 0; tt <= 1000; tt = tt + kage.kRate) {
          t = tt / 1000;

          // calculate a dot
          x = ((1.0 - t) * (1.0 - t) * x1 + 2.0 * t * (1.0 - t) * sx1 + t * t * x2);
          y = ((1.0 - t) * (1.0 - t) * y1 + 2.0 * t * (1.0 - t) * sy1 + t * t * y2);

          // KATAMUKI of vector by BIBUN
          ix = (x1 - 2.0 * sx1 + x2) * 2.0 * t + (-2.0 * x1 + 2.0 * sx1);
          iy = (y1 - 2.0 * sy1 + y2) * 2.0 * t + (-2.0 * y1 + 2.0 * sy1);

          // line SUICHOKU by vector
          if (ix != 0 && iy != 0) {
            ir = Math.atan(iy / ix * -1);
            ia = Math.sin(ir) * (kMinWidthT);
            ib = Math.cos(ir) * (kMinWidthT);
          }
          else if (ix == 0) {
            if (iy < 0) {
              ia = -kMinWidthT;
            } else {
              ia = kMinWidthT;
            }
            ib = 0;
          }
          else {
            ia = 0;
            ib = kMinWidthT;
          }

          if ((a1 == 7 || a1 == 27) && a2 == 0) { // L2RD: fatten
            deltad = Math.pow(t, hosomi) * kage.kL2RDfatten;
          }
          else if (a1 == 7 || a1 == 27) {
            deltad = Math.pow(t, hosomi);
          }
          else if (a2 == 7) {
            deltad = Math.pow(1.0 - t, hosomi);
          }
          else if (opt3 > 0 || opt4 > 0) {
            deltad = ((kage.kMinWidthT - opt3 / 2) - (opt4 - opt3) / 2 * t) / kage.kMinWidthT;
          }
          else { deltad = 1; }

          if (deltad < 0.15) {
            deltad = 0.15;
          }
          ia = ia * deltad;
          ib = ib * deltad;

          //reverse if vector is going 2nd/3rd quadrants
          if (ix <= 0) {
            ia = ia * -1;
            ib = ib * -1;
          }

          //copy to polygon structure
          poly.push(x - ia, y - ib);
          poly2.push(x + ia, y + ib);
        }

        // suiheisen ni setsuzoku
        if (a1 == 132) {
          var index = 0;
          while (true) {
            if (poly2.array[index].y <= y1 && y1 <= poly2.array[index + 1].y) {
              break;
            }
            index++;
          }
          var newx1 = poly2.array[index + 1].x + (poly2.array[index].x - poly2.array[index + 1].x) *
            (poly2.array[index + 1].y - y1) / (poly2.array[index + 1].y - poly2.array[index].y);
          var newy1 = y1;
          var newx2 = poly.array[0].x + (poly.array[0].x - poly.array[1].x) * (poly.array[0].y - y1) /
            (poly.array[1].y - poly.array[0].y);
          var newy2 = y1;

          for (var i = 0; i < index; i++) {
            poly2.shift();
          }
          poly2.set(0, newx1, newy1);
          poly.unshift(newx2, newy2);
        }

        // suiheisen ni setsuzoku 2
        if (a1 == 22 && y1 > y2) {
          var index = 0;
          while (true) {
            if (poly2.array[index].y <= y1 && y1 <= poly2.array[index + 1].y) {
              break;
            }
            index++;
          }
          newx1 = poly2.array[index + 1].x + (poly2.array[index].x - poly2.array[index + 1].x) *
            (poly2.array[index + 1].y - y1) / (poly2.array[index + 1].y - poly2.array[index].y);
          newy1 = y1;
          newx2 = poly.array[0].x + (poly.array[0].x - poly.array[1].x - 1) * (poly.array[0].y - y1) /
            (poly.array[1].y - poly.array[0].y);
          newy2 = y1 + 1;

          for (var i = 0; i < index; i++) {
            poly2.shift();
          }
          poly2.set(0, newx1, newy1);
          poly.unshift(newx2, newy2);
        }

        poly2.reverse();
        poly.concat(poly2);
        polygons.push(poly);
      }
    } else { // Bezier
      for (tt = 0; tt <= 1000; tt = tt + kage.kRate) {
        t = tt / 1000;

        // calculate a dot
        x = (1.0 - t) * (1.0 - t) * (1.0 - t) * x1 + 3.0 * t * (1.0 - t) * (1.0 - t) * sx1 + 3 * t * t * (1.0 - t) * sx2 + t * t * t * x2;
        y = (1.0 - t) * (1.0 - t) * (1.0 - t) * y1 + 3.0 * t * (1.0 - t) * (1.0 - t) * sy1 + 3 * t * t * (1.0 - t) * sy2 + t * t * t * y2;
        // KATAMUKI of vector by BIBUN
        ix = t * t * (-3 * x1 + 9 * sx1 + -9 * sx2 + 3 * x2) + t * (6 * x1 + -12 * sx1 + 6 * sx2) + -3 * x1 + 3 * sx1;
        iy = t * t * (-3 * y1 + 9 * sy1 + -9 * sy2 + 3 * y2) + t * (6 * y1 + -12 * sy1 + 6 * sy2) + -3 * y1 + 3 * sy1;

        // line SUICHOKU by vector
        if (ix != 0 && iy != 0) {
          ir = Math.atan(iy / ix * -1);
          ia = Math.sin(ir) * (kMinWidthT);
          ib = Math.cos(ir) * (kMinWidthT);
        }
        else if (ix == 0) {
          if (iy < 0) {
            ia = -kMinWidthT;
          } else {
            ia = kMinWidthT;
          }
          ib = 0;
        }
        else {
          ia = 0;
          ib = kMinWidthT;
        }

        if ((a1 == 7 || a1 == 27) && a2 == 0) { // L2RD: fatten
          deltad = Math.pow(t, hosomi) * kage.kL2RDfatten;
        }
        else if (a1 == 7 || a1 == 27) {
          deltad = Math.pow(t, hosomi);
          deltad = Math.pow(deltad, 0.7); // make fatten
        }
        else if (a2 == 7) {
          deltad = Math.pow(1.0 - t, hosomi);
        }
        else { deltad = 1; }

        if (deltad < 0.15) {
          deltad = 0.15;
        }
        ia = ia * deltad;
        ib = ib * deltad;

        //reverse if vector is going 2nd/3rd quadrants
        if (ix <= 0) {
          ia = ia * -1;
          ib = ib * -1;
        }

        //copy to polygon structure
        poly.push(x - ia, y - ib);
        poly2.push(x + ia, y + ib);
      }

      // suiheisen ni setsuzoku
      if (a1 == 132) {
        var index = 0;
        while (true) {
          if (poly2.array[index].y <= y1 && y1 <= poly2.array[index + 1].y) {
            break;
          }
          index++;
        }
        newx1 = poly2.array[index + 1].x + (poly2.array[index].x - poly2.array[index + 1].x) *
          (poly2.array[index + 1].y - y1) / (poly2.array[index + 1].y - poly2.array[index].y);
        newy1 = y1;
        newx2 = poly.array[0].x + (poly.array[0].x - poly.array[1].x) * (poly.array[0].y - y1) /
          (poly.array[1].y - poly.array[0].y);
        newy2 = y1;

        for (var i = 0; i < index; i++) {
          poly2.shift();
        }
        poly2.set(0, newx1, newy1);
        poly.unshift(newx2, newy2);
      }

      // suiheisen ni setsuzoku 2
      if (a1 == 22) {
        if (x1 > sx1) {
          var index = 0;
          while (true) {
            if (poly2.array[index].y <= y1 && y1 <= poly2.array[index + 1].y) {
              break;
            }
            index++;
          }
          newx1 = poly2.array[index + 1].x + (poly2.array[index].x - poly2.array[index + 1].x) *
            (poly2.array[index + 1].y - y1) / (poly2.array[index + 1].y - poly2.array[index].y);
          newy1 = y1;
          newx2 = poly.array[0].x + (poly.array[0].x - poly.array[1].x - 1) * (poly.array[0].y - y1) /
            (poly.array[1].y - poly.array[0].y);
          newy2 = y1 + 1;

          for (var i = 0; i < index; i++) {
            poly2.shift();
          }
          poly2.set(0, newx1, newy1);
          poly.unshift(newx2, newy2);
        }
      }

      poly2.reverse();
      poly.concat(poly2);
      polygons.push(poly);
    }

    //process for head of stroke
    rad = Math.atan((sy1 - y1) / (sx1 - x1));
    if (x1 < sx1) { v = 1; } else { v = -1; }
    XX = Math.sin(rad) * v;
    XY = Math.cos(rad) * v * -1;
    YX = Math.cos(rad) * v;
    YY = Math.sin(rad) * v;

    if (a1 == 12) {
      if (x1 == sx1) {
        poly = new Polygon();
        poly.push(x1 - kMinWidthT, y1);
        poly.push(x1 + kMinWidthT, y1);
        poly.push(x1 - kMinWidthT, y1 - kMinWidthT);
        polygons.push(poly);
      }
      else {
        poly = new Polygon();
        poly.push(x1 - kMinWidthT * XX, y1 - kMinWidthT * XY);
        poly.push(x1 + kMinWidthT * XX, y1 + kMinWidthT * XY);
        poly.push(x1 - kMinWidthT * XX - kMinWidthT * YX, y1 - kMinWidthT * XY - kMinWidthT * YY);
        polygons.push(poly);
      }
    }

    var pm = 0;
    if (a1 == 0) {
      if (y1 <= y2) { //from up to bottom
        type = (Math.atan2(Math.abs(y1 - sy1), Math.abs(x1 - sx1)) / Math.PI * 2 - 0.4);
        if (type > 0) {
          type = type * 2;
        } else {
          type = type * 16;
        }
        if (type < 0) {
          pm = -1;
        } else {
          pm = 1;
        }
        if (x1 == sx1) {
          poly = new Polygon();
          poly.push(x1 - kMinWidthT, y1 + 1);
          poly.push(x1 + kMinWidthT, y1);
          poly.push(x1 - kMinWidthT * pm, y1 - kage.kMinWidthY * type * pm);
          //if(x1 > x2){
          //  poly.reverse();
          //}
          polygons.push(poly);
        }
        else {
          poly = new Polygon();
          poly.push(x1 - kMinWidthT * XX + 1 * YX, y1 - kMinWidthT * XY + 1 * YY);
          poly.push(x1 + kMinWidthT * XX, y1 + kMinWidthT * XY);
          poly.push(x1 - kMinWidthT * pm * XX - kage.kMinWidthY * type * pm * YX, y1 - kMinWidthT * pm * XY - kage.kMinWidthY * type * pm * YY);
          //if(x1 > x2){
          //  poly.reverse();
          //}
          polygons.push(poly);
        }
      }
      else { //bottom to up
        if (x1 == sx1) {
          poly = new Polygon();
          poly.push(x1 - kMinWidthT, y1);
          poly.push(x1 + kMinWidthT, y1);
          poly.push(x1 + kMinWidthT, y1 - kage.kMinWidthY);
          polygons.push(poly);
        }
        else {
          poly = new Polygon();
          poly.push(x1 - kMinWidthT * XX, y1 - kMinWidthT * XY);
          poly.push(x1 + kMinWidthT * XX, y1 + kMinWidthT * XY);
          poly.push(x1 + kMinWidthT * XX - kage.kMinWidthY * YX, y1 + kMinWidthT * XY - kage.kMinWidthY * YY);
          //if(x1 < x2){
          //  poly.reverse();
          //}
          polygons.push(poly);
        }
      }
    }

    if (a1 == 22 || a1 == 27) { //box's up-right corner, any time same degree
      poly = new Polygon();
      poly.push(x1 - cornerOffset - kMinWidthT, y1 - kage.kMinWidthY);
      poly.push(x1 - cornerOffset, y1 - kage.kMinWidthY - kage.kWidth);
      poly.push(x1 - cornerOffset + kMinWidthT + kage.kWidth, y1 + kage.kMinWidthY);
      poly.push(x1 - cornerOffset + kMinWidthT, y1 + kMinWidthT - 1);
      if (a1 == 27) {
        poly.push(x1 - cornerOffset, y1 + kMinWidthT + 2);
        poly.push(x1 - cornerOffset, y1);
      } else {
        poly.push(x1 - cornerOffset - kMinWidthT, y1 + kMinWidthT + 4);
      }
      polygons.push(poly);
    }

    if (a1 == 0) { //beginning of the stroke
      if (y1 <= y2) { //from up to bottom
        if (pm > 0) {
          type = 0;
        }
        var move = kage.kMinWidthY * type * pm;
        if (x1 == sx1) {
          poly = new Polygon();
          poly.push(x1 + kMinWidthT, y1 - move);
          poly.push(x1 + kMinWidthT * 1.5, y1 + kage.kMinWidthY - move);
          poly.push(x1 + kMinWidthT - 2, y1 + kage.kMinWidthY * 2 + 1);
          polygons.push(poly);
        }
        else {
          poly = new Polygon();
          poly.push(x1 + kMinWidthT * XX - move * YX,
            y1 + kMinWidthT * XY - move * YY);
          poly.push(x1 + kMinWidthT * 1.5 * XX + (kage.kMinWidthY - move * 1.2) * YX,
            y1 + kMinWidthT * 1.5 * XY + (kage.kMinWidthY - move * 1.2) * YY);
          poly.push(x1 + (kMinWidthT - 2) * XX + (kage.kMinWidthY * 2 - move * 0.8 + 1) * YX,
            y1 + (kMinWidthT - 2) * XY + (kage.kMinWidthY * 2 - move * 0.8 + 1) * YY);
          //if(x1 < x2){
          //  poly.reverse();
          //}
          polygons.push(poly);
        }
      }
      else { //from bottom to up
        if (x1 == sx1) {
          poly = new Polygon();
          poly.push(x1 - kMinWidthT, y1);
          poly.push(x1 - kMinWidthT * 1.5, y1 + kage.kMinWidthY);
          poly.push(x1 - kMinWidthT * 0.5, y1 + kage.kMinWidthY * 3);
          polygons.push(poly);
        }
        else {
          poly = new Polygon();
          poly.push(x1 - kMinWidthT * XX, y1 - kMinWidthT * XY);
          poly.push(x1 - kMinWidthT * 1.5 * XX + kage.kMinWidthY * YX, y1 + kage.kMinWidthY * YY - kMinWidthT * 1.5 * XY);
          poly.push(x1 - kMinWidthT * 0.5 * XX + kage.kMinWidthY * 3 * YX, y1 + kage.kMinWidthY * 3 * YY - kMinWidthT * 0.5 * XY);
          //if(x1 < x2){
          //  poly.reverse();
          //}
          polygons.push(poly);
        }
      }
    }

    //process for tail
    rad = Math.atan((y2 - sy2) / (x2 - sx2));
    if (sx2 < x2) { v = 1; } else { v = -1; }
    YX = Math.sin(rad) * v * -1;
    YY = Math.cos(rad) * v;
    XX = Math.cos(rad) * v;
    XY = Math.sin(rad) * v;

    if (a2 == 1 || a2 == 8 || a2 == 15) { //the last filled circle ... it can change 15->5
      if (sx2 == x2) {
        poly = new Polygon();
        if (kage.kUseCurve) {
          // by curve path
          poly.push(x2 - kMinWidthT2, y2);
          poly.push(x2 - kMinWidthT2 * 0.9, y2 + kMinWidthT2 * 0.9, 1);
          poly.push(x2, y2 + kMinWidthT2);
          poly.push(x2 + kMinWidthT2 * 0.9, y2 + kMinWidthT2 * 0.9, 1);
          poly.push(x2 + kMinWidthT2, y2);
        } else {
          // by polygon
          poly.push(x2 - kMinWidthT2, y2);
          poly.push(x2 - kMinWidthT2 * 0.7, y2 + kMinWidthT2 * 0.7);
          poly.push(x2, y2 + kMinWidthT2);
          poly.push(x2 + kMinWidthT2 * 0.7, y2 + kMinWidthT2 * 0.7);
          poly.push(x2 + kMinWidthT2, y2);
        }
        polygons.push(poly);
      }
      else if (sy2 == y2) {
        poly = new Polygon();
        if (kage.kUseCurve) {
          // by curve path
          poly.push(x2, y2 - kMinWidthT2);
          poly.push(x2 + kMinWidthT2 * 0.9, y2 - kMinWidthT2 * 0.9, 1);
          poly.push(x2 + kMinWidthT2, y2);
          poly.push(x2 + kMinWidthT2 * 0.9, y2 + kMinWidthT2 * 0.9, 1);
          poly.push(x2, y2 + kMinWidthT2);
        } else {
          // by polygon
          poly.push(x2, y2 - kMinWidthT2);
          poly.push(x2 + kMinWidthT2 * 0.7, y2 - kMinWidthT2 * 0.7);
          poly.push(x2 + kMinWidthT2, y2);
          poly.push(x2 + kMinWidthT2 * 0.7, y2 + kMinWidthT2 * 0.7);
          poly.push(x2, y2 + kMinWidthT2);
        }
        polygons.push(poly);
      }
      else {
        poly = new Polygon();
        if (kage.kUseCurve) {
          poly.push(x2 + Math.sin(rad) * kMinWidthT2 * v, y2 - Math.cos(rad) * kMinWidthT2 * v);
          poly.push(x2 + Math.cos(rad) * kMinWidthT2 * 0.9 * v + Math.sin(rad) * kMinWidthT2 * 0.9 * v,
            y2 + Math.sin(rad) * kMinWidthT2 * 0.9 * v - Math.cos(rad) * kMinWidthT2 * 0.9 * v, 1);
          poly.push(x2 + Math.cos(rad) * kMinWidthT2 * v, y2 + Math.sin(rad) * kMinWidthT2 * v);
          poly.push(x2 + Math.cos(rad) * kMinWidthT2 * 0.9 * v - Math.sin(rad) * kMinWidthT2 * 0.9 * v,
            y2 + Math.sin(rad) * kMinWidthT2 * 0.9 * v + Math.cos(rad) * kMinWidthT2 * 0.9 * v, 1);
          poly.push(x2 - Math.sin(rad) * kMinWidthT2 * v, y2 + Math.cos(rad) * kMinWidthT2 * v);
        } else {
          poly.push(x2 + Math.sin(rad) * kMinWidthT2 * v, y2 - Math.cos(rad) * kMinWidthT2 * v);
          poly.push(x2 + Math.cos(rad) * kMinWidthT2 * 0.7 * v + Math.sin(rad) * kMinWidthT2 * 0.7 * v,
            y2 + Math.sin(rad) * kMinWidthT2 * 0.7 * v - Math.cos(rad) * kMinWidthT2 * 0.7 * v);
          poly.push(x2 + Math.cos(rad) * kMinWidthT2 * v, y2 + Math.sin(rad) * kMinWidthT2 * v);
          poly.push(x2 + Math.cos(rad) * kMinWidthT2 * 0.7 * v - Math.sin(rad) * kMinWidthT2 * 0.7 * v,
            y2 + Math.sin(rad) * kMinWidthT2 * 0.7 * v + Math.cos(rad) * kMinWidthT2 * 0.7 * v);
          poly.push(x2 - Math.sin(rad) * kMinWidthT2 * v, y2 + Math.cos(rad) * kMinWidthT2 * v);
        }
        polygons.push(poly);
      }
    }

    if (a2 == 9 || ((a1 == 7 || a1 == 27) && a2 == 0)) { // Math.sinnyu & L2RD Harai ... no need for a2=9
      var type = (Math.atan2(Math.abs(y2 - sy2), Math.abs(x2 - sx2)) / Math.PI * 2 - 0.6);
      if (type > 0) {
        type = type * 8;
      } else {
        type = type * 3;
      }
      var pm = 0;
      if (type < 0) {
        pm = -1;
      } else {
        pm = 1;
      }
      if (sy2 == y2) {
        poly = new Polygon();
        poly.push(x2, y2 + kMinWidthT * kage.kL2RDfatten);
        poly.push(x2, y2 - kMinWidthT * kage.kL2RDfatten);
        poly.push(x2 + kMinWidthT * kage.kL2RDfatten * Math.abs(type), y2 + kMinWidthT * kage.kL2RDfatten * pm);
        polygons.push(poly);
      }
      else {
        poly = new Polygon();
        poly.push(x2 + kMinWidthT * kage.kL2RDfatten * YX, y2 + kMinWidthT * kage.kL2RDfatten * YY);
        poly.push(x2 - kMinWidthT * kage.kL2RDfatten * YX, y2 - kMinWidthT * kage.kL2RDfatten * YY);
        poly.push(x2 + kMinWidthT * kage.kL2RDfatten * Math.abs(type) * XX + kMinWidthT * kage.kL2RDfatten * pm * YX,
          y2 + kMinWidthT * kage.kL2RDfatten * Math.abs(type) * XY + kMinWidthT * kage.kL2RDfatten * pm * YY);
        polygons.push(poly);
      }
    }

    if (a2 == 15) { //jump up ... it can change 15->5
      // anytime same degree
      poly = new Polygon();
      if (y1 < y2) {
        poly.push(x2, y2 - kMinWidthT + 1);
        poly.push(x2 + 2, y2 - kMinWidthT - kage.kWidth * 5);
        poly.push(x2, y2 - kMinWidthT - kage.kWidth * 5);
        poly.push(x2 - kMinWidthT, y2 - kMinWidthT + 1);
      } else {
        poly.push(x2, y2 + kMinWidthT - 1);
        poly.push(x2 - 2, y2 + kMinWidthT + kage.kWidth * 5);
        poly.push(x2, y2 + kMinWidthT + kage.kWidth * 5);
        poly.push(x2 + kMinWidthT, y2 + kMinWidthT - 1);
      }
      polygons.push(poly);
    }

    if (a2 == 14) { //jump to left, allways go left
      poly = new Polygon();
      poly.push(x2, y2);
      poly.push(x2, y2 - kMinWidthT);
      var jumpFactor = (kMinWidthT > 6 ? 6.0 / kMinWidthT : 1.0);
      poly.push(x2 - kage.kWidth * 4 * Math.min(1 - opt2 / 10, Math.pow(kMinWidthT / kage.kMinWidthT, 3)) * jumpFactor, y2 - kMinWidthT);
      poly.push(x2 - kage.kWidth * 4 * Math.min(1 - opt2 / 10, Math.pow(kMinWidthT / kage.kMinWidthT, 3)) * jumpFactor, y2 - kMinWidthT * 0.5);
      //poly.reverse();
      polygons.push(poly);
    }
  }
  else { //gothic
    if (a1 % 10 == 2) {
      if (x1 == sx1) {
        if (y1 < sy1) { y1 = y1 - kage.kWidth; } else { y1 = y1 + kage.kWidth; }
      }
      else if (y1 == sy1) {
        if (x1 < sx1) { x1 = x1 - kage.kWidth; } else { x1 = x1 + kage.kWidth; }
      }
      else {
        rad = Math.atan((sy1 - y1) / (sx1 - x1));
        if (x1 < sx1) { v = 1; } else { v = -1; }
        x1 = x1 - kage.kWidth * Math.cos(rad) * v;
        y1 = y1 - kage.kWidth * Math.sin(rad) * v;
      }
    }

    if (a1 % 10 == 3) {
      if (x1 == sx1) {
        if (y1 < sy1) {
          y1 = y1 - kage.kWidth * kage.kKakato;
        }
        else {
          y1 = y1 + kage.kWidth * kage.kKakato;
        }
      }
      else if (y1 == sy1) {
        if (x1 < sx1) {
          x1 = x1 - kage.kWidth * kage.kKakato;
        }
        else {
          x1 = x1 + kage.kWidth * kage.kKakato;
        }
      }
      else {
        rad = Math.atan((sy1 - y1) / (sx1 - x1));
        if (x1 < sx1) { v = 1; } else { v = -1; }
        x1 = x1 - kage.kWidth * Math.cos(rad) * v * kage.kKakato;
        y1 = y1 - kage.kWidth * Math.sin(rad) * v * kage.kKakato;
      }
    }
    if (a2 % 10 == 2) {
      if (sx2 == x2) {
        if (sy2 < y2) { y2 = y2 + kage.kWidth; } else { y2 = y2 - kage.kWidth; }
      }
      else if (sy2 == y2) {
        if (sx2 < x2) { x2 = x2 + kage.kWidth; } else { x2 = x2 - kage.kWidth; }
      }
      else {
        rad = Math.atan((y2 - sy2) / (x2 - sx2));
        if (sx2 < x2) { v = 1; } else { v = -1; }
        x2 = x2 + kage.kWidth * Math.cos(rad) * v;
        y2 = y2 + kage.kWidth * Math.sin(rad) * v;
      }
    }

    if (a2 % 10 == 3) {
      if (sx2 == x2) {
        if (sy2 < y2) {
          y2 = y2 + kage.kWidth * kage.kKakato;
        }
        else {
          y2 = y2 - kage.kWidth * kage.kKakato;
        }
      }
      else if (sy2 == y2) {
        if (sx2 < x2) {
          x2 = x2 + kage.kWidth * kage.kKakato;
        }
        else {
          x2 = x2 - kage.kWidth * kage.kKakato;
        }
      }
      else {
        rad = Math.atan((y2 - sy2) / (x2 - sx2));
        if (sx2 < x2) { v = 1; } else { v = -1; }
        x2 = x2 + kage.kWidth * Math.cos(rad) * v * kage.kKakato;
        y2 = y2 + kage.kWidth * Math.sin(rad) * v * kage.kKakato;
      }
    }

    poly = new Polygon();
    poly2 = new Polygon();

    for (tt = 0; tt <= 1000; tt = tt + kage.kRate) {
      t = tt / 1000;

      if (sx1 == sx2 && sy1 == sy2) {
        //calculating each point
        x = ((1.0 - t) * (1.0 - t) * x1 + 2.0 * t * (1.0 - t) * sx1 + t * t * x2);
        y = ((1.0 - t) * (1.0 - t) * y1 + 2.0 * t * (1.0 - t) * sy1 + t * t * y2);

        //SESSEN NO KATAMUKI NO KEISAN(BIBUN)
        ix = (x1 - 2.0 * sx1 + x2) * 2.0 * t + (-2.0 * x1 + 2.0 * sx1);
        iy = (y1 - 2.0 * sy1 + y2) * 2.0 * t + (-2.0 * y1 + 2.0 * sy1);
      } else {
      }
      //SESSEN NI SUICHOKU NA CHOKUSEN NO KEISAN
      if (kage.kShotai == kage.kMincho) { //always false ?
        if (ix != 0 && iy != 0) {
          ir = Math.atan(iy / ix * -1.0);
          ia = Math.sin(ir) * kage.kMinWidthT;
          ib = Math.cos(ir) * kage.kMinWidthT;
        }
        else if (ix == 0) {
          if (iy < 0) {
            ia = -kage.kMinWidthT;
          } else {
            ia = kage.kMinWidthT;
          }
          ib = 0;
        }
        else {
          ia = 0;
          ib = kage.kMinWidthT;
        }
        ia = ia * Math.sqrt(1.0 - t);
        ib = ib * Math.sqrt(1.0 - t);
      }
      else {
        if (ix != 0 && iy != 0) {
          ir = Math.atan(iy / ix * -1.0);
          ia = Math.sin(ir) * kage.kWidth;
          ib = Math.cos(ir) * kage.kWidth;
        }
        else if (ix == 0) {
          if (iy < 0) {
            ia = -kage.kWidth;
          } else {
            ia = kage.kWidth;
          }
          ib = 0;
        }
        else {
          ia = 0;
          ib = kage.kWidth;
        }
      }

      //reverse if vector is going 2nd/3rd quadrants
      if (ix <= 0) {
        ia = ia * -1;
        ib = ib * -1;
      }

      //save to polygon
      poly.push(x - ia, y - ib);
      poly2.push(x + ia, y + ib);
    }

    poly2.reverse();
    poly.concat(poly2);
    polygons.push(poly);
  }
}
exports.cdDrawCurveU = cdDrawCurveU;

/**
 * @param {Kage} kage
 * @param {Polygons} polygons
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} x3
 * @param {number} y3
 * @param {number} x4
 * @param {number} y4
 * @param {number} a1
 * @param {number} a2
 */
function cdDrawBezier(kage, polygons, x1, y1, x2, y2, x3, y3, x4, y4, a1, a2) {
  cdDrawCurveU(kage, polygons, x1, y1, x2, y2, x3, y3, x4, y4, a1, a2);
}
exports.cdDrawBezier = cdDrawBezier;

/**
 * @param {Kage} kage
 * @param {Polygons} polygons
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} x3
 * @param {number} y3
 * @param {number} a1
 * @param {number} a2
 */
function cdDrawCurve(kage, polygons, x1, y1, x2, y2, x3, y3, a1, a2) {
  cdDrawCurveU(kage, polygons, x1, y1, x2, y2, x2, y2, x3, y3, a1, a2);
}
exports.cdDrawCurve = cdDrawCurve;

/**
 * @param {Kage} kage
 * @param {Polygons} polygons
 * @param {number} tx1
 * @param {number} ty1
 * @param {number} tx2
 * @param {number} ty2
 * @param {number} ta1
 * @param {number} ta2
 */
function cdDrawLine(kage, polygons, tx1, ty1, tx2, ty2, ta1, ta2) {
  var rad;
  var v, x1, y1, x2, y2;
  var a1, a2, opt1, opt2;
  var XX, XY, YX, YY;
  var poly;
  var kMinWidthT;

  if (kage.kShotai == kage.kMincho) { //mincho
    x1 = tx1;
    y1 = ty1;
    x2 = tx2;
    y2 = ty2;
    a1 = ta1 % 1000;
    a2 = ta2 % 100;
    opt1 = Math.floor(ta1 / 1000);
    opt2 = Math.floor(ta2 / 100);

    kMinWidthT = kage.kMinWidthT - opt1 / 2;

    if (x1 == x2) { //if TATE stroke, use y-axis
      poly = new Polygon(4);
      switch (a1) {
        case 0:
          poly.set(3, x1 - kMinWidthT, y1 - kage.kMinWidthY / 2);
          poly.set(0, x1 + kMinWidthT, y1 + kage.kMinWidthY / 2);
          break;
        case 1:
        case 6: //... no need
        case 22:
          poly.set(3, x1 - kMinWidthT, y1);
          poly.set(0, x1 + kMinWidthT, y1);
          break;
        case 12:
          poly.set(3, x1 - kMinWidthT, y1 - kage.kMinWidthY - kMinWidthT);
          poly.set(0, x1 + kMinWidthT, y1 - kage.kMinWidthY);
          break;
        case 32:
          poly.set(3, x1 - kMinWidthT, y1 - kage.kMinWidthY);
          poly.set(0, x1 + kMinWidthT, y1 - kage.kMinWidthY);
          break;
      }

      switch (a2) {
        case 0:
          if (a1 == 6) { //KAGI's tail ... no need
            poly.set(2, x2 - kMinWidthT, y2);
            poly.set(1, x2 + kMinWidthT, y2);
          }
          else {
            poly.set(2, x2 - kMinWidthT, y2 + kMinWidthT / 2);
            poly.set(1, x2 + kMinWidthT, y2 - kMinWidthT / 2);
          }
          break;
        case 1:
          poly.set(2, x2 - kMinWidthT, y2);
          poly.set(1, x2 + kMinWidthT, y2);
          break;
        case 13:
          poly.set(2, x2 - kMinWidthT, y2 + kage.kAdjustKakatoL[opt2] + kMinWidthT);
          poly.set(1, x2 + kMinWidthT, y2 + kage.kAdjustKakatoL[opt2]);
          break;
        case 23:
          poly.set(2, x2 - kMinWidthT, y2 + kage.kAdjustKakatoR[opt2] + kMinWidthT);
          poly.set(1, x2 + kMinWidthT, y2 + kage.kAdjustKakatoR[opt2]);
          break;
        case 24: //for T/H design
          poly.set(2, x2 - kMinWidthT, y2 + kage.kMinWidthY);
          poly.set(1, x2 + kMinWidthT, y2 + kage.kMinWidthY);
          break;
        case 32:
          poly.set(2, x2 - kMinWidthT, y2 + kage.kMinWidthY);
          poly.set(1, x2 + kMinWidthT, y2 + kage.kMinWidthY);
          break;
      }

      polygons.push(poly);

      if (a2 == 24) { //for T design
        poly = new Polygon();
        poly.push(x2, y2 + kage.kMinWidthY);
        poly.push(x2 + kMinWidthT, y2 - kage.kMinWidthY * 3);
        poly.push(x2 + kMinWidthT * 2, y2 - kage.kMinWidthY);
        poly.push(x2 + kMinWidthT * 2, y2 + kage.kMinWidthY);
        polygons.push(poly);
      }

      if (a2 == 13 && opt2 == 4) { //for new GTH box's left bottom corner
        poly = new Polygon();
        poly.push(x2 - kMinWidthT, y2 - kage.kMinWidthY * 3);
        poly.push(x2 - kMinWidthT * 2, y2);
        poly.push(x2 - kage.kMinWidthY, y2 + kage.kMinWidthY * 5);
        poly.push(x2 + kMinWidthT, y2 + kage.kMinWidthY);
        polygons.push(poly);
      }

      if (a1 == 22 || a1 == 27) { //box's right top corner
        poly = new Polygon();
        poly.push(x1 - kMinWidthT, y1 - kage.kMinWidthY);
        poly.push(x1, y1 - kage.kMinWidthY - kage.kWidth);
        poly.push(x1 + kMinWidthT + kage.kWidth, y1 + kage.kMinWidthY);
        poly.push(x1 + kMinWidthT, y1 + kMinWidthT);
        poly.push(x1 - kMinWidthT, y1);
        polygons.push(poly);
      }

      if (a1 == 0) { //beginning of the stroke
        poly = new Polygon();
        poly.push(x1 + kMinWidthT, y1 + kage.kMinWidthY * 0.5);
        poly.push(x1 + kMinWidthT + kMinWidthT * 0.5, y1 + kage.kMinWidthY * 0.5 + kage.kMinWidthY);
        poly.push(x1 + kMinWidthT - 2, y1 + kage.kMinWidthY * 0.5 + kage.kMinWidthY * 2 + 1);
        polygons.push(poly);
      }

      if ((a1 == 6 && a2 == 0) || a2 == 1) { //KAGI NO YOKO BOU NO SAIGO NO MARU ... no need only used at 1st=yoko
        poly = new Polygon();
        if (kage.kUseCurve) {
          poly.push(x2 - kMinWidthT, y2);
          poly.push(x2 - kMinWidthT * 0.9, y2 + kMinWidthT * 0.9, 1);
          poly.push(x2, y2 + kMinWidthT);
          poly.push(x2 + kMinWidthT * 0.9, y2 + kMinWidthT * 0.9, 1);
          poly.push(x2 + kMinWidthT, y2);
        } else {
          poly.push(x2 - kMinWidthT, y2);
          poly.push(x2 - kMinWidthT * 0.6, y2 + kMinWidthT * 0.6);
          poly.push(x2, y2 + kMinWidthT);
          poly.push(x2 + kMinWidthT * 0.6, y2 + kMinWidthT * 0.6);
          poly.push(x2 + kMinWidthT, y2);
        }
        //poly.reverse(); // for fill-rule
        polygons.push(poly);
      }
    }
    else if (y1 == y2) { //if it is YOKO stroke, use x-axis
      if (a1 == 6) { //if it is KAGI's YOKO stroke, get bold
        poly = new Polygon();
        poly.push(x1, y1 - kMinWidthT);
        poly.push(x2, y2 - kMinWidthT);
        poly.push(x2, y2 + kMinWidthT);
        poly.push(x1, y1 + kMinWidthT);
        polygons.push(poly);

        if (a2 == 1 || a2 == 0 || a2 == 5) { // no need a2=1
          //KAGI NO YOKO BOU NO SAIGO NO MARU
          poly = new Polygon();
          if (kage.kUseCurve) {
            if (x1 < x2) {
              poly.push(x2, y2 - kMinWidthT);
              poly.push(x2 + kMinWidthT * 0.9, y2 - kMinWidthT * 0.9, 1);
              poly.push(x2 + kMinWidthT, y2);
              poly.push(x2 + kMinWidthT * 0.9, y2 + kMinWidthT * 0.9, 1);
              poly.push(x2, y2 + kMinWidthT);
            } else {
              poly.push(x2, y2 - kMinWidthT);
              poly.push(x2 - kMinWidthT * 0.9, y2 - kMinWidthT * 0.9, 1);
              poly.push(x2 - kMinWidthT, y2);
              poly.push(x2 - kMinWidthT * 0.9, y2 + kMinWidthT * 0.9, 1);
              poly.push(x2, y2 + kMinWidthT);
            }
          } else {
            if (x1 < x2) {
              poly.push(x2, y2 - kMinWidthT);
              poly.push(x2 + kMinWidthT * 0.6, y2 - kMinWidthT * 0.6);
              poly.push(x2 + kMinWidthT, y2);
              poly.push(x2 + kMinWidthT * 0.6, y2 + kMinWidthT * 0.6);
              poly.push(x2, y2 + kMinWidthT);
            } else {
              poly.push(x2, y2 - kMinWidthT);
              poly.push(x2 - kMinWidthT * 0.6, y2 - kMinWidthT * 0.6);
              poly.push(x2 - kMinWidthT, y2);
              poly.push(x2 - kMinWidthT * 0.6, y2 + kMinWidthT * 0.6);
              poly.push(x2, y2 + kMinWidthT);
            }
          }
          polygons.push(poly);
        }

        if (a2 == 5) {
          //KAGI NO YOKO BOU NO HANE
          poly = new Polygon();
          if (x1 < x2) {
            //poly.push(x2, y2 - kMinWidthT + 1);
            poly.push(x2, y2 - kMinWidthT);
            poly.push(x2 + 2, y2 - kMinWidthT - kage.kWidth * (4 * (1 - opt1 / kage.kAdjustMageStep) + 1));
            poly.push(x2, y2 - kMinWidthT - kage.kWidth * (4 * (1 - opt1 / kage.kAdjustMageStep) + 1));
            //poly.push(x2 - kMinWidthT, y2 - kMinWidthT + 1);
            poly.push(x2 - kMinWidthT, y2 - kMinWidthT);
          } else {
            //poly.push(x2, y2 - kMinWidthT + 1);
            poly.push(x2, y2 - kMinWidthT);
            poly.push(x2 - 2, y2 - kMinWidthT - kage.kWidth * (4 * (1 - opt1 / kage.kAdjustMageStep) + 1));
            poly.push(x2, y2 - kMinWidthT - kage.kWidth * (4 * (1 - opt1 / kage.kAdjustMageStep) + 1));
            //poly.push(x2 + kMinWidthT, y2 - kMinWidthT + 1);
            poly.push(x2 + kMinWidthT, y2 - kMinWidthT);
          }
          //poly.reverse(); // for fill-rule
          polygons.push(poly);
        }
      }
      else {
        //always same
        poly = new Polygon(4);
        poly.set(0, x1, y1 - kage.kMinWidthY);
        poly.set(1, x2, y2 - kage.kMinWidthY);
        poly.set(2, x2, y2 + kage.kMinWidthY);
        poly.set(3, x1, y1 + kage.kMinWidthY);
        polygons.push(poly);

        //UROKO
        if (a2 == 0) {
          var urokoScale = (kage.kMinWidthU / kage.kMinWidthY - 1.0) / 4.0 + 1.0;
          poly = new Polygon();
          poly.push(x2, y2 - kage.kMinWidthY);
          poly.push(x2 - kage.kAdjustUrokoX[opt2] * urokoScale, y2);
          poly.push(x2 - kage.kAdjustUrokoX[opt2] * urokoScale / 2, y2 - kage.kAdjustUrokoY[opt2] * urokoScale);
          polygons.push(poly);
        }
      }
    }
    else { //for others, use x-axis
      rad = Math.atan((y2 - y1) / (x2 - x1));
      if ((Math.abs(y2 - y1) < Math.abs(x2 - x1)) && (a1 != 6) && (a2 != 6) && !(x1 > x2)) { //ASAI KAUDO
        //always same
        poly = new Polygon(4);
        poly.set(0, x1 + Math.sin(rad) * kage.kMinWidthY, y1 - Math.cos(rad) * kage.kMinWidthY);
        poly.set(1, x2 + Math.sin(rad) * kage.kMinWidthY, y2 - Math.cos(rad) * kage.kMinWidthY);
        poly.set(2, x2 - Math.sin(rad) * kage.kMinWidthY, y2 + Math.cos(rad) * kage.kMinWidthY);
        poly.set(3, x1 - Math.sin(rad) * kage.kMinWidthY, y1 + Math.cos(rad) * kage.kMinWidthY);
        polygons.push(poly);

        //UROKO
        if (a2 == 0) {
          var urokoScale = (kage.kMinWidthU / kage.kMinWidthY - 1.0) / 4.0 + 1.0;
          poly = new Polygon();
          poly.push(x2 + Math.sin(rad) * kage.kMinWidthY, y2 - Math.cos(rad) * kage.kMinWidthY);
          poly.push(x2 - Math.cos(rad) * kage.kAdjustUrokoX[opt2] * urokoScale, y2 - Math.sin(rad) * kage.kAdjustUrokoX[opt2] * urokoScale);
          poly.push(x2 - Math.cos(rad) * kage.kAdjustUrokoX[opt2] * urokoScale / 2 + Math.sin(rad) * kage.kAdjustUrokoX[opt2] * urokoScale / 2, y2 - Math.sin(rad) * kage.kAdjustUrokoY[opt2] * urokoScale - Math.cos(rad) * kage.kAdjustUrokoY[opt2] * urokoScale);
          polygons.push(poly);
        }
      }

      else { //KAKUDO GA FUKAI or KAGI NO YOKO BOU
        if (x1 > x2) { v = -1; } else { v = 1; }
        poly = new Polygon(4);
        switch (a1) {
          case 0:
            poly.set(0, x1 + Math.sin(rad) * kMinWidthT * v + kage.kMinWidthY * Math.cos(rad) * 0.5 * v,
              y1 - Math.cos(rad) * kMinWidthT * v + kage.kMinWidthY * Math.sin(rad) * 0.5 * v);
            poly.set(3, x1 - Math.sin(rad) * kMinWidthT * v - kage.kMinWidthY * Math.cos(rad) * 0.5 * v,
              y1 + Math.cos(rad) * kMinWidthT * v - kage.kMinWidthY * Math.sin(rad) * 0.5 * v);
            break;
          case 1:
          case 6:
            poly.set(0, x1 + Math.sin(rad) * kMinWidthT * v, y1 - Math.cos(rad) * kMinWidthT * v);
            poly.set(3, x1 - Math.sin(rad) * kMinWidthT * v, y1 + Math.cos(rad) * kMinWidthT * v);
            break;
          case 12:
            poly.set(0, x1 + Math.sin(rad) * kMinWidthT * v - kage.kMinWidthY * Math.cos(rad) * v,
              y1 - Math.cos(rad) * kMinWidthT * v - kage.kMinWidthY * Math.sin(rad) * v);
            poly.set(3, x1 - Math.sin(rad) * kMinWidthT * v - (kMinWidthT + kage.kMinWidthY) * Math.cos(rad) * v,
              y1 + Math.cos(rad) * kMinWidthT * v - (kMinWidthT + kage.kMinWidthY) * Math.sin(rad) * v);
            break;
          case 22:
            poly.set(0, x1 + (kMinWidthT * v + 1) / Math.sin(rad), y1 + 1);
            poly.set(3, x1 - (kMinWidthT * v) / Math.sin(rad), y1);
            break;
          case 32:
            poly.set(0, x1 + (kMinWidthT * v) / Math.sin(rad), y1);
            poly.set(3, x1 - (kMinWidthT * v) / Math.sin(rad), y1);
            break;
        }

        switch (a2) {
          case 0:
            if (a1 == 6) {
              poly.set(1, x2 + Math.sin(rad) * kMinWidthT * v, y2 - Math.cos(rad) * kMinWidthT * v);
              poly.set(2, x2 - Math.sin(rad) * kMinWidthT * v, y2 + Math.cos(rad) * kMinWidthT * v);
            }
            else {
              poly.set(1, x2 + Math.sin(rad) * kMinWidthT * v - kMinWidthT * 0.5 * Math.cos(rad) * v,
                y2 - Math.cos(rad) * kMinWidthT * v - kMinWidthT * 0.5 * Math.sin(rad) * v);
              poly.set(2, x2 - Math.sin(rad) * kMinWidthT * v + kMinWidthT * 0.5 * Math.cos(rad) * v,
                y2 + Math.cos(rad) * kMinWidthT * v + kMinWidthT * 0.5 * Math.sin(rad) * v);
            }
            break;
          case 1: // is needed?
          case 5:
            poly.set(1, x2 + Math.sin(rad) * kMinWidthT * v, y2 - Math.cos(rad) * kMinWidthT * v);
            poly.set(2, x2 - Math.sin(rad) * kMinWidthT * v, y2 + Math.cos(rad) * kMinWidthT * v);
            break;
          case 13:
            poly.set(1, x2 + Math.sin(rad) * kMinWidthT * v + kage.kAdjustKakatoL[opt2] * Math.cos(rad) * v,
              y2 - Math.cos(rad) * kMinWidthT * v + kage.kAdjustKakatoL[opt2] * Math.sin(rad) * v);
            poly.set(2, x2 - Math.sin(rad) * kMinWidthT * v + (kage.kAdjustKakatoL[opt2] + kMinWidthT) * Math.cos(rad) * v,
              y2 + Math.cos(rad) * kMinWidthT * v + (kage.kAdjustKakatoL[opt2] + kMinWidthT) * Math.sin(rad) * v);
            break;
          case 23:
            poly.set(1, x2 + Math.sin(rad) * kMinWidthT * v + kage.kAdjustKakatoR[opt2] * Math.cos(rad) * v,
              y2 - Math.cos(rad) * kMinWidthT * v + kage.kAdjustKakatoR[opt2] * Math.sin(rad) * v);
            poly.set(2,
              x2 - Math.sin(rad) * kMinWidthT * v + (kage.kAdjustKakatoR[opt2] + kMinWidthT) * Math.cos(rad) * v,
              y2 + Math.cos(rad) * kMinWidthT * v + (kage.kAdjustKakatoR[opt2] + kMinWidthT) * Math.sin(rad) * v);
            break;
          case 24:
            poly.set(1, x2 + (kMinWidthT * v) / Math.sin(rad), y2);
            poly.set(2, x2 - (kMinWidthT * v) / Math.sin(rad), y2);
            break;
          case 32:
            poly.set(1, x2 + (kMinWidthT * v) / Math.sin(rad), y2);
            poly.set(2, x2 - (kMinWidthT * v) / Math.sin(rad), y2);
            break;
        }

        polygons.push(poly);

        if (a2 == 24) { //for T design
          poly = new Polygon();
          poly.push(x2, y2 + kage.kMinWidthY);
          poly.push(x2 + kMinWidthT * 0.5, y2 - kage.kMinWidthY * 4);
          poly.push(x2 + kMinWidthT * 2, y2 - kage.kMinWidthY);
          poly.push(x2 + kMinWidthT * 2, y2 + kage.kMinWidthY);
          polygons.push(poly);
        }

        if ((a1 == 6) && (a2 == 0 || a2 == 5)) { //KAGI NO YOKO BOU NO SAIGO NO MARU
          poly = new Polygon();
          if (kage.kUseCurve) {
            poly.push(x2 + Math.sin(rad) * kMinWidthT * v, y2 - Math.cos(rad) * kMinWidthT * v);
            poly.push(x2 - Math.cos(rad) * kMinWidthT * 0.9 * v + Math.sin(rad) * kMinWidthT * 0.9 * v,
              y2 + Math.sin(rad) * kMinWidthT * 0.9 * v - Math.cos(rad) * kMinWidthT * 0.9 * v, 1);
            poly.push(x2 + Math.cos(rad) * kMinWidthT * v, y2 + Math.sin(rad) * kMinWidthT * v);
            poly.push(x2 + Math.cos(rad) * kMinWidthT * 0.9 * v - Math.sin(rad) * kMinWidthT * 0.9 * v,
              y2 + Math.sin(rad) * kMinWidthT * 0.9 * v + Math.cos(rad) * kMinWidthT * 0.9 * v, 1);
            poly.push(x2 - Math.sin(rad) * kMinWidthT * v, y2 + Math.cos(rad) * kMinWidthT * v);
          } else {
            poly.push(x2 + Math.sin(rad) * kMinWidthT * v, y2 - Math.cos(rad) * kMinWidthT * v);
            poly.push(x2 + Math.cos(rad) * kMinWidthT * 0.8 * v + Math.sin(rad) * kMinWidthT * 0.6 * v,
              y2 + Math.sin(rad) * kMinWidthT * 0.8 * v - Math.cos(rad) * kMinWidthT * 0.6 * v);
            poly.push(x2 + Math.cos(rad) * kMinWidthT * v, y2 + Math.sin(rad) * kMinWidthT * v);
            poly.push(x2 + Math.cos(rad) * kMinWidthT * 0.8 * v - Math.sin(rad) * kMinWidthT * 0.6 * v,
              y2 + Math.sin(rad) * kMinWidthT * 0.8 * v + Math.cos(rad) * kMinWidthT * 0.6 * v);
            poly.push(x2 - Math.sin(rad) * kMinWidthT * v, y2 + Math.cos(rad) * kMinWidthT * v);
          }
          polygons.push(poly);
        }

        if (a1 == 6 && a2 == 5) {
          //KAGI NO YOKO BOU NO HANE
          poly = new Polygon();
          if (x1 < x2) {
            poly.push(x2 + (kMinWidthT - 1) * Math.sin(rad) * v, y2 - (kMinWidthT - 1) * Math.cos(rad) * v);
            poly.push(x2 + 2 * Math.cos(rad) * v + (kMinWidthT + kage.kWidth * 5) * Math.sin(rad) * v,
              y2 + 2 * Math.sin(rad) * v - (kMinWidthT + kage.kWidth * 5) * Math.cos(rad) * v);
            poly.push(x2 + (kMinWidthT + kage.kWidth * 5) * Math.sin(rad) * v,
              y2 - (kMinWidthT + kage.kWidth * 5) * Math.cos(rad) * v);
            poly.push(x2 + (kMinWidthT - 1) * Math.sin(rad) * v - kMinWidthT * Math.cos(rad) * v,
              y2 - (kMinWidthT - 1) * Math.cos(rad) * v - kMinWidthT * Math.sin(rad) * v);
          } else {
            poly.push(x2 - (kMinWidthT - 1) * Math.sin(rad) * v, y2 + (kMinWidthT - 1) * Math.cos(rad) * v);
            poly.push(x2 + 2 * Math.cos(rad) * v - (kMinWidthT + kage.kWidth * 5) * Math.sin(rad) * v,
              y2 + 2 * Math.sin(rad) * v + (kMinWidthT + kage.kWidth * 5) * Math.cos(rad) * v);
            poly.push(x2 - (kMinWidthT + kage.kWidth * 5) * Math.sin(rad) * v,
              y2 + (kMinWidthT + kage.kWidth * 5) * Math.cos(rad) * v);
            poly.push(x2 + (kMinWidthT - 1) * Math.sin(rad) * v - kMinWidthT * Math.cos(rad) * v,
              y2 - (kMinWidthT - 1) * Math.cos(rad) * v - kMinWidthT * Math.sin(rad) * v);
          }
          polygons.push(poly);
        }

        if (a1 == 22 || a1 == 27) { //SHIKAKU MIGIUE UROKO NANAME DEMO MASSUGU MUKI
          poly = new Polygon();
          poly.push(x1 - kMinWidthT, y1 - kage.kMinWidthY);
          poly.push(x1, y1 - kage.kMinWidthY - kage.kWidth);
          poly.push(x1 + kMinWidthT + kage.kWidth, y1 + kage.kMinWidthY);
          poly.push(x1 + kMinWidthT, y1 + kMinWidthT - 1);
          if (a1 == 27) {
            poly.push(x1, y1 + kMinWidthT + 2);
            poly.push(x1, y1);
          } else {
            poly.push(x1 - kMinWidthT, y1 + kMinWidthT + 4);
          }
          polygons.push(poly);
        }


        if (a2 == 13 && opt2 == 4) { //for new GTH box's left bottom corner MUKI KANKEINASHI
          poly = new Polygon();
          var m = 0;
          if (x1 > x2 && y1 != y2) {
            m = Math.floor((x1 - x2) / (y2 - y1) * 3);
          }
          poly.push(x2 + m, y2 - kage.kMinWidthY * 5);
          poly.push(x2 - kMinWidthT * 2 + m, y2);
          poly.push(x2 - kage.kMinWidthY + m, y2 + kage.kMinWidthY * 5);
          poly.push(x2 + kMinWidthT + m, y2 + kage.kMinWidthY);
          poly.push(x2 + m, y2);
          polygons.push(poly);
        }

        XX = Math.sin(rad) * v;
        XY = Math.cos(rad) * v * -1;
        YX = Math.cos(rad) * v;
        YY = Math.sin(rad) * v;

        if (a1 == 0) { //beginning of the storke
          poly = new Polygon();
          poly.push(x1 + kMinWidthT * XX + (kage.kMinWidthY * 0.5) * YX,
            y1 + kMinWidthT * XY + (kage.kMinWidthY * 0.5) * YY);
          poly.push(x1 + (kMinWidthT + kMinWidthT * 0.5) * XX + (kage.kMinWidthY * 0.5 + kage.kMinWidthY) * YX,
            y1 + (kMinWidthT + kMinWidthT * 0.5) * XY + (kage.kMinWidthY * 0.5 + kage.kMinWidthY) * YY);
          poly.push(x1 + kMinWidthT * XX + (kage.kMinWidthY * 0.5 + kage.kMinWidthY * 2) * YX - 2 * XX,
            y1 + kMinWidthT * XY + (kage.kMinWidthY * 0.5 + kage.kMinWidthY * 2) * YY + 1 * XY);
          polygons.push(poly);
        }
      }
    }
  }
  else { //gothic
    if (tx1 == tx2) { //if TATE stroke, use y-axis
      if (ty1 > ty2) {
        x1 = tx2;
        y1 = ty2;
        x2 = tx1;
        y2 = ty1;
        a1 = ta2;
        a2 = ta1;
      }
      else {
        x1 = tx1;
        y1 = ty1;
        x2 = tx2;
        y2 = ty2;
        a1 = ta1;
        a2 = ta2;
      }

      if (a1 % 10 == 2) { y1 = y1 - kage.kWidth; }
      if (a2 % 10 == 2) { y2 = y2 + kage.kWidth; }
      if (a1 % 10 == 3) { y1 = y1 - kage.kWidth * kage.kKakato; }
      if (a2 % 10 == 3) { y2 = y2 + kage.kWidth * kage.kKakato; }

      poly = new Polygon();
      poly.push(x1 - kage.kWidth, y1);
      poly.push(x2 - kage.kWidth, y2);
      poly.push(x2 + kage.kWidth, y2);
      poly.push(x1 + kage.kWidth, y1);
      //poly.reverse(); // for fill-rule

      polygons.push(poly);
    }
    else if (ty1 == ty2) { //if YOKO stroke, use x-axis
      if (tx1 > tx2) {
        x1 = tx2;
        y1 = ty2;
        x2 = tx1;
        y2 = ty1;
        a1 = ta2;
        a2 = ta1;
      }
      else {
        x1 = tx1;
        y1 = ty1;
        x2 = tx2;
        y2 = ty2;
        a1 = ta1;
        a2 = ta2;
      }
      if (a1 % 10 == 2) { x1 = x1 - kage.kWidth; }
      if (a2 % 10 == 2) { x2 = x2 + kage.kWidth; }
      if (a1 % 10 == 3) { x1 = x1 - kage.kWidth * kage.kKakato; }
      if (a2 % 10 == 3) { x2 = x2 + kage.kWidth * kage.kKakato; }

      poly = new Polygon();
      poly.push(x1, y1 - kage.kWidth);
      poly.push(x2, y2 - kage.kWidth);
      poly.push(x2, y2 + kage.kWidth);
      poly.push(x1, y1 + kage.kWidth);

      polygons.push(poly);
    }
    else { //for others, use x-axis
      if (tx1 > tx2) {
        x1 = tx2;
        y1 = ty2;
        x2 = tx1;
        y2 = ty1;
        a1 = ta2;
        a2 = ta1;
      }
      else {
        x1 = tx1;
        y1 = ty1;
        x2 = tx2;
        y2 = ty2;
        a1 = ta1;
        a2 = ta2;
      }
      rad = Math.atan((y2 - y1) / (x2 - x1));
      if (a1 % 10 == 2) {
        x1 = x1 - kage.kWidth * Math.cos(rad);
        y1 = y1 - kage.kWidth * Math.sin(rad);
      }
      if (a2 % 10 == 2) {
        x2 = x2 + kage.kWidth * Math.cos(rad);
        y2 = y2 + kage.kWidth * Math.sin(rad);
      }
      if (a1 % 10 == 3) {
        x1 = x1 - kage.kWidth * Math.cos(rad) * kage.kKakato;
        y1 = y1 - kage.kWidth * Math.sin(rad) * kage.kKakato;
      }
      if (a2 % 10 == 3) {
        x2 = x2 + kage.kWidth * Math.cos(rad) * kage.kKakato;
        y2 = y2 + kage.kWidth * Math.sin(rad) * kage.kKakato;
      }

      //SUICHOKU NO ICHI ZURASHI HA Math.sin TO Math.cos NO IREKAE + x-axis MAINASU KA
      poly = new Polygon();
      poly.push(x1 + Math.sin(rad) * kage.kWidth, y1 - Math.cos(rad) * kage.kWidth);
      poly.push(x2 + Math.sin(rad) * kage.kWidth, y2 - Math.cos(rad) * kage.kWidth);
      poly.push(x2 - Math.sin(rad) * kage.kWidth, y2 + Math.cos(rad) * kage.kWidth);
      poly.push(x1 - Math.sin(rad) * kage.kWidth, y1 + Math.cos(rad) * kage.kWidth);

      polygons.push(poly);
    }
  }
}
exports.cdDrawLine = cdDrawLine;

// kagedf

/**
 * @param {Kage} kage
 * @param {Polygons} polygons
 * @param {number} a1
 * @param {number} a2
 * @param {number} a3
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} x3
 * @param {number} y3
 * @param {number} x4
 * @param {number} y4
 */
function dfDrawFont(kage, polygons, a1, a2, a3, x1, y1, x2, y2, x3, y3, x4, y4) {
  var tx1, tx2, tx3, tx4, ty1, ty2, ty3, ty4, v;
  var rad;

  if (kage.kShotai == kage.kMincho) {
    switch (a1 % 100) { // ... no need to divide
      case 0:
        if (a2 == 98) {
          for (var i = 0; i < polygons.array.length; i++) {
            var inside = true;
            for (var j = 0; j < polygons.array[i].array.length; j++) {
              if (x1 > polygons.array[i].array[j].x || polygons.array[i].array[j].x > x2 ||
                y1 > polygons.array[i].array[j].y || polygons.array[i].array[j].y > y2) {
                inside = false;
              }
            }
            if (inside) {
              for (var j = 0; j < polygons.array[i].array.length; j++) {
                polygons.array[i].array[j].x = x2 - (polygons.array[i].array[j].x - x1);
                polygons.array[i].array[j].x = Math.floor(polygons.array[i].array[j].x * 10) / 10;
              }
            }
          }
        } else if (a2 == 97) {
          for (var i = 0; i < polygons.array.length; i++) {
            var inside = true;
            for (var j = 0; j < polygons.array[i].array.length; j++) {
              if (x1 > polygons.array[i].array[j].x || polygons.array[i].array[j].x > x2 ||
                y1 > polygons.array[i].array[j].y || polygons.array[i].array[j].y > y2) {
                inside = false;
              }
            }
            if (inside) {
              for (var j = 0; j < polygons.array[i].array.length; j++) {
                polygons.array[i].array[j].y = y2 - (polygons.array[i].array[j].y - y1);
                polygons.array[i].array[j].y = Math.floor(polygons.array[i].array[j].y * 10) / 10;
              }
            }
          }
        } else if (a2 == 99 && a3 == 1) {
          for (var i = 0; i < polygons.array.length; i++) {
            var inside = true;
            for (var j = 0; j < polygons.array[i].array.length; j++) {
              if (x1 > polygons.array[i].array[j].x || polygons.array[i].array[j].x > x2 ||
                y1 > polygons.array[i].array[j].y || polygons.array[i].array[j].y > y2) {
                inside = false;
              }
            }
            if (inside) {
              for (var j = 0; j < polygons.array[i].array.length; j++) {
                var x = polygons.array[i].array[j].x;
                var y = polygons.array[i].array[j].y;
                polygons.array[i].array[j].x = x1 + (y2 - y);
                polygons.array[i].array[j].y = y1 + (x - x1);
                polygons.array[i].array[j].x = Math.floor(polygons.array[i].array[j].x * 10) / 10;
                polygons.array[i].array[j].y = Math.floor(polygons.array[i].array[j].y * 10) / 10;
              }
            }
          }
        } else if (a2 == 99 && a3 == 2) {
          for (var i = 0; i < polygons.array.length; i++) {
            var inside = true;
            for (var j = 0; j < polygons.array[i].array.length; j++) {
              if (x1 > polygons.array[i].array[j].x || polygons.array[i].array[j].x > x2 ||
                y1 > polygons.array[i].array[j].y || polygons.array[i].array[j].y > y2) {
                inside = false;
              }
            }
            if (inside) {
              for (var j = 0; j < polygons.array[i].array.length; j++) {
                var x = polygons.array[i].array[j].x;
                var y = polygons.array[i].array[j].y;
                polygons.array[i].array[j].x = x2 - (x - x1);
                polygons.array[i].array[j].y = y2 - (y - y1);
                polygons.array[i].array[j].x = Math.floor(polygons.array[i].array[j].x * 10) / 10;
                polygons.array[i].array[j].y = Math.floor(polygons.array[i].array[j].y * 10) / 10;
              }
            }
          }
        } else if (a2 == 99 && a3 == 3) {
          for (var i = 0; i < polygons.array.length; i++) {
            var inside = true;
            for (var j = 0; j < polygons.array[i].array.length; j++) {
              if (x1 > polygons.array[i].array[j].x || polygons.array[i].array[j].x > x2 ||
                y1 > polygons.array[i].array[j].y || polygons.array[i].array[j].y > y2) {
                inside = false;
              }
            }
            if (inside) {
              for (var j = 0; j < polygons.array[i].array.length; j++) {
                var x = polygons.array[i].array[j].x;
                var y = polygons.array[i].array[j].y;
                polygons.array[i].array[j].x = x1 + (y - y1);
                polygons.array[i].array[j].y = y2 - (x - x1);
                polygons.array[i].array[j].x = Math.floor(polygons.array[i].array[j].x * 10) / 10;
                polygons.array[i].array[j].y = Math.floor(polygons.array[i].array[j].y * 10) / 10;
              }
            }
          }
        }
        break;
      case 1:
        if (a3 % 100 == 4) {
          if (x1 == x2) {
            if (y1 < y2) { v = 1; } else { v = -1; }
            tx1 = x2;
            ty1 = y2 - kage.kMage * v;
          }
          else if (y1 == y2) { // ... no need
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * v;
            ty1 = y2;
          }
          else {
            rad = Math.atan((y2 - y1) / (x2 - x1));
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * Math.cos(rad) * v;
            ty1 = y2 - kage.kMage * Math.sin(rad) * v;
          }
          cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
          cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, x2 - kage.kMage * (((kage.kAdjustTateStep + 4) - Math.floor(a2 / 1000)) / (kage.kAdjustTateStep + 4)), y2, 1 + (a2 - a2 % 1000), a3 + 10);
        }
        else {
          cdDrawLine(kage, polygons, x1, y1, x2, y2, a2, a3);
        }
        break;
      case 2:
        //case 12: // ... no need
        if (a3 % 100 == 4) {
          if (x2 == x3) {
            tx1 = x3;
            ty1 = y3 - kage.kMage;
          }
          else if (y2 == y3) {
            tx1 = x3 - kage.kMage;
            ty1 = y3;
          }
          else {
            rad = Math.atan((y3 - y2) / (x3 - x2));
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx1 = x3 - kage.kMage * Math.cos(rad) * v;
            ty1 = y3 - kage.kMage * Math.sin(rad) * v;
          }
          cdDrawCurve(kage, polygons, x1, y1, x2, y2, tx1, ty1, a2, 0);
          cdDrawCurve(kage, polygons, tx1, ty1, x3, y3, x3 - kage.kMage, y3, Math.floor(a2 / 1000) * 1000 + 2, a3 + 10);
        }
        else if (a3 == 5) {
          cdDrawCurve(kage, polygons, x1, y1, x2, y2, x3, y3, a2, 15);
        }
        else {
          cdDrawCurve(kage, polygons, x1, y1, x2, y2, x3, y3, a2, a3);
        }
        break;
      case 3:
        if (a3 % 1000 == 5) {
          if (x1 == x2) {
            if (y1 < y2) { v = 1; } else { v = -1; }
            tx1 = x2;
            ty1 = y2 - kage.kMage * v;
          }
          else if (y1 == y2) {
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * v;
            ty1 = y2;
          }
          else {
            rad = Math.atan((y2 - y1) / (x2 - x1));
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * Math.cos(rad) * v;
            ty1 = y2 - kage.kMage * Math.sin(rad) * v;
          }
          if (x2 == x3) {
            if (y2 < y3) { v = 1; } else { v = -1; }
            tx2 = x2;
            ty2 = y2 + kage.kMage * v;
          }
          else if (y2 == y3) {
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx2 = x2 + kage.kMage * v;
            ty2 = y2;
          }
          else {
            rad = Math.atan((y3 - y2) / (x3 - x2));
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx2 = x2 + kage.kMage * Math.cos(rad) * v;
            ty2 = y2 + kage.kMage * Math.sin(rad) * v;
          }
          tx3 = x3;
          ty3 = y3;

          cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
          cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, tx2, ty2, 1 + (a2 - a2 % 1000) * 10, 1 + (a3 - a3 % 1000));
          if ((x2 < x3 && tx3 - tx2 > 0) || (x2 > x3 && tx2 - tx3 > 0)) { // for closer position
            cdDrawLine(kage, polygons, tx2, ty2, tx3, ty3, 6 + (a3 - a3 % 1000), 5); // bolder by force
          }
        }
        else {
          if (x1 == x2) {
            if (y1 < y2) { v = 1; } else { v = -1; }
            tx1 = x2;
            ty1 = y2 - kage.kMage * v;
          }
          else if (y1 == y2) {
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * v;
            ty1 = y2;
          }
          else {
            rad = Math.atan((y2 - y1) / (x2 - x1));
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * Math.cos(rad) * v;
            ty1 = y2 - kage.kMage * Math.sin(rad) * v;
          }
          if (x2 == x3) {
            if (y2 < y3) { v = 1; } else { v = -1; }
            tx2 = x2;
            ty2 = y2 + kage.kMage * v;
          }
          else if (y2 == y3) {
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx2 = x2 + kage.kMage * v;
            ty2 = y2;
          }
          else {
            rad = Math.atan((y3 - y2) / (x3 - x2));
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx2 = x2 + kage.kMage * Math.cos(rad) * v;
            ty2 = y2 + kage.kMage * Math.sin(rad) * v;
          }
          cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
          cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, tx2, ty2, 1 + (a2 - a2 % 1000) * 10, 1 + (a3 - a3 % 1000));
          cdDrawLine(kage, polygons, tx2, ty2, x3, y3, 6 + (a3 - a3 % 1000), a3); // bolder by force
        }
        break;
      case 12:
        cdDrawCurve(kage, polygons, x1, y1, x2, y2, x3, y3, a2, 1);
        cdDrawLine(kage, polygons, x3, y3, x4, y4, 6, a3);
        break;
      case 4:
        var rate = 6;
        if ((x3 - x2) * (x3 - x2) + (y3 - y2) * (y3 - y2) < 14400) { // smaller than 120 x 120
          rate = Math.sqrt((x3 - x2) * (x3 - x2) + (y3 - y2) * (y3 - y2)) / 120 * 6;
        }
        if (a3 == 5) {
          if (x1 == x2) {
            if (y1 < y2) { v = 1; } else { v = -1; }
            tx1 = x2;
            ty1 = y2 - kage.kMage * v * rate;
          }
          else if (y1 == y2) {
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * v * rate;
            ty1 = y2;
          }
          else {
            rad = Math.atan((y2 - y1) / (x2 - x1));
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * Math.cos(rad) * v * rate;
            ty1 = y2 - kage.kMage * Math.sin(rad) * v * rate;
          }
          if (x2 == x3) {
            if (y2 < y3) { v = 1; } else { v = -1; }
            tx2 = x2;
            ty2 = y2 + kage.kMage * v * rate;
          }
          else if (y2 == y3) {
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx2 = x2 + kage.kMage * v * rate;
            ty2 = y2;
          }
          else {
            rad = Math.atan((y3 - y2) / (x3 - x2));
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx2 = x2 + kage.kMage * Math.cos(rad) * v * rate;
            ty2 = y2 + kage.kMage * Math.sin(rad) * v * rate;
          }
          tx3 = x3;
          ty3 = y3;

          cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
          cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, tx2, ty2, 1, 1);
          if (tx3 - tx2 > 0) { // for closer position
            cdDrawLine(kage, polygons, tx2, ty2, tx3, ty3, 6, 5); // bolder by force
          }
        }
        else {
          if (x1 == x2) {
            if (y1 < y2) { v = 1; } else { v = -1; }
            tx1 = x2;
            ty1 = y2 - kage.kMage * v * rate;
          }
          else if (y1 == y2) {
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * v * rate;
            ty1 = y2;
          }
          else {
            rad = Math.atan((y2 - y1) / (x2 - x1));
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * Math.cos(rad) * v * rate;
            ty1 = y2 - kage.kMage * Math.sin(rad) * v * rate;
          }
          if (x2 == x3) {
            if (y2 < y3) { v = 1; } else { v = -1; }
            tx2 = x2;
            ty2 = y2 + kage.kMage * v * rate;
          }
          else if (y2 == y3) {
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx2 = x2 + kage.kMage * v * rate;
            ty2 = y2;
          }
          else {
            rad = Math.atan((y3 - y2) / (x3 - x2));
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx2 = x2 + kage.kMage * Math.cos(rad) * v * rate;
            ty2 = y2 + kage.kMage * Math.sin(rad) * v * rate;
          }
          cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
          cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, tx2, ty2, 1, 1);
          cdDrawLine(kage, polygons, tx2, ty2, x3, y3, 6, a3); // bolder by force
        }
        break;
      case 6:
        if (a3 % 100 == 4) {
          if (x3 == x4) {
            tx1 = x4;
            ty1 = y4 - kage.kMage;
          }
          else if (y3 == y4) {
            tx1 = x4 - kage.kMage;
            ty1 = y4;
          }
          else {
            rad = Math.atan((y4 - y3) / (x4 - x3));
            if (x3 < x4) { v = 1; } else { v = -1; }
            tx1 = x4 - kage.kMage * Math.cos(rad) * v;
            ty1 = y4 - kage.kMage * Math.sin(rad) * v;
          }
          cdDrawBezier(kage, polygons, x1, y1, x2, y2, x3, y3, tx1, ty1, a2, 1);
          cdDrawCurve(kage, polygons, tx1, ty1, x4, y4, x4 - kage.kMage, y4, 1, a3 + 10);
        }
        else if (a3 == 5) {
          cdDrawBezier(kage, polygons, x1, y1, x2, y2, x3, y3, x4, y4, a2, 15);
        }
        else {
          cdDrawBezier(kage, polygons, x1, y1, x2, y2, x3, y3, x4, y4, a2, a3);
        }
        break;
      case 7:
        cdDrawLine(kage, polygons, x1, y1, x2, y2, a2, 1);
        cdDrawCurve(kage, polygons, x2, y2, x3, y3, x4, y4, 1 + (a2 - a2 % 1000), a3);
        break;
      case 9: // may not be exist ... no need
        //kageCanvas[y1][x1] = 0;
        //kageCanvas[y2][x2] = 0;
        break;
      default:
        break;
    }
  }

  else { // gothic
    switch (a1 % 100) {
      case 0:
        break;
      case 1:
        if (a3 == 4) {
          if (x1 == x2) {
            if (y1 < y2) { v = 1; } else { v = -1; }
            tx1 = x2;
            ty1 = y2 - kage.kMage * v;
          }
          else if (y1 == y2) {
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * v;
            ty1 = y2;
          }
          else {
            rad = Math.atan((y2 - y1) / (x2 - x1));
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * Math.cos(rad) * v;
            ty1 = y2 - kage.kMage * Math.sin(rad) * v;
          }
          cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
          cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, x2 - kage.kMage * 2, y2 - kage.kMage * 0.5, 1, 0);
        }
        else {
          cdDrawLine(kage, polygons, x1, y1, x2, y2, a2, a3);
        }
        break;
      case 2:
      case 12:
        if (a3 == 4) {
          if (x2 == x3) {
            tx1 = x3;
            ty1 = y3 - kage.kMage;
          }
          else if (y2 == y3) {
            tx1 = x3 - kage.kMage;
            ty1 = y3;
          }
          else {
            rad = Math.atan((y3 - y2) / (x3 - x2));
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx1 = x3 - kage.kMage * Math.cos(rad) * v;
            ty1 = y3 - kage.kMage * Math.sin(rad) * v;
          }
          cdDrawCurve(kage, polygons, x1, y1, x2, y2, tx1, ty1, a2, 1);
          cdDrawCurve(kage, polygons, tx1, ty1, x3, y3, x3 - kage.kMage * 2, y3 - kage.kMage * 0.5, 1, 0);
        }
        else if (a3 == 5) {
          tx1 = x3 + kage.kMage;
          ty1 = y3;
          tx2 = tx1 + kage.kMage * 0.5;
          ty2 = y3 - kage.kMage * 2;
          cdDrawCurve(kage, polygons, x1, y1, x2, y2, x3, y3, a2, 1);
          cdDrawCurve(kage, polygons, x3, y3, tx1, ty1, tx2, ty2, 1, 0);
        }
        else {
          cdDrawCurve(kage, polygons, x1, y1, x2, y2, x3, y3, a2, a3);
        }
        break;
      case 3:
        if (a3 == 5) {
          if (x1 == x2) {
            if (y1 < y2) { v = 1; } else { v = -1; }
            tx1 = x2;
            ty1 = y2 - kage.kMage * v;
          }
          else if (y1 == y2) {
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * v;
            ty1 = y2;
          }
          else {
            rad = Math.atan((y2 - y1) / (x2 - x1));
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * Math.cos(rad) * v;
            ty1 = y2 - kage.kMage * Math.sin(rad) * v;
          }
          if (x2 == x3) {
            if (y2 < y3) { v = 1; } else { v = -1; }
            tx2 = x2;
            ty2 = y2 + kage.kMage * v;
          }
          else if (y2 == y3) {
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx2 = x2 + kage.kMage * v;
            ty2 = y2;
          }
          else {
            rad = Math.atan((y3 - y2) / (x3 - x2));
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx2 = x2 + kage.kMage * Math.cos(rad) * v;
            ty2 = y2 + kage.kMage * Math.sin(rad) * v;
          }
          tx3 = x3 - kage.kMage;
          ty3 = y3;
          tx4 = x3 + kage.kMage * 0.5;
          ty4 = y3 - kage.kMage * 2;

          cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
          cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, tx2, ty2, 1, 1);
          cdDrawLine(kage, polygons, tx2, ty2, tx3, ty3, 1, 1);
          cdDrawCurve(kage, polygons, tx3, ty3, x3, y3, tx4, ty4, 1, 0);
        }
        else {
          if (x1 == x2) {
            if (y1 < y2) { v = 1; } else { v = -1; }
            tx1 = x2;
            ty1 = y2 - kage.kMage * v;
          }
          else if (y1 == y2) {
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * v;
            ty1 = y2;
          }
          else {
            rad = Math.atan((y2 - y1) / (x2 - x1));
            if (x1 < x2) { v = 1; } else { v = -1; }
            tx1 = x2 - kage.kMage * Math.cos(rad) * v;
            ty1 = y2 - kage.kMage * Math.sin(rad) * v;
          }
          if (x2 == x3) {
            if (y2 < y3) { v = 1; } else { v = -1; }
            tx2 = x2;
            ty2 = y2 + kage.kMage * v;
          }
          else if (y2 == y3) {
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx2 = x2 + kage.kMage * v;
            ty2 = y2;
          }
          else {
            rad = Math.atan((y3 - y2) / (x3 - x2));
            if (x2 < x3) { v = 1; } else { v = -1; }
            tx2 = x2 + kage.kMage * Math.cos(rad) * v;
            ty2 = y2 + kage.kMage * Math.sin(rad) * v;
          }

          cdDrawLine(kage, polygons, x1, y1, tx1, ty1, a2, 1);
          cdDrawCurve(kage, polygons, tx1, ty1, x2, y2, tx2, ty2, 1, 1);
          cdDrawLine(kage, polygons, tx2, ty2, x3, y3, 1, a3);
        }
        break;
      case 6:
        if (a3 == 5) {
          tx1 = x4 - kage.kMage;
          ty1 = y4;
          tx2 = x4 + kage.kMage * 0.5;
          ty2 = y4 - kage.kMage * 2;
          /*
          cdDrawCurve(x1, y1, x2, y2, (x2 + x3) / 2, (y2 + y3) / 2, a2, 1);
          cdDrawCurve((x2 + x3) / 2, (y2 + y3) / 2, x3, y3, tx1, ty1, 1, 1);
           */
          cdDrawBezier(kage, polygons, x1, y1, x2, y2, x3, y3, tx1, ty1, a2, 1);
          cdDrawCurve(kage, polygons, tx1, ty1, x4, y4, tx2, ty2, 1, 0);
        }
        else {
          /*
          cdDrawCurve(x1, y1, x2, y2, (x2 + x3) / 2, (y2 + y3) / 2, a2, 1);
          cdDrawCurve((x2 + x3) / 2, (y2 + y3) / 2, x3, y3, x4, y4, 1, a3);
           */
          cdDrawBezier(kage, polygons, x1, y1, x2, y2, x3, y3, x4, y4, a2, a3);
        }
        break;
      case 7:
        cdDrawLine(kage, polygons, x1, y1, x2, y2, a2, 1);
        cdDrawCurve(kage, polygons, x2, y2, x3, y3, x4, y4, 1, a3);
        break;
      case 9: // may not be exist
        //kageCanvas[y1][x1] = 0;
        //kageCanvas[y2][x2] = 0;
        break;
      default:
        break;
    }
  }
}
exports.dfDrawFont = dfDrawFont;
