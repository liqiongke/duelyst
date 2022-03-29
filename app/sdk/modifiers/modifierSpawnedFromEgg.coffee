Modifier = require './modifier'
SetExhaustionAction =	require 'app/sdk/actions/setExhaustionAction'
CardType = require 'app/sdk/cards/cardType'

class ModifierSpawnedFromEgg extends Modifier

	type:"ModifierSpawnedFromEgg"
	@type:"ModifierSpawnedFromEgg"

	maxStacks: 1

	@modifierName:"Spawned From Egg"
	@description: "Spawned From An Egg"

	@isHiddenToUI: true
	isRemovable: false
	isCloneable: false
	activeInDeck: false
	activeInHand: false
	activeInSignatureCards: false

	fxResource: ["FX.Modifiers.ModifierSpawnedFromEgg"]

	onApplyToCard: (card)  ->
		super(card)

		if @_private.cachedIsActive
			# if General ended up in an Egg and is respawning, make sure it is not set as General
			card = @getCard()
			if card.getType() is CardType.Unit and card.getIsGeneral()
				card.setIsGeneral(false)

			# set exhaustion state of hatched card to not exhausted
			# only do this when this modifier is initially applied to the card
			setExhaustionAction = @getGameSession().createActionForType(SetExhaustionAction.type)
			setExhaustionAction.setExhausted(false)
			setExhaustionAction.setMovesMade(0)
			setExhaustionAction.setAttacksMade(0)
			setExhaustionAction.setSource(@getCard())
			setExhaustionAction.setTarget(@getCard())
			@getCard().getGameSession().executeAction(setExhaustionAction)

module.exports = ModifierSpawnedFromEgg
