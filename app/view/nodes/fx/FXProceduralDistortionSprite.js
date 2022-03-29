
var FXDistortionSprite = require('./FXDistortionSprite');

/****************************************************************************
FXProceduralDistortionSprite
var FXProceduralDistortionSprite = FXDistortionSprite
FXProceduralDistortionSprite.create()
- abstract class for creating procedural distortion via shaders.
 ****************************************************************************/

var FXProceduralDistortionSprite = FXDistortionSprite.extend({
  depthOffset: 0.0,
  depthModifier: 0.0,
	duration: 1.0,
	// radius of distortion
	radius: 0.0,

	_createRenderCmd: function(){
		if(cc._renderType === cc._RENDER_TYPE_CANVAS) {
			return this._super();
		} else {
			return new FXProceduralDistortionSprite.WebGLRenderCmd(this);
		}
	},

	setOptions: function (options) {
		this._super(options);
		if (options.radius != null) this.setRadius( options.radius );
	},
	setRadius: function ( radius ) {
		radius || (radius = 0.0);
		if(this.radius !== radius) {
			this.radius = radius;
			this._renderCmd.rebuildQuad();
		}
	},
	getRadius: function () {
		return this.radius;
	}
});

FXProceduralDistortionSprite.WebGLRenderCmd = function(renderable){
	FXDistortionSprite.WebGLRenderCmd.call(this, renderable);
};
var proto = FXProceduralDistortionSprite.WebGLRenderCmd.prototype = Object.create(FXDistortionSprite.WebGLRenderCmd.prototype);
proto.constructor = FXProceduralDistortionSprite.WebGLRenderCmd;

proto.rebuildQuad = function () {
	var node = this._node;
	var radius = node.radius;
	if (radius > 0.0) {
		var diameter = radius * 2.0;
		var rect = cc.size(diameter, diameter);
		node.setContentSize(rect);
		node.setVertexRect(rect);

		var quad = this._quad;
		var bl = quad.bl;
		var br = quad.br;
		var tl = quad.tl;
		var tr = quad.tr;

		var nbl = new cc.kmVec4(-radius, -radius, 0.0, 1.0);
		var nbr = new cc.kmVec4(radius, -radius, 0.0, 1.0);
		var ntl = new cc.kmVec4(-radius, radius, 0.0, 1.0);
		var ntr = new cc.kmVec4(radius, radius, 0.0, 1.0);

		bl.vertices.x = nbl.x + radius;
		bl.vertices.y = nbl.y + radius;
		bl.vertices.z = nbl.z;
		bl.texCoords.u = 0.0;
		bl.texCoords.v = 0.0;

		br.vertices.x = nbr.x + radius;
		br.vertices.y = nbr.y + radius;
		br.vertices.z = nbr.z;
		br.texCoords.u = 1.0;
		br.texCoords.v = 0.0;

		tl.vertices.x = ntl.x + radius;
		tl.vertices.y = ntl.y + radius;
		tl.vertices.z = ntl.z;
		tl.texCoords.u = 0.0;
		tl.texCoords.v = 1.0;

		tr.vertices.x = ntr.x + radius;
		tr.vertices.y = ntr.y + radius;
		tr.vertices.z = ntr.z;
		tr.texCoords.u = 1.0;
		tr.texCoords.v = 1.0;

		this.setDirtyFlag(cc.Node._dirtyFlags.transformDirty);
		this._quadDirty = true;
	}
};

proto.renderingDistortion = function () {
	var node = this._node;
	var fx = node.getFX();
	var depthMap = fx.getDepthMap();
	var refractMap = fx.getRefractMap();
	if (refractMap == null) return;

	this.updateMatricesForRender();

	var gl = cc._renderContext;
	var shaderProgram = this._shaderProgram;
	shaderProgram.use();
	shaderProgram._setUniformForMVPMatrixWithMat4(this._stackMatrix);
	shaderProgram.setUniformLocationWith1f(shaderProgram.loc_depthOffset, node.depthOffset);
	shaderProgram.setUniformLocationWith1f(shaderProgram.loc_depthModifier, node.depthModifier);
	if (shaderProgram.loc_radius) { shaderProgram.setUniformLocationWith1f(shaderProgram.loc_radius, node.radius); }
	if (shaderProgram.loc_refraction) { shaderProgram.setUniformLocationWith1f(shaderProgram.loc_refraction, node.refraction); }
	if (shaderProgram.loc_reflection) { shaderProgram.setUniformLocationWith1f(shaderProgram.loc_reflection, node.reflection); }
	if (shaderProgram.loc_fresnelBias) { shaderProgram.setUniformLocationWith1f(shaderProgram.loc_fresnelBias, node.fresnelBias); }
	if (shaderProgram.loc_frequency) { shaderProgram.setUniformLocationWith1f(shaderProgram.loc_frequency, node.frequency); }
	if (shaderProgram.loc_amplitude) { shaderProgram.setUniformLocationWith1f(shaderProgram.loc_amplitude, node.amplitude); }
	if (shaderProgram.loc_time) { shaderProgram.setUniformLocationWith1f(shaderProgram.loc_time, node.time); }
	cc.glBindTexture2DN(0, depthMap);
	cc.glBindTexture2DN(1, refractMap);
	cc.glBlendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

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

FXProceduralDistortionSprite.create = function(options, sprite) {
	return FXDistortionSprite.create(options, sprite || new FXProceduralDistortionSprite(options));
};

module.exports = FXProceduralDistortionSprite;
