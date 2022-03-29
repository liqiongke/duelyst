TrueDamageAction = 		require './trueDamageAction'
_ = require 'underscore'

###
  Hurting damage actions are generated by the hurting phase of the game when a player has no more cards in the deck.
###
class HurtingDamageAction extends TrueDamageAction

	@type:"HurtingDamageAction"

	damageAmount: 2

	constructor: () ->
		@type ?= HurtingDamageAction.type
		super

module.exports = HurtingDamageAction
