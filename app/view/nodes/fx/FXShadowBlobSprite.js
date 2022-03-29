//pragma PKGS: alwaysloaded

var RSX = require('app/data/resources');
var CONFIG = require('app/common/config');
var FXSprite = require('./FXSprite');

/****************************************************************************
FXShadowBlobSprite
 ****************************************************************************/

var FXShadowBlobSprite = FXSprite.extend({
	shaderKey: "ShadowBlob",

	antiAlias: true,
	autoZOrder: false,
	removeOnEnd: false,

	// uniforms

	// default to using noise
	spriteIdentifier: RSX.noise.img,

	_createRenderCmd: function(){
		if(cc._renderType === cc._RENDER_TYPE_CANVAS) {
			return this._super();
		} else {
			return new FXShadowBlobSprite.WebGLRenderCmd(this);
		}
	},

	setOptions: function (options) {
		this._super(options);
		if (options.phase != null) { this.phase = options.phase; }
	}
});

FXShadowBlobSprite.WebGLRenderCmd = function(renderable){
	FXSprite.WebGLRenderCmd.call(this, renderable);
};
var proto = FXShadowBlobSprite.WebGLRenderCmd.prototype = Object.create(FXSprite.WebGLRenderCmd.prototype);
proto.constructor = FXShadowBlobSprite.WebGLRenderCmd;

proto.rendering = function () {
	var node = this._node;
	if (!node._texture)
		return;

	this.updateMatricesForRender();

	var gl = cc._renderContext;
	var shaderProgram = this._shaderProgram;
	shaderProgram.use();
	shaderProgram._setUniformForMVPMatrixWithMat4(this._stackMatrix);
	shaderProgram.setUniformLocationWith2f(shaderProgram.loc_texResolution, node._texture.getPixelsWide(), node._texture.getPixelsHigh());
	shaderProgram.setUniformLocationWith1f(shaderProgram.loc_time, node.getFX().getTime());
	cc.glBindTexture2DN(0, node._texture);
	cc.glBlendFunc(node._blendFunc.src, node._blendFunc.dst);

	cc.glEnableVertexAttribs(cc.VERTEX_ATTRIB_FLAG_POS_COLOR_TEX);
	gl.bindBuffer(gl.ARRAY_BUFFER, this._quadWebBuffer);
	if(this._quadDirty) {
		this._quadDirty = false;
		gl.bufferData(gl.ARRAY_BUFFER, this._quad.arrayBuffer, gl.DYNAMIC_DRAW);
	}
	gl.vertexAttribPointer(cc.VERTEX_ATTRIB_POSITION, 3, gl.FLOAT, false, 24, 0);
	gl.vertexAttribPointer(cc.VERTEX_ATTRIB_COLOR, 4, gl.UNSIGNED_BYTE, true, 24, 12);
	gl.vertexAttribPointer(cc.VERTEX_ATTRIB_TEX_COORDS, 2, gl.FLOAT, false, 24, 16);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	this.updateMatricesAfterRender();
};

FXShadowBlobSprite.create = function(options, sprite) {
	return FXSprite.create.call(this, options, sprite || new FXShadowBlobSprite(options));
};

module.exports = FXShadowBlobSprite;
