var RSX = require("./resources.js");

/**
 * packages_predefined.js - predefined non-dynamic packages of resources that get merged into final generated packages file.
 * NOTE: don't require this file, require the generated packages.js instead!
 */
var PKGS_DEF = {
	all: [],
	alwaysloaded: []
};

// add all fonts to be always loaded
PKGS_DEF.alwaysloaded = PKGS_DEF.alwaysloaded.concat((function () {
	var fonts = [];
	for (var resourceAlias in RSX) {
		var resourceData = RSX[resourceAlias];
		if (resourceData.font != null) {
			fonts.push(resourceData);
		}
	}
	return fonts;
})());

module.exports = PKGS_DEF;
