import { Renderer } from "./renderer";

/**
 * Context class that holds the current game state and delegates updates/drawing.
 */
export class GameStateContext {
    State: GameState | null;

    constructor(defaultState: GameState | null) {
        this.State = null;

        if (defaultState != null) {
            this.State = defaultState;
            this.State.Enter();
        }
    }

    /**
     * Changes the current state.
     * @param newState The new state to switch to.
     */
    ChangeState(newState: GameState): void {
        if (this.State != null) {
            this.State.Exit();
        }
        this.State = newState;
        this.State.Enter();
    }

    /**
     * Updates the current state.
     * @param delta Time elapsed.
     */
    Update(delta: number): void {
        if (this.State) {
            this.State.CheckForChange(this);
            this.State.Update(delta);
        }
    }

    /**
     * Draws the current state.
     * @param renderer Renderer instance.
     */
    Draw(renderer: Renderer): void {
        if (this.State) {
            this.State.Draw(renderer);
        }
    }
}

/**
 * Base class for game states (e.g., Title, Level, Win, Lose).
 */
export class GameState {
    Enter(): void { }
    Exit(): void { }
    Update(delta: number): void { }
    Draw(renderer: Renderer): void { }
    /**
     * Checks if the state needs to change.
     * @param context The state context.
     */
    CheckForChange(context: GameStateContext): void { }
}
