import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import { ProgressBar } from "@/code/objects/ProgressBar";

export class Landfill extends GameObject {
    public totalTime: number;
    public timer: number;

    private particles: { x: number, y: number, vy: number, s: number }[] = [];
    private nextParticle: number = 0;
    private progressBar: ProgressBar;

    constructor(x: number, y: number, time: number) {
        super(x, y);
        this.totalTime = time;
        this.timer = time;
        this.zOrderOffset = 0.3; // Above tiles
        this.UpdateZOrder();

        this.progressBar = new ProgressBar(x, y);
        this.progressBar.yOffset = -30;
        this.progressBar.color = "#4caf50";
    }

    public Update(delta: number): void {
        super.Update(delta);
        this.timer -= delta;
        this.progressBar.progress = 1 - Math.max(0, this.timer / this.totalTime);

        this.nextParticle -= delta;
        if (this.nextParticle <= 0) {
            this.nextParticle = 0.1;
            this.particles.push({
                x: (Math.random() - 0.5) * 30,
                y: -40,
                vy: 30 + Math.random() * 20,
                s: 2 + Math.random() * 3
            });
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.y += p.vy * delta;
            if (p.y > 5) {
                this.particles.splice(i, 1);
            }
        }

        if (this.timer <= 0) {
            const game = (window as any).game;
            if (game) game.FinishHarvest(this.x, this.y, 'water');
        }
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        if (!this.visible) return;

        const isoPos = camera.GridToScreen(this.x, this.y);
        const drawX = Math.floor(isoPos.x);
        const drawY = Math.floor(isoPos.y);
        const zoom = camera.zoom;

        // Draw Dirt Pile
        const progress = 1 - Math.max(0, this.timer / this.totalTime);
        const pileWidth = (48 * zoom) * progress;
        const pileHeight = (24 * zoom) * progress;

        renderer.SetFillStyle("#8B4513");
        renderer.BeginPath();
        renderer.MoveTo(drawX, drawY + 10 - pileHeight);
        renderer.LineTo(drawX + pileWidth / 2, drawY + 10 + pileWidth * 0.2);
        renderer.LineTo(drawX - pileWidth / 2, drawY + 10 + pileWidth * 0.2);
        renderer.ClosePath();
        renderer.Fill();

        renderer.SetStrokeStyle("#5D4037");
        renderer.Stroke();

        // Draw Falling Dirt Particles
        renderer.SetFillStyle("#A0522D");
        for (const p of this.particles) {
            renderer.BeginPath();
            renderer.Arc(drawX + p.x * zoom, drawY + p.y * zoom, p.s * zoom, 0, Math.PI * 2);
            renderer.Fill();
        }

        // Progress Bar
        this.progressBar.Draw(renderer, camera);
    }
}
