(function() {

var origParticle = null;

var MAIN_MENU = 0;
var SETTING_MENU = 1;
var BGM_SETTING = 2;
var SE_SETTING = 3;
var DIFFICULTY_SETTING = 4;
var GAME_SCENE = 5;

gls2.TitleScene = tm.createClass({
    superClass: gls2.Scene,
    result: null,
    age: 0,
    particles: [],

    gameStarted: false,
    highScoreLabel: null,

    lastMainMenu: 0,
    lastSetting: 0,

    init: function() {
        this.superInit();

        tm.app.Label("GL-Shooter 2", 50).setPosition(SC_W * 0.5, SC_H * 0.25).addChildTo(this);
        tm.app.Label("version 1.0-beta", 22).setPosition(SC_W * 0.9, SC_H * 0.30).setAlign("right").addChildTo(this);
        this.highScoreLabel = tm.app.Label().setPosition(SC_W * 0.5, SC_H * 0.40).addChildTo(this);
        tm.app.Label("press space key").setPosition(SC_W * 0.5, SC_H * 0.9).addChildTo(this);

        this.addEventListener("enter", function() {
            this.gameStarted = false;
            this.highScoreLabel.text = "HIGH SCORE: " + gls2.core.highScore;
        });
    },

    draw: function(canvas) {
        canvas.fillStyle = "black";
        canvas.fillRect(0,0,SC_W,SC_H);
    },

    update: function(app) {
        this._generateParticle(Math.cos(this.age*0.01)        *120+SC_W*0.5, Math.sin(this.age*0.04)        *120+SC_H*0.5);
        this._generateParticle(Math.cos(this.age*0.01+Math.PI)*120+SC_W*0.5, Math.sin(this.age*0.04+Math.PI)*120+SC_H*0.5);

        if (app.keyboard.getKeyDown("space") || app.pointing.getPointingEnd()) {
            this.openMainMenu()
        }

        this.age += 1;
    },

    _generateParticle: function(cx, cy) {
        if (this.gameStarted) return;

        if (origParticle === null) origParticle = gls2.Particle(80, 1.0, 0.8, tm.graphics.Canvas()
            .resize(80, 80)
            .setFillStyle(
                tm.graphics.RadialGradient(40,40,0,40,40,40).addColorStopList([
                    {offset:0, color: "rgba(255,255,255,0.1)"},
                    {offset:1, color: "rgba(  0,155,  0,0.0)"},
                ]).toStyle()
            ).fillRect(0, 0, 80, 80)
            .element
        );

        var p = origParticle.clone().addChildTo(this);
        p.speed = 0.6;
        var a = Math.randf(0, Math.PI*2);
        var r = Math.rand(0, 20);
        p.setPosition(Math.cos(a) * r + cx, Math.sin(a) * r + cy);
        var self = this;
        p.update = function() {
            this.x += Math.cos(a) * this.speed;
            this.y += Math.sin(a) * this.speed;
            if (this.x < -50 || SC_W+50 < this.x || this.y < -50 || SC_H+50 < this.y) {
                this.remove();
                var idx = self.particles.indexOf(this);
                if (idx !== -1) {
                    self.particles.splice(idx, 1);
                }
            }
        };
        this.particles.push(p);
    },

    onResult: function(requestCode, result) {
        var callbacks = {};
        callbacks[MAIN_MENU] = this.onResultMainMenu;
        callbacks[SETTING_MENU] = this.onResultSetting;
        callbacks[BGM_SETTING] = this.onResultBgmSetting;
        callbacks[SE_SETTING] = this.onResultSeSetting;
        callbacks[DIFFICULTY_SETTING] = this.onResultDifficultySetting;

        var callback = callbacks[requestCode];
        if (callback) callback.call(this, result);
    },

    openMainMenu: function() {
        this.openDialogMenu(MAIN_MENU, "MAIN MENU", [ "start", "setting", "save score" ], this.lastMainMenu, [
            "プレイを開始します",
            "設定を変更します",
            "ゲームを終了し9leapにスコアを登録します",
        ]);
    },
    onResultMainMenu: function(result) {
        if (result !== 3) this.lastMainMenu = result;
        switch (result) {
        case 0: // start
            this.tweener
                .clear()
                .call(function() {
                    for (var i = 0, end = this.particles.length; i < end; i++) {
                        this.particles[i].speed = 6;
                        this.gameStarted = true;
                    }
                }.bind(this))
                .wait(1000)
                .call(function() {
                    gls2.core.gameScene.gameStart(1); // TODO 自機タイプを渡す
                    this.startScene(GAME_SCENE, gls2.core.gameScene);
                }.bind(this));
            break;
        case 1: // option
            this.openSetting();
            break;
        case 2: // to 9leap
            gls2.core.exitApp();
            break;
        }
    },

    openSetting: function() {
        this.openDialogMenu(SETTING_MENU, "SETTING", [ "bgm volume", "sound volume", "difficulty" ], this.lastSetting, [
            "BGMボリュームを設定します",
            "効果音ボリュームを設定します",
            "難易度を設定します",
        ]);
    },
    onResultSetting: function(result) {
        if (result !== 3) this.lastSetting = result;
        switch (result) {
        case 0:
            this.openBgmSetting();
            break;
        case 1:
            this.openSeSetting();
            break;
        case 2:
            this.openDifficultySetting();
            break;
        default:
            this.openMainMenu();
            break;
        }
    },

    openBgmSetting: function() {
        this.openDialogMenu(BGM_SETTING, "BGM VOLUME", [ "0", "1", "2", "3", "4", "5" ], gls2.core.bgmVolume);
    },
    onResultBgmSetting: function(result) {
        if (result !== 6) gls2.core.bgmVolume = result;
        this.openSetting();
    },

    openSeSetting: function() {
        this.openDialogMenu(SE_SETTING, "SE VOLUME", [ "0", "1", "2", "3", "4", "5" ], gls2.core.seVolume);
    },
    onResultSeSetting: function(result) {
        if (result !== 6) gls2.core.seVolume = result;
        this.openSetting();
    },

    openDifficultySetting: function() {
        this.openDialogMenu(DIFFICULTY_SETTING, "DIFFICULTY", [ "easy", "normal", "hard", "very hard", "hell" ], gls2.core.difficulty, [
            "初心者でも安心して挑戦可能な入門コース",
            "普通の難易度。easyでは物足りない人へ",
            "一般的な弾幕STGの難易度",
            "hardはヌルすぎるという人向け",
            "死ぬがよい",
        ]);
    },
    onResultDifficultySetting: function(result) {
        if (result !== 5) gls2.core.difficulty = result;
        this.openSetting();
    },

});

})();
