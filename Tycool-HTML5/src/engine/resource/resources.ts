/** Interface for sound channel with audio elements and index tracking */
export interface SoundChannel extends Array<HTMLAudioElement> {
    index: number;
}

/**
 * Static object to manage game resources (images and sounds).
 */
export const Resources = {
    Images: {} as { [key: string]: HTMLImageElement },
    Sounds: {} as { [key: string]: SoundChannel },

    /**
     * Clears all resources.
     */
    Destroy: function (): typeof Resources {
        this.Images = {};
        this.Sounds = {};
        return this;
    },

    //***********************/
    //Images
    /**
     * Adds an image to the resource library.
     * @param name Name to reference the image.
     * @param src Source URL of the image.
     */
    AddImage: function (name: string, src: string): typeof Resources {
        var tempImage = new Image();
        this.Images[name] = tempImage;
        tempImage.src = src;
        return this;
    },

    /**
     * Adds multiple images to the resource library.
     * @param array Array of objects with name and src properties.
     */
    AddImages: function (array: { name: string; src: string }[]): typeof Resources {
        for (var i = 0; i < array.length; i++) {
            var tempImage = new Image();
            this.Images[array[i].name] = tempImage;
            tempImage.src = array[i].src;
        }
        return this;
    },

    ClearImages: function (): typeof Resources {
        this.Images = {};
        return this;
    },

    RemoveImage: function (name: string): typeof Resources {
        delete this.Images[name];
        return this;
    },

    //***********************/
    //Sounds
    /**
     * Adds a sound to the resource library.
     * @param name Name to reference the sound.
     * @param src Source URL of the sound.
     * @param maxChannels Number of simultaneous channels for this sound.
     */
    AddSound: function (name: string, src: string, maxChannels?: number): typeof Resources {
        const channel = [] as unknown as SoundChannel;
        channel.index = 0;
        if (!maxChannels) {
            maxChannels = 3;
        }
        for (var i = 0; i < maxChannels; i++) {
            channel[i] = new Audio(src);
        }
        this.Sounds[name] = channel;
        return this;
    },

    ClearSounds: function (): typeof Resources {
        this.Sounds = {};
        return this;
    },

    RemoveSound: function (name: string): typeof Resources {
        delete this.Sounds[name];
        return this;
    },

    /**
     * Plays a sound.
     * @param name Name of the sound to play.
     * @param loop Whether to loop the sound.
     */
    PlaySound: function (name: string, loop?: boolean): number {
        if (this.Sounds[name].index >= this.Sounds[name].length) {
            this.Sounds[name].index = 0;
        }
        if (loop) {
            this.Sounds[name][this.Sounds[name].index].addEventListener("ended", this.LoopCallback, false);
        }
        this.Sounds[name][this.Sounds[name].index++].play();
        return this.Sounds[name].index;
    },

    /**
     * Pauses a specific sound channel.
     * @param name Name of the sound.
     * @param index Index of the channel.
     */
    PauseChannel: function (name: string, index: number): typeof Resources {
        if (!this.Sounds[name][index].paused) {
            this.Sounds[name][index].pause();
        }
        return this;
    },

    /**
     * Pauses all channels of a sound.
     * @param name Name of the sound.
     */
    PauseSound: function (name: string): typeof Resources {
        for (var i = 0; i < this.Sounds[name].length; i++) {
            if (!this.Sounds[name][i].paused) {
                this.Sounds[name][i].pause();
            }
        }
        return this;
    },

    /**
     * Resets a specific sound channel to the beginning.
     * @param name Name of the sound.
     * @param index Index of the channel.
     */
    ResetChannel: function (name: string, index: number): typeof Resources {
        this.Sounds[name][index].currentTime = 0;
        this.StopLoop(name, index);
        return this;
    },

    /**
     * Resets all channels of a sound to the beginning.
     * @param name Name of the sound.
     */
    ResetSound: function (name: string): typeof Resources {
        for (var i = 0; i < this.Sounds[name].length; i++) {
            this.Sounds[name].currentTime = 0;
            this.StopLoop(name, i);
        }
        return this;
    },

    StopLoop: function (name: string, index: number): void {
        this.Sounds[name][index].removeEventListener("ended", this.LoopCallback, false);
    },

    LoopCallback: function (this: HTMLAudioElement) {
        this.currentTime = -1;
        this.play();
    }
};
