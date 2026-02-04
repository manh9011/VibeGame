import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Button } from "@/code/objects/Button";
import { Label } from "@/code/objects/Label";
import { FONTS } from "@/code/Options";

export class ObjMarketItem extends GameObject {
    public width: number = 380;
    public height: number = 60;

    private lblName: Label;
    private lblPrice: Label;
    private btnBuy: Button;
    private btnSell: Button;

    constructor(res: string, icon: string, currentPrice: number, onBuy: () => void, onSell: () => void) {
        super(0, 0);

        this.lblName = new Label(10, 20, `${icon} ${res.toUpperCase()}`, "white", `bold 20px ${FONTS.emoji}`);
        this.lblPrice = new Label(140, 20, `Giá: ${currentPrice}`, "#facc15");

        this.btnBuy = new Button(230, 15, 60, 30, "Mua 10");
        this.btnBuy.bgColor = "#166534";
        this.btnBuy.onClick = onBuy;

        this.btnSell = new Button(300, 15, 60, 30, "Bán 10");
        this.btnSell.bgColor = "#991b1b";
        this.btnSell.onClick = onSell;
    }

    public SetPrice(price: number) {
        this.lblPrice.text = `Giá: ${price}`;
    }

    public Update(delta: number): void {
        this.lblName.x = this.x + 10;
        this.lblName.y = this.y + 20;

        this.lblPrice.x = this.x + 140;
        this.lblPrice.y = this.y + 20;

        this.btnBuy.x = this.x + 230;
        this.btnBuy.y = this.y + 15;
        this.btnBuy.Update(delta);

        this.btnSell.x = this.x + 300;
        this.btnSell.y = this.y + 15;
        this.btnSell.Update(delta);
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        this.lblName.Draw(renderer, camera);
        this.lblPrice.Draw(renderer, camera);
        this.btnBuy.Draw(renderer, camera);
        this.btnSell.Draw(renderer, camera);

        // Separator
        const ctx = (renderer as any).context;
        if (ctx) {
            ctx.fillStyle = "#334155";
            ctx.fillRect(this.x, this.y + this.height - 1, this.width, 1);
        }
    }
}
