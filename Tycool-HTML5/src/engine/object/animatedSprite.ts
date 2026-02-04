import { FrameSprite } from '@/engine/object/frameSprite';

/**
 * Represents a single sequence of animation frames.
 */
export class AnimationSequence {
    StartRow: number;
    StartColumn: number;
    EndRow: number;
    EndColumn: number;
    SingleFrame: boolean;

    constructor(startRow: number, startColumn: number, endRow: number, endColumn: number) {
        this.StartRow = startRow;
        this.StartColumn = startColumn;
        this.EndRow = endRow;
        this.EndColumn = endColumn;

        this.SingleFrame = false;

        if ((this.StartRow == this.EndRow) && (this.StartColumn == this.EndColumn)) {
            this.SingleFrame = true;
        }
    }
}

/**
 * Sprite that supports animation sequences.
 */
export class AnimatedSprite extends FrameSprite {
    LastElapsed: number;
    FramesPerSecond: number;
    CurrentSequence: AnimationSequence | null;
    Playing: boolean;
    Looping: boolean;
    Rows: number;
    Columns: number;
    Sequences: { [key: string]: AnimationSequence };

    constructor() {
        super();
        this.LastElapsed = 0;
        this.FramesPerSecond = 1 / 20;
        this.CurrentSequence = null;
        this.Playing = false;
        this.Looping = false;
        this.Rows = 0;
        this.Columns = 0;
        this.Sequences = {};
    }

    /**
     * Updates the sprite animation scene.
     * @param delta Time elapsed since last update.
     */
    Update(delta: number): void {
        if (!this.CurrentSequence) return;

        if (this.CurrentSequence.SingleFrame) {
            return;
        }
        if (!this.Playing) {
            return;
        }

        this.LastElapsed -= delta;

        if (this.LastElapsed > 0) {
            return;
        }

        this.LastElapsed = this.FramesPerSecond;
        this.FrameX += this.FrameWidth;

        //increment the frame
        if (this.FrameX > (this.Image!.width - this.FrameWidth)) {
            this.FrameX = 0;
            this.FrameY += this.FrameHeight;

            if (this.FrameY > (this.Image!.height - this.FrameHeight)) {
                this.FrameY = 0;
            }
        }

        //check if it's at the end of the animation sequence
        var seqEnd = false;
        if ((this.FrameX > (this.CurrentSequence.EndColumn * this.FrameWidth)) && (this.FrameY == (this.CurrentSequence.EndRow * this.FrameHeight))) {
            seqEnd = true;
        } else if (this.FrameX == 0 && (this.FrameY > (this.CurrentSequence.EndRow * this.FrameHeight))) {
            seqEnd = true;
        }

        //go back to the beginning if looping, otherwise stop playing
        if (seqEnd) {
            if (this.Looping) {
                this.FrameX = this.CurrentSequence.StartColumn * this.FrameWidth;
                this.FrameY = this.CurrentSequence.StartRow * this.FrameHeight;
            } else {
                this.Playing = false;
            }
        }
    }

    /**
     * Plays a specific animation sequence.
     * @param seqName Name of the sequence to play.
     * @param loop Whether to loop the sequence.
     */
    PlaySequence(seqName: string, loop: boolean): void {
        this.Playing = true;
        this.Looping = loop;
        this.CurrentSequence = this.Sequences["seq_" + seqName];
        this.FrameX = this.CurrentSequence.StartColumn * this.FrameWidth;
        this.FrameY = this.CurrentSequence.StartRow * this.FrameHeight;
    }

    /**
     * Stops the animation loop.
     */
    StopLooping(): void {
        this.Looping = false;
    }

    /**
     * Stops playing the animation.
     */
    StopPlaying(): void {
        this.Playing = false;
    }

    /**
     * Sets the width of a single frame and recalculates rows.
     * @param width Width of a frame.
     */
    SetFrameWidth(width: number): void {
        this.FrameWidth = width;
        this.Rows = this.Image!.width / this.FrameWidth;
    }

    /**
     * Sets the height of a single frame and recalculates columns.
     * @param height Height of a frame.
     */
    SetFrameHeight(height: number): void {
        this.FrameHeight = height;
        this.Columns = this.Image!.height / this.FrameHeight;
    }

    /**
     * Sets the number of columns in the sprite sheet.
     * @param columnCount Number of columns.
     */
    SetColumnCount(columnCount: number): void {
        this.FrameWidth = this.Image!.width / columnCount;
        this.Columns = columnCount;
    }

    /**
     * Sets the number of rows in the sprite sheet.
     * @param rowCount Number of rows.
     */
    SetRowCount(rowCount: number): void {
        this.FrameHeight = this.Image!.height / rowCount;
        this.Rows = rowCount;
    }

    /**
     * Adds an existing animation sequence.
     * @param name Name of the sequence.
     * @param sequence The sequence object.
     */
    AddExistingSequence(name: string, sequence: AnimationSequence): void {
        this.Sequences["seq_" + name] = sequence;
    }

    /**
     * Creates and adds a new animation sequence.
     * @param name Name of the sequence.
     * @param startRow Starting row index.
     * @param startColumn Starting column index.
     * @param endRow Ending row index.
     * @param endColumn Ending column index.
     */
    AddNewSequence(name: string, startRow: number, startColumn: number, endRow: number, endColumn: number): void {
        this.Sequences["seq_" + name] = new AnimationSequence(startRow, startColumn, endRow, endColumn);
    }

    /**
     * Deletes an animation sequence by name.
     * @param name Name of the sequence to delete.
     */
    DeleteSequence(name: string): void {
        if (this.Sequences["seq_" + name] != null) {
            delete this.Sequences["seq_" + name];
        }
    }

    /**
     * Clears all animation sequences.
     */
    ClearSequences(): void {
        this.Sequences = {};
    }
}
