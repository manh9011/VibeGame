/*
* using cross platform MIDI library MIDI.js http://www.midijs.net/
* Refactored to ES Module
*/

import { Mario } from './setup.js';

var midifiles = {
    "title": "midi/title.mid",
    "map": "midi/map.mid",
    "background": "midi/background.mid",
    "overground": "midi/overground.mid",
    "underground": "midi/underground.mid",
    "castle": "midi/castle.mid",
};

export const PlayMusic = function (name) {
    if (name in midifiles) {
        // Currently we stop all playing tracks when playing a new one
        // MIDIjs can't play multiple at one time
        //MIDIjs.stop();;
        //MIDIjs.play(midifiles[name]);
    } else {
        console.error("Cannot play music track " + name + " as i have no data for it.");
    }
};

export const PlayTitleMusic = function () {
    PlayMusic("title");
};

export const PlayMapMusic = function () {
    PlayMusic("map");
};

export const PlayOvergroundMusic = function () {
    PlayMusic("background");
};

export const PlayUndergroundMusic = function () {
    PlayMusic("underground");
};

export const PlayCastleMusic = function () {
    PlayMusic("castle");
};

export const StopMusic = function () {
    //MIDIjs.stop();
};

// Bind to Mario global for compatibility
Mario.PlayMusic = PlayMusic;
Mario.PlayTitleMusic = PlayTitleMusic;
Mario.PlayMapMusic = PlayMapMusic;
Mario.PlayOvergroundMusic = PlayOvergroundMusic;
Mario.PlayUndergroundMusic = PlayUndergroundMusic;
Mario.PlayCastleMusic = PlayCastleMusic;
Mario.StopMusic = StopMusic;
