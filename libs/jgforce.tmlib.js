jgforce.tm = {};
(function() {
	jgforce.tm.Mouse = tm.createClass({
		superClass: tm.input.Mouse,
		init: function(element, app) {
			this.element = element || window.document;

			this.position       = tm.geom.Vector2(0, 0);
			this.deltaPosition  = tm.geom.Vector2(0, 0);
			this.prevPosition   = tm.geom.Vector2(0, 0);

			/*
			var self = this;
			this.element.addEventListener("mousemove", function(e){
				// 座標更新
				self._mousemove(e);
			});
			this.element.addEventListener("mousedown", function(e){
				self.button |= 1<<e.button;
			});
			this.element.addEventListener("mouseup", function(e){
				self.button &= ~(1<<e.button);
			});
			this.element.addEventListener("mouseover", function(e){
				// 座標更新
				self._mousemove(e);
				self.prevPosition.setObject(self.position);
			});
			*/
		}
	}),
	jgforce.tm.Touches = tm.createClass({
		superClass: tm.input.Touches,
		init: function(elm, length, app) {
			this.element = elm;
			for (var i=0; i<length; ++i) {
				var touch = tm.input.Touch(this.element);
				this.push(touch);
			}

			var self = this;
			/*
			this.element.addEventListener("touchstart", function(e) {
				var target = null;
				for (var i=0; i<length; ++i) {
					if (!self[i]._touch) {
						target = self[i];
						break;
					}
				}
				if (!target) return ;

				target._touch = e.changedTouches[0];

				target._touchmove(e);
				target.prevPosition.setObject(target.position);

				target.touched = true;
				// changedTouches;
				// targetTouches;
			});
			this.element.addEventListener("touchend", function(e){
				for (var i=0; i<length; ++i) {
					if (self[i]._touch == e.changedTouches[0]) {
						self[i]._touch = null;
						self[i].touched = false;
					}
				}
			});
			this.element.addEventListener("touchmove", function(e){
				for (var i=0; i<length; ++i) {
					if (self[i]._touch) {
						self[i]._touchmove(e);
					}
				}
				// 画面移動を止める
				e.stop();
			});
			*/
		}
	}),
	jgforce.tm.Keyboard = tm.createClass({
		superClass: tm.input.Keyboard,
		init: function(element, app) {
			this.element = element || document;
			this.app = app;

			this.key = {};

			this.press  = {};
			this.down   = {};
			this.up     = {};
			this.last   = {};

			var self = this;
			this.element.addEventListener("keydown", function(e){
				if (self.app.mode == jgforce.GameState.Play) {
					self.app.events.push({
						type: jg.InputEventType.Keyboard,
						action: jg.InputEventAction.Down,
						param: {
							keyCode: e.keyCode
						}
					});
				}
				e.stopPropagation();
				e.preventDefault();
			});
			this.element.addEventListener("keyup", function(e){
				if (self.app.mode == jgforce.GameState.Play) {
					self.app.events.push({
						type: jg.InputEventType.Keyboard,
						action: jg.InputEventAction.Up,
						param: {
							keyCode: e.keyCode
						}
					});
				}
				e.stopPropagation();
				e.preventDefault();
			});
			/*
			//なんもしてないっぽい
			this.element.addEventListener("keypress", function(e){
			// self.button &= ~(1<<e.button);
			});
			*/
		},
		fire: function(e) {
			if (e.type != jg.InputEventType.Keyboard)
				return;
			if (e.action == jg.InputEventAction.Down) {
				this.key[e.param.keyCode] = true;
			} else if (e.action == jg.InputEventAction.Up) {
				this.key[e.param.keyCode] = false;
			}
			this._update();
		}
	});

	jgforce.tm.App = tm.createClass({
		superClass: tm.app.CanvasApp,
		// ---- jgofrce専用
		mode: jgforce.GameState.Stop,
		pause: function() {
			if (this.mode != jgforce.GameState.Play && this.mode != jgforce.GameState.View)
				return false;
			this.mode = this.mode == jgforce.GameState.Play ? jgforce.GameState.PausePlay : jgforce.GameState.PauseView;
			return true;
		},
		resume: function() {
			if (this.mode != jgforce.GameState.PausePlay && this.mode != jgforce.GameState.PauseView)
				return false;

			if (this.mode == jgforce.GameState.PauseView)
				this._view();
			else if (this.mode == jgforce.GameState.PausePlay)
				this._play();
			return true;
		},
		clearLog: function() {
			if (this.playHelper)
				this.playHelper.clearLog();
		},
		hasLog: function() {
			if (this.playHelper)
				return this.playHelper.hasLog();
			return false;
		},
		setSeed: function(seed) {
			this.seed = seed;
		},
		jgstart: function() {
			if (! this.isStarted) {
				this.isStarted = true;
				this.sceneIndex = 1;
				this.logScene = 1;
				this.total_time = 0;
				this.total_frame = 0;
				this.current_frame = 0;
				this.current_time = 0;
				this.inputState = {};

				this.started.fire();
			}
		},
		set: function(session, game_id, revision) {
			this.session = session;
			this.game_id = game_id;
			this.revision = revision;
		},
		view: function(play_user_id, seq) {
			if (this.viewHelper) {
				this.viewHelper._exit = true;
				this.viewHelper.new_log.remove(this, this.onNewData);
			}

			this.play_user_id = play_user_id;
			this.seq = seq;

			this.viewHelper = new jgforce.ViewHelper(this, this.game_id, play_user_id, seq);
			this.viewHelper.new_log.handle(this, this.onNewData);

			var self = this;
			this.viewHelper.view(function() {
				self.setSeed(self.viewHelper.seed);
				self._view();
			}, function() {
				alert("初期化に失敗しました。");
			});
		},
		onNewData: function(e) {
			this.total_time += e.total_time;
			this.total_frame += e.data.length;
		},
		startView: function() {
			this._start = true;
			this._view();
		},
		_view: function() {
			if (! this._start)
				return;
			if (! this.seq)
				return;
			if (! this.seed)
				return;

			this.mode = jgforce.GameState.View;
			this.viewHelper.polling();
			this.jgstart();
		},
		play: function() {
			if (this.playHelper)
				this.playHelper._exit = true;

			this.playHelper = new jgforce.PlayHelper(this, this.game_id);
			var self = this;
			this.playHelper.play(function() {
				self.setSeed(self.playHelper.seed);
				self.seq = self.playHelper.seq;
				self._play();
			}, function() {
				alert("シードの取得に失敗しました。");
			});	
		},
		startPlay: function() {
			//状況見てモードチェンジとstartかな
			this._start = true;
			this._play();
		},
		_play: function() {
			if (! this._start)
				return;
			if (! this.seq)
				return;

			if (! this.playHelper) {
				this.playHelper = new jgforce.PlayHelper(this, this.game_id);
				this.playHelper.seed = this.seed;
			}
			this.playHelper.seq = this.seq;
			this.playHelper.polling();
			this.mode = jgforce.GameState.Play;
			this.isPlaying = true;

			this.jgstart();
		},
		isSequencial: function() {
			return true;
		},
		viewUpdate: function() {
			if (! this.viewHelper)
				return 0;

			if (this.viewHelper.logs.length == 0)
				return 0;

			var log;
			var e;
			var totalTime = 0;
			do {
				e = this.viewHelper.logs.shift();
				if (e.type == 0) {
					if (this.sceneIndex > this.logScene) {
						this.current_frame++;
						this.current_time += e.t;
						//読み飛ばす
						console.log("skip to scene synchronized..."+this.sceneIndex+":"+this.logScene);
					} else {
						for (var i=0; i<e.events.length; i++)
							this.events.push(e.events[i]);
						totalTime += e.t;
						//this.manualUpdate(e.t)
						this.manualUpdate(e.t);
						this.current_frame++;
						this.current_time += e.t;
					}
				} else if (e.type == 4) {	// clear input state
					console.log("clear input state");
					this.current_frame++;
					this.clearInputEvent();
					this.raiseInputEvent();
				} else { //scene change
					this.logScene = e.t;
					if (this.sceneIndex < this.logScene) {
						console.log("wait for synchronized scene... "+this.sceneIndex+":"+this.logScene);
						this.viewHelper.logs.unshift(e);
						break;
					} else {
						this.current_frame++;
						this.current_time += e.t;
					}
				}
			} while (e.type != 0 && this.viewHelper.logs.length > 0);
			return totalTime;
		},
		events: [],
		fireInputEvents: function() {
			var e;
			while (e = this.events.shift()) {
				if (e.type == jg.InputEventType.Keyboard) {
					this.keyboard.fire(e);
				} else {
					//this.getTouchDispatcher().fire(e);
					//this.getMouseDispatcher().fire(e);
				}
			}
		},
		//jgofrce専用 ----

		init: function(canvas, width, height) {
			//Note:
			//superInit、は使えない。使った時点でKeyboardなどが登録され、解除する方法がないため

			//---- CanvasApp部分のInit処理(1)
			if (canvas instanceof HTMLCanvasElement) {
				this.element = canvas;
			}
			else if (typeof canvas == "string") {
				this.element = document.querySelector(canvas);
			}
			else {
				this.element = document.createElement("canvas");
			}
			// CanvasApp部分のInit処理(1) ----

			//---- BaseApp部分のInit処理
			//this.element = elm;

			//glshooter2がマウスサポートしてからね
			// マウスを生成
			this.mouse = jgforce.tm.Mouse(this.element, this);
			// タッチを生成
			this.touches = jgforce.tm.Touches(this.element, 3, this);
			//this.touch = this.touches[0];
			// キーボードを生成
			this.keyboard   = jgforce.tm.Keyboard(this.element, this);

			// ポインティングをセット(PC では Mouse, Mobile では Touch)
			this.pointing   = (tm.isMobile) ? this.touch : this.mouse;

			// 加速度センサーを生成
			this.accelerometer = tm.input.Accelerometer();

			// 再生フラグ
			this.isPlaying = true;

			// シーン周り
			this._scenes = [ tm.app.Scene() ];
			this._sceneIndex = 0;

			//glshooter2がマウスサポートしてからね
			// 決定時の処理をオフにする(iPhone 時のちらつき対策)
			//this.element.addEventListener("touchstart", function(e) { e.stop(); });

			//unsupported
			/*
			// ウィンドウフォーカス時イベントリスナを登録
			window.addEventListener("focus", function() {
				this.currentScene.dispatchEvent(tm.event.Event("focus"));
			}.bind(this));
			// ウィンドウブラー時イベントリスナを登録
			window.addEventListener("blur", function() {
				this.currentScene.dispatchEvent(tm.event.Event("blur"));
			}.bind(this));
			*/
			
			//glshooter2がマウスサポートしてからね
			// クリック
			//this.element.addEventListener((tm.isMobile) ? "touchstart" : "mousedown", this._onclick.bind(this));
			// BaseApp部分のInit処理 ----


			// ---- CanvasApp部分のInit処理(2)
			// グラフィックスを生成
			this.canvas = tm.graphics.Canvas(this.element);
			this.renderer = tm.app.CanvasRenderer(this.canvas);

			// カラー
			this.background = "black";

			// シーン周り
			this._scenes = [ tm.app.Scene() ];
			// CanvasApp部分のInit処理(2) ----


			//---- jgforce init
			this.resize(width, height).fitWindow();
			this.started = new jg.Trigger();
			this.element.setAttribute('tabindex', 1);
			this.element.style.outline = 'none';
			this.element.style.cursor = 'default';


			// LoadingScene自動生成
			this.replaceScene(tm.app.LoadingScene({
				assets: g_resources,
				nextScene: function() {
					//mainloopのっとり
					tm.exit = true;
					setTimeout(this.mainLoop.bind(this), tm.loopTime);

					jgforce.loaded.fire(this);
					return StartScene(this);
				}.bind(this),
			}));
		},
		manualUpdate: function(t) {
			this.fireInputEvents();

			var updater = tm.updater;
			var len = updater.length;
			var dels = [];
			for (var i=0; i<len; i++) {
				if (updater[i].t <= tm.loopTime) {
					if (updater[i].fn()) {
						dels.push(updater[i]);
					} else {
						updater[i].t = updater[i].delay;
					}
				} else {
					updater[i].t -= tm.loopTime;
				}
			}

			for (var i=0; i<dels.length; i++) {
				var d = dels[i];
				for (var j=0; j<len; j++) {
					if (tm.updater[j] == d) {
						tm.updater.splice(j, 1);
						len--;
						break;
					}
				}
			}
		},
		mainLoop: function() {
			var start = (new Date()).getTime();
			if (this.mode == jgforce.GameState.Play) {
				if (this.playHelper) {
					this.playHelper.logging({
						type: 0,
						t: tm.loopTime,
						events: this.events
					});
				}
				this.manualUpdate();
			} else if (this.mode == jgforce.GameState.View) {
				this.viewUpdate();
			}

			var progress = (new Date()).getTime() - start;
			var newDelay = tm.loopTime-progress;
			newDelay = (newDelay > 0) ? newDelay : 0;
			setTimeout(this.mainLoop.bind(this), newDelay);
		}
	});
})();
