/**
    State for moving between different playable levels.
    Code by Rob Kleffner, 2011
*/

import { GameState } from "../Enjine/state.js";
import { Camera } from "../Enjine/camera.js";
import { AnimatedSprite } from "../Enjine/animatedSprite.js";
import { Resources } from "../Enjine/resources.js";
import { SpriteCuts } from "./spriteCuts.js";
import { ImprovedNoise } from "./improvedNoise.js";
import { KeyboardInput, Keys } from "../Enjine/keyboardInput.js";
import { Mario } from "./setup.js";
import { WinState } from "./winState.js";
import { LevelState } from "./levelState.js";
import { LevelType } from "./level.js";
import * as PIXI from 'pixi.js';

export const MapTile = {
    Grass: 0,
    Water: 1,
    Level: 2,
    Road: 3,
    Decoration: 4
};

export class MapState extends GameState {
    constructor() {
        super();
        this.camera = new Camera();

        this.Level = [];
        this.Data = [];
        this.XMario = 0; this.YMario = 0;
        this.XMarioA = 0; this.YMarioA = 0;
        this.MoveTime = 0;
        this.LevelId = 0;
        this.Farthest = 0;
        this.XFarthestCap = 0;
        this.YFarthestCap = 0;
        // Legacy Canvas removed: this.MapImage, this.MapContext
        this.CanEnterLevel = false;
        this.EnterLevel = false;
        this.LevelDifficulty = 0;
        this.LevelType = 0;

        this.WorldNumber = -1;
        this.NextWorld();
    }

    Enter() {
        this.WaterSprite = new AnimatedSprite();
        this.WaterSprite.Image = Resources.Images["worldMap"];
        this.WaterSprite.SetColumnCount(16);
        this.WaterSprite.SetRowCount(16);
        this.WaterSprite.AddNewSequence("loop", 14, 0, 14, 3);
        this.WaterSprite.FramesPerSecond = 1 / 3;
        this.WaterSprite.PlaySequence("loop", true);
        this.WaterSprite.X = 0;
        this.WaterSprite.Y = 0;

        this.DecoSprite = new AnimatedSprite();
        this.DecoSprite.Image = Resources.Images["worldMap"];
        this.DecoSprite.SetColumnCount(16);
        this.DecoSprite.SetRowCount(16);
        this.DecoSprite.AddNewSequence("world0", 10, 0, 10, 3);
        this.DecoSprite.AddNewSequence("world1", 11, 0, 11, 3);
        this.DecoSprite.AddNewSequence("world2", 12, 0, 12, 3);
        this.DecoSprite.AddNewSequence("world3", 13, 0, 13, 3);
        this.DecoSprite.FramesPerSecond = 1 / 3;
        this.DecoSprite.PlaySequence("world0", true);
        this.DecoSprite.X = 0;
        this.DecoSprite.Y = 0;

        this.HelpSprite = new AnimatedSprite();
        this.HelpSprite.Image = Resources.Images["worldMap"];
        this.HelpSprite.SetColumnCount(16);
        this.HelpSprite.SetRowCount(16);
        this.HelpSprite.AddNewSequence("help", 7, 3, 7, 5);
        this.HelpSprite.FramesPerSecond = 1 / 2;
        this.HelpSprite.PlaySequence("help", true);
        this.HelpSprite.X = 0;
        this.HelpSprite.Y = 0;

        this.SmallMario = new AnimatedSprite();
        this.SmallMario.Image = Resources.Images["worldMap"];
        this.SmallMario.SetColumnCount(16);
        this.SmallMario.SetRowCount(16);
        this.SmallMario.AddNewSequence("small", 1, 0, 1, 1);
        this.SmallMario.FramesPerSecond = 1 / 3;
        this.SmallMario.PlaySequence("small", true);
        this.SmallMario.X = 0;
        this.SmallMario.Y = 0;

        this.LargeMario = new AnimatedSprite();
        this.LargeMario.Image = Resources.Images["worldMap"];
        this.LargeMario.SetColumnCount(16);
        this.LargeMario.SetRowCount(8);
        this.LargeMario.AddNewSequence("large", 0, 2, 0, 3);
        this.LargeMario.AddNewSequence("fire", 0, 4, 0, 5);
        this.LargeMario.FramesPerSecond = 1 / 3;
        this.LargeMario.PlaySequence("large", true);
        this.LargeMario.X = 0;
        this.LargeMario.Y = 0;

        this.FontShadow = SpriteCuts.CreateBlackFont();
        this.Font = SpriteCuts.CreateWhiteFont();

        //get the correct world decoration
        this.DecoSprite.PlaySequence("world" + (this.WorldNumber % 4), true);

        if (!Mario.MarioCharacter.Fire) {
            this.LargeMario.PlaySequence("large", true);
        } else {
            this.LargeMario.PlaySequence("fire", true);
        }

        this.EnterLevel = false;
        this.LevelDifficulty = 0;
        this.LevelType = 0;

        Mario.PlayMapMusic();
    }

    Exit() {
        Mario.StopMusic();

        delete this.WaterSprite;
        delete this.DecoSprite;
        delete this.HelpSprite;
        delete this.SmallMario;
        delete this.LargeMario;
        delete this.FontShadow;
        delete this.Font;
    }

    NextWorld() {
        var generated = false;
        this.WorldNumber++;

        //The player has won, wait for CheckForChange to get called
        if (this.WorldNumber === 8) {
            return;
        }

        this.MoveTime = 0;
        this.LevelId = 0;
        this.Farthest = 0;
        this.XFarthestCap = 0;
        this.YFarthestCap = 0;

        while (!generated) {
            generated = this.GenerateLevel();
        }
        this.RenderStatic();
    }

    GenerateLevel() {
        var x = 0, y = 0, t0 = 0, t1 = 0, td = 0, t = 0;

        var n0 = new ImprovedNoise((Math.random() * 9223372036854775807) | 0);
        var n1 = new ImprovedNoise((Math.random() * 9223372036854775807) | 0);
        var dec = new ImprovedNoise((Math.random() * 9223372036854775807) | 0);

        var width = 320 / 16 + 1;
        var height = 240 / 16 + 1;
        this.Level = [];
        this.Data = [];

        var xo0 = Math.random() * 512;
        var yo0 = Math.random() * 512;
        var xo1 = Math.random() * 512;
        var yo1 = Math.random() * 512;

        for (x = 0; x < width; x++) {
            this.Level[x] = [];
            this.Data[x] = [];

            for (y = 0; y < height; y++) {

                t0 = n0.PerlinNoise(x * 10 + xo0, y * 10 + yo0);
                t1 = n1.PerlinNoise(x * 10 + xo1, y * 10 + yo1);
                td = t0 - t1;
                t = td * 2;

                this.Level[x][y] = t > 0 ? MapTile.Water : MapTile.Grass;
            }
        }

        var lowestX = 9999, lowestY = 9999, i = 0;
        t = 0;

        for (i = 0; i < 100 && t < 12; i++) {
            x = ((Math.random() * (((width - 1) / 3) | 0)) | 0) * 3 + 2;
            y = ((Math.random() * (((height - 1) / 3) | 0)) | 0) * 3 + 1;
            if (this.Level[x][y] === MapTile.Grass) {
                if (x < lowestX) {
                    lowestX = x;
                    lowestY = y;
                }
                this.Level[x][y] = MapTile.Level;
                this.Data[x][y] = -1;
                t++;
            }
        }

        this.Data[lowestX][lowestY] = -2;

        var connection = true;
        while (connection) { connection = this.FindConnection(width, height); }
        this.FindCaps(width, height);

        if (this.XFarthestCap === 0) {
            return false;
        }

        this.Data[this.XFarthestCap][this.YFarthestCap] = -2;
        this.Data[(this.XMario / 16) | 0][(this.YMario / 16) | 0] = -11;

        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                if (this.Level[x][y] === MapTile.Grass && (x !== this.XFarthestCap || y !== this.YFarthestCap - 1)) {
                    t0 = dec.PerlinNoise(x * 10 + xo0, y * 10 + yo0);
                    if (t0 > 0) {
                        this.Level[x][y] = MapTile.Decoration;
                    }
                }
            }
        }

        return true;
    }

    FindConnection(width, height) {
        var x = 0, y = 0;
        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                if (this.Level[x][y] === MapTile.Level && this.Data[x][y] === -1) {
                    this.Connect(x, y, width, height);
                    return true;
                }
            }
        }
        return false;
    }

    Connect(xSource, ySource, width, height) {
        var maxDistance = 10000, xTarget = 0, yTarget = 0, x = 0, y = 0,
            xd = 0, yd = 0, d = 0;

        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                if (this.Level[x][y] === MapTile.Level && this.Data[x][y] === -2) {
                    xd = Math.abs(xSource - x) | 0;
                    yd = Math.abs(ySource - y) | 0;
                    d = xd * xd + yd * yd;
                    if (d < maxDistance) {
                        xTarget = x;
                        yTarget = y;
                        maxDistance = d;
                    }
                }
            }
        }

        this.DrawRoad(xSource, ySource, xTarget, yTarget);
        this.Level[xSource][ySource] = MapTile.Level;
        this.Data[xSource][ySource] = -2;
        return;
    }

    DrawRoad(x0, y0, x1, y1) {
        var xFirst = false;
        if (Math.random() > 0.5) {
            xFirst = true;
        }

        if (xFirst) {
            while (x0 > x1) {
                this.Data[x0][y0] = 0;
                this.Level[x0--][y0] = MapTile.Road;
            }
            while (x0 < x1) {
                this.Data[x0][y0] = 0;
                this.Level[x0++][y0] = MapTile.Road;
            }
        }

        while (y0 > y1) {
            this.Data[x0][y0] = 0;
            this.Level[x0][y0--] = MapTile.Road;
        }
        while (y0 < y1) {
            this.Data[x0][y0] = 0;
            this.Level[x0][y0++] = MapTile.Road;
        }

        if (!xFirst) {
            while (x0 > x1) {
                this.Data[x0][y0] = 0;
                this.Level[x0--][y0] = MapTile.Road;
            }
            while (x0 < x1) {
                this.Data[x0][y0] = 0;
                this.Level[x0++][y0] = MapTile.Road;
            }
        }
    }

    FindCaps(width, height) {
        var x = 0, y = 0, xCap = -1, yCap = -1, roads = 0, xx = 0, yy = 0;

        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                if (this.Level[x][y] === MapTile.Level) {
                    roads = 0;

                    for (xx = x - 1; xx <= x + 1; xx++) {
                        for (yy = y - 1; yy <= y + 1; yy++) {
                            if (this.Level[xx][yy] === MapTile.Road) {
                                roads++;
                            }
                        }
                    }

                    if (roads === 1) {
                        if (xCap === -1) {
                            xCap = x;
                            yCap = y;
                        }
                        this.Data[x][y] = 0;
                    } else {
                        this.Data[x][y] = 1;
                    }
                }
            }
        }

        this.XMario = xCap * 16;
        this.YMario = yCap * 16;

        this.Travel(xCap, yCap, -1, 0);
    }

    Travel(x, y, dir, depth) {
        if (this.Level[x][y] !== MapTile.Road && this.Level[x][y] !== MapTile.Level) {
            return;
        }

        if (this.Level[x][y] === MapTile.Road) {
            if (this.Data[x][y] === 1) {
                return;
            } else {
                this.Data[x][y] = 1;
            }
        }

        if (this.Level[x][y] === MapTile.Level) {
            if (this.Data[x][y] > 0) {
                if (this.LevelId !== 0 && ((Math.random() * 4) | 0) === 0) {
                    this.Data[x][y] = -3;
                } else {
                    this.Data[x][y] = ++this.LevelId;
                }
            } else if (depth > 0) {
                this.Data[x][y] = -1;
                if (depth > this.Farthest) {
                    this.Farthest = depth;
                    this.XFarthestCap = x;
                    this.YFarthestCap = y;
                }
            }
        }

        if (dir !== 2) {
            this.Travel(x - 1, y, 0, depth++);
        }
        if (dir !== 3) {
            this.Travel(x, y - 1, 1, depth++);
        }
        if (dir !== 0) {
            this.Travel(x + 1, y, 2, depth++);
        }
        if (dir !== 1) {
            this.Travel(x, y + 1, 3, depth++);
        }
    }

    RenderStatic() {
        var x = 0, y = 0, p0 = 0, p1 = 0, p2 = 0, p3 = 0, s = 0, xx = 0, yy = 0, type = 0;

        // Use a container for the map
        if (!this.mapContainer) {
            this.mapContainer = new PIXI.Container();
            // Cache base texture
            this.mapBaseTexture = PIXI.Texture.from(Resources.Images["worldMap"]);
        }

        this.mapContainer.removeChildren();

        // Helper to add tile sprite
        const addTile = (sx, sy, dx, dy) => {
            const tex = new PIXI.Texture({
                source: this.mapBaseTexture.source,
                frame: new PIXI.Rectangle(sx * 16, sy * 16, 16, 16)
            });
            const sprite = new PIXI.Sprite(tex);
            sprite.x = dx * 16;
            sprite.y = dy * 16;
            this.mapContainer.addChild(sprite);
        };

        //320 / 16 = 20
        for (x = 0; x < 20; x++) {
            //240 / 16 = 15
            for (y = 0; y < 15; y++) {
                // Background
                addTile(((this.WorldNumber / 4) | 0), 0, x, y);

                if (this.Level[x][y] === MapTile.Level) {
                    type = this.Data[x][y];
                    if (type === 0) {
                        addTile(0, 7, x, y);
                    } else if (type === -1) {
                        addTile(3, 8, x, y);
                    } else if (type === -3) {
                        addTile(0, 8, x, y);
                    } else if (type === -10) {
                        addTile(1, 8, x, y);
                    } else if (type === -11) {
                        addTile(1, 7, x, y);
                    } else if (type === -2) {
                        addTile(2, 7, x, y - 1);
                        addTile(2, 8, x, y);
                    } else {
                        addTile(type - 1, 6, x, y);
                    }
                } else if (this.Level[x][y] === MapTile.Road) {
                    p0 = this.IsRoad(x - 1, y) ? 1 : 0;
                    p1 = this.IsRoad(x, y - 1) ? 1 : 0;
                    p2 = this.IsRoad(x + 1, y) ? 1 : 0;
                    p3 = this.IsRoad(x, y + 1) ? 1 : 0;
                    s = p0 + (p1 * 2) + (p2 * 4) + (p3 * 8);
                    addTile(s, 2, x, y);
                } else if (this.Level[x][y] === MapTile.Water) {
                    // Water uses sub-tiles (8x8 rendered into 16x16 slot)
                    for (xx = 0; xx < 2; xx++) {
                        for (yy = 0; yy < 2; yy++) {
                            p0 = this.IsWater(x * 2 + (xx - 1), y * 2 + (yy - 1)) ? 0 : 1;
                            p1 = this.IsWater(x * 2 + xx, y * 2 + (yy - 1)) ? 0 : 1;
                            p2 = this.IsWater(x * 2 + (xx - 1), y * 2 + yy) ? 0 : 1;
                            p3 = this.IsWater(x * 2 + xx, y * 2 + yy) ? 0 : 1;
                            s = p0 + (p1 * 2) + (p2 * 4) + (p3 * 8) - 1;
                            if (s >= 0 && s <= 14) {
                                // Manual texture creation for 8x8?
                                // addTile expects 16x16 logic.
                                // We need custom 8x8 add.
                                const frameX = s * 16;
                                const frameY = (4 + ((xx + yy) & 1)) * 16;
                                const tex = new PIXI.Texture({
                                    source: this.mapBaseTexture.source,
                                    frame: new PIXI.Rectangle(frameX, frameY, 16, 16) // Source is 16x16? Code says 16, 16.
                                });
                                // Wait, original code: drawImage(image, s*16, ..., 16, 16, x*16 + xx*8, ...)
                                // Source is 16x16. Dest is 8x8?
                                // Or renders 16x16 scaled to 16x16 but pos is offset?
                                // "x * 16 + xx * 8" -> steps of 8.
                                // "16, 16" -> dest width height.
                                // So it draws a 16x16 tile at an 8x8 offset, possibly overlapping?
                                // Yes.
                                const sprite = new PIXI.Sprite(tex);
                                sprite.x = x * 16 + xx * 8;
                                sprite.y = y * 16 + yy * 8;
                                sprite.width = 16; sprite.height = 16; // Explicit size
                                this.mapContainer.addChild(sprite);
                            }
                        }
                    }
                }
            }
        }
    }

    IsRoad(x, y) {
        if (x < 0) {
            x = 0;
        }
        if (y < 0) {
            y = 0;
        }
        if (this.Level[x][y] === MapTile.Road) {
            return true;
        }
        if (this.Level[x][y] === MapTile.Level) {
            return true;
        }
        return false;
    }

    IsWater(x, y) {
        var xx = 0, yy = 0;
        if (x < 0) {
            x = 0;
        }
        if (y < 0) {
            y = 0;
        }

        for (xx = 0; xx < 2; xx++) {
            for (yy = 0; yy < 2; yy++) {
                if (this.Level[((x + xx) / 2) | 0][((y + yy) / 2) | 0] !== MapTile.Water) {
                    return false;
                }
            }
        }

        return true;
    }

    Update(delta) {
        var x = 0, y = 0, difficulty = 0, type = 0;

        if (this.WorldNumber === 8) {
            return;
        }

        this.XMario += this.XMarioA;
        this.YMario += this.YMarioA;

        x = (this.XMario / 16) | 0;
        y = (this.YMario / 16) | 0;

        if (this.Level[x][y] === MapTile.Road) {
            this.Data[x][y] = 0;
        }

        if (this.MoveTime > 0) {
            this.MoveTime--;
        } else {
            this.XMarioA = 0;
            this.YMarioA = 0;

            if (this.CanEnterLevel && KeyboardInput.IsKeyDown(Keys.S)) {
                if (this.Level[x][y] === MapTile.Level && this.Data[x][y] !== -11) {
                    if (this.Level[x][y] === MapTile.Level && this.Data[x][y] !== 0 && this.Data[x][y] > -10) {
                        difficulty = this.WorldNumber + 1;
                        Mario.MarioCharacter.LevelString = difficulty + "-";
                        type = LevelType.Overground;

                        if (this.Data[x][y] > 1 && ((Math.random() * 3) | 0) === 0) {
                            type = LevelType.Underground;
                        }

                        if (this.Data[x][y] < 0) {
                            if (this.Data[x][y] === -2) {
                                Mario.MarioCharacter.LevelString += "X";
                                difficulty += 2;
                            } else if (this.Data[x][y] === -1) {
                                Mario.MarioCharacter.LevelString += "?";
                            } else {
                                Mario.MarioCharacter.LevelString += "#";
                                difficulty += 1;
                            }

                            type = LevelType.Castle;
                        } else {
                            Mario.MarioCharacter.LevelString += this.Data[x][y];
                        }

                        //TODO: stop music here
                        this.EnterLevel = true;
                        this.LevelDifficulty = difficulty;
                        this.LevelType = type;
                    }
                }
            }

            this.CanEnterLevel = !KeyboardInput.IsKeyDown(Keys.S);

            if (KeyboardInput.IsKeyDown(Keys.Left)) {
                this.TryWalking(-1, 0);
            }
            if (KeyboardInput.IsKeyDown(Keys.Right)) {
                this.TryWalking(1, 0);
            }
            if (KeyboardInput.IsKeyDown(Keys.Up)) {
                this.TryWalking(0, -1);
            }
            if (KeyboardInput.IsKeyDown(Keys.Down)) {
                this.TryWalking(0, 1);
            }
        }

        this.WaterSprite.Update(delta);
        this.DecoSprite.Update(delta);
        this.HelpSprite.Update(delta);
        if (!Mario.MarioCharacter.Large) {
            this.SmallMario.X = this.XMario + (this.XMarioA * delta) | 0;
            this.SmallMario.Y = this.YMario + ((this.YMarioA * delta) | 0) - 6;
            this.SmallMario.Update(delta);
        } else {
            this.LargeMario.X = this.XMario + (this.XMarioA * delta) | 0;
            this.LargeMario.Y = this.YMario + ((this.YMarioA * delta) | 0) - 22;
            this.LargeMario.Update(delta);
        }
    }

    TryWalking(xd, yd) {
        var x = (this.XMario / 16) | 0, y = (this.YMario / 16) | 0, xt = x + xd, yt = y + yd;

        if (this.Level[xt][yt] === MapTile.Road || this.Level[xt][yt] === MapTile.Level) {
            if (this.Level[xt][yt] === MapTile.Road) {
                if ((this.Data[xt][yt] !== 0) && (this.Data[x][y] !== 0 && this.Data[x][y] > -10)) {
                    return;
                }
            }

            this.XMarioA = xd * 8;
            this.YMarioA = yd * 8;
            this.MoveTime = this.CalcDistance(x, y, xd, yd) * 2 + 1;
        }
    }

    CalcDistance(x, y, xa, ya) {
        var distance = 0;
        while (true) {
            x += xa;
            y += ya;
            if (this.Level[x][y] !== MapTile.Road) {
                return distance;
            }
            if (this.Level[x - ya][y + xa] === MapTile.Road) {
                return distance;
            }
            if (this.Level[x + ya][y - xa] === MapTile.Road) {
                return distance;
            }
            distance++;
        }
    }

    Draw(container) {
        var x = 0, y = 0;

        if (this.WorldNumber === 8) {
            return;
        }

        // Add map container
        if (this.mapContainer && this.mapContainer.parent !== container) {
            container.addChild(this.mapContainer);
        }

        // Draw map sprites
        for (y = 0; y <= 15; y++) {
            for (x = 20; x >= 0; x--) {
                if (this.Level[x][y] === MapTile.Water) {
                    if (this.IsWater(x * 2 - 1, y * 2 - 1)) {
                        this.WaterSprite.X = x * 16 - 8;
                        this.WaterSprite.Y = y * 16 - 8;
                        this.WaterSprite.Draw(container, this.camera);
                    }
                } else if (this.Level[x][y] === MapTile.Decoration) {
                    this.DecoSprite.X = x * 16;
                    this.DecoSprite.Y = y * 16;
                    this.DecoSprite.Draw(container, this.camera);
                } else if (this.Level[x][y] === MapTile.Level && this.Data[x][y] === -2) {
                    this.HelpSprite.X = x * 16 + 16;
                    this.HelpSprite.Y = y * 16 - 16;
                    this.HelpSprite.Draw(container, this.camera);
                }
            }
        }

        if (!Mario.MarioCharacter.Large) {
            this.SmallMario.Draw(container, this.camera);
        } else {
            this.LargeMario.Draw(container, this.camera);
        }

        this.Font.Strings[0] = { String: "MARIO " + Mario.MarioCharacter.Lives, X: 4, Y: 4 };
        this.FontShadow.Strings[0] = { String: "MARIO " + Mario.MarioCharacter.Lives, X: 5, Y: 5 };
        this.Font.Strings[1] = { String: "WORLD " + (this.WorldNumber + 1), X: 256, Y: 4 };
        this.FontShadow.Strings[1] = { String: "WORLD " + (this.WorldNumber + 1), X: 257, Y: 5 };

        this.FontShadow.Draw(container, this.camera);
        this.Font.Draw(container, this.camera);
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

        const points = [];
        for (let i = 0; i < 16; i++) {
            points.push({ x: x + (Math.cos(i * Math.PI / 15) * radius) | 0, y: y + (Math.sin(i * Math.PI / 15) * radius) | 0 });
        }
        g.poly(points);
        g.cut();
    }

    LevelWon() {
        var x = this.XMario / 16, y = this.YMario / 16;
        if (this.Data[x][y] === -2) {
            this.NextWorld();
            return;
        }
        if (this.Data[x][y] !== -3) {
            this.Data[x][y] = 0;
        } else {
            this.Data[x][y] = -10;
        }
        this.RenderStatic();
    }

    GetX() {
        return 160;
    }

    GetY() {
        return 120;
    }

    CheckForChange(context) {
        if (this.WorldNumber === 8) {
            context.ChangeState(new WinState());
        }
        if (this.EnterLevel) {
            context.ChangeState(new LevelState(this.LevelDifficulty, this.LevelType));
        }
    }
}
