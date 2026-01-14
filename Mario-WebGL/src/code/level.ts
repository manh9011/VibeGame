import { SpriteTemplate } from './spriteTemplate'; // Will be migrated later, ensuring correct import type

/**
 * Static class defining tile behaviors and flags.
 */
export const Tile = {
    BlockUpper: 1 << 0,
    BlockAll: 1 << 1,
    BlockLower: 1 << 2,
    Special: 1 << 3,
    Bumpable: 1 << 4,
    Breakable: 1 << 5,
    PickUpable: 1 << 6,
    Animated: 1 << 7,
    /** Array of behavior flags for each tile ID. */
    Behaviors: [] as number[],

    /**
     * Initializes the tile behavior flags.
     */
    LoadBehaviors: function (): void {
        var b = [];
        b[0] = 0;
        b[1] = 20;
        b[2] = 28;
        b[3] = 0;
        b[4] = 130;
        b[5] = 130;
        b[6] = 130;
        b[7] = 130;
        b[8] = 2;
        b[9] = 2;
        b[10] = 2;
        b[11] = 2;
        b[12] = 2;
        b[13] = 0;
        b[14] = 138;
        b[15] = 0;
        b[16] = 162;
        b[17] = 146;
        b[18] = 154;
        b[19] = 162;
        b[20] = 146;
        b[21] = 146;
        b[22] = 154;
        b[23] = 146;
        b[24] = 2;
        b[25] = 0;
        b[26] = 2;
        b[27] = 2;
        b[28] = 2;
        b[29] = 0;
        b[30] = 2;
        b[31] = 0;
        b[32] = 192;
        b[33] = 192;
        b[34] = 192;
        b[35] = 192;
        b[36] = 0;
        b[37] = 0;
        b[38] = 0;
        b[39] = 0;
        b[40] = 2;
        b[41] = 2;
        b[42] = 0;
        b[43] = 0;
        b[44] = 0;
        b[45] = 0;
        b[46] = 2;
        b[47] = 0;
        b[48] = 0;
        b[49] = 0;
        b[50] = 0;
        b[51] = 0;
        b[52] = 0;
        b[53] = 0;
        b[54] = 0;
        b[55] = 0;
        b[56] = 2;
        b[57] = 2;

        var i = 0;
        for (i = 58; i < 128; i++) {
            b[i] = 0;
        }

        b[128] = 2;
        b[129] = 2;
        b[130] = 2;
        b[131] = 0;
        b[132] = 1;
        b[133] = 1;
        b[134] = 1;
        b[135] = 0;
        b[136] = 2;
        b[137] = 2;
        b[138] = 2;
        b[139] = 0;
        b[140] = 2;
        b[141] = 2;
        b[142] = 2;
        b[143] = 0;
        b[144] = 2;
        b[145] = 0;
        b[146] = 2;
        b[147] = 0;
        b[148] = 0;
        b[149] = 0;
        b[150] = 0;
        b[151] = 0;
        b[152] = 2;
        b[153] = 2;
        b[154] = 2;
        b[155] = 0;
        b[156] = 2;
        b[157] = 2;
        b[158] = 2;
        b[159] = 0;
        b[160] = 2;
        b[161] = 2;
        b[162] = 2;
        b[163] = 0;
        b[164] = 0;
        b[165] = 0;
        b[166] = 0;
        b[167] = 0;
        b[168] = 2;
        b[169] = 2;
        b[170] = 2;
        b[171] = 0;
        b[172] = 2;
        b[173] = 2;
        b[174] = 2;
        b[175] = 0;
        b[176] = 2;
        b[177] = 2;
        b[178] = 2;
        b[179] = 0;
        b[180] = 1;
        b[181] = 1;
        b[182] = 1;

        for (i = 183; i < 224; i++) {
            b[i] = 0;
        }

        b[224] = 1;
        b[225] = 1;
        b[226] = 1;

        for (i = 227; i < 256; i++) {
            b[i] = 0;
        }

        this.Behaviors = b;
    }
};

// Initialize behaviors
Tile.LoadBehaviors();

/**
 * Enum for level types.
 */
export const LevelType = {
    Overground: 0,
    Underground: 1,
    Castle: 2
};

/**
 * Enum for level generation feature odds.
 */
export const Odds = {
    Straight: 0,
    HillStraight: 1,
    Tubes: 2,
    Jump: 3,
    Cannons: 4
};

/**
 * Represents a game level, containing the map data and sprite templates.
 */
export class Level {
    /** Width of the level in tiles. */
    Width: number;
    /** Height of the level in tiles. */
    Height: number;
    /** X coordinate of the level exit. */
    ExitX: number;
    /** Y coordinate of the level exit. */
    ExitY: number;
    /** 2D array of tile IDs. */
    Map: number[][];
    /** 2D array of tile data (e.g. state). */
    Data: number[][];
    /** 2D array of sprite templates for spawning enemies. */
    SpriteTemplates: SpriteTemplate[][];

    constructor(width: number, height: number) {
        this.Width = width;
        this.Height = height;
        this.ExitX = 10;
        this.ExitY = 10;

        this.Map = [];
        this.Data = [];
        this.SpriteTemplates = [];

        var x = 0, y = 0;
        for (x = 0; x < this.Width; x++) {
            this.Map[x] = [];
            this.Data[x] = [];
            this.SpriteTemplates[x] = [];

            for (y = 0; y < this.Height; y++) {
                this.Map[x][y] = 0;
                this.Data[x][y] = 0;
                this.SpriteTemplates[x][y] = null;
            }
        }
    }

    /**
     * Updates level data (e.g., ticking down block data).
     */
    Update(): void {
        var x = 0, y = 0;
        for (x = 0; x < this.Width; x++) {
            for (y = 0; y < this.Height; y++) {
                if (this.Data[x][y] > 0) {
                    this.Data[x][y]--;
                }
            }
        }
    }

    /**
     * Gets a block ID at the specified coordinates, clamping to bounds.
     */
    GetBlockCapped(x: number, y: number): number {
        if (x < 0) { x = 0; }
        if (y < 0) { y = 0; }
        if (x >= this.Width) { x = this.Width - 1; }
        if (y >= this.Height) { y = this.Height - 1; }
        return this.Map[x][y];
    }

    /**
     * Gets a block ID at the specified coordinates. Returns 0 if out of bounds.
     */
    GetBlock(x: number, y: number): number {
        if (x < 0) { x = 0; }
        if (y < 0) { return 0; }
        if (x >= this.Width) { x = this.Width - 1; }
        if (y >= this.Height) { y = this.Height - 1; }
        return this.Map[x][y];
    }

    /**
     * Sets a block ID at the specified coordinates.
     */
    SetBlock(x: number, y: number, block: number): void {
        if (x < 0) { return; }
        if (y < 0) { return; }
        if (x >= this.Width) { return; }
        if (y >= this.Height) { return; }
        this.Map[x][y] = block;
    }

    /**
     * Sets block data at the specified coordinates.
     */
    SetBlockData(x: number, y: number, data: number): void {
        if (x < 0) { return; }
        if (y < 0) { return; }
        if (x >= this.Width) { return; }
        if (y >= this.Height) { return; }
        this.Data[x][y] = data;
    }

    /**
     * Checks if a specific position is blocked based on tile behaviors.
     */
    IsBlocking(x: number, y: number, xa: number, ya: number): boolean {
        var block = this.GetBlock(x, y);
        var blocking = ((Tile.Behaviors[block & 0xff]) & Tile.BlockAll) > 0;
        blocking = blocking || ((ya > 0) && ((Tile.Behaviors[block & 0xff]) & Tile.BlockUpper) > 0);
        blocking = blocking || ((ya < 0) && ((Tile.Behaviors[block & 0xff]) & Tile.BlockLower) > 0);

        return blocking;
    }

    /**
     * Gets the sprite template at the specified coordinates.
     */
    GetSpriteTemplate(x: number, y: number): SpriteTemplate | null {
        if (x < 0) { return null; }
        if (y < 0) { return null; }
        if (x >= this.Width) { return null; }
        if (y >= this.Height) { return null; }
        return this.SpriteTemplates[x][y];
    }

    /**
     * Sets a sprite template at the specified coordinates.
     */
    SetSpriteTemplate(x: number, y: number, template: SpriteTemplate): void {
        if (x < 0) { return; }
        if (y < 0) { return; }
        if (x >= this.Width) { return; }
        if (y >= this.Height) { return; }
        this.SpriteTemplates[x][y] = template;
    }
}
