import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { MouseInput } from "@/engine/input/mouseInput";

export class ImageButton extends GameObject {
    public width: number;
    public height: number;
    public image: HTMLImageElement | null = null;
    public imageLoaded: boolean = false;
    public hoverImage: HTMLImageElement | null = null;
    public hoverImageLoaded: boolean = false;

    public bgColor: string = "#1e293b";
    public hoverColor: string = "#334155";
    public borderColor: string = "#475569";
    public hoverBorderColor: string = "#94a3b8";
    public showBackground: boolean = true;

    public onClick: () => void = () => { };
    public isHovered: boolean = false;
    public disabled: boolean = false;

    private wasMouseDown: boolean = false;
    private imageSrc: string = "";
    private hoverImageSrc: string = "";
    private padding: number = 4;

    constructor(x: number, y: number, width: number, height: number, imageSrc: string, hoverImageSrc?: string) {
        super(x, y);
        this.width = width;
        this.height = height;
        this.Layer = 1; // UI layer
        this.ZOrder = 1000;

        this.setImage(imageSrc);
        if (hoverImageSrc) {
            this.setHoverImage(hoverImageSrc);
        }
    }

    /**
     * Set the image source for the button
     * @param src - Path to the image file
     */
    public setImage(src: string): void {
        this.imageSrc = src;
        this.imageLoaded = false;

        this.image = new Image();
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.onerror = () => {
            console.warn(`ImageButton: Failed to load image: ${src}`);
            this.imageLoaded = false;
        };
        this.image.src = src;
    }

    /**
     * Set the image directly from an HTMLImageElement
     * @param img - Pre-loaded HTMLImageElement
     */
    public setImageElement(img: HTMLImageElement): void {
        this.image = img;
        this.imageLoaded = img.complete && img.naturalWidth > 0;
    }

    /**
     * Set the hover image source for the button (optional)
     * @param src - Path to the hover image file
     */
    public setHoverImage(src: string): void {
        this.hoverImageSrc = src;
        this.hoverImageLoaded = false;

        this.hoverImage = new Image();
        this.hoverImage.onload = () => {
            this.hoverImageLoaded = true;
        };
        this.hoverImage.onerror = () => {
            console.warn(`ImageButton: Failed to load hover image: ${src}`);
            this.hoverImageLoaded = false;
        };
        this.hoverImage.src = src;
    }

    /**
     * Set the hover image directly from an HTMLImageElement
     * @param img - Pre-loaded HTMLImageElement
     */
    public setHoverImageElement(img: HTMLImageElement): void {
        this.hoverImage = img;
        this.hoverImageLoaded = img.complete && img.naturalWidth > 0;
    }

    public Update(delta: number): void {
        const domCanvas = document.getElementById('game-canvas');
        if (!domCanvas) return;
        const rect = domCanvas.getBoundingClientRect();

        const mx = MouseInput.X - rect.left;
        const my = MouseInput.Y - rect.top;

        if (mx >= this.x && mx <= this.x + this.width &&
            my >= this.y && my <= this.y + this.height) {
            this.isHovered = true;

            // Only trigger click if not disabled
            if (!this.disabled && !MouseInput.IsButtonDown(0) && this.wasMouseDown) {
                this.onClick();
            }
        } else {
            this.isHovered = false;
        }

        this.wasMouseDown = MouseInput.IsButtonDown(0);
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        if (!this.visible) return;

        const width = this.width;
        const height = this.height;

        // Only draw background and border if showBackground is true
        if (this.showBackground) {
            // Colors - use grayed out when disabled
            let baseColor = this.isHovered && !this.disabled ? this.hoverColor : this.bgColor;
            const isPressed = this.isHovered && MouseInput.IsButtonDown(0) && !this.disabled;

            if (this.disabled) {
                baseColor = "#3f3f46"; // Gray when disabled
            }

            // Define rounded rect path
            const radius = 8;
            renderer.BeginPath();
            renderer.RoundRect(this.x, this.y, width, height, radius);
            renderer.ClosePath();

            // 1. Fill Background
            const grad = renderer.CreateLinearGradient(this.x, this.y, this.x, this.y + height);
            if (isPressed) {
                grad.addColorStop(0, "#0f172a");
                grad.addColorStop(1, "#334155");
                renderer.SetFillStyle(grad);
                renderer.Fill();
            } else {
                // Base color fill
                renderer.SetFillStyle(baseColor);
                renderer.Fill();

                // Gloss effect (white gradient top to bottom fade) - only for enabled
                if (!this.disabled) {
                    const glossGrad = renderer.CreateLinearGradient(this.x, this.y, this.x, this.y + height / 2);
                    glossGrad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
                    glossGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");

                    renderer.SetFillStyle(glossGrad);
                    renderer.Fill();
                }
            }

            // 2. Stroke / Border
            renderer.SetLineWidth(2);
            renderer.SetStrokeStyle(this.disabled ? "#52525b" : (this.isHovered ? this.hoverBorderColor : this.borderColor));
            renderer.Stroke();
        }

        // 3. Draw Image
        // Determine which image to draw (hover image if hovered and available)
        const useHoverImage = this.isHovered && !this.disabled && this.hoverImage && this.hoverImageLoaded;
        const currentImage = useHoverImage ? this.hoverImage : this.image;
        const isImageLoaded = useHoverImage ? this.hoverImageLoaded : this.imageLoaded;

        if (currentImage && isImageLoaded) {
            // Use padding only when background is shown
            const pad = this.showBackground ? this.padding : 0;
            const imgWidth = width - pad * 2;
            const imgHeight = height - pad * 2;
            const imgX = this.x + pad;
            const imgY = this.y + pad;

            // Apply grayscale for disabled state using globalAlpha
            if (this.disabled) {
                renderer.SetGlobalAlpha(0.4);
            }

            renderer.DrawImage(currentImage, imgX, imgY, imgWidth, imgHeight);

            if (this.disabled) {
                renderer.SetGlobalAlpha(1.0);
            }
        }
    }
}
