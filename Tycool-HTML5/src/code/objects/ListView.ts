import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import { MouseInput } from "@/engine/input/mouseInput";

export class ListView extends GameObject {
    public width: number;
    public height: number;
    public items: GameObject[] = [];

    // Layout properties
    public itemSpacing: number = 5;
    public padding: number = 5;

    // Scroll properties
    public scrollTop: number = 0;
    public maxScrollTop: number = 0;

    // State
    private isDragging: boolean = false;
    private lastMy: number = 0;
    private totalContentHeight: number = 0;

    constructor(x: number, y: number, width: number, height: number) {
        super(x, y);
        this.width = width;
        this.height = height;
        this.Layer = 1; // UI Layer
        this.ZOrder = 2005;

        // Wheel listener for scroll
        window.addEventListener('wheel', this.HandleWheel.bind(this), { passive: false });
    }

    public Dispose() {
        window.removeEventListener('wheel', this.HandleWheel.bind(this));
    }

    private HandleWheel(e: WheelEvent) {
        if (!this.visible) return;

        // Check if mouse is over list
        const domCanvas = document.getElementById('game-canvas');
        if (!domCanvas) return;
        const rect = domCanvas.getBoundingClientRect();
        const mx = MouseInput.X - rect.left;
        const my = MouseInput.Y - rect.top;

        if (mx >= this.x && mx <= this.x + this.width &&
            my >= this.y && my <= this.y + this.height) {

            // Apply scroll
            this.scrollTop += e.deltaY;
            this.ClampScroll();
            // Prevent page scroll
            e.preventDefault();
        }
    }

    public AddItem(item: GameObject) {
        this.items.push(item);
        this.RecalculateLayout();
    }

    public RemoveItem(item: GameObject) {
        const index = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
            this.RecalculateLayout();
        }
    }

    public Clear() {
        this.items = [];
        this.scrollTop = 0;
        this.totalContentHeight = 0;
        this.maxScrollTop = 0;
    }

    private RecalculateLayout() {
        let currentX = this.padding;
        let currentY = this.padding;
        let rowHeight = 0;

        // Simple Flow Layout
        this.items.forEach(item => {
            const itemW = (item as any).width || 0;
            const itemH = (item as any).height || 0;

            // Check if we need to wrap
            if (currentX + itemW + this.padding > this.width) {
                // New Line
                currentX = this.padding;
                currentY += rowHeight + this.itemSpacing;
                rowHeight = 0;
            }

            // Store relative position
            (item as any).relX = currentX;
            (item as any).relY = currentY;

            // Update row height
            if (itemH > rowHeight) rowHeight = itemH;

            // Move X
            currentX += itemW + this.itemSpacing;
        });

        // Final content height
        this.totalContentHeight = currentY + rowHeight + this.padding;
        this.maxScrollTop = Math.max(0, this.totalContentHeight - this.height);
        this.ClampScroll();
    }

    private ClampScroll() {
        if (this.scrollTop < 0) this.scrollTop = 0;
        if (this.scrollTop > this.maxScrollTop) this.scrollTop = this.maxScrollTop;
    }

    public Update(delta: number): void {
        const domCanvas = document.getElementById('game-canvas');
        if (!domCanvas) return;
        const rect = domCanvas.getBoundingClientRect();
        const mx = MouseInput.X - rect.left;
        const my = MouseInput.Y - rect.top;

        // Handle Drag Scroll (touch-like)
        if (mx >= this.x && mx <= this.x + this.width &&
            my >= this.y && my <= this.y + this.height) {

            if (MouseInput.IsButtonDown(0)) {
                if (!this.isDragging) {
                    this.isDragging = true;
                    this.lastMy = my;
                } else {
                    const diff = this.lastMy - my;
                    this.scrollTop += diff;
                    this.ClampScroll();
                    this.lastMy = my;
                }
            } else {
                this.isDragging = false;
            }
        } else {
            if (!MouseInput.IsButtonDown(0)) {
                this.isDragging = false;
            }
        }

        // Update items
        this.items.forEach(item => {
            const relX = (item as any).relX || 0;
            const relY = (item as any).relY || 0;

            // Update absolute position for interactions
            item.x = this.x + relX;
            item.y = this.y + relY - this.scrollTop;

            // Only update if near viewport to save perf? 
            // Better to always update logic in case of internal timers, 
            // but maybe skip expensive stuff.
            const itemH = (item as any).height || 0;
            // Check visibility
            if (item.y + itemH >= this.y && item.y <= this.y + this.height) {
                item.visible = true; // Use built-in visible flag? 
                // Careful, if logic relies on visible=false stopping updates.
                item.Update(delta);
            } else {
                // item.visible = false; 
                // If we set visible false, Draw might skip it automatically depending on implementation.
                // But let's just update everything for stability for now.
                item.Update(delta);
            }
        });
    }

    public Draw(renderer: Renderer, camera: Camera): void {

        // Background
        renderer.SetFillStyle("rgba(15, 23, 42, 0.5)");
        renderer.FillRect(this.x, this.y, this.width, this.height, "rgba(15, 23, 42, 0.5)");

        renderer.SetStrokeStyle("#475569");
        renderer.SetLineWidth(1);
        renderer.StrokeRect(this.x, this.y, this.width, this.height);

        // Clip
        renderer.Save();
        renderer.ClipRect(this.x, this.y, this.width, this.height);

        // Draw Items
        this.items.forEach(item => {
            const itemH = (item as any).height || 0;
            // Strict visibility check for drawing
            if (item.y + itemH >= this.y && item.y <= this.y + this.height) {
                item.Draw(renderer, camera);
            }
        });

        // Draw Scrollbar
        if (this.maxScrollTop > 0) {
            const scrollRatio = this.scrollTop / this.maxScrollTop;
            const barHeight = Math.max(30, (this.height / this.totalContentHeight) * this.height);
            const barY = this.y + (this.height - barHeight) * scrollRatio;

            renderer.SetFillStyle("rgba(255, 255, 255, 0.3)");
            renderer.FillRect(this.x + this.width - 6, barY, 4, barHeight, "rgba(255, 255, 255, 0.3)");
        }

        renderer.Restore();
    }
}
