// KAGE engine sample script for JavaScript engine
//
// % js sample.js > result.svg (SpiderMonkey)
// % java -jar js.jar sample.js > result.svg (Rhino)

const { Kage } = require("./kage");
const { Polygons } = require("./polygons");

var kage = new Kage();
var polygons = new Polygons();

kage.kBuhin.push("u6f22", "99:0:0:1:0:151:200:u6c35-01:0:0:0$99:0:0:-28:0:202:200:u26c29-02:0:0:0");
kage.kBuhin.push("u6c35-01", "2:7:8:31:20:56:27:67:41$2:7:8:12:66:39:73:49:87$2:7:8:14:133:49:142:45:184$2:32:7:40:150:44:138:86:67");
kage.kBuhin.push("u26c29-02", "1:0:0:76:34:188:34$1:0:0:113:13:113:53$1:0:0:151:13:151:53$1:12:13:94:63:94:92$1:2:2:94:63:170:63$1:22:23:170:63:170:92$1:2:2:94:92:170:92$1:0:0:85:114:179:114$1:0:0:77:137:187:137$7:32:7:132:63:132:114:132:177:63:187$2:7:0:135:137:150:172:180:182");

kage.makeGlyph(polygons, "u6f22");

console.log(polygons.generateSVG(false));
