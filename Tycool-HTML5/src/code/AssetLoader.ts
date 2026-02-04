
export class AssetLoader {
    private static images: Record<string, HTMLImageElement> = {};
    private static loadingPromises: Promise<void>[] = [];

    /**
     * Load an image and cache it.
     */
    public static LoadImage(name: string, path: string): Promise<void> {
        if (this.images[name]) return Promise.resolve();

        const p = new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                this.images[name] = img;
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load asset: ${path}`);
                reject();
            };
        });

        this.loadingPromises.push(p);
        return p;
    }

    public static GetImage(name: string): HTMLImageElement {
        return this.images[name];
    }

    public static async WaitForAll(): Promise<void> {
        await Promise.all(this.loadingPromises);
    }
}
