import { GameState, GameStateContext } from "../Enjine/state";
import { DrawableManager } from "../Enjine/drawableManager";
import { Camera } from "../Enjine/camera";
import { AnimatedSprite } from "../Enjine/animatedSprite";
import { Resources } from "../Enjine/resources";
import { KeyboardInput, Keys } from "../Enjine/keyboardInput";
import { SpriteCuts } from "./spriteCuts";
import { TitleState } from "./titleState";
import { Renderer } from "../Enjine/renderer";
import { SpriteFont } from "../Enjine/spriteFont";

/**
 * State displayed when the player beats the game (rescues the princess).
 */
export class WinState extends GameState {
    /** Time to wait before allowing input. */
    waitTime: number;
    /** Manager for handling drawables. */
    drawManager: DrawableManager | null;
    /** Camera for the win screen. */
    camera: Camera | null;
    /** Font for the thank you message. */
    font: SpriteFont | null;
    /** Animated sprite of the Princess kissing Mario. */
    kissing: AnimatedSprite | null;
    /** Helper to track if a key was previously held down. */
    wasKeyDown: boolean;

    constructor() {
        super();
        this.waitTime = 2;
        this.drawManager = null;
        this.camera = null;
        this.font = null;
        this.kissing = null;
        this.wasKeyDown = false;
    }

    Enter(): void {
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

    Exit(): void {
        this.drawManager?.Clear();
        delete this.drawManager;
        delete this.camera;
    }

    Update(delta: number): void {
        this.drawManager?.Update(delta);

        if (this.waitTime > 0) {
            this.waitTime -= delta;
        } else {
            if (KeyboardInput.IsKeyDown(Keys.S)) {
                this.wasKeyDown = true;
            }
        }
    }

    /**
     * Draws the win screen.
     */
    Draw(renderer: Renderer): void {
        this.drawManager?.Draw(renderer, this.camera!);
    }

    CheckForChange(context: GameStateContext): void {
        if (this.waitTime <= 0) {
            if (this.wasKeyDown && !KeyboardInput.IsKeyDown(Keys.S)) {
                context.ChangeState(new TitleState());
            }
        }
    }
}
