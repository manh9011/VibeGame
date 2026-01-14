import { GameState, GameStateContext } from "../Enjine/state";
import { SpriteFont } from "../Enjine/spriteFont";
import { Camera } from "../Enjine/camera";
import { AnimatedSprite } from "../Enjine/animatedSprite";
import { Resources } from "../Enjine/resources";
import { SpriteCuts } from "./spriteCuts";
import { ImprovedNoise } from "./improvedNoise";
import { KeyboardInput, Keys } from "../Enjine/keyboardInput";
import { Mario } from "./setup";
import { WinState } from "./winState";
import { LevelState } from "./levelState";
import { LevelType } from "./level";
import { Renderer } from "../Enjine/renderer";

/**
 * Enum for map tile types.
 */
export const MapTile = {
    Grass: 0,
    Water: 1,
    Level: 2,
    Road: 3,
    Decoration: 4
};

/**
 * Sate for the world map where the player selects a level.
 */
export class MapState extends GameState {
    /** Camera for the map view. */
    camera: Camera;
    /** 2D array of map tile IDs. */
    Level: number[][];
    /** 2D array of map data (state/type). */
    Data: number[][];
    /** Mario's X coordinate on the map. */
    XMario: number;
    /** Mario's Y coordinate on the map. */
    YMario: number;
    /** Mario's X acceleration/velocity. */
    XMarioA: number;
    /** Mario's Y acceleration/velocity. */
    YMarioA: number;
    /** Timer for movement animation. */
    MoveTime: number;
    /** Counter for assigning level IDs. */
    LevelId: number;
    /** Depth of the farthest level reached in generation. */
    Farthest: number;
    /** X coordinate of the farthest level. */
    XFarthestCap: number;
    /** Y coordinate of the farthest level. */
    YFarthestCap: number;
    /** Off-screen canvas for the generated map. */
    MapImage: HTMLCanvasElement;
    /** Context for the map canvas. */
    MapContext: CanvasRenderingContext2D;
    /** Whether the player can currently enter a level. */
    CanEnterLevel: boolean;
    /** Flag to trigger entering a level. */
    EnterLevel: boolean;
    /** Difficuly of the selected level. */
    LevelDifficulty: number;
    /** Type of the selected level. */
    LevelType: number;
    /** Current world number (0-8). */
    WorldNumber: number;

    /** Sprite for animated water. */
    WaterSprite: AnimatedSprite | null = null;
    /** Sprite for world decorations. */
    DecoSprite: AnimatedSprite | null = null;
    /** Sprite for the "Help" indicator. */
    HelpSprite: AnimatedSprite | null = null;
    /** Sprite for Small Mario on the map. */
    SmallMario: AnimatedSprite | null = null;
    /** Sprite for Large Mario on the map. */
    LargeMario: AnimatedSprite | null = null;
    /** Font for shadow text. */
    FontShadow: SpriteFont | null = null;
    /** Font for text. */
    Font: SpriteFont | null = null;

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
        this.MapImage = document.createElement("canvas");
        this.MapImage.width = 320;
        this.MapImage.height = 240;
        this.MapContext = this.MapImage.getContext("2d")!;
        this.CanEnterLevel = false;
        this.EnterLevel = false;
        this.LevelDifficulty = 0;
        this.LevelType = 0;

        this.WorldNumber = -1;
        this.NextWorld();
    }

    /**
     * Initializes the map state assets.
     */
    Enter(): void {
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

        Mario.PlayMapMusic?.();
    }

    Exit(): void {
        Mario.StopMusic?.();

        delete this.WaterSprite;
        delete this.DecoSprite;
        delete this.HelpSprite;
        delete this.SmallMario;
        delete this.LargeMario;
        delete this.FontShadow;
        delete this.Font;
    }

    /**
     * Advances to the next world and generates the level map.
     */
    NextWorld(): void {
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

    /**
     * Generates a procedural map layout.
     */
    GenerateLevel(): boolean {
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

    /**
     * Finds a connection between generated map segments.
     */
    FindConnection(width: number, height: number): boolean {
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

    /**
     * Connects two points on the map with a road.
     */
    Connect(xSource: number, ySource: number, width: number, height: number): void {
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

    /**
     * Draws the road path between two points.
     */
    DrawRoad(x0: number, y0: number, x1: number, y1: number): void {
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

    /**
     * Finds dead ends (caps) to place levels.
     */
    FindCaps(width: number, height: number): void {
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

    /**
     * Recursively traverses roads to assign data.
     */
    Travel(x: number, y: number, dir: number, depth: number): void {
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
            this.Travel(x - 1, y, 0, depth + 1);
        }
        if (dir !== 3) {
            this.Travel(x, y - 1, 1, depth + 1);
        }
        if (dir !== 0) {
            this.Travel(x + 1, y, 2, depth + 1);
        }
        if (dir !== 1) {
            this.Travel(x, y + 1, 3, depth + 1);
        }
    }

    RenderStatic(): void {
        var x = 0, y = 0, p0 = 0, p1 = 0, p2 = 0, p3 = 0, s = 0, xx = 0, yy = 0,
            image = Resources.Images["worldMap"], type = 0;

        //320 / 16 = 20
        for (x = 0; x < 20; x++) {
            //240 / 16 = 15
            for (y = 0; y < 15; y++) {
                this.MapContext.drawImage(image, ((this.WorldNumber / 4) | 0) * 16, 0, 16, 16, x * 16, y * 16, 16, 16);

                if (this.Level[x][y] === MapTile.Level) {
                    type = this.Data[x][y];
                    if (type === 0) {
                        this.MapContext.drawImage(image, 0, 7 * 16, 16, 16, x * 16, y * 16, 16, 16);
                    } else if (type === -1) {
                        this.MapContext.drawImage(image, 3 * 16, 8 * 16, 16, 16, x * 16, y * 16, 16, 16);
                    } else if (type === -3) {
                        this.MapContext.drawImage(image, 0, 8 * 16, 16, 16, x * 16, y * 16, 16, 16);
                    } else if (type === -10) {
                        this.MapContext.drawImage(image, 16, 8 * 16, 16, 16, x * 16, y * 16, 16, 16);
                    } else if (type === -11) {
                        this.MapContext.drawImage(image, 16, 7 * 16, 16, 16, x * 16, y * 16, 16, 16);
                    } else if (type === -2) {
                        this.MapContext.drawImage(image, 2 * 16, 7 * 16, 16, 16, x * 16, (y - 1) * 16, 16, 16);
                        this.MapContext.drawImage(image, 2 * 16, 8 * 16, 16, 16, x * 16, y * 16, 16, 16);
                    } else {
                        this.MapContext.drawImage(image, (type - 1) * 16, 6 * 16, 16, 16, x * 16, y * 16, 16, 16);
                    }
                } else if (this.Level[x][y] === MapTile.Road) {
                    p0 = this.IsRoad(x - 1, y) ? 1 : 0;
                    p1 = this.IsRoad(x, y - 1) ? 1 : 0;
                    p2 = this.IsRoad(x + 1, y) ? 1 : 0;
                    p3 = this.IsRoad(x, y + 1) ? 1 : 0;
                    s = p0 + (p1 * 2) + (p2 * 4) + (p3 * 8);
                    this.MapContext.drawImage(image, s * 16, 32, 16, 16, x * 16, y * 16, 16, 16);
                } else if (this.Level[x][y] === MapTile.Water) {
                    for (xx = 0; xx < 2; xx++) {
                        for (yy = 0; yy < 2; yy++) {
                            p0 = this.IsWater(x * 2 + (xx - 1), y * 2 + (yy - 1)) ? 0 : 1;
                            p1 = this.IsWater(x * 2 + xx, y * 2 + (yy - 1)) ? 0 : 1;
                            p2 = this.IsWater(x * 2 + (xx - 1), y * 2 + yy) ? 0 : 1;
                            p3 = this.IsWater(x * 2 + xx, y * 2 + yy) ? 0 : 1;
                            s = p0 + (p1 * 2) + (p2 * 4) + (p3 * 8) - 1;
                            if (s >= 0 && s <= 14) {
                                this.MapContext.drawImage(image, s * 16, (4 + ((xx + yy) & 1)) * 16, 16, 16, x * 16 + xx * 8, y * 16 + yy * 8, 16, 16);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Checks if a coordinate is a road or level.
     */
    IsRoad(x: number, y: number): boolean {
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

    /**
     * Checks if a coordinate is water.
     */
    IsWater(x: number, y: number): boolean {
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

    /**
     * Updates the map state (mario movement, camera, animations).
     */
    Update(delta: number): void {
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

        this.WaterSprite?.Update(delta);
        this.DecoSprite?.Update(delta);
        this.HelpSprite?.Update(delta);
        if (!Mario.MarioCharacter.Large) {
            this.SmallMario!.X = this.XMario + (this.XMarioA * delta) | 0;
            this.SmallMario!.Y = this.YMario + ((this.YMarioA * delta) | 0) - 6;
            this.SmallMario!.Update(delta);
        } else {
            this.LargeMario!.X = this.XMario + (this.XMarioA * delta) | 0;
            this.LargeMario!.Y = this.YMario + ((this.YMarioA * delta) | 0) - 22;
            this.LargeMario!.Update(delta);
        }
    }

    /**
     * Attempts to move Mario on the map.
     */
    TryWalking(xd: number, yd: number): void {
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

    /**
     * Calculates the distance to the next intersection or turn.
     */
    CalcDistance(x: number, y: number, xa: number, ya: number): number {
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

    /**
     * Draws the world map.
     */
    Draw(renderer: Renderer): void {
        var x = 0, y = 0;

        if (this.WorldNumber === 8) {
            return;
        }

        renderer.DrawImage(this.MapImage, 0, 0);

        for (y = 0; y <= 15; y++) {
            for (x = 20; x >= 0; x--) {
                if (this.Level[x][y] === MapTile.Water) {
                    if (this.IsWater(x * 2 - 1, y * 2 - 1)) {
                        this.WaterSprite!.X = x * 16 - 8;
                        this.WaterSprite!.Y = y * 16 - 8;
                        this.WaterSprite!.Draw(renderer, this.camera);
                    }
                } else if (this.Level[x][y] === MapTile.Decoration) {
                    this.DecoSprite!.X = x * 16;
                    this.DecoSprite!.Y = y * 16;
                    this.DecoSprite!.Draw(renderer, this.camera);
                } else if (this.Level[x][y] === MapTile.Level && this.Data[x][y] === -2) {
                    this.HelpSprite!.X = x * 16 + 16;
                    this.HelpSprite!.Y = y * 16 - 16;
                    this.HelpSprite!.Draw(renderer, this.camera);
                }
            }
        }

        if (!Mario.MarioCharacter.Large) {
            this.SmallMario!.Draw(renderer, this.camera);
        } else {
            this.LargeMario!.Draw(renderer, this.camera);
        }

        this.Font.Strings[0] = { String: "MARIO " + Mario.MarioCharacter.Lives, X: 4, Y: 4 };
        this.FontShadow.Strings[0] = { String: "MARIO " + Mario.MarioCharacter.Lives, X: 5, Y: 5 };
        this.Font.Strings[1] = { String: "WORLD " + (this.WorldNumber + 1), X: 256, Y: 4 };
        this.FontShadow.Strings[1] = { String: "WORLD " + (this.WorldNumber + 1), X: 257, Y: 5 };

        this.FontShadow.Draw(renderer, this.camera);
        this.Font.Draw(renderer, this.camera);
    }

    /**
     * Called when a level is beaten to update the map.
     */
    LevelWon(): void {
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

    /**
     * Gets the X center.
     */
    GetX(): number {
        return 160;
    }

    /**
     * Gets the Y center.
     */
    GetY(): number {
        return 120;
    }

    CheckForChange(context: GameStateContext): void {
        if (this.WorldNumber === 8) {
            context.ChangeState(new WinState());
        }
        if (this.EnterLevel) {
            context.ChangeState(new LevelState(this.LevelDifficulty, this.LevelType));
        }
    }
}
