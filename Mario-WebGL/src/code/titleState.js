/**
    Displays the title screen and menu.
    Code by Rob Kleffner, 2011
*/

import { GameState } from "../Enjine/state.js";
import { DrawableManager } from "../Enjine/drawableManager.js";
import { Camera } from "../Enjine/camera.js";
import { BackgroundGenerator } from "./backgroundGenerator.js";
import { BackgroundRenderer } from "./backgroundRenderer.js";
import { Sprite } from "../Enjine/sprite.js";
import { Resources } from "../Enjine/resources.js";
import { SpriteCuts } from "./spriteCuts.js";
import { KeyboardInput, Keys } from "../Enjine/keyboardInput.js";
import { Mario } from "./setup.js";
import { MapState } from "./mapState.js";
import { Character } from "./character.js";
import { LevelType } from "./level.js";

export class TitleState extends GameState {
    constructor() {
        super();
        this.drawManager = null;
        this.camera = null;
        this.logoY = null;
        this.bounce = null;
        this.font = null;
    }

    Enter() {
        this.drawManager = new DrawableManager();
        this.camera = new Camera();

        var bgGenerator = new BackgroundGenerator(2048, 15, true, LevelType.Overground);
        var bgLayer0 = new BackgroundRenderer(bgGenerator.CreateLevel(), 320, 240, 2);
        bgGenerator.SetValues(2048, 15, false, LevelType.Overground);
        var bgLayer1 = new BackgroundRenderer(bgGenerator.CreateLevel(), 320, 240, 1);

        this.title = new Sprite();
        this.title.Image = Resources.Images["title"];
        this.title.X = 0, this.title.Y = 120;

        this.logo = new Sprite();
        this.logo.Image = Resources.Images["logo"];
        this.logo.X = 0, this.logo.Y = 0;

        this.font = SpriteCuts.CreateRedFont();
        this.font.Strings[0] = { String: "Press S to Start", X: 96, Y: 120 };

        this.logoY = 20;

        this.drawManager.Add(bgLayer0);
        this.drawManager.Add(bgLayer1);

        this.bounce = 0;

        Mario.GlobalMapState = new MapState();
        //set up the global main character variable
        Mario.MarioCharacter = new Character();
        Mario.MarioCharacter.Image = Resources.Images["smallMario"];

        Mario.PlayTitleMusic();
    }

    Exit() {
        Mario.StopMusic();

        this.drawManager.Clear();
        delete this.drawManager;
        delete this.camera;
        delete this.font;
    }

    Update(delta) {
        this.bounce += delta * 2;
        this.logoY = 20 + Math.sin(this.bounce) * 10;

        this.camera.X += delta * 25;

        this.drawManager.Update(delta);
    }

    Draw(container) {
        this.drawManager.Draw(container, this.camera);

        // UI Elements should not move with the camera
        const uiCamera = { X: 0, Y: 0 };
        this.title.Draw(container, uiCamera);
        this.logo.Draw(container, uiCamera);
        this.font.Draw(container, uiCamera);
    }

    CheckForChange(context) {
        if (KeyboardInput.IsKeyDown(Keys.S)) {
            context.ChangeState(Mario.GlobalMapState);
        }
    }
}
