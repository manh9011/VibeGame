/**
 * Global Mario namespace and constants.
 * Use explicit types for the global object.
 */

import type { Character } from "./character";
import type { MapState } from "./mapState";

/**
 * Global Mario namespace containing shared state and constants.
 */
export const Mario = {
    // Global state holders
    /** Global reference to the main Mario character. */
    MarioCharacter: null as Character | null,
    /** Global reference to the map state. */
    GlobalMapState: null as MapState | null,

    // Constants
    /** Level types. */
    LevelType: {
        Overground: 0,
        Underground: 1,
        Castle: 2
    },

    // Tile Handling
    /** Tile behavior flags. */
    Tile: {
        BlockUpper: 1 << 0,
        BlockAll: 1 << 1,
        BlockLower: 1 << 2,
        Special: 1 << 3,
        Bumpable: 1 << 4,
        Breakable: 1 << 5,
        PickUpable: 1 << 6,
        Animated: 1 << 7,
        /** Array of tile behaviors. */
        Behaviors: [] as number[],
        /** Loads default tile behaviors. */
        LoadBehaviors: function () {
            var b = this.Behaviors;
            b[0] = 0;
            b[1] = 20;
            b[2] = 28;
            b[3] = 0;
            b[4] = 130;
            b[5] = 16;
            b[6] = 16;
            b[7] = 16;
            b[8] = 16;
            b[9] = 16;
            b[10] = 16;
            b[11] = 16;
            b[12] = 16;
            b[13] = 16;
            b[14] = 130;
            b[15] = 0;
            b[16] = 130;
            b[17] = 16;
            b[18] = 16;
            b[19] = 16;
            b[20] = 16;
            b[21] = 130;
            b[22] = 16;
            b[23] = 0;
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
            b[58] = 0;
            b[59] = 0;
        }
    },

    // Music helpers
    PlayMusic: null as Function | null,
    PlayTitleMusic: null as Function | null,
    PlayMapMusic: null as Function | null,
    PlayOvergroundMusic: null as Function | null,
    PlayUndergroundMusic: null as Function | null,
    PlayCastleMusic: null as Function | null,
    StopMusic: null as Function | null
};
