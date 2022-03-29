var path = require('path')
require('app-module-path').addPath(path.join(__dirname, '../../../../../'))
require('coffee-script/register')
var expect = require('chai').expect;
var CONFIG = require('app/common/config');
var Logger = require('app/common/logger');
var SDK = require('app/sdk');
var UtilsSDK = require('test/utils/utils_sdk');
var _ = require('underscore');
var ModifierForcefield = require('app/sdk/modifiers/modifierForcefield');

// disable the logger for cleaner test output
Logger.enabled = false;

describe("first watch", function() {
	describe("neutral", function(){
		beforeEach(function () {
			var player1Deck = [
				{id: SDK.Cards.Faction6.AltGeneral},
			];

			var player2Deck = [
				{id: SDK.Cards.Faction1.General},
			];

			UtilsSDK.setupSession(player1Deck, player2Deck, true, true);
		});

		afterEach(function () {
			SDK.GameSession.reset();
		});

		it('expect wild tahr to gain +3 attack until end of turn whenever an enemy attacks', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;
			player2.remainingMana = 9;

			var wildTahr = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.WildTahr}, 4, 2, gameSession.getPlayer2Id());

			var snowchaser = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction6.WyrBeast}, 7, 3, gameSession.getPlayer1Id());
			var snowchaser2 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction6.WyrBeast}, 7, 2, gameSession.getPlayer1Id());
			snowchaser.refreshExhaustion();
			snowchaser2.refreshExhaustion();

			expect(wildTahr.getATK()).to.equal(2);

			var action = snowchaser.actionAttack(gameSession.getGeneralForPlayer2());
			gameSession.executeAction(action);

			expect(wildTahr.getATK()).to.equal(5);

			var action = snowchaser2.actionAttack(gameSession.getGeneralForPlayer2());
			gameSession.executeAction(action);

			expect(wildTahr.getATK()).to.equal(8);
			gameSession.executeAction(gameSession.actionEndTurn());
			expect(wildTahr.getATK()).to.equal(8);
			gameSession.executeAction(gameSession.actionEndTurn());
			expect(wildTahr.getATK()).to.equal(2);
		});
		it('expect komodo hunter to spawn 2 komodo chargers for your opponent', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;
			player2.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Neutral.KomodoHunter}));
			var playCardFromHandAction1 = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction1);

			var chargers = board.getEntitiesAroundEntity(gameSession.getGeneralForPlayer2());

			expect(chargers[0].getId()).to.equal(SDK.Cards.Neutral.KomodoCharger);
			expect(chargers[1].getId()).to.equal(SDK.Cards.Neutral.KomodoCharger);
			expect(chargers[2]).to.not.exist;
		});
		it('expect rokadoptera to put a 0 mana, deal 1 damage spell in your hand', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;
			player2.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Neutral.Rokadoptera}));
			var playCardFromHandAction1 = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction1);

			var playCardFromHandAction1 = player1.actionPlayCardFromHand(0, 8, 2);
			gameSession.executeAction(playCardFromHandAction1);

			expect(gameSession.getGeneralForPlayer2().getDamage()).to.equal(1);
		});
		it('expect sinister silhouette to not be attackable by minions or general', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;
			player2.remainingMana = 9;

			var sinister = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.SinisterSilhouette}, 1, 2, gameSession.getPlayer2Id());

			var action = gameSession.getGeneralForPlayer1().actionAttack(sinister);
			gameSession.executeAction(action);
			expect(action.getIsValid()).to.equal(false);

			var snowchaser = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction6.WyrBeast}, 2, 2, gameSession.getPlayer1Id());
			snowchaser.refreshExhaustion();
			var action = snowchaser.actionAttack(sinister);
			gameSession.executeAction(action);
			expect(action.getIsValid()).to.equal(false);
		});
		it('expect minions that quahog defeats to return to their owners action bar', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;

			var quahog = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.Quahog}, 1, 2, gameSession.getPlayer2Id());

			var crystalCloaker = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction6.CrystalCloaker}, 2, 2, gameSession.getPlayer1Id());
			crystalCloaker.refreshExhaustion();
			var action = crystalCloaker.actionAttack(quahog);
			gameSession.executeAction(action);

			var hand = player1.getDeck().getCardsInHand();
			expect(hand[0].getId()).to.equal(SDK.Cards.Faction6.CrystalCloaker);
		});
		it('expect matter shaper to destroy an enemy artifact and to put a random artifact from your faction in your hand', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Artifact.ArclyteRegalia}));
			var playCardFromHandAction1 = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction1);

			gameSession.executeAction(gameSession.actionEndTurn());
			player2.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer2Id(), {id: SDK.Cards.Neutral.MatterShaper}));
			var playCardFromHandAction1 = player2.actionPlayCardFromHand(0, 8, 1);
			gameSession.executeAction(playCardFromHandAction1);

			var modifiers = gameSession.getGeneralForPlayer1().getArtifactModifiers();
			expect(modifiers[0]).to.equal(undefined);

			var hand = player2.getDeck().getCardsInHand();
			expect(hand[0].type).to.equal(SDK.CardType.Artifact);
			expect(hand[0].factionId).to.equal(gameSession.getGeneralForPlayer2().factionId);
		});
		it('expect thunderhorn to deal its damage to all joined enemies', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;
			player2.remainingMana = 9;

			var terradon1 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.Terradon}, 2, 2, gameSession.getPlayer2Id());
			var terradon2 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.Terradon}, 3, 3, gameSession.getPlayer2Id());
			var terradon3 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.Terradon}, 4, 3, gameSession.getPlayer2Id());
			var terradon4 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.Terradon}, 5, 1, gameSession.getPlayer2Id());

			var thunderhorn = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.Thunderhorn}, 1, 2, gameSession.getPlayer1Id());
			thunderhorn.refreshExhaustion();


			var action = thunderhorn.actionAttack(terradon1);
			gameSession.executeAction(action);

			expect(terradon1.getDamage()).to.equal(thunderhorn.getATK());
			expect(terradon2.getDamage()).to.equal(thunderhorn.getATK());
			expect(terradon3.getDamage()).to.equal(thunderhorn.getATK());
			expect(terradon4.getDamage()).to.equal(0);
		});
		it('expect spriggin to summon 3 spriggin kin nearby each general', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.AerialRift}));
			var playCardFromHandAction1 = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction1);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Neutral.Spriggin}));
			var playCardFromHandAction1 = player1.actionPlayCardFromHand(0, 4, 2);
			gameSession.executeAction(playCardFromHandAction1);

			allySpriggans = board.getEntitiesAroundEntity(gameSession.getGeneralForPlayer1());
			enemySpriggans = board.getEntitiesAroundEntity(gameSession.getGeneralForPlayer2());

			expect(allySpriggans.length).to.equal(3); // expect there to be 3 spriggin
			expect(enemySpriggans.length).to.equal(3);

			expect(allySpriggans[1].getId()).to.equal(allySpriggans[0].getId()); // expect all 3 for both players to match
			expect(allySpriggans[2].getId()).to.equal(allySpriggans[1].getId());
			expect(enemySpriggans[1].getId()).to.equal(enemySpriggans[0].getId());
			expect(enemySpriggans[2].getId()).to.equal(enemySpriggans[1].getId());

			var allySprigganCheck = false; // expect the spriggin kin to match the correct ID
			if(allySpriggans[0].getId() == SDK.Cards.Neutral.PartyAnimal1 || allySpriggans[0].getId() == SDK.Cards.Neutral.PartyAnimal2 ||
				allySpriggans[0].getId() == SDK.Cards.Neutral.PartyAnimal3 || allySpriggans[0].getId() == SDK.Cards.Neutral.PartyAnimal4){
					allySprigganCheck = true;
				}

			var enemySprigganCheck = false;
			if(enemySpriggans[0].getId() == SDK.Cards.Neutral.PartyAnimal1 || enemySpriggans[0].getId() == SDK.Cards.Neutral.PartyAnimal2 ||
				enemySpriggans[0].getId() == SDK.Cards.Neutral.PartyAnimal3 || enemySpriggans[0].getId() == SDK.Cards.Neutral.PartyAnimal4){
					enemySprigganCheck = true;
				}

			expect(allySprigganCheck).to.equal(true);
			expect(enemySprigganCheck).to.equal(true);
		});
		it('expect spriggin kin glub to gain +3/+3 whenever a spriggin dies', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;

			var glub = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.PartyAnimal1}, 1, 2, gameSession.getPlayer1Id());
			var spriggin2 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.Spriggin}, 3, 2, gameSession.getPlayer2Id());
			var spriggin1 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.Spriggin}, 4, 2, gameSession.getPlayer1Id());

			expect(glub.getATK()).to.equal(1);
			expect(glub.getHP()).to.equal(1);

			spriggin1.setDamage(5);
			spriggin2.setDamage(5);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 3, 2);
			gameSession.executeAction(playCardFromHandAction);

			expect(glub.getATK()).to.equal(4);
			expect(glub.getHP()).to.equal(4);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 4, 2);
			gameSession.executeAction(playCardFromHandAction);

			expect(glub.getATK()).to.equal(7);
			expect(glub.getHP()).to.equal(7);
		});
		it('expect spriggin kin binky to heal your general for 2 whenever it damages a minion', function() {
		  var gameSession = SDK.GameSession.getInstance();
		  var board = gameSession.getBoard();
		  var player1 = gameSession.getPlayer1();

		  var binky = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.PartyAnimal2}, 3, 2, gameSession.getPlayer1Id());
		  var terradon1 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction5.Terradon}, 2, 2, gameSession.getPlayer2Id());

		  gameSession.getGeneralForPlayer1().setDamage(5);

		  binky.refreshExhaustion();
		  var action = binky.actionAttack(terradon1);
		  gameSession.executeAction(action);

		  expect(gameSession.getGeneralForPlayer1().getHP()).to.equal(22);
		});
		it('expect spriggin kin moro to have +3 attack as long as a spriggin lives', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;

			var moro = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.PartyAnimal4}, 1, 2, gameSession.getPlayer1Id());
			var spriggin2 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.Spriggin}, 3, 2, gameSession.getPlayer2Id());
			var spriggin1 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.Spriggin}, 4, 2, gameSession.getPlayer1Id());

			expect(moro.getATK()).to.equal(3);

			spriggin1.setDamage(5);
			spriggin2.setDamage(5);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 4, 2);
			gameSession.executeAction(playCardFromHandAction);

			expect(moro.getATK()).to.equal(3);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 3, 2);
			gameSession.executeAction(playCardFromHandAction);

			expect(moro.getATK()).to.equal(0);
		});
		it('expect bloodsworn gambler to have a chance of randomly activating and attacking again', function() {
			var attackedTwice = false;
			var safetyCounter = 0;
			do {
				var player1Deck = [
					{id: SDK.Cards.Faction1.General}
				];

				var player2Deck = [
					{id: SDK.Cards.Faction3.General}
				];

				// setup test session
				UtilsSDK.setupSession(player1Deck, player2Deck, true, true);

				var gameSession = SDK.GameSession.getInstance();
				var board = gameSession.getBoard();
				var player1 = gameSession.getPlayer1();
				player1.remainingMana = 9;

				var gambler = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.Gambler}, 1, 2, gameSession.getPlayer1Id());
				gambler.refreshExhaustion();

				var action = gambler.actionAttack(gameSession.getGeneralForPlayer2());
				gameSession.executeAction(action);

				if(gameSession.getGeneralForPlayer2().getDamage() > 2){
					attackedTwice = true;
				}

				safetyCounter++;

				SDK.GameSession.reset();
			}
			while (attackedTwice == false && safetyCounter < 50);

			expect(attackedTwice).to.equal(true);
		});
		it('expect theobule to replace your hand', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInDeckAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.AerialRift}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInDeckAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.AerialRift}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInDeckAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.AerialRift}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInDeckAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.AerialRift}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInDeckAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.AerialRift}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInDeckAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.AerialRift}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInDeckAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.AerialRift}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInDeckAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.AerialRift}));

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Neutral.Theobule}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(5, 1, 2);
			gameSession.executeAction(playCardFromHandAction);

			var hand = player1.getDeck().getCardsInHand();
			expect(hand[0].getId()).to.equal(SDK.Cards.Spell.AerialRift);
			expect(hand[1].getId()).to.equal(SDK.Cards.Spell.AerialRift);
			expect(hand[2].getId()).to.equal(SDK.Cards.Spell.AerialRift);
			expect(hand[3].getId()).to.equal(SDK.Cards.Spell.AerialRift);
			expect(hand[4].getId()).to.equal(SDK.Cards.Spell.AerialRift);
		});
		it('expect letigress to summon a saberspine cub every time your general attacks', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;

			var letigress = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.Letigress}, 4, 2, gameSession.getPlayer1Id());

			var snowchaser2 = UtilsSDK.applyCardToBoard({id: SDK.Cards.Faction6.WyrBeast}, 1, 2, gameSession.getPlayer2Id());

			var action = gameSession.getGeneralForPlayer1().actionAttack(snowchaser2);
			gameSession.executeAction(action);

			var cub = board.getEntitiesAroundEntity(letigress);
			expect(cub.length).to.equal(1);
			expect(cub[0].getId()).to.equal(SDK.Cards.Neutral.TigerCub);
		});
		it('expect magesworn to stop both players from casting spells that cost 2 or less', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;

			var magesworn = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.Magesworn}, 4, 2, gameSession.getPlayer1Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 8, 2);
			gameSession.executeAction(playCardFromHandAction);
			expect(playCardFromHandAction.getIsValid()).to.equal(false);
			expect(gameSession.getGeneralForPlayer2().getDamage()).to.equal(0);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.SpiralTechnique}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(1, 8, 2);
			gameSession.executeAction(playCardFromHandAction);
			expect(playCardFromHandAction.getIsValid()).to.equal(true);
			expect(gameSession.getGeneralForPlayer2().getDamage()).to.equal(8);

			gameSession.executeAction(gameSession.actionEndTurn());

			player2.remainingMana = 9;

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer2Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			var playCardFromHandAction = player2.actionPlayCardFromHand(0, 0, 2);
			gameSession.executeAction(playCardFromHandAction);
			expect(playCardFromHandAction.getIsValid()).to.equal(false);
			expect(gameSession.getGeneralForPlayer1().getDamage()).to.equal(0);

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer2Id(), {id: SDK.Cards.Spell.SpiralTechnique}));
			var playCardFromHandAction = player2.actionPlayCardFromHand(1, 0, 2);
			gameSession.executeAction(playCardFromHandAction);
			expect(playCardFromHandAction.getIsValid()).to.equal(true);
			expect(gameSession.getGeneralForPlayer1().getDamage()).to.equal(8);
		});
		it('expect dagona to not be summonable on spaces not occupied by minions', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;

			var magesworn = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.Magesworn}, 4, 2, gameSession.getPlayer1Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Neutral.DagonaFish}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 1, 1);
			gameSession.executeAction(playCardFromHandAction);

			expect(playCardFromHandAction.getIsValid()).to.equal(false);
			expect(board.getUnitAtPosition({x:1, y:1})).to.not.exist;
		});
		it('expect dagona to consume the minion it is summoned on and to spit it out when it dies', function() {
			var gameSession = SDK.GameSession.getInstance();
			var board = gameSession.getBoard();
			var player1 = gameSession.getPlayer1();
			var player2 = gameSession.getPlayer2();
			player1.remainingMana = 9;

			var magesworn = UtilsSDK.applyCardToBoard({id: SDK.Cards.Neutral.Magesworn}, 4, 2, gameSession.getPlayer2Id());

			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Neutral.DagonaFish}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 4, 2);
			gameSession.executeAction(playCardFromHandAction);

			var dagona = board.getUnitAtPosition({x:4, y:2});

			expect(dagona.getId()).to.equal(SDK.Cards.Neutral.DagonaFish);

			dagona.setDamage(7);

			player1.remainingMana = 9;
			UtilsSDK.executeActionWithoutValidation(new SDK.PutCardInHandAction(gameSession, gameSession.getPlayer1Id(), {id: SDK.Cards.Spell.PhoenixFire}));
			var playCardFromHandAction = player1.actionPlayCardFromHand(0, 4, 2);
			gameSession.executeAction(playCardFromHandAction);

			var magesworn = board.getUnitAtPosition({x:4, y:2});
			expect(magesworn.getId()).to.equal(SDK.Cards.Neutral.Magesworn);
		});
	});
});
