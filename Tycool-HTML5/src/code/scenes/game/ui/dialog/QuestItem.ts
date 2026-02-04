import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Button } from "@/code/objects/Button";
import { Label } from "@/code/objects/Label";
import { Combobox } from "@/code/objects/Combobox";
import { FONTS } from "@/code/Options";

export class QuestItem extends GameObject {
    public width: number = 460;
    public height: number = 90;

    private lblInfo: Label;
    private lblRewards: Label;
    public comboHero: Combobox;
    private btnStart: Button;

    constructor(questData: any, idleHeroes: any[], onStart: (heroId: number) => void) {
        super(0, 0);

        const info = `${questData.name} (Lv.${questData.level}) - ⏱️${questData.duration}s`;
        const rewards = `Thưởng: 💰${questData.reward.gold || 0} ⭐${questData.reward.fame || 0}`;

        this.lblInfo = new Label(10, 10, info, "white", `bold 16px ${FONTS.main}`);
        this.lblRewards = new Label(10, 30, rewards, "#86efac", `12px ${FONTS.main}`);

        // Combobox
        this.comboHero = new Combobox(10, 50, 200, 30);
        this.comboHero.AddOption("-- Chọn Hero --", null);
        idleHeroes.forEach(h => {
            this.comboHero.AddOption(`${h.name} (Lv.${h.level})`, h.id);
        });

        this.btnStart = new Button(220, 50, 80, 30, "Bắt đầu");
        this.btnStart.bgColor = "#2563eb";
        this.btnStart.onClick = () => {
            const val = this.comboHero.GetValue();
            if (val) {
                onStart(val);
            } else {
                // Maybe callback with null to handle error UI logic up top?
                onStart(0);
            }
        };
    }

    public Update(delta: number): void {
        this.lblInfo.x = this.x + 10;
        this.lblInfo.y = this.y + 10;

        this.lblRewards.x = this.x + 10;
        this.lblRewards.y = this.y + 30;

        this.comboHero.x = this.x + 10;
        this.comboHero.y = this.y + 50;

        this.btnStart.x = this.x + 220;
        this.btnStart.y = this.y + 50;

        this.comboHero.Update(delta);
        this.btnStart.Update(delta);
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        this.lblInfo.Draw(renderer, camera);
        this.lblRewards.Draw(renderer, camera);
        this.btnStart.Draw(renderer, camera);

        // Draw Combobox Last so dropdown handles z-order locally? 
        // Actually ObJCombobox manages its own dropdown layer often or needs high Z.
        // If it's a child of ListView, z-order might be tricky if clipped.
        // But for now let's draw it here.
        this.comboHero.Draw(renderer, camera);

        // Divider
        const ctx = (renderer as any).context;
        if (ctx) {
            ctx.fillStyle = "#334155";
            ctx.fillRect(this.x, this.y + this.height - 1, this.width, 1);
        }
    }
}
