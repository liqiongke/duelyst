//pragma PKGS: currency_reward
var CONFIG = require('app/common/config');
var Logger = require('app/common/logger');
var EventBus = require('app/common/eventbus');
var EVENTS = require('app/common/event_types');
var RSX = require("app/data/resources");
var PKGS = require("app/data/packages");
var UtilsEngine = require('app/common/utils/utils_engine');
var FigureEight = require('app/view/actions/FigureEight');
var BaseSprite = require('app/view/nodes/BaseSprite');
var BaseParticleSystem = require('./../BaseParticleSystem');
var GlowSprite = require('app/view/nodes/GlowSprite');
var RewardNode = require('./RewardNode');
var Promise = require("bluebird");
var i18next = require('i18next')

/****************************************************************************
 CurrencyRewardNode
 ****************************************************************************/

var CurrencyRewardNode = RewardNode.extend({

	_additionalText: "",
	_amount: 0,
	_currencyType: "gold",

	ctor: function (type, amount, additionalText) {
		this.setCurrencyType(type);
		this.setAmount(amount);
		if (additionalText != null) {
			this.setAdditionalText(additionalText);
		}

		this._super();

	},

	setCurrencyType: function (val) {
		if (this._currencyType != val) {
			this._currencyType = val;
		}
	},
	getCurrencyType: function () {
		return this._currencyType;
	},

	setAmount: function (val) {
		if (this._amount != val) {
			this._amount = val;
		}
	},
	getAmount: function () {
		return this._amount;
	},

	setAdditionalText: function (val) {
		if (this._additionalText != val) {
			this._additionalText = val;
		}
	},
	getAdditionalText: function () {
		return this._additionalText;
	},

	/* region RESOURCES */

	/**
	 * Returns a list of resource objects this node uses.
	 * @returns {Array}
	 */
	getRequiredResources: function () {
		return this._super().concat(PKGS.getPkgForIdentifier("currency_reward"));
	},

	/* endregion RESOURCES */

	/* region ANIMATION */

	getRewardAnimationPromise: function (looping, showLabel) {
		return (looping ? this.showLoopingRewardFlare() : this.showRewardFlare())
		.then(function () {
			return new Promise(function (resolve,reject) {
				var type = this.getCurrencyType();
				var amount = this.getAmount();

				// anchor position for ui
				var centerAnchorPosition = cc.p(0, 0);
				var goldIconPosition = cc.p(centerAnchorPosition.x, centerAnchorPosition.y+5);
				var labelPosition = cc.p(centerAnchorPosition.x, centerAnchorPosition.y - 120);

				// non-label node
				var currencyContainerNode = new cc.Node();
				currencyContainerNode.setAnchorPoint(0.5, 0.5);
				this.addChild(currencyContainerNode);

				// bg shadow
				var bgShadowSprite = BaseSprite.create(RSX.gold_reward_bg_shadow.img);
				bgShadowSprite.setPosition(0, 0);
				bgShadowSprite.setScale(0.7);
				bgShadowSprite.setOpacity(0);
				bgShadowSprite.setVisible(false);
				currencyContainerNode.addChild(bgShadowSprite);

				// bg sprite
				var bgSpriteImage = null;
				switch (type) {
					case "spirit":
						bgSpriteImage = RSX.spirit_reward_bg_small.img;
						break;
					default:
						bgSpriteImage = RSX.gold_reward_bg_small.img;
						break;
				}

				var bgSprite = GlowSprite.create(bgSpriteImage);
				bgSprite.setPosition(centerAnchorPosition);
				bgSprite.setVisible(false);
				bgSprite.setHighlighted(true);
				currencyContainerNode.addChild(bgSprite, 1);

				// metal ring sprite
				var metalRingSprite;
				switch (type) {
					case "spirit":
						metalRingSprite = BaseSprite.create(RSX.spirit_reward_metal_ring.img);
						metalRingSprite.setPosition(cc.p(centerAnchorPosition.x,centerAnchorPosition.y));
						metalRingSprite.setVisible(false);
						break;
					default:
						metalRingSprite = BaseSprite.create(RSX.gold_reward_metal_ring.img);
						metalRingSprite.setPosition(goldIconPosition);
						break;
				}

				metalRingSprite.setVisible(false);
				metalRingSprite.setOpacity(0);
				metalRingSprite.setScale(1.2);
				currencyContainerNode.addChild(metalRingSprite, 2);

				// gold icon sprite
				var currencyIcon;
				switch (type) {
					case "spirit":
						currencyIcon = BaseSprite.create(RSX.spirit_reward_spirit_icon.img);
						break;
					default:
						currencyIcon = BaseSprite.create(RSX.gold_reward_gold_icon.img);
						break;
				}
				currencyIcon.setPosition(goldIconPosition);
				currencyIcon.setVisible(false);
				currencyIcon.setOpacity(0);
				currencyIcon.setScale(1.2);
				currencyContainerNode.addChild(currencyIcon,1);

				// gold AMOUNT # label
				var currencyAmountLabel = new cc.LabelTTF(amount.toString(), RSX.font_regular.name, 20, cc.size(48,24), cc.TEXT_ALIGNMENT_CENTER);
				switch (type) {
					case "spirit":
						currencyAmountLabel.setFontFillColor({r: 28, g: 35, b: 57});
						currencyAmountLabel.setPosition(goldIconPosition);
						break;
					default:
						currencyAmountLabel.setFontFillColor({r: 121, g: 66, b: 0});
						currencyAmountLabel.setPosition(goldIconPosition);
						break;
				}
				currencyAmountLabel.setVisible(false);
				currencyAmountLabel.setOpacity(0);
				currencyContainerNode.addChild(currencyAmountLabel,1);

				if (showLabel) {
					// white label below gold
					var labelText = _.isString(showLabel) ? showLabel : "+" + amount.toString() + " " + i18next.t("common.currency_"+type) + " " + this.getAdditionalText();
					var rewardNameLabel = new cc.LabelTTF(labelText.toUpperCase(), RSX.font_regular.name, 20, cc.size(300, 24), cc.TEXT_ALIGNMENT_CENTER);
					switch (type) {
						case "spirit":
							rewardNameLabel.setFontFillColor({r: 120, g: 252, b: 255});
							break;
						default:
							rewardNameLabel.setFontFillColor({r: 247, g: 228, b: 154});
							break;
					}
					rewardNameLabel.setPosition(labelPosition);
					this.addChild(rewardNameLabel);

					rewardNameLabel.setVisible(false);
					rewardNameLabel.setOpacity(0);
				}

				// show wipe flare
				this.showRewardWipeFlare();

				// show currency
				this.runAction(cc.sequence(
					cc.spawn(
						cc.targetedAction(metalRingSprite, cc.sequence(
							cc.delayTime(0.1),
							cc.show(),
							cc.fadeIn(CONFIG.ANIMATE_FAST_DURATION),
							cc.scaleTo(CONFIG.ANIMATE_FAST_DURATION, 1.0)
						)),
						cc.targetedAction(currencyIcon, cc.spawn(
							cc.show(),
							cc.fadeIn(0.1),
							cc.sequence(
								cc.scaleTo(0.1, 1.0),
								cc.callFunc(function () {
									currencyAmountLabel.fadeTo(0.1, 255.0);

									if (showLabel) {
										rewardNameLabel.fadeTo(0.1, 255.0);
									}
								}.bind(this))
							)
						)),
						cc.targetedAction(bgSprite, cc.spawn(
							cc.callFunc(function () {
								bgSprite.setVisible(true);
								bgSprite.setScale(0.0);
								bgSprite.fadeInHighlight(CONFIG.ANIMATE_MEDIUM_DURATION);
							}),
							cc.sequence(
								cc.scaleTo(CONFIG.ANIMATE_MEDIUM_DURATION, 1.0).easing(cc.easeOut(2.0)),
								cc.callFunc(function(){
									bgSprite.fadeOutHighlight(0.5);
								}.bind(this)),
								cc.delayTime(0.5)
							)
						))
					),
					cc.callFunc(function(){
						// show shadow
						bgShadowSprite.setVisible(true);
						bgShadowSprite.setOpacity(0.0);
						bgShadowSprite.fadeTo(0.2, 100.0);

						// float sprite to make it appear more dynamic
						if (!looping) {
							currencyContainerNode.runAction(FigureEight.create(4.0 + Math.random(), 2, 5, currencyContainerNode.getPosition()).repeatForever());
						}

						// finish
						resolve();
					}.bind(this))
				));
			}.bind(this))
			.catch(function (error) { EventBus.getInstance().trigger(EVENTS.error, error); });
		}.bind(this));
	}

	/* endregion ANIMATION */

});

CurrencyRewardNode.create = function(options, node) {
	return RewardNode.create(options, node || new CurrencyRewardNode());
};

module.exports = CurrencyRewardNode;
