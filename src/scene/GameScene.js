(function() {

var SINGLETON = null;

gls2.GameScene = tm.createClass({
    superClass: gls2.Scene,
    player: null,
    score: 0,
    stage: null,
    ground: null,
    zanki: 3,
    groundLayer: null,
    playerLayer: null,
    enemyLayer: null,
    effectLayer0: null,
    effectLayer1: null,
    bulletLayer: null,
    labelLayer: null,

    consoleWindow: null,

    background: this.background = tm.graphics.LinearGradient(0, 0, 0, SC_H).addColorStopList([
        { offset:0, color:"#030" },
        { offset:1, color:"#010" }
    ]).toStyle(),

    init: function() {
        if (SINGLETON !== null) throw new Error("class 'gls2.GameScene' is singleton!!");

        this.superInit();
        SINGLETON = this;

        this._createGround();

        this.groundLayer = tm.app.Object2D().addChildTo(this);
        this.enemyLayer = tm.app.Object2D().addChildTo(this);
        this.effectLayer0 = tm.app.Object2D().addChildTo(this);
        this.playerLayer = tm.app.Object2D().addChildTo(this);
        this.effectLayer1 = tm.app.Object2D().addChildTo(this);
        this.bulletLayer = tm.app.Object2D().addChildTo(this);
        this.labelLayer = tm.app.Object2D().addChildTo(this);

        this.consoleWindow = gls2.ConsoleWindow(200)
            .setPosition(SC_W - 100 - 5, 32 + 5)
            .addChildTo(this.labelLayer);

        tm.bulletml.AttackPattern.defaultConfig.addTarget = this;
    },

    println: function(string) {
        this.consoleWindow.addLine(string);
    },

    _createGround: function() {
        var g = this.ground = tm.app.CanvasElement().addChildTo(this);
        g.gx = g.gy = 0;
        g.direction = Math.PI * 0.5;
        g.cellSize = 20;
        g.speed = 1;
        g.dx = 0;
        g.dy = 0;
        g.update = function() {
            this.dx = Math.cos(this.direction) * this.speed;
            this.dy = Math.sin(this.direction) * this.speed;
            this.gx = (this.gx + this.dx) % this.cellSize;
            this.gy = (this.gy + this.dy) % this.cellSize;
        };
        g.blendMode = "lighter";
        g.draw = function(canvas) {
            canvas.lineWidth = 0.2;
            canvas.strokeStyle = "#999";
            canvas.beginPath();
            for (var x = this.gx; x < SC_W; x += this.cellSize) {
                canvas.line(x, 0, x, SC_H);
            }
            for (var y = this.gy; y < SC_H; y += this.cellSize) {
                canvas.line(0, y, SC_W, y);
            }
            canvas.closePath();
            canvas.stroke();
        };
    },

    addChild: function(child) {
        if (child instanceof gls2.Player) {
            this.playerLayer.addChild(child);
        } else if (child instanceof gls2.Enemy) {
            if (child.hard.isGround) {
                this.groundLayer.addChild(child);
            } else {
                this.enemyLayer.addChild(child);
            }
        } else if (child instanceof gls2.BackfireParticle || child instanceof gls2.ShotBullet || child instanceof gls2.Laser) {
            this.effectLayer0.addChild(child);
        } else if (child instanceof gls2.Particle || child.isEffect) {
            this.effectLayer1.addChild(child);
        } else if (child instanceof gls2.Bullet) {
            this.bulletLayer.addChild(child);
        } else {
            this.superClass.prototype.addChild.apply(this, arguments);
        }
    },

    update: function(app) {
        this.stage.update(app.frame);

        if (app.keyboard.getKeyDown("escape")) {
            this.finish(0);
        } else if (app.keyboard.getKeyDown("space")) {
            this.openPauseMenu(0);
        } else if (app.keyboard.getKeyDown("p")) {
            app.canvas.saveAsImage();
            this.openPauseMenu(0);
        }
    },

    onResult: function(requestCode, result) {
        switch(requestCode) {
        case 0: // pause
            this.onResultPause(result);
            break;
        case 1: // setting
            this.onResultSetting(result);
            break;
        case 2: // confirm exit game
            this.onResultConfirmExitGame(result);
            break;
        case 3: // bgm setting
            this.onResultBgmSetting(result);
            break;
        case 4: // se setting
            this.onResultSeSetting(result);
            break;
        }
    },

    openPauseMenu: function(defaultValue) {
        this.openDialogMenu(0, "PAUSE", [ "resume", "setting", "exit game" ], defaultValue, [
            "ゲームを再開します",
            "設定を変更します",
            "ゲームを中断し、タイトル画面に戻ります",
        ], false);
    },
    onResultPause: function(result) {
        switch (result) {
        case 0: // resume
            break;
        case 1: // setting
            this.openSetting();
            break;
        case 2: // exit title
            this.openConfirmExitGame();
            break;
        }
    },

    openSetting: function() {
        this.openDialogMenu(1, "SETTING", [ "bgm volume", "sound volume" ], this.lastSetting, [
            "BGMボリュームを設定します",
            "効果音ボリュームを設定します",
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
        default:
            this.openPauseMenu();
            break;
        }
    },

    openConfirmExitGame: function() {
        this.openDialogMenu(2, "REARY?", [ "yes", "no" ], 1, [
            "ゲームを中断し、タイトル画面に戻ります",
            "前の画面へ戻ります",
        ], false);
    },
    onResultConfirmExitGame: function(result) {
        if (result === 0) {
            this.finish(0);
        } else {
            this.openPauseMenu(1);
        }
    },

    openBgmSetting: function() {
        this.openDialogMenu(3, "BGM VOLUME", [ "0", "1", "2", "3", "4", "5" ], gls2.core.bgmVolume);
    },
    onResultBgmSetting: function(result) {
        if (result !== 6) gls2.core.bgmVolume = result;
        this.openSetting(1);
    },

    openSeSetting: function() {
        this.openDialogMenu(4, "SE VOLUME", [ "0", "1", "2", "3", "4", "5" ], gls2.core.seVolume);
    },
    onResultSeSetting: function(result) {
        if (result !== 6) {
            gls2.core.seVolume = result;
        }
        this.openSetting(1);
    },

    draw: function(canvas) {
        canvas.clearColor(this.background, 0, 0);
    },

    gameStart: function(playerType) {
        this.consoleWindow.clearBuf().clear();

        if (this.player !== null) this.player.remove();
        gls2.Enemy.clearAll();
        gls2.ShotBullet.clearAll();
        gls2.Danmaku.clearAll();

        this.player = gls2.Player(this);
        this.startStage(0);
    },

    startStage: function(stageNumber) {
        this.stage = gls2.Stage.create(this, stageNumber);
        this.launch();
    },

    launch: function() {
        this.player
            .setPosition(SC_W*0.5, SC_H+32)
            .setFrameIndex(3)
            .addChildTo(this);
        this.player.controllable = false;
        this.player.muteki = true;
        this.player.tweener
            .clear()
            .wait(30)
            .moveBy(0, -120)
            .wait(120)
            .call(function() {
                this.controllable = true;
            }.bind(this.player))
            .wait(120)
            .call(function() {
                this.muteki = false;
            }.bind(this.player));
    },

    miss: function() {
        this.player.remove();
        this.zanki -= 1;
        if (this.zanki > 0) {
            this.launch();
        } else {
            // TODO コンティニュー確認画面へ
        }
    },

    gameContinue: function() {
        this.launch();
    },

    clearStage: function() {
        // TODO リザルト画面へ
    },

    gameOver: function() {
        // TODO ゲームオーバー画面へ
    },

    gameClear: function() {
        // TODO エンディング画面へ
    },

});

})();