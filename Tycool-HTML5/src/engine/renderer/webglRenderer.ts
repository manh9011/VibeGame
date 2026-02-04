import { Renderer } from "@/engine/renderer/renderer";

/**
 * Renderer implementation using WebGL for high performance.
 */
export class WebGLRenderer implements Renderer {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    gl: WebGLRenderingContext;

    // Batching
    maxQuads: number;
    vertexSize: number;
    vertices: Float32Array;
    quadCount: number;
    currentTexture: WebGLTexture | null;
    currentVertexIndex: number;
    vertexPtr: number;

    // Matrix
    matrixStack: Float32Array[];
    currentMatrix: Float32Array;

    // Scissor
    scissorStack: ({ x: number, y: number, w: number, h: number } | null)[];
    currentScissor: { x: number, y: number, w: number, h: number } | null;

    // Resources
    program!: WebGLProgram;
    aPosition!: number;
    aTexCoord!: number;
    uMatrix!: WebGLUniformLocation | null;
    uResolution!: WebGLUniformLocation | null;
    uImage!: WebGLUniformLocation | null;
    uColor!: WebGLUniformLocation | null;

    positionBuffer!: WebGLBuffer | null;
    textureCache: Map<HTMLImageElement | HTMLCanvasElement, WebGLTexture>;
    whiteTexture: WebGLTexture;

    // Path Compatibility
    pathCanvas: HTMLCanvasElement;
    pathContext: CanvasRenderingContext2D;
    pathTexture: WebGLTexture;
    pathDirty: boolean;

    /**
     * Creates a new WebGL renderer.
     * @param canvas The canvas element.
     * @param width Resolution width.
     * @param height Resolution height.
     */
    constructor(canvas: HTMLCanvasElement, width: number, height: number) {
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        const gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: true });

        if (!gl) {
            throw new Error("WebGL not supported");
        }
        this.gl = gl;

        // Batching
        this.maxQuads = 2000;
        this.vertexSize = 4; // x, y, u, v
        this.vertices = new Float32Array(this.maxQuads * 6 * this.vertexSize);
        this.quadCount = 0;
        this.currentTexture = null;
        this.currentVertexIndex = 0;
        this.vertexPtr = 0;

        // Matrix stack
        this.matrixStack = [new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1])];
        this.currentMatrix = this.matrixStack[0];

        // Scissor stack
        this.scissorStack = [];
        this.currentScissor = null;

        this.initShaders();
        this.initBuffers();

        this.textureCache = new Map();
        // 1x1 white texture for FillRect
        this.whiteTexture = this.createWhiteTexture();

        // Offscreen canvas for paths (compatibility)
        this.pathCanvas = document.createElement("canvas");
        this.pathCanvas.width = width;
        this.pathCanvas.height = height;
        this.pathContext = this.pathCanvas.getContext("2d")!;
        this.pathTexture = this.createTexture();
        this.pathDirty = false;

        this.gl.viewport(0, 0, width, height);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    createTexture(): WebGLTexture {
        const tex = this.gl.createTexture();
        if (!tex) throw new Error("Failed to create texture");
        this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        return tex;
    }

    createWhiteTexture(): WebGLTexture {
        const tex = this.createTexture();
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
        return tex;
    }

    initShaders(): void {
        const vsSource = `
            attribute vec2 aPosition;
            attribute vec2 aTexCoord;
            uniform mat3 uMatrix;
            uniform vec2 uResolution;
            varying vec2 vTexCoord;
            void main() {
                // Apply transformation matrix
                vec3 pos = uMatrix * vec3(aPosition, 1.0);
                
                // Convert to clip space
                vec2 clipSpace = (pos.xy / uResolution) * 2.0 - 1.0;
                
                // Flip Y because WebGL 0,0 is bottom-left
                gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
                vTexCoord = aTexCoord;
            }
        `;

        const fsSource = `
            precision mediump float;
            varying vec2 vTexCoord;
            uniform sampler2D uImage;
            uniform vec4 uColor;
            void main() {
                gl_FragColor = texture2D(uImage, vTexCoord) * uColor;
            }
        `;

        const vs = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
        const fs = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
        if (!vs || !fs) return;

        const program = this.createProgram(vs, fs);
        if (!program) return;
        this.program = program;

        this.gl.useProgram(this.program);

        this.aPosition = this.gl.getAttribLocation(this.program, "aPosition");
        this.aTexCoord = this.gl.getAttribLocation(this.program, "aTexCoord");
        this.uMatrix = this.gl.getUniformLocation(this.program, "uMatrix");
        this.uResolution = this.gl.getUniformLocation(this.program, "uResolution");
        this.uImage = this.gl.getUniformLocation(this.program, "uImage");
        this.uColor = this.gl.getUniformLocation(this.program, "uColor"); // For tinting/FillRect

        this.gl.uniform2f(this.uResolution, this.width, this.height);
        this.gl.uniformMatrix3fv(this.uMatrix, false, this.currentMatrix);
        this.gl.uniform4f(this.uColor, 1, 1, 1, 1);
    }

    compileShader(type: number, source: string): WebGLShader | null {
        const shader = this.gl.createShader(type);
        if (!shader) return null;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error(this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    createProgram(vs: WebGLShader, fs: WebGLShader): WebGLProgram | null {
        const program = this.gl.createProgram();
        if (!program) return null;
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error(this.gl.getProgramInfoLog(program));
            return null;
        }
        return program;
    }

    initBuffers(): void {
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.DYNAMIC_DRAW);
    }

    /**
     * Updates the renderer resolution.
     */
    UpdateResolution(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.gl.viewport(0, 0, width, height);
        this.gl.uniform2f(this.uResolution, width, height);

        this.pathCanvas.width = width;
        this.pathCanvas.height = height;
    }

    /**
     * Flushes the current batch of quads to the GPU.
     */
    flush(): void {
        if (this.quadCount === 0) return;

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        // Only update data that we used
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.vertices.subarray(0, this.quadCount * 6 * this.vertexSize));

        this.gl.vertexAttribPointer(this.aPosition, 2, this.gl.FLOAT, false, this.vertexSize * 4, 0);
        this.gl.enableVertexAttribArray(this.aPosition);

        this.gl.vertexAttribPointer(this.aTexCoord, 2, this.gl.FLOAT, false, this.vertexSize * 4, 2 * 4);
        this.gl.enableVertexAttribArray(this.aTexCoord);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.quadCount * 6);

        const err = this.gl.getError();
        if (err !== this.gl.NO_ERROR) {
            console.error("WebGL Draw Error:", err);
        }

        this.quadCount = 0;
        this.vertexPtr = 0;
    }

    getTexture(image: HTMLImageElement | HTMLCanvasElement): WebGLTexture {
        // Handle HTMLImageElement or Canvas
        let tex = this.textureCache.get(image);
        if (!tex) {
            tex = this.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
            this.textureCache.set(image, tex);
        }
        return tex;
    }

    switchTexture(tex: WebGLTexture): void {
        if (this.currentTexture !== tex) {
            this.flush();
            this.currentTexture = tex;
            this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
        }
    }

    // --- Styling for Paths ---

    SetFillStyle(style: string | CanvasGradient | CanvasPattern): void {
        this.pathContext.fillStyle = style;
    }

    SetStrokeStyle(style: string | CanvasGradient | CanvasPattern): void {
        this.pathContext.strokeStyle = style;
    }

    SetLineWidth(width: number): void {
        this.pathContext.lineWidth = width;
    }

    SetLineJoin(join: CanvasLineJoin): void {
        this.pathContext.lineJoin = join;
    }

    SetGlobalAlpha(alpha: number): void {
        this.pathContext.globalAlpha = alpha;
        // Optimization: We could also apply this to WebGL uColor, 
        // but for now we focus on path context compatibility.
    }

    CreateLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
        return this.pathContext.createLinearGradient(x0, y0, x1, y1);
    }


    // --- Renderer API Implementation ---

    /**
     * Draws an image.
     */
    DrawImage(image: HTMLImageElement | HTMLCanvasElement, x: number, y: number, width?: number, height?: number, sx?: number, sy?: number, sWidth?: number, sHeight?: number): void {
        if (!image.width || !image.height) return;

        // Argument unification logic similar to Canvas2D
        let dx = x, dy = y, dw = width || image.width, dh = height || image.height;
        let sourceX = sx || 0, sourceY = sy || 0, sourceW = sWidth || image.width, sourceH = sHeight || image.height;

        // If sx is undefined (3 args: image, x, y)
        if (sx === undefined) {
            sourceX = 0;
            sourceY = 0;
            sourceW = image.width;
            sourceH = image.height;

            if (width === undefined) {
                dw = image.width;
                dh = image.height;
            }
        }

        const tex = this.getTexture(image);
        this.switchTexture(tex);
        this.gl.uniform4f(this.uColor, 1, 1, 1, 1); // Reset tint to white

        this.addQuad(dx, dy, dw, dh, sourceX, sourceY, sourceW, sourceH, image.width, image.height);
    }

    /**
     * Fills a rectangle with a color.
     */
    FillRect(x: number, y: number, width: number, height: number, color?: string): void {
        if (color) {
            if (this.quadCount > 0) {
                this.flush(); // Barrier: Ensure pending batches are drawn before we change global uniforms (uColor)
            }

            this.switchTexture(this.whiteTexture);

            const c = this.parseColor(color);
            this.gl.uniform4f(this.uColor, c[0], c[1], c[2], c[3]);

            this.addQuad(x, y, width, height, 0, 0, 1, 1, 1, 1);
            this.flush(); // Flush immediately to reset color scene
            this.gl.uniform4f(this.uColor, 1, 1, 1, 1);
        } else {
            // Fallback to path context to support current fillStyle (gradients, etc)
            this.pathContext.fillRect(x, y, width, height);
            this.pathDirty = true;
            this.uploadPathCanvas();
        }
    }

    parseColor(color: string): number[] {
        if (!color) return [0, 0, 0, 1];
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const bigint = parseInt(hex, 16);
            const r = (bigint >> 16) & 255;
            const g = (bigint >> 8) & 255;
            const b = bigint & 255;
            return [r / 255, g / 255, b / 255, 1];
        } else if (color.startsWith('rgb')) {
            const parts = color.match(/[\d.]+/g);
            if (parts) {
                return [parseFloat(parts[0]) / 255, parseFloat(parts[1]) / 255, parseFloat(parts[2]) / 255, (parts[3] !== undefined ? parseFloat(parts[3]) : 1)];
            }
        }
        return [1, 1, 1, 1];
    }

    addQuad(x: number, y: number, w: number, h: number, u: number, v: number, uw: number, vh: number, texW: number, texH: number): void {
        if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) {
            console.error("WebGLRenderer: NaN detected in addQuad arguments", { x, y, w, h, u, v, uw, vh });
            return;
        }

        if (this.quadCount >= this.maxQuads) {
            this.flush();
        }

        const x1 = x;
        const y1 = y;
        const x2 = x + w;
        const y2 = y + h;

        const u1 = u / texW;
        const v1 = v / texH;
        const u2 = (u + uw) / texW;
        const v2 = (v + vh) / texH;

        // Transform vertices by current matrix on CPU
        const m = this.currentMatrix;

        // Inline efficient pushing
        // Vertex 1
        this.vertices[this.vertexPtr++] = x1 * m[0] + y1 * m[3] + m[6];
        this.vertices[this.vertexPtr++] = x1 * m[1] + y1 * m[4] + m[7];
        this.vertices[this.vertexPtr++] = u1;
        this.vertices[this.vertexPtr++] = v1;

        // Vertex 2
        this.vertices[this.vertexPtr++] = x2 * m[0] + y1 * m[3] + m[6];
        this.vertices[this.vertexPtr++] = x2 * m[1] + y1 * m[4] + m[7];
        this.vertices[this.vertexPtr++] = u2;
        this.vertices[this.vertexPtr++] = v1;

        // Vertex 3
        this.vertices[this.vertexPtr++] = x1 * m[0] + y2 * m[3] + m[6];
        this.vertices[this.vertexPtr++] = x1 * m[1] + y2 * m[4] + m[7];
        this.vertices[this.vertexPtr++] = u1;
        this.vertices[this.vertexPtr++] = v2;

        // Vertex 4 (Same as 3)
        this.vertices[this.vertexPtr++] = x1 * m[0] + y2 * m[3] + m[6];
        this.vertices[this.vertexPtr++] = x1 * m[1] + y2 * m[4] + m[7];
        this.vertices[this.vertexPtr++] = u1;
        this.vertices[this.vertexPtr++] = v2;

        // Vertex 5 (Same as 2)
        this.vertices[this.vertexPtr++] = x2 * m[0] + y1 * m[3] + m[6];
        this.vertices[this.vertexPtr++] = x2 * m[1] + y1 * m[4] + m[7];
        this.vertices[this.vertexPtr++] = u2;
        this.vertices[this.vertexPtr++] = v1;

        // Vertex 6
        this.vertices[this.vertexPtr++] = x2 * m[0] + y2 * m[3] + m[6];
        this.vertices[this.vertexPtr++] = x2 * m[1] + y2 * m[4] + m[7];
        this.vertices[this.vertexPtr++] = u2;
        this.vertices[this.vertexPtr++] = v2;

        this.quadCount++;
    }

    /**
     * Clears the screen.
     */
    Clear(color?: string): void {
        // Reset matrix stack to Identity for new frame
        this.currentMatrix = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        this.matrixStack = [this.currentMatrix];

        if (color) {
            const c = this.parseColor(color);
            this.gl.clearColor(c[0], c[1], c[2], c[3]);
        } else {
            this.gl.clearColor(0, 0, 0, 0);
        }
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    /**
     * Saves the current transformation matrix.
     */
    /**
     * Saves the current transformation matrix and scissor state.
     */
    Save(): void {
        // Clone current matrix
        var copy = new Float32Array(this.currentMatrix);
        this.matrixStack.push(copy);
        this.currentMatrix = copy;

        // Save scissor
        this.scissorStack.push(this.currentScissor ? { ...this.currentScissor } : null);
    }

    /**
     * Restores the previous transformation matrix and scissor state.
     */
    Restore(): void {
        if (this.matrixStack.length > 1) {
            this.matrixStack.pop();
            this.currentMatrix = this.matrixStack[this.matrixStack.length - 1];
        }

        if (this.scissorStack.length > 0) {
            this.currentScissor = this.scissorStack.pop() || null;
            this.applyScissor();
        }
    }

    ClipRect(x: number, y: number, width: number, height: number): void {
        // Transform rect by current matrix to get screen coords?
        // Canvas2D clip() applies to transformed path.
        // But gl.scissor is in window coordinates (pixels).
        // Since we are simulating Canvas2D, we should probably transform the rect.
        // However, standard simplified 2D engines often assume clip rects are axis aligned in screen space or local space.
        // If we have rotation, strict scissor won't work.
        // Assuming no rotation (tycoon game), we can just transform x,y by matrix translation/scale.

        const m = this.currentMatrix;
        // x' = x*m0 + y*m1 + m2
        // y' = x*m3 + y*m4 + m5

        // Simple transform of top-left and bottom-right?
        // Only works if no rotation.
        // We assume scale and translate only.

        let tx = x * m[0] + y * m[3] + m[6];
        let ty = x * m[1] + y * m[4] + m[7];

        // We need width/height scale too
        // Scale x is related to m[0], Scale y to m[4] roughly.
        let tw = width * m[0];
        let th = height * m[4];

        const newRect = { x: tx, y: ty, w: tw, h: th };

        if (this.currentScissor) {
            // Intersect
            const x1 = Math.max(this.currentScissor.x, newRect.x);
            const y1 = Math.max(this.currentScissor.y, newRect.y);
            const x2 = Math.min(this.currentScissor.x + this.currentScissor.w, newRect.x + newRect.w);
            const y2 = Math.min(this.currentScissor.y + this.currentScissor.h, newRect.y + newRect.h);

            this.currentScissor = { x: x1, y: y1, w: Math.max(0, x2 - x1), h: Math.max(0, y2 - y1) };
        } else {
            this.currentScissor = newRect;
        }

        this.applyScissor();
    }

    applyScissor(): void {
        this.flush();
        if (this.currentScissor && this.currentScissor.w > 0 && this.currentScissor.h > 0) {
            this.gl.enable(this.gl.SCISSOR_TEST);
            // WebGL Scissor Y is from bottom
            this.gl.scissor(this.currentScissor.x, this.height - this.currentScissor.y - this.currentScissor.h, this.currentScissor.w, this.currentScissor.h);
        } else {
            if (this.currentScissor) {
                // Enabled but empty?
                this.gl.enable(this.gl.SCISSOR_TEST);
                this.gl.scissor(0, 0, 0, 0);
            } else {
                this.gl.disable(this.gl.SCISSOR_TEST);
            }
        }
    }

    /**
     * Scales the current transformation.
     */
    Scale(x: number, y: number): void {
        const m = this.currentMatrix;
        m[0] *= x;
        m[1] *= x;
        m[2] *= x;

        m[3] *= y;
        m[4] *= y;
        m[5] *= y;
    }

    /**
     * Translates the current transformation.
     */
    Translate(x: number, y: number): void {
        const m = this.currentMatrix;
        m[6] = m[0] * x + m[3] * y + m[6];
        m[7] = m[1] * x + m[4] * y + m[7];
        m[8] = m[2] * x + m[5] * y + m[8]; // Should remain 1
    }

    // --- Path API (Compatibility Mode) ---

    BeginPath(): void {
        this.flush(); // Finish rendering WebGL content before switching to path recording
        this.pathContext.setTransform(1, 0, 0, 1, 0, 0); // Reset for manual transform application or just copy
        // Actually, we should sync the transform.
        this.syncPathTransform();
        this.pathContext.beginPath();
        this.pathDirty = true;
    }

    syncPathTransform(): void {
        // Copy current WebGL matrix to 2D context
        const m = this.currentMatrix;
        // setTransform(a, b, c, d, e, f)
        // m00, m10, m01, m11, m20, m21
        // [0], [1], [3], [4], [6], [7]
        this.pathContext.setTransform(m[0], m[1], m[3], m[4], m[6], m[7]);
    }

    MoveTo(x: number, y: number): void {
        this.pathContext.moveTo(x, y);
    }

    LineTo(x: number, y: number): void {
        this.pathContext.lineTo(x, y);
    }

    ClosePath(): void {
        this.pathContext.closePath();
    }

    Fill(): void {
        this.pathContext.fill();
        this.uploadPathCanvas();
    }



    uploadPathCanvas(): void {
        // This is expensive but correct for compatibility
        // Bind the path canvas as texture and draw it full screen over everything
        if (!this.pathDirty) return;

        this.switchTexture(this.pathTexture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.pathCanvas);

        this.gl.uniform4f(this.uColor, 1, 1, 1, 1);

        // Reset matrix to identity for full screen draw
        // We need to temporarily bypass the currentMatrix for this draw

        var oldMatrix = new Float32Array(this.currentMatrix);
        this.currentMatrix.set([1, 0, 0, 0, 1, 0, 0, 0, 1]); // Identity

        this.addQuad(0, 0, this.width, this.height, 0, 0, this.width, this.height, this.width, this.height); // UVs 0..1
        this.flush();

        this.currentMatrix.set(oldMatrix);

        this.pathContext.setTransform(1, 0, 0, 1, 0, 0);
        this.pathContext.clearRect(0, 0, this.width, this.height);
        this.pathDirty = false;
    }

    // --- Text Rendering (Delegated) ---

    DrawText(text: string, x: number, y: number): void {
        this.pathContext.fillText(text, x, y);
        this.uploadPathCanvas(); // Helper to make sure it draws immediately or mark dirty?
        // Wait, uploadPathCanvas only uploads if pathDirty is true.
        // We should set pathDirty = true here.
        this.pathDirty = true;
        // We probably should not upload immediately for performance if multiple texts are drawn.
        // But since we don't have a flush loop for text, we might need to rely on the next call to upload.
        // However, if we mix text and images, we need layer ordering.
        // existing Fill() calls uploadPathCanvas().
        // Let's call uploadPathCanvas() immediately to act like a draw call.
        this.uploadPathCanvas();
    }

    MeasureText(text: string): TextMetrics {
        return this.pathContext.measureText(text);
    }

    SetFont(font: string): void {
        this.pathContext.font = font;
    }

    SetTextAlign(align: CanvasTextAlign): void {
        this.pathContext.textAlign = align;
    }

    SetTextBaseline(baseline: CanvasTextBaseline): void {
        this.pathContext.textBaseline = baseline;
    }

    // --- Path Extensions ---

    StrokeRect(x: number, y: number, width: number, height: number): void {
        this.pathContext.strokeRect(x, y, width, height);
        this.pathDirty = true;
        this.uploadPathCanvas();
    }

    RoundRect(x: number, y: number, width: number, height: number, radius: number | number[]): void {
        if (typeof this.pathContext.roundRect === 'function') {
            this.pathContext.roundRect(x, y, width, height, radius);
        } else {
            if (typeof radius === 'number') {
                this.pathContext.moveTo(x + radius, y);
                this.pathContext.lineTo(x + width - radius, y);
                this.pathContext.quadraticCurveTo(x + width, y, x + width, y + radius);
                this.pathContext.lineTo(x + width, y + height - radius);
                this.pathContext.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                this.pathContext.lineTo(x + radius, y + height);
                this.pathContext.quadraticCurveTo(x, y + height, x, y + height - radius);
                this.pathContext.lineTo(x, y + radius);
                this.pathContext.quadraticCurveTo(x, y, x + radius, y);
            }
        }
    }

    QuadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.pathContext.quadraticCurveTo(cpx, cpy, x, y);
    }

    Arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        this.pathContext.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    }

    Stroke(): void {
        this.pathContext.stroke();
        this.pathDirty = true;
        this.uploadPathCanvas();
    }
}
