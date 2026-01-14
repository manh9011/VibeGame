/**
    State that's shown when the player wins the game!
    Code by Rob Kleffner, 2011
*/

import { GameState } from "../Enjine/state.js";
import { DrawableManager } from "../Enjine/drawableManager.js";
import { Camera } from "../Enjine/camera.js";
import { AnimatedSprite } from "../Enjine/animatedSprite.js";
import { Resources } from "../Enjine/resources.js";
import { KeyboardInput, Keys } from "../Enjine/keyboardInput.js";
import { SpriteCuts } from "./spriteCuts.js";
import { TitleState } from "./titleState.js";

export class WinState extends GameState {
    constructor() {
        super();
        this.waitTime = 2;
        this.drawManager = null;
        this.camera = null;
        this.font = null;
        this.kissing = null;
        this.wasKeyDown = false;
    }

    Enter() {
        this.drawManager = new DrawableManager();
        this.camera = new Camera();

        this.font = SpriteCuts.CreateBlackFont();
        this.font.Strings[0] = { String: "Thank you for saving me, Mario!", X: 36, Y: 160 };

        this.kissing = new AnimatedSprite();
        this.kissing.Image = Resources.Images["endScene"];
        this.kissing.X = 112;
        this.kissing.Y = 52;
        this.kissing.SetColumnCount(2);
        this.kissing.SetRowCount(1);
        this.kissing.AddNewSequence("loop", 0, 0, 0, 1);
        this.kissing.PlaySequence("loop", true);
        this.kissing.FramesPerSecond = 1 / 2;

        this.waitTime = 2;

        this.drawManager.Add(this.font);
        this.drawManager.Add(this.kissing);
    }

    Exit() {
        this.drawManager.Clear();
        delete this.drawManager;
        delete this.camera;
    }

    Update(delta) {
        this.drawManager.Update(delta);

        if (this.waitTime > 0) {
            this.waitTime -= delta;
        } else {
            if (KeyboardInput.IsKeyDown(Keys.S)) {
                this.wasKeyDown = true;
            }
        }
    }

    Draw(context) {
        this.drawManager.Draw(context, this.camera);
    }

    CheckForChange(context) {
        if (this.waitTime <= 0) {
            if (this.wasKeyDown && !KeyboardInput.IsKeyDown(Keys.S)) {
                context.ChangeState(new TitleState());
            }
        }
    }
}
