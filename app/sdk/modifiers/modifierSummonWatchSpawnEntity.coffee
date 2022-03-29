CONFIG = require 'app/common/config'
UtilsJavascript = require 'app/common/utils/utils_javascript'
UtilsGameSession = require 'app/common/utils/utils_game_session'
UtilsPosition = require 'app/common/utils/utils_position'
ModifierSummonWatch = require './modifierSummonWatch'
CardType = require 'app/sdk/cards/cardType'
PlayCardSilentlyAction = require 'app/sdk/actions/playCardSilentlyAction'
PlayCardAction = require 'app/sdk/actions/playCardAction'

class ModifierSummonWatchSpawnEntity extends ModifierSummonWatch

	type:"ModifierSummonWatchSpawnEntity"
	@type:"ModifierSummonWatchSpawnEntity"

	@modifierName:"Summon Watch"
	@description:"Whenever you summon a minion, summon %X"

	cardDataOrIndexToSpawn: null

	fxResource: ["FX.Modifiers.ModifierSummonWatch", "FX.Modifiers.ModifierGenericSpawn"]

	@createContextObject: (cardDataOrIndexToSpawn, spawnDescription="", spawnCount=1, spawnPattern=CONFIG.PATTERN_3x3, spawnSilently=false, options) ->
		contextObject = super(options)
		contextObject.cardDataOrIndexToSpawn = cardDataOrIndexToSpawn
		contextObject.spawnDescription = spawnDescription
		contextObject.spawnCount = spawnCount
		contextObject.spawnPattern = spawnPattern
		contextObject.spawnSilently = spawnSilently
		return contextObject

	@getDescription: (modifierContextObject) ->
		if modifierContextObject
			replaceText = ""
			if UtilsPosition.getArraysOfPositionsAreEqual(modifierContextObject.spawnPattern, CONFIG.PATTERN_1x1)
				replaceText = "a "+modifierContextObject.spawnDescription+" in the same space"
			else if modifierContextObject.spawnCount == 1
				replaceText = "a "+modifierContextObject.spawnDescription+" into a nearby space"
			else if modifierContextObject.spawnCount == 8
				replaceText = ""+modifierContextObject.spawnDescription+"s in all nearby spaces"
			else
				replaceText = ""+modifierContextObject.spawnDescription+"s into "+modifierContextObject.spawnCount+" nearby spaces"
			return @description.replace /%X/, replaceText
		else
			return @description

	onSummonWatch: (action) ->
		super(action)

		if @getGameSession().getIsRunningAsAuthoritative()
			ownerId = @getSpawnOwnerId(action)
			spawnPositions = UtilsGameSession.getRandomNonConflictingSmartSpawnPositionsForModifier(@, ModifierSummonWatchSpawnEntity)
			for spawnPosition in spawnPositions
				cardDataOrIndexToSpawn = @getCardDataOrIndexToSpawn()
				if @spawnSilently
					spawnAction = new PlayCardSilentlyAction(@getGameSession(), ownerId, spawnPosition.x, spawnPosition.y, cardDataOrIndexToSpawn)
				else
					spawnAction = new PlayCardAction(@getGameSession(), ownerId, spawnPosition.x, spawnPosition.y, cardDataOrIndexToSpawn)
				spawnAction.setSource(@getCard())
				@getGameSession().executeAction(spawnAction)

	getCardDataOrIndexToSpawn: () ->
		return @cardDataOrIndexToSpawn

	getSpawnOwnerId: (action) ->
		return @getCard().getOwnerId()

	getIsCardRelevantToWatcher: (card) ->
		return true #default when no card restrictions are needed

module.exports = ModifierSummonWatchSpawnEntity
