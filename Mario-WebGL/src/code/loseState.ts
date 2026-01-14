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
 * State displayed when the player loses the game (Game Over).
 */
export class LoseState extends GameState {
    /** Manager for handling drawables. */
    drawManager: DrawableManager | null;
    /** Camera for the scene. */
    camera: Camera | null;
    /** Animated sprite for the game over ghost/screen. */
    gameOver: AnimatedSprite | null;
    /** Font for the game over message. */
    font: SpriteFont | null;
    /** Helper to track if a key was previously held down. */
    wasKeyDown: boolean;

    constructor() {
        super();
        this.drawManager = null;
        this.camera = null;
        this.gameOver = null;
        this.font = null;
        this.wasKeyDown = false;
    }

    Enter(): void {
        this.drawManager = new DrawableManager();
        this.camera = new Camera();

        this.gameOver = new AnimatedSprite();
        this.gameOver.Image = Resources.Images["gameOverGhost"];
        this.gameOver.SetColumnCount(9);
        this.gameOver.SetRowCount(1);
        this.gameOver.AddNewSequence("turnLoop", 0, 0, 0, 8);
        this.gameOver.PlaySequence("turnLoop", true);
        this.gameOver.FramesPerSecond = 1 / 15;
        this.gameOver.X = 112;
        this.gameOver.Y = 68;

        this.font = SpriteCuts.CreateWhiteFont();
        this.font.Strings[0] = { String: "Game over!", X: 116, Y: 160 };

        this.drawManager.Add(this.font);
        this.drawManager.Add(this.gameOver);
    }

    Exit(): void {
        this.drawManager?.Clear();
        delete this.drawManager;
        delete this.camera;
        delete this.gameOver;
        delete this.font;
    }

    Update(delta: number): void {
        this.drawManager?.Update(delta);
        if (KeyboardInput.IsKeyDown(Keys.S)) {
            this.wasKeyDown = true;
        }
    }

    Draw(renderer: Renderer): void {
        this.drawManager?.Draw(renderer, this.camera!);
    }

    CheckForChange(context: GameStateContext): void {
        if (this.wasKeyDown && !KeyboardInput.IsKeyDown(Keys.S)) {
            context.ChangeState(new TitleState());
        }
    }
}
