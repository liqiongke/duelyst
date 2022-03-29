var Logger = require('app/common/logger');
var CONFIG = require('app/common/config');

/****************************************************************************
EntitySupportNode
 - node used to support an entity node with some type of utility behavior
 ****************************************************************************/

var EntitySupportNode = cc.Node.extend({

	entityNode: null,

	/* region INITIALIZE */

	ctor: function (entityNode) {
		this.setEntityNode(entityNode);
		this._super();
		this.setAnchorPoint(cc.p(0.5, 0.5));
	},

	/* endregion INITIALIZE */

	/* region GETTERS / SETTERS */

	setEntityNode: function (entityNode) {
		this.entityNode = entityNode;
	},

	getEntityNode: function () {
		return this.entityNode;
	}

	/* endregion GETTERS / SETTERS */

});

EntitySupportNode.create = function(entityNode, node) {
	return node || new EntitySupportNode(entityNode);
};

module.exports = EntitySupportNode;
