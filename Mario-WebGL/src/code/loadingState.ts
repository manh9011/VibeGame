import { GameState, GameStateContext } from "../Enjine/state";
import { Resources } from "../Enjine/resources";
import { Mario } from "./setup";
import { MapState } from "./mapState";
import { TitleState } from "./titleState";
import { Tile } from "./level";
import { Renderer } from "../Enjine/renderer";

interface ImageDef {
    name: string;
    src: string;
}

/**
 * State responsible for loading game resources (images and sound).
 */
export class LoadingState extends GameState {
    /** Array of images to load. */
    Images: ImageDef[];
    /** Whether all images have been loaded. */
    ImagesLoaded: boolean;
    /** Current screen color value (for fading). */
    ScreenColor: number;
    /** Direction of the fade (-1 or 1). */
    ColorDirection: number;
    /** Index of the current image being loaded. */
    ImageIndex: number;
    /** Index of the current sound being loaded. */
    SoundIndex: number;

    constructor() {
        super();
        this.Images = [];
        this.ImagesLoaded = false;
        this.ScreenColor = 0;
        this.ColorDirection = 1;
        this.ImageIndex = 0;
        this.SoundIndex = 0;
    }

    /**
     * Starts the loading process.
     */
    Enter(): void {
        this.Images[0] = { name: "background", src: "images/bgsheet.png" };
        this.Images[1] = { name: "endScene", src: "images/endscene.gif" };
        this.Images[2] = { name: "enemies", src: "images/enemysheet.png" };
        this.Images[3] = { name: "fireMario", src: "images/firemariosheet.png" };
        this.Images[4] = { name: "font", src: "images/font.gif" };
        this.Images[5] = { name: "gameOverGhost", src: "images/gameovergost.gif" };
        this.Images[6] = { name: "items", src: "images/itemsheet.png" };
        this.Images[7] = { name: "logo", src: "images/logo.gif" };
        this.Images[8] = { name: "map", src: "images/mapsheet.png" };
        this.Images[9] = { name: "mario", src: "images/mariosheet.png" };
        this.Images[10] = { name: "particles", src: "images/particlesheet.png" };
        this.Images[11] = { name: "racoonMario", src: "images/racoonmariosheet.png" };
        this.Images[12] = { name: "smallMario", src: "images/smallmariosheet.png" };
        this.Images[13] = { name: "title", src: "images/title.gif" };
        this.Images[14] = { name: "worldMap", src: "images/worldmap.png" };
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

    Exit(): void {
        delete this.Images;
    }

    Update(delta: number): void {
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

    Draw(renderer: Renderer): void {
        if (!this.ImagesLoaded) {
            var color = this.ScreenColor | 0; // parseInt handled by bitwise or
            renderer.FillRect(0, 0, 640, 480, "rgb(" + color + "," + color + "," + color + ")");
        } else {
            renderer.FillRect(0, 0, 640, 480, "rgb(0, 0, 0)");
        }
    }

    CheckForChange(context: GameStateContext): void {
        if (this.ImagesLoaded) {
            //set up the global map state variable
            Mario.GlobalMapState = new MapState();

            context.ChangeState(new TitleState());
        }
    }
}
