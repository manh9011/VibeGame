import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Button } from "@/code/objects/Button";
import { Label } from "@/code/objects/Label";
import { FONTS } from "@/code/Options";

export class HeroItem extends GameObject {
    public width: number = 300;
    public height: number = 60;

    private lblInfo: Label;
    private lblStats: Label;
    private btnAction: Button | null = null;

    constructor(data: any, actionLabel: string = "", onAction: () => void = () => { }) {
        super(0, 0);

        // Data parsing
        const icon = data.icon || "👤";
        const name = data.name || "Unknown";
        const level = data.level ? `(Lv.${data.level})` : `(${data.class || ''})`;
        const stats = data.str ? `⚔️${data.str} 🔮${data.int} - ${data.status || 'Ready'}` : (data.desc || "");

        this.lblInfo = new Label(5, 5, `${icon} ${name} ${level}`, "white", `16px ${FONTS.main}`);
        this.lblStats = new Label(5, 30, stats, "#94a3b8", `12px ${FONTS.main}`);

        if (actionLabel) {
            this.btnAction = new Button(220, 15, 70, 30, actionLabel);
            this.btnAction.bgColor = "#ca8a04";
            this.btnAction.onClick = onAction;
        }

        // Background for item? Optional, helpful for list view visibility
    }

    public Update(delta: number): void {
        this.lblInfo.x = this.x + 5;
        this.lblInfo.y = this.y + 15; // Centered vertically in top half?

        this.lblStats.x = this.x + 5;
        this.lblStats.y = this.y + 40;

        if (this.btnAction) {
            this.btnAction.x = this.x + 220;
            this.btnAction.y = this.y + 15;
            this.btnAction.Update(delta);
        }
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        // Draw background card
        // Maybe in future, for now just text

        this.lblInfo.Draw(renderer, camera);
        this.lblStats.Draw(renderer, camera);
        if (this.btnAction) {
            this.btnAction.Draw(renderer, camera);
        }

        // Separator line?
        // Let's draw a subtle line?
        // Handled by list view spacing usually, but visual separator is nice.
    }
}
