var Logger = require('app/common/logger');
var EVENTS = require('app/common/event_types');
var BaseLayer = require('./BaseLayer');

/****************************************************************************
 FXCompositeLayer
 ****************************************************************************/

var FXCompositeLayer = BaseLayer.extend({

	// layer rendered with and affected by fx
	fxLayer: null,

	// layer rendered without fx
	noFXLayer: null,

	/* region INITIALIZATION */

	ctor: function () {
		// layer affected by post fx
		this.fxLayer = BaseLayer.create();

		// layer rendered on top of surface and post fx
		this.noFXLayer = BaseLayer.create();

		// do super ctor
		this._super();

		// add layers
		this.addChild(this.fxLayer);
		this.addChild(this.noFXLayer);
	},

	_createRenderCmd: function(){
		if (cc._renderType === cc._RENDER_TYPE_CANVAS)
			return this._super();
		else {
			return new FXCompositeLayer.WebGLRenderCmd(this);
		}
	},

	/* endregion INITIALIZATION */

	/* region GETTERS / SETTERS */

	getFXLayer: function () {
		return this.fxLayer;
	},

	getNoFXLayer: function () {
		return this.noFXLayer;
	},

	addChild: function (child, localZOrder, tag) {
		if (child === this.fxLayer || child === this.noFXLayer) {
			this._super(child, localZOrder, tag);
		} else {
			// any children added to this layer should be added to either fx or no fx layers
			// if any attempt is made to add a child to this layer directly
			// automatically redirect that child into no fx layer
			this.noFXLayer.addChild(child, localZOrder, tag);
		}
	},

	/* endregion GETTERS / SETTERS */

	/* region EVENTS */

	_startListeningToEvents: function () {
		this._super();

		// listen for events
		var fx = this.getFX();
		if (fx != null) {
			fx.getEventBus().on(EVENTS.caching_screen_start, this.onCachingStart, this);
			fx.getEventBus().on(EVENTS.caching_surface_start, this.onCachingStart, this);
			fx.getEventBus().on(EVENTS.caching_screen_setup, this.onCachingReset, this);
			fx.getEventBus().on(EVENTS.caching_surface_setup, this.onCachingReset, this);
			fx.getEventBus().on(EVENTS.caching_screen_stop, this.onCachingReset, this);
			fx.getEventBus().on(EVENTS.caching_surface_stop, this.onCachingReset, this);
			fx.getEventBus().on(EVENTS.caching_screen_dirty, this.onCachingReset, this);
			fx.getEventBus().on(EVENTS.caching_surface_dirty, this.onCachingReset, this);

			fx.getEventBus().on(EVENTS.blur_screen_start, this.onBlurChange, this);
			fx.getEventBus().on(EVENTS.blur_screen_stop, this.onBlurChange, this);
			fx.getEventBus().on(EVENTS.blur_surface_start, this.onBlurChange, this);
			fx.getEventBus().on(EVENTS.blur_surface_stop, this.onBlurChange, this);
		}
	},

	_stopListeningToEvents: function () {
		this._super();

		// listen for events
		var fx = this.getFX();
		if (fx != null) {
			fx.getEventBus().off(EVENTS.caching_screen_start, this.onCachingStart, this);
			fx.getEventBus().off(EVENTS.caching_surface_start, this.onCachingStart, this);
			fx.getEventBus().off(EVENTS.caching_screen_setup, this.onCachingReset, this);
			fx.getEventBus().off(EVENTS.caching_surface_setup, this.onCachingReset, this);
			fx.getEventBus().off(EVENTS.caching_screen_stop, this.onCachingReset, this);
			fx.getEventBus().off(EVENTS.caching_surface_stop, this.onCachingReset, this);
			fx.getEventBus().off(EVENTS.caching_screen_dirty, this.onCachingReset, this);
			fx.getEventBus().off(EVENTS.caching_surface_dirty, this.onCachingReset, this);

			fx.getEventBus().off(EVENTS.blur_screen_start, this.onBlurChange, this);
			fx.getEventBus().off(EVENTS.blur_screen_stop, this.onBlurChange, this);
			fx.getEventBus().off(EVENTS.blur_surface_start, this.onBlurChange, this);
			fx.getEventBus().off(EVENTS.blur_surface_stop, this.onBlurChange, this);
		}
	},

	onSetupTransitionIn: function () {
		this.getFX().reset();
		BaseLayer.prototype.onSetupTransitionIn.call(this);
	},

	onBlurChange: function () {
		var blurringSurface = this.getFX().getIsBlurringSurface();
		var blurringScreen = this.getFX().getIsBlurringScreen();
		var blurring = blurringSurface || blurringScreen;
		this.getNoFXLayer().setVisible(!blurring);
	},

	onCachingStart: function () {
		this.setVisible(false);
	},

	onCachingReset: function () {
		this.setVisible(true);
	}

	/* endregion EVENTS */

});

FXCompositeLayer.WebGLRenderCmd = function(renderable){
	cc.Layer.WebGLRenderCmd.call(this, renderable);
};
var proto = FXCompositeLayer.WebGLRenderCmd.prototype = Object.create(cc.Layer.WebGLRenderCmd.prototype);
proto.constructor = FXCompositeLayer.WebGLRenderCmd;

proto.visit = function (parentCmd) {
	var node = this._node;
	var fx = node.getFX();

	if (!node._visible) {
		// just push surface render cmds when not visible
		cc.renderer.pushRenderCommand(fx.getBeginSurfaceCompositeRenderCmd());
		cc.renderer.pushRenderCommand(fx.getEndSurfaceCompositeRenderCmd());
	} else {
		parentCmd = parentCmd || this.getParentRenderCmd();
		if (node._parent && node._parent._renderCmd) {
			this._curLevel = node._parent._renderCmd._curLevel + 1;
		}
		var currentStack = cc.current_stack;

		//optimize performance for javascript
		currentStack.stack.push(currentStack.top);
		this._syncStatus(parentCmd);
		currentStack.top = this._stackMatrix;

		node.sortAllChildren();

		// push own layer render command
		cc.renderer.pushRenderCommand(this);

		// push render command to start surface compositing
		cc.renderer.pushRenderCommand(fx.getBeginSurfaceCompositeRenderCmd());

		// visit fx layer
		node.fxLayer._renderCmd.visit(this);

		// push render command to stop surface compositing
		cc.renderer.pushRenderCommand(fx.getEndSurfaceCompositeRenderCmd());

		// visit no fx layer
		node.noFXLayer._renderCmd.visit(this);

		// no longer dirty
		this._dirtyFlag = 0;

		//optimize performance for javascript
		currentStack.top = currentStack.stack.pop();
	}
};

FXCompositeLayer.create = function(layer) {
	return BaseLayer.create(layer || new FXCompositeLayer());
};

module.exports = FXCompositeLayer;
