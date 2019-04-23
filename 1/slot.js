var djankey;
(function (djankey) {
    var SlotMachine = (function () {
        function SlotMachine(canvasId) {
            var _this = this;
            this.reel_icons = 6;
            this.spining = 0;
            this.init = function () {
                // stage
                _this.stageWidth = _this.canvas.width;
                _this.stageHeight = _this.canvas.height;
                _this.stage = new createjs.Stage(_this.canvas);
                _this.stage.mouseEnabled = true;

                // run!
                createjs.Ticker.setFPS(60);
                createjs.Ticker.useRAF = true;
                createjs.Ticker.addEventListener("tick", _this.tick);

                // load image
                _this.queue = new createjs.LoadQueue(false);
                _this.queue.addEventListener("complete", _this.imagesLoadedHandler);
                _this.queue.loadManifest([
                    { id: "spritesheet", src: "1.png" },
                    { id: "frame", src: "2.png" }
                ]);

                // text
                _this.txt = new createjs.Text("loading spritesheet...", '18px Arial', '#666666');
                _this.txt.textAlign = "center";
                _this.txt.x = _this.stageWidth / 2;
                _this.txt.y = _this.stageHeight / 2 - 10;
                _this.stage.addChild(_this.txt);

                // stats.js
                _this.stats = new Stats();
                _this.stats.setMode(0);
                document.body.appendChild(_this.stats.domElement);
            };
            this.imagesLoadedHandler = function (event) {
                _this.txt.y = 30;
                _this.txt.text = "...";

                // spritesheet
                _this.holder = new createjs.Container();
                _this.stage.addChild(_this.holder);

                var spritesheet_img = _this.queue.getResult("spritesheet");
                _this.reel_width = spritesheet_img.width / 2;
                _this.reel_height = spritesheet_img.height;
                _this.icon_height = Math.floor(_this.reel_height / _this.reel_icons);

                // duplicate spritesheet...
                var spritesheet_bmd = new createjs.BitmapData(spritesheet_img, _this.reel_width * 2, _this.reel_height);
                var frames_bmd = new createjs.BitmapData(null, _this.reel_width * 2, _this.reel_height * 2);
                var sourceRect = new createjs.Rectangle(0, 0, _this.reel_width * 2, _this.reel_height * 2);
                var destPoint = new createjs.Point(0, 0);
                frames_bmd.copyPixels(spritesheet_bmd, sourceRect, destPoint);
                destPoint.y = _this.reel_height;
                frames_bmd.copyPixels(spritesheet_bmd, sourceRect, destPoint);

                // create reels
                _this.reels = [];
                _this.currentSpin = [];

                for (var i = 0; i < 3; i++) {
                    var reel = new djankey.Reel(frames_bmd, _this.reel_width, _this.icon_height, _this.reel_icons, Math.floor(Math.random() * 6));
                    reel.x = i * 121;

                    reel.reelStopped = _this.reelStopped;

                    _this.holder.addChild(reel);
                    _this.reels[i] = reel;
                    _this.spining++;

                    _this.currentSpin[i] = Math.floor(Math.random() * _this.reel_icons);
                    setTimeout(reel.spin, i * 50, _this.currentSpin[i], 15 + i * 2, 0.98);
                }

                // frame
                var frame_img = _this.queue.getResult("frame");
                _this.frame_bmp = new createjs.Bitmap(frame_img);
                _this.frame_bmp.x = (_this.stageWidth - _this.frame_bmp.image.width) / 2;
                _this.frame_bmp.y = (_this.stageHeight - _this.frame_bmp.image.height) / 2;
                _this.stage.addChild(_this.frame_bmp);

                // reel position
                _this.holder.x = _this.frame_bmp.x + 18;
                _this.holder.y = _this.frame_bmp.y + 18;

                _this.canvas.addEventListener("click", _this.spinReels);
            };
            this.reelStopped = function () {
                _this.spining--;
                if (_this.spining <= 0) {
                    _this.spining = 0;

                    var num = _this.currentSpin[0];
                    var ok = 1;
                    for (var i = 1; i < _this.currentSpin.length; i++) {
                        if (num === _this.currentSpin[i])
                            ok++;
                    }
                    if (ok == _this.currentSpin.length) {
                        _this.txt.text = "You win! Click to spin!";
                    } else {
                        _this.txt.text = "You lose! Click to spin!";
                    }
                }
            };
            this.spinReels = function (event) {
                if (_this.spining == 0) {
                    _this.txt.text = "...";

                    for (var i = 0; i < _this.reels.length; i++) {
                        _this.spining++;
                        _this.currentSpin[i] = Math.floor(Math.random() * _this.reel_icons);
                        setTimeout(_this.reels[i].spin, i * 50, _this.currentSpin[i], 15 + i * 2, 0.98);
                    }
                }
            };
            // ------ TICK -------
            this.tick = function () {
                _this.stage.update();
                _this.stats.update();
            };
            this.canvas = document.getElementById(canvasId);

            if (!this.canvas || !this.canvas.getContext) {
                alert('HTML5 Canvas is not supported!');
            } else {
                this.init();
            }
        }
        return SlotMachine;
    })();
    djankey.SlotMachine = SlotMachine;
})(djankey || (djankey = {}));

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
(function (djankey) {
    var Reel = (function (_super) {
        __extends(Reel, _super);
        function Reel(spritesheet, reel_width, icon_height, reel_icons, no) {
            if (typeof no === "undefined") { no = 0; }
            var _this = this;
            _super.call(this, null);
            this.blur = false;
            this.speed = 0;
            this.delta_speed = 1;
            this.min_speed = 0.05;
            this.getRect = function (n, blured) {
                if (typeof n === "undefined") { n = _this.no; }
                if (typeof blured === "undefined") { blured = _this.blur; }
                var newRect = _this.sourceRect.clone();

                if (blured === true)
                    newRect.x = _this.reel_width;
                else
                    newRect.x = 0;

                if (n < 0.5)
                    newRect.y = (_this.reel_icons + n) * _this.icon_height - _this.icon_height / 2;
                else
                    newRect.y = n * _this.icon_height - _this.icon_height / 2;

                return newRect;
            };
            this.spin = function (no, speed, delta_speed) {
                if (typeof delta_speed === "undefined") { delta_speed = 1; }
                _this.no = no;
                _this.speed = speed;
                _this.delta_speed = delta_speed;
            };
            this.reelStopped = function () {
            };
            this.drawFrame = function (n, blured) {
                if (typeof n === "undefined") { n = _this.no; }
                if (typeof blured === "undefined") { blured = _this.blur; }
                _this.bmd.copyPixels(_this.spritesheet, _this.getRect(n, blured), _this.destPoint);
                _this.image = _this.bmd.canvas;
            };
            this.draw = function (a, b, c) {
                if (_this.current != _this.no || _this.delta_speed != 1) {
                    _this.current -= _this.speed;
                    if (_this.current > _this.reel_icons)
                        _this.current %= _this.reel_icons;
                    else if (_this.current < 0)
                        _this.current = _this.current % _this.reel_icons + _this.reel_icons;

                    if (Math.abs(_this.speed) < 0.05)
                        _this.drawFrame(_this.current, false);
                    else
                        _this.drawFrame(_this.current, true);

                    _this.speed *= _this.delta_speed;

                    if (Math.abs(_this.speed) < _this.min_speed)
                        _this.delta_speed = 1;

                    if (_this.delta_speed == 1) {
                        if (_this.no < (_this.current + _this.min_speed) && _this.no > (_this.current - _this.min_speed)) {
                            _this.speed = 0;
                            _this.current = _this.no;
                            _this.drawFrame(_this.current, false);
                            _this.reelStopped();
                        }
                    }
                }

                _super.prototype.draw.call(_this, a, b, c);
            };

            this.spritesheet = spritesheet;
            this.reel_width = reel_width;
            this.icon_height = icon_height;
            this.reel_icons = reel_icons;
            this.no = no;
            if (this.no >= this.reel_icons)
                this.no = 0;
            this.current = this.no;

            // initialize
            this.bmd = new createjs.BitmapData(null, this.reel_width, this.icon_height * 2);
            this.sourceRect = new createjs.Rectangle(0, 0, this.reel_width, this.icon_height * 2);
            this.destPoint = new createjs.Point(0, 0);

            // first draw
            this.drawFrame(this.current, false);
        }
        return Reel;
    })(createjs.Bitmap);
    djankey.Reel = Reel;
})(djankey || (djankey = {}));


window.onload = function () {
    var slotmachine = new djankey.SlotMachine('canvas');
};