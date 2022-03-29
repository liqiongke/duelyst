var path = require('path')
require('app-module-path').addPath(path.join(__dirname, '../../../../../../'))
require('coffee-script/register')
var expect = require('chai').expect;
var CONFIG = require('app/common/config');
var Logger = require('app/common/logger');
var SDK = require('app/sdk');
var UtilsSDK = require('test/utils/utils_sdk');
var _ = require('underscore');

// disable the logger for cleaner test output
Logger.enabled = false;

describe("faction4", function() {
	describe("artifacts", function(){

		beforeEach(function () {
			// define test decks.  Spells do not work.  Only add minions and generals this way
			var player1Deck = [
				{id: SDK.Cards.Faction4.General},
			];

			var player2Deck = [
				{id: SDK.Cards.Faction1.General},
			];

			// setup test session
			UtilsSDK.setupSession(player1Deck, player2Deck, true, true);

			/* // USE THIS TO GET THE CURRENT CARDS IN YOUR HAND
			var deck = player1.getDeck();
			Logger.module("UNITTEST").log(deck.getCardsInHand(1));
			*/
		});

		afterEach(function () {
			SDK.GameSession.reset();
		});


		it('expect horn of the forsaken to summon 1/1 in random space when general attacks something', function() {
//********************create basic structure for how we'll categorize neutrals******************
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Artifact.HornOfTheForsaken}));
			UtilsSDK.executeActionWithoutValidation(player1.actionPlayCardFromHand(0, 1, 1));

			var brightmossGolem = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.BrightmossGolem}, 0, 1, gameSession.getPlayer2Id());

			var action = gameSession.getGeneralForPlayer1().actionAttack(brightmossGolem);
			gameSession.executeAction(action);

			var wraithlingx = 0;
			var wraithlingy = 0;

			for (var xx = 0; xx < 10; xx++) {
				for (var yy = 0; yy < 5; yy++) {
					var wraithling = board.getUnitAtPosition({x: xx, y: yy});
					if (wraithling != null && wraithling.getId() === SDK.Cards.Faction4.Wraithling) {
						wraithlingx = xx;
						wraithlingy = yy;
						break;
					}
				}
			}

			var wraithling = board.getUnitAtPosition({x: wraithlingx, y: wraithlingy});

			expect(wraithling.getHP()).to.equal(1);
			expect(wraithling.getATK()).to.equal(1);
		});
		it('expect horn of the forsaken to summon 1/1 in instead of magmar egg if no other spaces available', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Artifact.HornOfTheForsaken}));
			UtilsSDK.executeActionWithoutValidation(player1.actionPlayCardFromHand(0, 1, 1));

			var youngSilithar = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.YoungSilithar}, 0, 1, gameSession.getPlayer2Id());
			var abyssalCrawler1 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction4.AbyssalCrawler}, 1, 1, gameSession.getPlayer1Id());
			var abyssalCrawler2 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction4.AbyssalCrawler}, 1, 2, gameSession.getPlayer1Id());
			var abyssalCrawler3 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction4.AbyssalCrawler}, 1, 3, gameSession.getPlayer1Id());
			var abyssalCrawler4 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction4.AbyssalCrawler}, 0, 3, gameSession.getPlayer1Id());

			youngSilithar.setDamage(2);

			var action = gameSession.getGeneralForPlayer1().actionAttack(youngSilithar);
			gameSession.executeAction(action);

			var wraithlingx = 0;
			var wraithlingy = 0;


			var wraithling = board.getUnitAtPosition({x: 0, y: 1});

			expect(wraithling.getId()).to.equal(SDK.Cards.Faction4.Wraithling)
			expect(wraithling.getHP()).to.equal(1);
			expect(wraithling.getATK()).to.equal(1);
		});
		it('expect spectral blade to give +2 attack', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Artifact.SpectralBlade}));
			UtilsSDK.executeActionWithoutValidation(player1.actionPlayCardFromHand(0, 1, 1));

			expect(gameSession.getGeneralForPlayer1().getATK()).to.equal(4);
		});
    it('expect spectral blade to restore +2 health to general if it kills enemy minion', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Artifact.SpectralBlade}));
			UtilsSDK.executeActionWithoutValidation(player1.actionPlayCardFromHand(0, 1, 1));

			var youngSilithar = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.YoungSilithar}, 0, 1, gameSession.getPlayer2Id());

			youngSilithar.setDamage(2);

			var action = gameSession.getGeneralForPlayer1().actionAttack(youngSilithar);
			gameSession.executeAction(action);

			expect(gameSession.getGeneralForPlayer1().getHP()).to.equal(25);
		});
    it('expect soul grimwar to give general +2 attack on ally and enemy minion death', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Artifact.SoulGrimwar}));
			UtilsSDK.executeActionWithoutValidation(player1.actionPlayCardFromHand(0, 1, 1));

			var youngSilithar = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.YoungSilithar}, 0, 1, gameSession.getPlayer2Id());
			var abyssalCrawler1 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction4.AbyssalCrawler}, 1, 1, gameSession.getPlayer1Id());
			abyssalCrawler1.refreshExhaustion();

			youngSilithar.setDamage(2);

			var action = abyssalCrawler1.actionAttack(youngSilithar);
			gameSession.executeAction(action);

			expect(gameSession.getGeneralForPlayer1().getATK()).to.equal(6);
		});
	});  //end Spells describe

});
