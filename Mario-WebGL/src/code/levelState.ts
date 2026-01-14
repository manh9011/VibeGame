import { GameState, GameStateContext } from "../Enjine/state";
import { LevelGenerator } from "./levelGenerator";
import { LevelRenderer } from "./levelRenderer";
import { DrawableManager } from "../Enjine/drawableManager";
import { Camera } from "../Enjine/camera";
import { SpriteCuts } from "./spriteCuts";
import { BackgroundGenerator } from "./backgroundGenerator";
import { BackgroundRenderer } from "./backgroundRenderer";
import { Sparkle } from "./sparkle";
import { BulletBill } from "./bulletBill";
import { Fireball } from "./fireball";
import { Mushroom } from "./mushroom";
import { FireFlower } from "./fireFlower";
import { CoinAnim } from "./coinAnim";
import { Particle } from "./particle";
import { Resources } from "../Enjine/resources";
import { Mario } from "./setup";
import { LoseState } from "./loseState";
import { LevelType, Tile } from "./level";
import { Renderer } from "../Enjine/renderer";
import { MapState } from "./mapState";
import { Level } from "./level";
import { SpriteFont } from "../Enjine/spriteFont";
import { NotchSprite } from "./notchSprite";
import { Shell } from "./shell";

/**
 * Represents the main gameplay state (playing a level).
 */
export class LevelState extends GameState {
    /** Difficulty level of the current game. */
    LevelDifficulty: number;
    /** Type of level (Overground, Underground, Castle). */
    LevelType: number;
    /** The generated level data. */
    Level: Level | null;
    /** Renderer for the level tiles. */
    Layer: LevelRenderer | null;
    /** Renderers for the scrolling background layers. */
    BgLayer: BackgroundRenderer[];

    /** Whether the game is currently paused. */
    Paused: boolean;
    /** Manager for all sprites in the level. */
    Sprites: DrawableManager | null;
    /** List of sprites to be added next frame. */
    SpritesToAdd: NotchSprite[];
    /** List of sprites to be removed next frame. */
    SpritesToRemove: NotchSprite[];
    /** Camera object for scrolling. */
    Camera: Camera | null;
    /** List of shells currently active (for collision checks). */
    ShellsToCheck: Shell[];
    /** List of fireballs currently active (for collision checks). */
    FireballsToCheck: Fireball[];

    /** Font for drawing shadow text. */
    FontShadow: SpriteFont | null;
    /** Font for drawing text. */
    Font: SpriteFont | null;

    /** Time remaining in the level. */
    TimeLeft: number;
    /** Time elapsed since start of level. */
    StartTime: number;
    /** Number of fireballs currently on screen. */
    FireballsOnScreen: number;
    /** Game tick counter. */
    Tick: number;

    /** Time elapsed between frames. */
    Delta: number;

    /** Flag to transition to MapState. */
    GotoMapState: boolean;
    /** Flag to transition to LoseState. */
    GotoLoseState: boolean;

    constructor(difficulty: number, type: number) {
        super();
        this.LevelDifficulty = difficulty;
        this.LevelType = type;
        this.Level = null;
        this.Layer = null;
        this.BgLayer = [];

        this.Paused = false;
        this.Sprites = null;
        this.SpritesToAdd = [];
        this.SpritesToRemove = [];
        this.Camera = null;
        this.ShellsToCheck = [];
        this.FireballsToCheck = [];

        this.FontShadow = null;
        this.Font = null;

        this.TimeLeft = 0;
        this.StartTime = 0;
        this.FireballsOnScreen = 0;
        this.Tick = 0;

        this.Delta = 0;

        this.GotoMapState = false;
        this.GotoLoseState = false;
    }

    Enter(): void {
        var levelGenerator = new LevelGenerator(320, 15), i = 0, scrollSpeed = 0, w = 0, h = 0, bgLevelGenerator = null;
        this.Level = levelGenerator.CreateLevel(this.LevelType, this.LevelDifficulty);

        //play music here
        if (this.LevelType === LevelType.Overground) {
            Mario.PlayOvergroundMusic?.();
        } else if (this.LevelType === LevelType.Underground) {
            Mario.PlayUndergroundMusic?.();
        } else if (this.LevelType === LevelType.Castle) {
            Mario.PlayCastleMusic?.();
        }

        this.Paused = false;
        this.Layer = new LevelRenderer(this.Level, 320, 240);
        this.Sprites = new DrawableManager();
        this.Camera = new Camera();
        this.Tick = 0;

        this.ShellsToCheck = [];
        this.FireballsToCheck = [];
        this.SpritesToAdd = [];
        this.SpritesToRemove = [];

        this.FontShadow = SpriteCuts.CreateBlackFont();
        this.Font = SpriteCuts.CreateWhiteFont();

        for (i = 0; i < 2; i++) {
            scrollSpeed = 4 >> i;
            w = ((((this.Level.Width * 16) - 320) / scrollSpeed) | 0) + 320;
            h = ((((this.Level.Height * 16) - 240) / scrollSpeed) | 0) + 240;
            bgLevelGenerator = new BackgroundGenerator(w / 32 + 1, h / 32 + 1, i === 0, this.LevelType);
            this.BgLayer[i] = new BackgroundRenderer(bgLevelGenerator.CreateLevel(), 320, 240, scrollSpeed);
        }

        Mario.MarioCharacter.Initialize(this);

        this.Sprites.Add(Mario.MarioCharacter);
        this.StartTime = 1;
        this.TimeLeft = 200;

        this.GotoMapState = false;
        this.GotoLoseState = false;
    }

    Exit(): void {
        delete this.Level;
        delete this.Layer;
        delete this.BgLayer;
        delete this.Sprites;
        delete this.Camera;
        delete this.ShellsToCheck;
        delete this.FireballsToCheck;
        delete this.FontShadow;
        delete this.Font;
    }

    /**
     * Adds a shell to check for potential collisions.
     */
    CheckShellCollide(shell: Shell): void {
        this.ShellsToCheck.push(shell);
    }

    /**
     * Adds a fireball to check for potential collisions.
     */
    CheckFireballCollide(fireball: Fireball): void {
        this.FireballsToCheck.push(fireball);
    }

    /**
     * Updates the level state (sprites, physics, camera).
     */
    Update(delta: number): void {
        var i = 0, j = 0, xd = 0, yd = 0, sprite = null, hasShotCannon = false, xCannon = 0, x = 0, y = 0,
            dir = 0, st = null, b = 0;

        this.Delta = delta;

        this.TimeLeft -= delta;
        if ((this.TimeLeft | 0) === 0) {
            Mario.MarioCharacter.Die();
        }

        if (this.StartTime > 0) {
            this.StartTime++;
        }

        this.Camera!.X = Mario.MarioCharacter.X - 160;
        if (this.Camera!.X < 0) {
            this.Camera!.X = 0;
        }
        if (this.Camera!.X > this.Level!.Width * 16 - 320) {
            this.Camera!.X = this.Level!.Width * 16 - 320;
        }

        this.FireballsOnScreen = 0;

        for (i = 0; i < this.Sprites!.Objects.length; i++) {
            sprite = this.Sprites!.Objects[i];
            if (sprite !== Mario.MarioCharacter) {
                xd = sprite.X - this.Camera!.X;
                yd = sprite.Y - this.Camera!.Y;
                if (xd < -64 || xd > 320 + 64 || yd < -64 || yd > 240 + 64) {
                    this.Sprites!.RemoveAt(i);
                } else {
                    if (sprite instanceof Fireball) {
                        this.FireballsOnScreen++;
                    }
                }
            }
        }

        if (this.Paused) {
            for (i = 0; i < this.Sprites!.Objects.length; i++) {
                if (this.Sprites!.Objects[i] === Mario.MarioCharacter) {
                    this.Sprites!.Objects[i].Update(delta);
                } else {
                    this.Sprites!.Objects[i].UpdateNoMove(delta);
                }
            }
        } else {
            this.Layer!.Update(delta);
            this.Level!.Update();

            hasShotCannon = false;
            xCannon = 0;
            this.Tick++;

            for (x = ((this.Camera!.X / 16) | 0) - 1; x <= (((this.Camera!.X + this.Layer!.Width) / 16) | 0) + 1; x++) {
                for (y = ((this.Camera!.Y / 16) | 0) - 1; y <= (((this.Camera!.Y + this.Layer!.Height) / 16) | 0) + 1; y++) {
                    dir = 0;

                    if (x * 16 + 8 > Mario.MarioCharacter.X + 16) {
                        dir = -1;
                    }
                    if (x * 16 + 8 < Mario.MarioCharacter.X - 16) {
                        dir = 1;
                    }

                    st = this.Level!.GetSpriteTemplate(x, y);

                    if (st !== null) {
                        if (st.LastVisibleTick !== this.Tick - 1) {
                            if (st.Sprite === null || !this.Sprites!.Contains(st.Sprite)) {
                                st.Spawn(this, x, y, dir);
                            }
                        }

                        st.LastVisibleTick = this.Tick;
                    }

                    if (dir !== 0) {
                        b = this.Level!.GetBlock(x, y);
                        if (((Tile.Behaviors[b & 0xff]) & Tile.Animated) > 0) {
                            if ((((b % 16) / 4) | 0) === 3 && ((b / 16) | 0) === 0) {
                                if ((this.Tick - x * 2) % 100 === 0) {
                                    xCannon = x;
                                    for (i = 0; i < 8; i++) {
                                        this.AddSprite(new Sparkle(this, x * 16 + 8, y * 16 + ((Math.random() * 16) | 0), Math.random() * dir, 0, 0, 1, 5));
                                    }
                                    this.AddSprite(new BulletBill(this, x * 16 + 8 + dir * 8, y * 16 + 15, dir));
                                    hasShotCannon = true;
                                }
                            }
                        }
                    }
                }
            }

            if (hasShotCannon) {
                Resources.PlaySound("cannon");
            }

            for (i = 0; i < this.Sprites!.Objects.length; i++) {
                this.Sprites!.Objects[i].Update(delta);
            }

            for (i = 0; i < this.Sprites!.Objects.length; i++) {
                this.Sprites!.Objects[i].CollideCheck();
            }

            for (i = 0; i < this.ShellsToCheck.length; i++) {
                for (j = 0; j < this.Sprites!.Objects.length; j++) {
                    if (this.Sprites!.Objects[j] !== this.ShellsToCheck[i] && !this.ShellsToCheck[i].Dead) {
                        if (this.Sprites!.Objects[j].ShellCollideCheck(this.ShellsToCheck[i])) {
                            if (Mario.MarioCharacter.Carried === this.ShellsToCheck[i] && !this.ShellsToCheck[i].Dead) {
                                Mario.MarioCharacter.Carried = null;
                                this.ShellsToCheck[i].Die();
                            }
                        }
                    }
                }
            }
            this.ShellsToCheck.length = 0;

            for (i = 0; i < this.FireballsToCheck.length; i++) {
                for (j = 0; j < this.Sprites!.Objects.length; j++) {
                    if (this.Sprites!.Objects[j] !== this.FireballsToCheck[i] && !this.FireballsToCheck[i].Dead) {
                        if (this.Sprites!.Objects[j].FireballCollideCheck(this.FireballsToCheck[i])) {
                            this.FireballsToCheck[i].Die();
                        }
                    }
                }
            }

            this.FireballsToCheck.length = 0;
        }

        this.Sprites!.AddRange(this.SpritesToAdd);
        this.Sprites!.RemoveList(this.SpritesToRemove);
        this.SpritesToAdd.length = 0;
        this.SpritesToRemove.length = 0;

        this.Camera!.X = (Mario.MarioCharacter.XOld + (Mario.MarioCharacter.X - Mario.MarioCharacter.XOld) * delta) - 160;
        this.Camera!.Y = (Mario.MarioCharacter.YOld + (Mario.MarioCharacter.Y - Mario.MarioCharacter.YOld) * delta) - 120;
    }

    /**
     * Draws the level scene.
     */
    Draw(renderer: Renderer): void {
        var i = 0, time = 0, t = 0;

        if (this.Camera!.X < 0) {
            this.Camera!.X = 0;
        }
        if (this.Camera!.Y < 0) {
            this.Camera!.Y = 0;
        }
        if (this.Camera!.X > this.Level!.Width * 16 - 320) {
            this.Camera!.X = this.Level!.Width * 16 - 320;
        }
        if (this.Camera!.Y > this.Level!.Height * 16 - 240) {
            this.Camera!.Y = this.Level!.Height * 16 - 240;
        }

        for (i = 0; i < 2; i++) {
            this.BgLayer[i].Draw(renderer, this.Camera!);
        }

        renderer.Save();
        renderer.Translate(-this.Camera!.X, -this.Camera!.Y);
        for (i = 0; i < this.Sprites!.Objects.length; i++) {
            if (this.Sprites!.Objects[i].Layer === 0) {
                this.Sprites!.Objects[i].Draw(renderer, this.Camera!);
            }
        }
        renderer.Restore();

        this.Layer!.Draw(renderer, this.Camera!);
        this.Layer!.DrawExit0(renderer, this.Camera!, Mario.MarioCharacter.WinTime === 0);

        renderer.Save();
        renderer.Translate(-this.Camera!.X, -this.Camera!.Y);
        for (i = 0; i < this.Sprites!.Objects.length; i++) {
            if (this.Sprites!.Objects[i].Layer === 1) {
                this.Sprites!.Objects[i].Draw(renderer, this.Camera!);
            }
        }
        renderer.Restore();

        this.Layer!.DrawExit1(renderer, this.Camera!);

        this.DrawStringShadow(renderer, "MARIO " + Mario.MarioCharacter.Lives, 0, 0);
        this.DrawStringShadow(renderer, "00000000", 0, 1);
        this.DrawStringShadow(renderer, "COIN", 14, 0);
        this.DrawStringShadow(renderer, " " + Mario.MarioCharacter.Coins, 14, 1);
        this.DrawStringShadow(renderer, "WORLD", 24, 0);
        this.DrawStringShadow(renderer, " " + Mario.MarioCharacter.LevelString, 24, 1);
        this.DrawStringShadow(renderer, "TIME", 34, 0);
        time = this.TimeLeft | 0;
        if (time < 0) {
            time = 0;
        }
        this.DrawStringShadow(renderer, " " + time, 34, 1);

        if (this.StartTime > 0) {
            t = this.StartTime + this.Delta - 2;
            t = t * t * 0.6;
            this.RenderBlackout(renderer, 160, 120, t | 0);
        }

        if (Mario.MarioCharacter.WinTime > 0) {
            Mario.StopMusic?.();
            t = Mario.MarioCharacter.WinTime + this.Delta;
            t = t * t * 0.2;

            if (t > 900) {
                //TODO: goto map state with level won
                (Mario.GlobalMapState as MapState).LevelWon();
                this.GotoMapState = true;
            }

            this.RenderBlackout(renderer, ((Mario.MarioCharacter.XDeathPos - this.Camera!.X) | 0), ((Mario.MarioCharacter.YDeathPos - this.Camera!.Y) | 0), (320 - t) | 0);
        }

        if (Mario.MarioCharacter.DeathTime > 0) {
            Mario.StopMusic?.();
            t = Mario.MarioCharacter.DeathTime + this.Delta;
            t = t * t * 0.1;

            if (t > 900) {
                //TODO: goto map with level lost
                Mario.MarioCharacter.Lives--;
                this.GotoMapState = true;
                if (Mario.MarioCharacter.Lives <= 0) {
                    this.GotoLoseState = true;
                }
            }

            this.RenderBlackout(renderer, ((Mario.MarioCharacter.XDeathPos - this.Camera!.X) | 0), ((Mario.MarioCharacter.YDeathPos - this.Camera!.Y) | 0), (320 - t) | 0);
        }
    }

    /**
     * Draws a string with a shadow offset.
     */
    DrawStringShadow(renderer: Renderer, string: string, x: number, y: number): void {
        this.Font.Strings[0] = { String: string, X: x * 8 + 4, Y: y * 8 + 4 };
        this.FontShadow.Strings[0] = { String: string, X: x * 8 + 5, Y: y * 8 + 5 };
        this.FontShadow.Draw(renderer, this.Camera!);
        this.Font.Draw(renderer, this.Camera!);
    }

    /**
     * Renders a circular blackout effect (iris out).
     */
    RenderBlackout(renderer: Renderer, x: number, y: number, radius: number): void {
        if (radius > 320) {
            return;
        }

        var xp = [], yp = [], i = 0;
        for (i = 0; i < 16; i++) {
            xp[i] = x + (Math.cos(i * Math.PI / 15) * radius) | 0;
            yp[i] = y + (Math.sin(i * Math.PI / 15) * radius) | 0;
        }
        xp[16] = 0;
        yp[16] = y;
        xp[17] = 0;
        yp[17] = 240;
        xp[18] = 320;
        yp[18] = 240;
        xp[19] = 320;
        yp[19] = y;

        renderer.SetFillStyle("#000");
        renderer.BeginPath();
        renderer.MoveTo(xp[19], yp[19]);
        for (i = 18; i >= 0; i--) {
            renderer.LineTo(xp[i], yp[i]);
        }
        renderer.ClosePath();
        renderer.Fill();

        for (i = 0; i < 16; i++) {
            xp[i] = x - (Math.cos(i * Math.PI / 15) * radius) | 0;
            yp[i] = y - (Math.sin(i * Math.PI / 15) * radius) | 0;
        }
        //cure a strange problem where the circle gets cut
        yp[15] += 5;

        xp[16] = 320;
        yp[16] = y;
        xp[17] = 320;
        yp[17] = 0;
        xp[18] = 0;
        yp[18] = 0;
        xp[19] = 0;
        yp[19] = y;

        renderer.SetFillStyle("#000");
        renderer.BeginPath();
        renderer.MoveTo(xp[0], yp[0]);
        for (i = 0; i <= xp.length - 1; i++) {
            renderer.LineTo(xp[i], yp[i]);
        }
        renderer.ClosePath();
        renderer.Fill();
    }

    /**
     * Adds a sprite to the level.
     */
    AddSprite(sprite: NotchSprite): void {
        this.Sprites?.Add(sprite);
    }

    /**
     * Removes a sprite from the level.
     */
    RemoveSprite(sprite: NotchSprite): void {
        this.Sprites?.Remove(sprite);
    }

    /**
     * Triggers a bump at a specific tile location (e.g., hitting a block from below).
     */
    Bump(x: number, y: number, canBreakBricks: boolean): void {
        var block = this.Level!.GetBlock(x, y), xx = 0, yy = 0;

        if ((Tile.Behaviors[block & 0xff] & Tile.Bumpable) > 0) {
            this.BumpInto(x, y - 1);
            this.Level!.SetBlock(x, y, 4);
            this.Level!.SetBlockData(x, y, 4);

            if ((Tile.Behaviors[block & 0xff] & Tile.Special) > 0) {
                Resources.PlaySound("sprout");
                if (!Mario.MarioCharacter.Large) {
                    this.AddSprite(new Mushroom(this, x * 16 + 8, y * 16 + 8));
                } else {
                    this.AddSprite(new FireFlower(this, x * 16 + 8, y * 16 + 8));
                }
            } else {
                Mario.MarioCharacter.GetCoin();
                Resources.PlaySound("coin");
                this.AddSprite(new CoinAnim(this, x, y));
            }
        }

        if ((Tile.Behaviors[block & 0xff] & Tile.Breakable) > 0) {
            this.BumpInto(x, y - 1);
            if (canBreakBricks) {
                Resources.PlaySound("breakblock");
                this.Level!.SetBlock(x, y, 0);
                for (xx = 0; xx < 2; xx++) {
                    for (yy = 0; yy < 2; yy++) {
                        this.AddSprite(new Particle(this, x * 16 + xx * 8 + 4, y * 16 + yy * 8 + 4, (xx * 2 - 1) * 4, (yy * 2 - 1) * 4 - 8));
                    }
                }
            }
        }
    }

    /**
     * Handles interaction when a sprite bumps into a block.
     */
    BumpInto(x: number, y: number): void {
        var block = this.Level!.GetBlock(x, y), i = 0;
        if (((Tile.Behaviors[block & 0xff]) & Tile.PickUpable) > 0) {
            Mario.MarioCharacter.GetCoin();
            Resources.PlaySound("coin");
            this.Level!.SetBlock(x, y, 0);
            this.AddSprite(new CoinAnim(null, x, y + 1));
        }

        for (i = 0; i < this.Sprites!.Objects.length; i++) {
            this.Sprites!.Objects[i].BumpCheck(x, y);
        }
    }

    /**
     * Checks if a state change is needed.
     */
    CheckForChange(context: GameStateContext): void {
        if (this.GotoLoseState) {
            context.ChangeState(new LoseState());
        }
        else {
            if (this.GotoMapState) {
                context.ChangeState(Mario.GlobalMapState);
            }
        }
    }
}
