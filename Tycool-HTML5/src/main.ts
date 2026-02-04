/**
    HTML5 Tycoon - Main Entry Point
*/

import { Application } from "@/engine/application";
import { SceneLogin } from "@/code/scenes/login";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
    // Tycoon uses full window canvas, so we want the Enjine to use '2d' mode and full res
    // Note: Application.Initialize usually creates a fixed size buffer (320x240 in Mario).
    // We want full window.

    // Hack: The original Tycoon handled resize dynamically. 
    // Enjine's Application might need a larger default size or we rely on Resize in Scene.
    // Let's pass window size.

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Use '2d' mode to allow our Canvas2DRenderer casting to work
    // Use '2d' mode to allow our Canvas2DRenderer casting to work
    const app = new Application('2d');
    app.Initialize(new SceneLogin(), width, height);

    // Handle Resize
    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        app.canvas.Canvas!.width = w;
        app.canvas.Canvas!.height = h;
        // Also need to resize BackBuffer and Renderer?
        // Enjine currently doesn't have a clean Resize method.
        // But SceneTycoon handles it manually in Draw based on canvas size?
        // No, SceneTycoon checks domCanvas size versus backbuffer.
        // If we update domCanvas here, SceneTycoon might pick it up if logic allows.
        // But for SceneLogin which uses simple fillRect, we need to ensure BackBuffer is also resized ot Draw scales correctly.

        if (app.canvas.BackBuffer) {
            app.canvas.BackBuffer.width = w;
            app.canvas.BackBuffer.height = h;
        }
        if (app.canvas.Renderer instanceof Canvas2DRenderer) {
            // Re-init context config?
            // Canvas2DRenderer holds w/h?
            (app.canvas.Renderer as Canvas2DRenderer).width = w;
            (app.canvas.Renderer as Canvas2DRenderer).height = h;
        }
    });

    // Globals for HTML UI
    (window as any).game = game;
    (window as any).cloud = game.cloud;
    // UI is Init in TycoonScene, but we might need to expose it if HTML calls it directly.
    // Actually UIManager hooks callbacks to GameManager? 
    // HTML calls 'ui.togglePanel' -> which implies 'ui' global.
    // TycoonScene creates UI. We should expose it there or here.
    // But TycoonScene instance isn't easily accessible here unless we capture it.
});

// Import instance to use in globals
import { instance as game } from "@/code/scenes/game/GameManager";