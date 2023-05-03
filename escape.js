/**
 * Escapes a string for use in XML attribute.
 * @param {string} s 
 */
function escapeXMLAttribute(s) {
    return s.replace("&", "&amp;").replace('"', "&quot;");
}
exports.escapeXMLAttribute = escapeXMLAttribute;
