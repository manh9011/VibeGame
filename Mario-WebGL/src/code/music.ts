/**
 * Music playback using external MIDI.js library (loaded via CDN)
 * Restored to original implementation for stability
 */

import { Mario } from './setup';

// Declare global MIDIjs object from CDN script
declare const MIDIjs: {
    play: (url: string) => void;
    stop: () => void;
    get_duration: (url: string, callback: (seconds: number) => void) => void;
};

// MIDI file paths
/** Dictionary mapping music track names to their file paths. */
const midiFiles: Record<string, string> = {
    "title": "midi/title.mid",
    "map": "midi/map.mid",
    "background": "midi/background.mid",
    "overground": "midi/overground.mid",
    "underground": "midi/underground.mid",
    "castle": "midi/castle.mid",
};

/**
 * Stops any currently playing music.
 */
export const StopMusic = (): void => {
    try {
        MIDIjs.stop();
    } catch (e) {
        console.warn("Error stopping MIDIjs:", e);
    }
};

/**
 * Plays a specific music track by name.
 * @param name The name of the track to play (e.g., "title", "map", "background").
 */
export const PlayMusic = (name: string): void => {
    if (name in midiFiles) {
        // MIDIjs handles stop/start internally usually, but explicit stop is safer
        StopMusic();
        MIDIjs.play(midiFiles[name]);
    } else {
        console.error("Cannot play music track " + name + " as i have no data for it.");
    }
};

/**
 * Plays the title screen music.
 */
export const PlayTitleMusic = (): void => {
    PlayMusic("title");
};

/**
 * Plays the world map music.
 */
export const PlayMapMusic = (): void => {
    PlayMusic("map");
};

/**
 * Plays the overground level music.
 */
export const PlayOvergroundMusic = (): void => {
    PlayMusic("background");
};

/**
 * Plays the underground level music.
 */
export const PlayUndergroundMusic = (): void => {
    PlayMusic("underground");
};

/**
 * Plays the castle level music.
 */
export const PlayCastleMusic = (): void => {
    PlayMusic("castle");
};

// Bind to Mario global for compatibility
Mario.PlayMusic = PlayMusic;
Mario.PlayTitleMusic = PlayTitleMusic;
Mario.PlayMapMusic = PlayMapMusic;
Mario.PlayOvergroundMusic = PlayOvergroundMusic;
Mario.PlayUndergroundMusic = PlayUndergroundMusic;
Mario.PlayCastleMusic = PlayCastleMusic;
Mario.StopMusic = StopMusic;
