import { GameState, GameStateContext } from "../Enjine/state";
import { DrawableManager } from "../Enjine/drawableManager";
import { Camera } from "../Enjine/camera";
import { BackgroundGenerator } from "./backgroundGenerator";
import { BackgroundRenderer } from "./backgroundRenderer";
import { Sprite } from "../Enjine/sprite";
import { Resources } from "../Enjine/resources";
import { SpriteCuts } from "./spriteCuts";
import { KeyboardInput, Keys } from "../Enjine/keyboardInput";
import { MouseInput } from "../Enjine/mouseInput";
import { Mario } from "./setup";
import { MapState } from "./mapState";
import { Character } from "./character";
import { LevelType } from "./level";
import { Renderer } from "../Enjine/renderer";
import { SpriteFont } from "../Enjine/spriteFont";


/**
 * Represents the title screen state.
 */
export class TitleState extends GameState {
    /** Manager for handling drawables logic. */
    drawManager: DrawableManager | null;
    /** Camera for the title screen. */
    camera: Camera | null;
    /** Vertical position of the Logo. */
    logoY: number;
    /** Bounce animation timer. */
    bounce: number;
    /** Font for the "Press Start" text. */
    font: SpriteFont | null;
    /** Title sprite. */
    title: Sprite | null;
    /** Logo sprite. */
    logo: Sprite | null;

    constructor() {
        super();
        this.drawManager = null;
        this.camera = null;
        this.logoY = 0;
        this.bounce = 0;
        this.font = null;
        this.title = null;
        this.logo = null;
    }

    Enter(): void {
        this.drawManager = new DrawableManager();
        this.camera = new Camera();

        var bgGenerator = new BackgroundGenerator(2048, 15, true, LevelType.Overground);
        var bgLayer0 = new BackgroundRenderer(bgGenerator.CreateLevel(), 320, 240, 2);
        bgGenerator.SetValues(2048, 15, false, LevelType.Overground);
        var bgLayer1 = new BackgroundRenderer(bgGenerator.CreateLevel(), 320, 240, 1);

        this.title = new Sprite();
        this.title.Image = Resources.Images["title"];
        this.title.X = 0;
        this.title.Y = 120;

        this.logo = new Sprite();
        this.logo.Image = Resources.Images["logo"];
        this.logo.X = 0;
        this.logo.Y = 0;

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

    Exit(): void {
        Mario.StopMusic();

        this.drawManager?.Clear();
        delete this.drawManager;
        delete this.camera;
        delete this.font;
    }

    Update(delta: number): void {
        this.bounce += delta * 2;
        this.logoY = 20 + Math.sin(this.bounce) * 10;

        if (this.camera) {
            this.camera.X += delta * 25;
        }

        this.drawManager?.Update(delta);
    }

    /**
     * Draws the title screen.
     */
    Draw(renderer: Renderer): void {
        this.drawManager?.Draw(renderer, this.camera!);

        renderer.DrawImage(Resources.Images["title"], 0, 120);
        renderer.DrawImage(Resources.Images["logo"], 0, this.logoY);

        this.font.Draw(renderer, this.camera);
    }

    CheckForChange(context: GameStateContext): void {
        if (KeyboardInput.IsKeyDown(Keys.S) || MouseInput.IsButtonDown(0)) {
            context.ChangeState(Mario.GlobalMapState);
        }
    }
}
