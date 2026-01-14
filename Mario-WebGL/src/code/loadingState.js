/**
    State that loads all the resources for the game.
    Code by Rob Kleffner, 2011
*/

import { GameState } from "../Enjine/state.js";
import { Resources } from "../Enjine/resources.js";
import { Mario } from "./setup.js";
import { MapState } from "./mapState.js";
import { TitleState } from "./titleState.js";
import { Tile } from "./level.js";
import * as PIXI from 'pixi.js';

export class LoadingState extends GameState {
    constructor() {
        super();
        this.Images = [];
        this.ImagesLoaded = false;
        this.ScreenColor = 0;
        this.ColorDirection = 1;
        this.ImageIndex = 0;
        this.SoundIndex = 0;
    }

    Enter() {
        var i = 0;
        for (i = 0; i < 15; i++) {
            this.Images[i] = {};
        }

        this.Images[0].name = "background";
        this.Images[1].name = "endScene";
        this.Images[2].name = "enemies";
        this.Images[3].name = "fireMario";
        this.Images[4].name = "font";
        this.Images[5].name = "gameOverGhost";
        this.Images[6].name = "items";
        this.Images[7].name = "logo";
        this.Images[8].name = "map";
        this.Images[9].name = "mario";
        this.Images[10].name = "particles";
        this.Images[11].name = "racoonMario";
        this.Images[12].name = "smallMario";
        this.Images[13].name = "title";
        this.Images[14].name = "worldMap";

        this.Images[0].src = "images/bgsheet.png";
        this.Images[1].src = "images/endscene.gif";
        this.Images[2].src = "images/enemysheet.png";
        this.Images[3].src = "images/firemariosheet.png";
        this.Images[4].src = "images/font.gif";
        this.Images[5].src = "images/gameovergost.gif";
        this.Images[6].src = "images/itemsheet.png";
        this.Images[7].src = "images/logo.gif";
        this.Images[8].src = "images/mapsheet.png";
        this.Images[9].src = "images/mariosheet.png";
        this.Images[10].src = "images/particlesheet.png";
        this.Images[11].src = "images/racoonmariosheet.png";
        this.Images[12].src = "images/smallmariosheet.png";
        this.Images[13].src = "images/title.gif";
        this.Images[14].src = "images/worldmap.png";

        Resources.AddImages(this.Images);

        var testAudio = new Audio();

        if (testAudio.canPlayType("audio/mp3")) {
            Resources.AddSound("1up", "sounds/1-up.mp3", 1)
                .AddSound("breakblock", "sounds/breakblock.mp3")
                .AddSound("bump", "sounds/bump.mp3", 4)
                .AddSound("cannon", "sounds/cannon.mp3")
                .AddSound("coin", "sounds/coin.mp3", 5)
                .AddSound("death", "sounds/death.mp3", 1)
                .AddSound("exit", "sounds/exit.mp3", 1)
                .AddSound("fireball", "sounds/fireball.mp3", 1)
                .AddSound("jump", "sounds/jump.mp3")
                .AddSound("kick", "sounds/kick.mp3")
                .AddSound("pipe", "sounds/pipe.mp3", 1)
                .AddSound("powerdown", "sounds/powerdown.mp3", 1)
                .AddSound("powerup", "sounds/powerup.mp3", 1)
                .AddSound("sprout", "sounds/sprout.mp3", 1)
                .AddSound("stagestart", "sounds/stagestart.mp3", 1)
                .AddSound("stomp", "sounds/stomp.mp3", 2);
        } else {
            Resources.AddSound("1up", "sounds/1-up.wav", 1)
                .AddSound("breakblock", "sounds/breakblock.wav")
                .AddSound("bump", "sounds/bump.wav", 2)
                .AddSound("cannon", "sounds/cannon.wav")
                .AddSound("coin", "sounds/coin.wav", 5)
                .AddSound("death", "sounds/death.wav", 1)
                .AddSound("exit", "sounds/exit.wav", 1)
                .AddSound("fireball", "sounds/fireball.wav", 1)
                .AddSound("jump", "sounds/jump.wav", 1)
                .AddSound("kick", "sounds/kick.wav", 1)
                .AddSound("message", "sounds/message.wav", 1)
                .AddSound("pipe", "sounds/pipe.wav", 1)
                .AddSound("powerdown", "sounds/powerdown.wav", 1)
                .AddSound("powerup", "sounds/powerup.wav", 1)
                .AddSound("sprout", "sounds/sprout.wav", 1)
                .AddSound("stagestart", "sounds/stagestart.wav", 1)
                .AddSound("stomp", "sounds/stomp.wav", 1);
        }

        //load the array of tile behaviors
        Tile.LoadBehaviors();
    }

    Exit() {
        delete this.Images;
    }

    Update(delta) {
        if (!this.ImagesLoaded) {
            this.ImagesLoaded = true;
            var i = 0;
            for (i = 0; i < this.Images.length; i++) {
                if (Resources.Images[this.Images[i].name].complete !== true) {
                    this.ImagesLoaded = false;
                    break;
                }
            }
        }

        this.ScreenColor += this.ColorDirection * 255 * delta;
        if (this.ScreenColor > 255) {
            this.ScreenColor = 255;
            this.ColorDirection = -1;
        } else if (this.ScreenColor < 0) {
            this.ScreenColor = 0;
            this.ColorDirection = 1;
        }
    }

    Draw(container) {
        if (!this.graphics) {
            this.graphics = new PIXI.Graphics();
        }
        if (this.graphics.parent !== container) {
            container.addChild(this.graphics);
        }

        this.graphics.clear();

        if (!this.ImagesLoaded) {
            var color = parseInt(this.ScreenColor, 10);
            var hex = (color << 16) | (color << 8) | color;
            this.graphics.rect(0, 0, 320, 240);
            this.graphics.fill(hex);
        } else {
            this.graphics.rect(0, 0, 320, 240);
            this.graphics.fill(0x000000);
        }
    }

    CheckForChange(context) {
        if (this.ImagesLoaded) {
            //set up the global map state variable
            Mario.GlobalMapState = new MapState();

            context.ChangeState(new TitleState());
        }
    }
}
