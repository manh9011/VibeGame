/**
    HTML5 Mario - Main Entry Point
*/

import { Application } from "./Enjine/application";
import { LoadingState } from "./code/loadingState";
import "./code/setup";
import "./code/music";
import "./style.css";

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.imageSmoothingEnabled = false;

    // Polyfills or specific browser properties might need casting or extending interface if strict
    (context as any).webkitImageSmoothingEnabled = false;
    (context as any).mozImageSmoothingEnabled = false;
    (context as any).msImageSmoothingEnabled = false;

    new Application().Initialize(new LoadingState(), 320, 240);
});
