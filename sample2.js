// KAGE engine sample script for JavaScript engine
//
// % node sample2.js > result.svg # (Node.js)

const { Kage } = require("./kage");

/**
 * Fetch KAGE data from glyphwiki.org
 * @param {string} name 
 * @returns 
 */
async function fetchKageData(name) {
  console.error(`Fetching ${name}`)
  const url = new URL(`https://glyphwiki.org/json`);
  url.searchParams.set("name", name);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${name}, status: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * Generate SVG from KAGE data of glyphwiki.org
 */
async function main() {
  const kage = new Kage();
  const glyph = kage.glyph("u3106c");
  let glyphsNotFound = glyph.componentsNotFound();
  let count = 10;
  while (glyphsNotFound.length > 0) {
    if (count-- < 0) {
      throw new Error("Too many components not found");
    }
    const fetchAllGlyphsNotFound = glyphsNotFound.map(async name => {
      const data = await fetchKageData(name);
      kage.glyph(name).setData(data);
    })
    await Promise.all(fetchAllGlyphsNotFound);
    glyphsNotFound = glyph.componentsNotFound();
  }
  console.log(glyph.polygons().generateSVG({
    fill: "black",
    background: "white",
  }));
}

main()
