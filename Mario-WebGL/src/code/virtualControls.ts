import { KeyboardInput, Keys } from "../Enjine/keyboardInput";

export class VirtualControls {
    public static Initialize(): void {
        const container = document.createElement("div");
        container.id = "virtual-controls";
        container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            user-select: none;
            touch-action: none;
        `;

        // D-Pad Container (Bottom Left)
        const dpad = document.createElement("div");
        dpad.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            width: 150px;
            height: 150px;
            pointer-events: auto;
        `;

        // Action Buttons Container (Bottom Right)
        const actions = document.createElement("div");
        actions.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 160px;
            height: 80px;
            pointer-events: auto;
            display: flex;
            gap: 20px;
            justify-content: flex-end;
            align-items: center;
        `;

        container.appendChild(dpad);
        container.appendChild(actions);
        document.body.appendChild(container);

        // Helper to create buttons
        const createBtn = (text: string, style: string, keyCode: number) => {
            const btn = document.createElement("div");
            btn.innerText = text;
            btn.style.cssText = `
                display: flex;
                justify-content: center;
                align-items: center;
                background: rgba(255, 255, 255, 0.3);
                border: 2px solid rgba(255, 255, 255, 0.5);
                border-radius: 5px;
                color: white;
                font-family: sans-serif;
                font-weight: bold;
                cursor: pointer;
                user-select: none;
                -webkit-user-select: none;
                touch-action: manipulation;
                ${style}
            `;

            const press = (e: Event) => {
                e.preventDefault();
                KeyboardInput.KeyDownEvent({ keyCode: keyCode, preventDefault: () => { } } as any);
                btn.style.background = "rgba(255, 255, 255, 0.6)";
            };

            const release = (e: Event) => {
                e.preventDefault();
                KeyboardInput.KeyUpEvent({ keyCode: keyCode, preventDefault: () => { } } as any);
                btn.style.background = "rgba(255, 255, 255, 0.3)";
            };

            btn.addEventListener("mousedown", press);
            btn.addEventListener("touchstart", press);
            btn.addEventListener("mouseup", release);
            btn.addEventListener("touchend", release);
            btn.addEventListener("mouseleave", release); // Handle sliding off

            return btn;
        };

        // D-Pad Buttons
        // Layout: 3x3 grid logic within 150x150
        // Up: 50,0
        // Left: 0,50
        // Right: 100,50
        // Down: 50,100
        const btnSize = "width: 48px; height: 48px; position: absolute;";

        dpad.appendChild(createBtn("▲", `${btnSize} top: 0; left: 51px;`, Keys.Up));
        dpad.appendChild(createBtn("◄", `${btnSize} top: 51px; left: 0;`, Keys.Left));
        dpad.appendChild(createBtn("►", `${btnSize} top: 51px; right: 0;`, Keys.Right));
        dpad.appendChild(createBtn("▼", `${btnSize} bottom: 0; left: 51px;`, Keys.Down));

        // Action Buttons
        // S (Start/Jump), A (Run/Fire)
        // Note: Title screen uses 'S' to start. Key mapping: S -> Keys.S, A -> Keys.A
        const actionBtnStyle = "width: 60px; height: 60px; border-radius: 50%;";

        actions.appendChild(createBtn("A", `${actionBtnStyle} background: rgba(255, 0, 0, 0.4);`, Keys.A)); // Run/Fire
        actions.appendChild(createBtn("S", `${actionBtnStyle} background: rgba(0, 255, 0, 0.4);`, Keys.S)); // Jump/Start
    }
}
