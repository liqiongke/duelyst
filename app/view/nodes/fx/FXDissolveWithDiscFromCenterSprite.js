//pragma PKGS: alwaysloaded

var RSX = require('app/data/resources');
var CONFIG = require('app/common/config');
var FXSprite = require('./FXSprite');

/****************************************************************************
FXDissolveWithDiscFromCenterSprite
 ****************************************************************************/

var FXDissolveWithDiscFromCenterSprite = FXSprite.extend({
	shaderKey: "DissolveWithDiscFromCenter",

	antiAlias: true,
	autoZOrder: false,
	removeOnEnd: false,

	// uniforms
	phase: 0.0, // between 0.0 and 1.0

	// default to using noise
	spriteIdentifier: RSX.noise.img,

	_createRenderCmd: function(){
		if(cc._renderType === cc._RENDER_TYPE_CANVAS) {
			return this._super();
		} else {
			return new FXDissolveWithDiscFromCenterSprite.WebGLRenderCmd(this);
		}
	},

	setOptions: function (options) {
		this._super(options);
		if (options.phase != null) { this.setPhase(options.phase); }
	},

	setPhase: function (phase) {
		this.phase = phase;
	},

	updateTweenAction:function(value, key){
		switch (key) {
			case "phase":
				this.phase = value;
				break;
			default:
				FXSprite.prototype.updateTweenAction.call(this, value, key);
				break;
		}
	}
});

FXDissolveWithDiscFromCenterSprite.WebGLRenderCmd = function(renderable){
	FXSprite.WebGLRenderCmd.call(this, renderable);
};
var proto = FXDissolveWithDiscFromCenterSprite.WebGLRenderCmd.prototype = Object.create(FXSprite.WebGLRenderCmd.prototype);
proto.constructor = FXDissolveWithDiscFromCenterSprite.WebGLRenderCmd;

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
	// note: because the shader renders a white box at phase 0, we min out the value to 0.01
	shaderProgram.setUniformLocationWith1f(shaderProgram.loc_phase, Math.max(0.01,node.phase)); // node.getFX().getTime()
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

FXDissolveWithDiscFromCenterSprite.create = function(options, sprite) {
	return FXSprite.create.call(this, options, sprite || new FXDissolveWithDiscFromCenterSprite(options));
};

module.exports = FXDissolveWithDiscFromCenterSprite;
