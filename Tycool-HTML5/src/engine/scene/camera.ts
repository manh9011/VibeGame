/**
 * Represents the game camera with isometric support.
 * Handles pan, zoom, and coordinate conversion.
 */
export class Camera {
    // Position (pan offset)
    public X: number = 0;
    public Y: number = 0;

    // Isometric base position (origin point)
    public baseX: number = 0;
    public baseY: number = 100;

    // Zoom level
    public zoom: number = 1.0;
    public minZoom: number = 0.5;
    public maxZoom: number = 4.0;

    // Tile dimensions (base, before zoom)
    public tileWidth: number = 64;
    public tileHeight: number = 32;

    // World bounds (for background clamping)
    public worldWidth: number = 2752;
    public worldHeight: number = 1536;
    public mapCenterX: number = 1376;
    public mapCenterY: number = 380;

    // Screen dimensions
    private screenWidth: number = 0;
    private screenHeight: number = 0;

    constructor() {
        this.X = 0;
        this.Y = 0;
    }

    /**
     * Initialize camera based on screen dimensions.
     */
    public Initialize(width: number, height: number): void {
        this.screenWidth = width;
        this.screenHeight = height;
        this.baseX = Math.floor(width / 2);
        this.baseY = 100;

        // Ensure initial zoom fits
        const fitZoom = this.GetFitZoom();
        if (this.zoom < fitZoom) this.zoom = fitZoom;
        this.ClampToBounds();
    }

    /**
     * Resize handler - update base position.
     */
    public Resize(width: number, height: number): void {
        this.screenWidth = width;
        this.screenHeight = height;
        this.baseX = Math.floor(width / 2);

        // Re-validate zoom
        const fitZoom = this.GetFitZoom();
        const effectiveMin = Math.max(this.minZoom, fitZoom);

        if (this.zoom < effectiveMin) {
            this.zoom = effectiveMin;
        }
        this.ClampToBounds();
    }

    /**
     * Apply pan delta (from mouse drag), clamped to world bounds.
     */
    public Pan(deltaX: number, deltaY: number): void {
        const bounds = this.GetWorldBounds();

        let newX = this.X + deltaX;
        let newY = this.Y + deltaY;

        // Clamp X
        if (newX < bounds.minX) newX = bounds.minX;
        if (newX > bounds.maxX) newX = bounds.maxX;

        // Clamp Y
        if (newY < bounds.minY) newY = bounds.minY;
        if (newY > bounds.maxY) newY = bounds.maxY;

        this.X = newX;
        this.Y = newY;
    }

    /**
     * Helper to get min/max X/Y for camera panning.
     */
    private GetWorldBounds(): { minX: number, maxX: number, minY: number, maxY: number } {
        const scaledWorldW = this.worldWidth * this.zoom;
        const scaledWorldH = this.worldHeight * this.zoom;

        // Map center offset in background (where grid origin aligns)
        const mapCenterX = this.mapCenterX * this.zoom;
        const mapCenterY = this.mapCenterY * this.zoom;

        // screenCenterX = baseX + X
        // worldOriginX = screenCenterX - mapCenterX
        // minX condition: worldOriginX + scaledWorldW >= screenWidth
        // => (baseX + X - mapCenterX) + scaledWorldW >= screenWidth
        // => X >= screenWidth + mapCenterX - scaledWorldW - baseX

        // maxX condition: worldOriginX <= 0
        // => (baseX + X - mapCenterX) <= 0
        // => X <= mapCenterX - baseX

        const minX = this.screenWidth + mapCenterX - scaledWorldW - this.baseX;
        const maxX = mapCenterX - this.baseX;

        // minY and maxY similar logic for Y
        const minY = this.screenHeight + mapCenterY - scaledWorldH - this.baseY;
        const maxY = mapCenterY - this.baseY;

        return { minX, maxX, minY, maxY };
    }

    /**
     * Clamp camera position to keep viewport within world bounds.
     * Uses GetWorldBounds logic.
     */
    public ClampToBounds(): void {
        const bounds = this.GetWorldBounds();

        if (this.X < bounds.minX) this.X = bounds.minX;
        if (this.X > bounds.maxX) this.X = bounds.maxX;
        if (this.Y < bounds.minY) this.Y = bounds.minY;
        if (this.Y > bounds.maxY) this.Y = bounds.maxY;
    }

    /**
     * Process mouse wheel zoom, centered on mouse position.
     */
    /**
     * Calculate the minimum zoom required to cover the screen without gaps.
     */
    public GetFitZoom(): number {
        if (this.worldWidth === 0 || this.worldHeight === 0) return this.minZoom;
        const fitX = this.screenWidth / this.worldWidth;
        const fitY = this.screenHeight / this.worldHeight;
        // Use max to wrap/cover the screen (no gaps). Use min to fit inside (gaps allowed).
        return Math.max(fitX, fitY);
    }

    /**
     * Process mouse wheel zoom, centered on mouse position.
     */
    public ProcessZoom(wheelDelta: number, mouseX: number, mouseY: number): void {
        const oldZoom = this.zoom;
        const zoomFactor = 1.1;
        let newZoom = oldZoom;

        if (wheelDelta < 0) {
            newZoom *= zoomFactor;
        } else {
            newZoom /= zoomFactor;
        }

        // Enforce fit zoom to prevent gaps
        const fitZoom = this.GetFitZoom();
        const effectiveMin = Math.max(this.minZoom, fitZoom);

        newZoom = Math.max(effectiveMin, Math.min(newZoom, this.maxZoom));

        if (newZoom !== oldZoom) {
            const ratio = newZoom / oldZoom;

            // Adjust pan to keep mouse position stable
            this.X = (mouseX - this.baseX) * (1 - ratio) + this.X * ratio;
            this.Y = (mouseY - this.baseY) * (1 - ratio) + this.Y * ratio;

            this.zoom = newZoom;
            this.ClampToBounds();
        }
    }

    /**
     * Get current tile dimensions (accounting for zoom).
     */
    public GetTileDimensions(): { width: number, height: number } {
        return {
            width: this.tileWidth * this.zoom,
            height: this.tileHeight * this.zoom
        };
    }

    /**
     * Convert grid coordinates to screen coordinates.
     */
    public GridToScreen(gridX: number, gridY: number): { x: number, y: number } {
        const tileW = this.tileWidth * this.zoom;
        const tileH = this.tileHeight * this.zoom;

        return {
            x: (gridX - gridY) * (tileW / 2) + this.baseX + this.X,
            y: (gridX + gridY) * (tileH / 2) + this.baseY + this.Y
        };
    }

    /**
     * Convert screen coordinates to grid coordinates.
     */
    public ScreenToGrid(screenX: number, screenY: number): { x: number, y: number } {
        const adjX = screenX - (this.baseX + this.X);
        const adjY = screenY - (this.baseY + this.Y);

        const hw = (this.tileWidth * this.zoom) / 2;
        const hh = (this.tileHeight * this.zoom) / 2;

        return {
            x: Math.floor((adjX / hw + adjY / hh) / 2),
            y: Math.floor((adjY / hh - adjX / hw) / 2)
        };
    }
}
