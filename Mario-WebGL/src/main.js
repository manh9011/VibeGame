/**
    HTML5 Mario - Main Entry Point
*/

import { Application } from "./Enjine/application.js";
import { LoadingState } from "./code/loadingState.js";
import "./code/setup.js";
import "./code/music.js";
import "./style.css";
import $ from "jquery";

$(document).ready(async function () {
    var canvas = document.getElementById("canvas");
    // PixiJS handles context creation and smoothing (scaleMode).

    await new Application().Initialize(new LoadingState(), 320, 240);

    // Initialize MouseInput
    import("./Enjine/mouseInput.js").then(module => {
        module.MouseInput.Initialize(canvas);
    });
});
