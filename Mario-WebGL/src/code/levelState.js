/**
    State for actually playing a randomly generated level.
    Code by Rob Kleffner, 2011
*/

import { GameState } from "../Enjine/state.js";
import { LevelGenerator } from "./levelGenerator.js";
import { LevelRenderer } from "./levelRenderer.js";
import { DrawableManager } from "../Enjine/drawableManager.js";
import { Camera } from "../Enjine/camera.js";
import { SpriteCuts } from "./spriteCuts.js";
import { BackgroundGenerator } from "./backgroundGenerator.js";
import { BackgroundRenderer } from "./backgroundRenderer.js";
import { Sparkle } from "./sparkle.js";
import { BulletBill } from "./bulletBill.js";
import { Fireball } from "./fireball.js";
import { Mushroom } from "./mushroom.js";
import { FireFlower } from "./fireFlower.js";
import { CoinAnim } from "./coinAnim.js";
import { Particle } from "./particle.js";
import { Resources } from "../Enjine/resources.js";
import { Mario } from "./setup.js";
import { LoseState } from "./loseState.js";
import { LevelType, Tile } from "./level.js";
import * as PIXI from 'pixi.js';

export class LevelState extends GameState {
    constructor(difficulty, type) {
        super();
        this.LevelDifficulty = difficulty;
        this.LevelType = type;
        this.Level = null;
        this.Layer = null;
        this.BgLayer = [];

        this.Paused = false;
        this.Sprites = null;
        this.SpritesToAdd = null;
        this.SpritesToRemove = null;
        this.Camera = null;
        this.ShellsToCheck = null;
        this.FireballsToCheck = null;

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

    Enter() {
        var levelGenerator = new LevelGenerator(320, 15), i = 0, scrollSpeed = 0, w = 0, h = 0, bgLevelGenerator = null;
        this.Level = levelGenerator.CreateLevel(this.LevelType, this.LevelDifficulty);

        //play music here
        if (this.LevelType === LevelType.Overground) {
            Mario.PlayOvergroundMusic();
        } else if (this.LevelType === LevelType.Underground) {
            Mario.PlayUndergroundMusic();
        } else if (this.LevelType === LevelType.Castle) {
            Mario.PlayCastleMusic();
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
            bgLevelGenerator = new BackgroundGenerator((w / 32) | 0 + 1, (h / 32) | 0 + 1, i === 0, this.LevelType);
            this.BgLayer[i] = new BackgroundRenderer(bgLevelGenerator.CreateLevel(), 320, 240, scrollSpeed);
        }

        Mario.MarioCharacter.Initialize(this);

        this.Sprites.Add(Mario.MarioCharacter);
        this.StartTime = 1;
        this.TimeLeft = 200;

        this.GotoMapState = false;
        this.GotoLoseState = false;
    }

    Exit() {
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

    CheckShellCollide(shell) {
        this.ShellsToCheck.push(shell);
    }

    CheckFireballCollide(fireball) {
        this.FireballsToCheck.push(fireball);
    }

    Update(delta) {
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

        this.Camera.X = Mario.MarioCharacter.X - 160;
        if (this.Camera.X < 0) {
            this.Camera.X = 0;
        }
        if (this.Camera.X > this.Level.Width * 16 - 320) {
            this.Camera.X = this.Level.Width * 16 - 320;
        }

        this.FireballsOnScreen = 0;

        for (i = 0; i < this.Sprites.Objects.length; i++) {
            sprite = this.Sprites.Objects[i];
            if (sprite !== Mario.MarioCharacter) {
                xd = sprite.X - this.Camera.X;
                yd = sprite.Y - this.Camera.Y;
                if (xd < -64 || xd > 320 + 64 || yd < -64 || yd > 240 + 64) {
                    this.Sprites.RemoveAt(i);
                } else {
                    if (sprite instanceof Fireball) {
                        this.FireballsOnScreen++;
                    }
                }
            }
        }

        if (this.Paused) {
            for (i = 0; i < this.Sprites.Objects.length; i++) {
                if (this.Sprites.Objects[i] === Mario.MarioCharacter) {
                    this.Sprites.Objects[i].Update(delta);
                } else {
                    this.Sprites.Objects[i].UpdateNoMove(delta);
                }
            }
        } else {
            this.Layer.Update(delta);
            this.Level.Update();

            hasShotCannon = false;
            xCannon = 0;
            this.Tick++;

            for (x = ((this.Camera.X / 16) | 0) - 1; x <= (((this.Camera.X + this.Layer.Width) / 16) | 0) + 1; x++) {
                for (y = ((this.Camera.Y / 16) | 0) - 1; y <= (((this.Camera.Y + this.Layer.Height) / 16) | 0) + 1; y++) {
                    dir = 0;

                    if (x * 16 + 8 > Mario.MarioCharacter.X + 16) {
                        dir = -1;
                    }
                    if (x * 16 + 8 < Mario.MarioCharacter.X - 16) {
                        dir = 1;
                    }

                    st = this.Level.GetSpriteTemplate(x, y);

                    if (st !== null) {
                        if (st.LastVisibleTick !== this.Tick - 1) {
                            if (st.Sprite === null || !this.Sprites.Contains(st.Sprite)) {
                                st.Spawn(this, x, y, dir);
                            }
                        }

                        st.LastVisibleTick = this.Tick;
                    }

                    if (dir !== 0) {
                        b = this.Level.GetBlock(x, y);
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

            for (i = 0; i < this.Sprites.Objects.length; i++) {
                this.Sprites.Objects[i].Update(delta);
            }

            for (i = 0; i < this.Sprites.Objects.length; i++) {
                this.Sprites.Objects[i].CollideCheck();
            }

            for (i = 0; i < this.ShellsToCheck.length; i++) {
                for (j = 0; j < this.Sprites.Objects.length; j++) {
                    if (this.Sprites.Objects[j] !== this.ShellsToCheck[i] && !this.ShellsToCheck[i].Dead) {
                        if (this.Sprites.Objects[j].ShellCollideCheck(this.ShellsToCheck[i])) {
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
                for (j = 0; j < this.Sprites.Objects.length; j++) {
                    if (this.Sprites.Objects[j] !== this.FireballsToCheck[i] && !this.FireballsToCheck[i].Dead) {
                        if (this.Sprites.Objects[j].FireballCollideCheck(this.FireballsToCheck[i])) {
                            this.FireballsToCheck[i].Die();
                        }
                    }
                }
            }

            this.FireballsToCheck.length = 0;
        }

        this.Sprites.AddRange(this.SpritesToAdd);
        this.Sprites.RemoveList(this.SpritesToRemove);
        this.SpritesToAdd.length = 0;
        this.SpritesToRemove.length = 0;

        this.Camera.X = (Mario.MarioCharacter.XOld + (Mario.MarioCharacter.X - Mario.MarioCharacter.XOld) * delta) - 160;
        this.Camera.Y = (Mario.MarioCharacter.YOld + (Mario.MarioCharacter.Y - Mario.MarioCharacter.YOld) * delta) - 120;
    }

    Draw(container) {
        if (!container.sortableChildren) {
            container.sortableChildren = true;
        }

        var i = 0, time = 0, t = 0;

        if (this.Camera.X < 0) {
            this.Camera.X = 0;
        }
        if (this.Camera.Y < 0) {
            this.Camera.Y = 0;
        }
        if (this.Camera.X > this.Level.Width * 16 - 320) {
            this.Camera.X = this.Level.Width * 16 - 320;
        }
        if (this.Camera.Y > this.Level.Height * 16 - 240) {
            this.Camera.Y = this.Level.Height * 16 - 240;
        }

        for (i = 0; i < 2; i++) {
            this.BgLayer[i].Draw(container, this.Camera);
        }

        // Sprites Layer 0
        for (i = 0; i < this.Sprites.Objects.length; i++) {
            if (this.Sprites.Objects[i].Layer === 0) {
                this.Sprites.Objects[i].Draw(container, this.Camera);
            }
        }

        this.Layer.Draw(container, this.Camera);
        this.Layer.DrawExit0(container, this.Camera, Mario.MarioCharacter.WinTime === 0);

        // Sprites Layer 1
        for (i = 0; i < this.Sprites.Objects.length; i++) {
            if (this.Sprites.Objects[i].Layer === 1) {
                this.Sprites.Objects[i].Draw(container, this.Camera);
            }
        }

        this.Layer.DrawExit1(container, this.Camera);

        this.DrawStringShadow(container, "MARIO " + Mario.MarioCharacter.Lives, 0, 0);
        this.DrawStringShadow(container, "00000000", 0, 1);
        this.DrawStringShadow(container, "COIN", 14, 0);
        this.DrawStringShadow(container, " " + Mario.MarioCharacter.Coins, 14, 1);
        this.DrawStringShadow(container, "WORLD", 24, 0);
        this.DrawStringShadow(container, " " + Mario.MarioCharacter.LevelString, 24, 1);
        this.DrawStringShadow(container, "TIME", 34, 0);
        time = this.TimeLeft | 0;
        if (time < 0) {
            time = 0;
        }
        this.DrawStringShadow(container, " " + time, 34, 1);

        if (this.StartTime > 0) {
            t = this.StartTime + this.Delta - 2;
            t = t * t * 0.6;
            this.RenderBlackout(container, 160, 120, t | 0);
        }

        if (Mario.MarioCharacter.WinTime > 0) {
            Mario.StopMusic();
            t = Mario.MarioCharacter.WinTime + this.Delta;
            t = t * t * 0.2;

            if (t > 900) {
                Mario.GlobalMapState.LevelWon();
                this.GotoMapState = true;
            }

            this.RenderBlackout(container, ((Mario.MarioCharacter.XDeathPos - this.Camera.X) | 0), ((Mario.MarioCharacter.YDeathPos - this.Camera.Y) | 0), (320 - t) | 0);
        }

        if (Mario.MarioCharacter.DeathTime > 0) {
            Mario.StopMusic();
            t = Mario.MarioCharacter.DeathTime + this.Delta;
            t = t * t * 0.1;

            if (t > 900) {
                Mario.MarioCharacter.Lives--;
                this.GotoMapState = true;
                if (Mario.MarioCharacter.Lives <= 0) {
                    this.GotoLoseState = true;
                }
            }

            this.RenderBlackout(container, ((Mario.MarioCharacter.XDeathPos - this.Camera.X) | 0), ((Mario.MarioCharacter.YDeathPos - this.Camera.Y) | 0), (320 - t) | 0);
        }
    }

    DrawStringShadow(container, string, x, y) {
        this.Font.Strings[0] = { String: string, X: x * 8 + 4, Y: y * 8 + 4 };
        this.FontShadow.Strings[0] = { String: string, X: x * 8 + 5, Y: y * 8 + 5 };
        this.FontShadow.Draw(container, this.Camera);
        this.Font.Draw(container, this.Camera);
    }

    RenderBlackout(container, x, y, radius) {
        if (radius > 320) {
            if (this.blackoutGraphics) this.blackoutGraphics.clear();
            return;
        }

        if (!this.blackoutGraphics) {
            this.blackoutGraphics = new PIXI.Graphics();
        }

        if (this.blackoutGraphics.parent !== container) {
            container.addChild(this.blackoutGraphics);
        }

        const g = this.blackoutGraphics;
        g.clear();
        g.rect(0, 0, 320, 240);
        g.fill(0x000000);

        // Create hole
        const points = [];
        for (let i = 0; i < 16; i++) {
            points.push({ x: x + (Math.cos(i * Math.PI / 15) * radius) | 0, y: y + (Math.sin(i * Math.PI / 15) * radius) | 0 });
        }
        g.poly(points);
        g.cut();
    }

    AddSprite(sprite) {
        this.Sprites.Add(sprite);
    }

    RemoveSprite(sprite) {
        this.Sprites.Remove(sprite);
    }

    Bump(x, y, canBreakBricks) {
        var block = this.Level.GetBlock(x, y), xx = 0, yy = 0;

        if ((Tile.Behaviors[block & 0xff] & Tile.Bumpable) > 0) {
            this.BumpInto(x, y - 1);
            this.Level.SetBlock(x, y, 4);
            this.Level.SetBlockData(x, y, 4);

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
                this.Level.SetBlock(x, y, 0);
                for (xx = 0; xx < 2; xx++) {
                    for (yy = 0; yy < 2; yy++) {
                        this.AddSprite(new Particle(this, x * 16 + xx * 8 + 4, y * 16 + yy * 8 + 4, (xx * 2 - 1) * 4, (yy * 2 - 1) * 4 - 8));
                    }
                }
            }
        }
    }

    BumpInto(x, y) {
        var block = this.Level.GetBlock(x, y), i = 0;
        if (((Tile.Behaviors[block & 0xff]) & Tile.PickUpable) > 0) {
            Mario.MarioCharacter.GetCoin();
            Resources.PlaySound("coin");
            this.Level.SetBlock(x, y, 0);
            this.AddSprite(new CoinAnim(x, y + 1));
        }

        for (i = 0; i < this.Sprites.Objects.length; i++) {
            this.Sprites.Objects[i].BumpCheck(x, y);
        }
    }

    CheckForChange(context) {
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
