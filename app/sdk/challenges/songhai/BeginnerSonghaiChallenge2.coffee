Challenge = require("app/sdk/challenges/challenge")
Instruction 	= require 'app/sdk/challenges/instruction'
MoveAction 		= require 'app/sdk/actions/moveAction'
AttackAction 	= require 'app/sdk/actions/attackAction'
PlayCardFromHandAction = require 'app/sdk/actions/playCardFromHandAction'
EndTurnAction 	= require 'app/sdk/actions/endTurnAction'
Cards 			= require 'app/sdk/cards/cardsLookupComplete'
Deck 			= require 'app/sdk/cards/deck'
GameSession 			= require 'app/sdk/gameSession'
AgentActions = require 'app/sdk/agents/agentActions'
CONFIG = require 'app/common/config'
RSX = require('app/data/resources');
ChallengeCategory = require('app/sdk/challenges/challengeCategory')
i18next = require('i18next')


# http://forums.duelyst.com/t/songhype-challenge/8451

class BeginnerSonghaiChallenge2 extends Challenge

	@type: "BeginnerSonghaiChallenge2"
	type: "BeginnerSonghaiChallenge2"
	categoryType: ChallengeCategory.starter.type

	name: i18next.t("challenges.beginner_songhai_2_title")
	description:i18next.t("challenges.beginner_songhai_2_description")
	iconUrl: RSX.speech_portrait_songhai.img

	_musicOverride: RSX.music_battlemap_songhai.audio

	otkChallengeStartMessage: i18next.t("challenges.beginner_songhai_2_start")
	otkChallengeFailureMessages: [
		i18next.t("challenges.beginner_songhai_2_fail")
	]

	battleMapTemplateIndex: 2
	snapShotOnPlayerTurn: 0
	startingManaPlayer: CONFIG.MAX_MANA
	startingHandSizePlayer: 6

	getMyPlayerDeckData: (gameSession)->
		return [
			{id: Cards.Faction2.General}
			{id: Cards.Faction2.GoreHorn}
			{id: Cards.Spell.SaberspineSeal}
			{id: Cards.Spell.MistDragonSeal}
			{id: Cards.Spell.InnerFocus}
		]

	getOpponentPlayerDeckData: (gameSession)->
		return [
			{id: Cards.Faction6.General}
			{id: Cards.TutorialSpell.TutorialFrozenFinisher}
		]

	setupBoard: (gameSession) ->
		super(gameSession)

		myPlayerId = gameSession.getMyPlayerId()
		opponentPlayerId = gameSession.getOpponentPlayerId()

		general1 = gameSession.getGeneralForPlayerId(myPlayerId)
		general1.setPosition({x: 1, y: 3})
		general1.maxHP = 25
		general1.setDamage(21)
		general2 = gameSession.getGeneralForPlayerId(opponentPlayerId)
		general2.setPosition({x: 6, y: 2})
		general2.maxHP = 25
		general2.setDamage(16)

		@applyCardToBoard({id: Cards.Faction6.BlazingSpines},4,3,opponentPlayerId)
		@applyCardToBoard({id: Cards.Faction6.BlazingSpines},5,3,opponentPlayerId)
		@applyCardToBoard({id: Cards.Faction6.BonechillBarrier},5,2,opponentPlayerId)
		@applyCardToBoard({id: Cards.Faction6.BonechillBarrier},5,1,opponentPlayerId)
		@applyCardToBoard({id: Cards.Faction6.BonechillBarrier},6,3,opponentPlayerId)

	setupOpponentAgent: (gameSession) ->
		super(gameSession)

		@_opponentAgent.addActionForTurn(0,AgentActions.createAgentSoftActionShowInstructionLabels([
			label:i18next.t("challenges.beginner_songhai_2_taunt")
			isSpeech:true
			yPosition:.6
			isOpponent: true
			isPersistent: true
		]))
		@_opponentAgent.addActionForTurn(0,AgentActions.createAgentActionPlayCardFindPosition(0,(() ->
			return [GameSession.getInstance().getGeneralForPlayer1().getPosition()]
		).bind(this)))


module.exports = BeginnerSonghaiChallenge2
