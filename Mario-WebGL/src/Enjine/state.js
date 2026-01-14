/**
 * Simple State pattern implementation for game states.
 * Code by Rob Kleffner, 2011
 * Refactored to ES Module
 */

export class GameStateContext {
    constructor(defaultState) {
        this.State = null;

        if (defaultState != null) {
            this.State = defaultState;
            this.State.Enter();
        }
    }

    ChangeState(newState) {
        if (this.State != null) {
            this.State.Exit();
        }
        this.State = newState;
        this.State.Enter();
    }

    Update(delta) {
        this.State.CheckForChange(this);
        this.State.Update(delta);
    }

    Draw(delta) {
        this.State.Draw(delta);
    }
}

/**
 * Base game state class to at least ensure that all the functions exist.
 */
export class GameState {
    Enter() { }
    Exit() { }
    Update(delta) { }
    Draw(context) { }
    CheckForChange(context) { }
}
