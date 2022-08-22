
/**
 * escape 
 * @param {String} str
 * @returns {string}
 */
exports.sanitizeBody = (str) => encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1))

/**
 * 
 * @param {String} str
 * @returns {String}
 */
exports.sanitizeName = (str) => str.replace(/[<>]/g, "").trim()

/**
 * convert file name to standard format
 * @param {string} str
 */
exports.unifiedName = (str) => str.toLowerCase().replace(/[^0-9a-z\.]/g, " ").replace(/ +/g, " ").trim() 

/**
 * replace & < >
 * @param {type} str
 */
exports.htmlEncode = (str) => str.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").trim()

/**
 * 
 * @param {type} str
 * @returns {string}
 */
exports.base64EncodeUnicode = (str) => {
	// Firstly, escape the string using encodeURIComponent to get the UTF-8 encoding of the characters, 
	// Secondly, we convert the percent encodings into raw bytes, and add it to btoa() function.
	utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
		return String.fromCharCode('0x' + p1);
	});

	return btoa(utf8Bytes);
}
