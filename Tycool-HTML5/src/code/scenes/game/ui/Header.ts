import { GameObject } from "@/engine/object/gameObject";
import { Renderer } from "@/engine/renderer/renderer";
import { Camera } from "@/engine/scene/camera";
import { Canvas2DRenderer } from "@/engine/renderer/canvas2dRenderer";
import { instance as game } from "@/code/scenes/game/GameManager";
import { Button } from "@/code/objects/Button";
import { Checkbox } from "@/code/objects/Checkbox";
import { FONTS } from "@/code/Options";

export class Header extends GameObject {
    public height: number = 64;
    private buttons: Button[] = [];
    private debugCheckbox: Checkbox;

    // Debug mode - static so it can be accessed from index.ts
    public static debugOccupied: boolean = false;

    constructor() {
        super(0, 0);
        this.Layer = 1; // UI layer
        this.ZOrder = 5000; // Header is always on top

        const btnSave = new Button(0, 0, 100, 40, "LƯU", "💾");
        btnSave.bgColor = "#15803d";
        btnSave.onClick = () => {
            game.cloud.save();
        };
        this.buttons.push(btnSave);

        const btnReset = new Button(0, 0, 80, 40, "RESET", "🔄");
        btnReset.bgColor = "#dc2626";
        btnReset.onClick = () => {
            if (window.confirm("⚠️ Bạn có chắc muốn XÓA TOÀN BỘ dữ liệu và bắt đầu lại từ đầu không?\n\nHành động này KHÔNG THỂ HOÀN TÁC!")) {
                game.Reset();
            }
        };
        this.buttons.push(btnReset);

        const btnExit = new Button(0, 0, 60, 40, "🚪", "");
        btnExit.bgColor = "#b91c1c";
        btnExit.onClick = () => {
            game.cloud.logout();
        };
        this.buttons.push(btnExit);

        // Debug checkbox
        this.debugCheckbox = new Checkbox(0, 0, "Debug", false);
        this.debugCheckbox.onChange = (checked) => {
            Header.debugOccupied = checked;
        };
    }

    public Update(delta: number): void {
        const width = window.innerWidth;

        const btnSave = this.buttons[0];
        const btnReset = this.buttons[1];
        const btnExit = this.buttons[2];

        btnSave.x = width - 270;
        btnSave.y = 12;

        btnReset.x = width - 160;
        btnReset.y = 12;

        btnExit.x = width - 70;
        btnExit.y = 12;

        // Debug checkbox on right side (before buttons)
        this.debugCheckbox.x = width - 380;
        this.debugCheckbox.y = 20;

        this.buttons.forEach(b => b.Update(delta));
        this.debugCheckbox.Update(delta);
    }

    public Draw(renderer: Renderer, camera: Camera): void {
        const width = renderer.width;

        renderer.FillRect(0, 0, width, this.height, "#0f172a");
        renderer.FillRect(0, this.height - 4, width, 4, "#334155");

        renderer.SetFont(`32px ${FONTS.emoji}`);
        renderer.SetTextAlign("left");
        renderer.SetTextBaseline("middle");
        renderer.SetFillStyle("#facc15");
        renderer.DrawText("🏰", 20, 32);

        renderer.SetFont(`bold 24px ${FONTS.main}`);
        renderer.SetFillStyle("#facc15");
        renderer.DrawText("TYCOON", 60, 32);

        const cx = width / 2;
        const spacing = 110;
        const startX = cx - (spacing * 3);

        this.DrawResource(renderer, startX - spacing, "📅", `Day ${game.scene.time.day}`, "white");
        this.DrawResource(renderer, startX, "👥", game.scene.resources.pop.toString(), "#93c5fd");
        this.DrawResource(renderer, startX + spacing, "💰", game.scene.resources.gold.toString(), "#fde047");
        this.DrawResource(renderer, startX + spacing * 2, "🪵", game.scene.resources.wood.toString(), "#d97706");
        this.DrawResource(renderer, startX + spacing * 3, "🪨", game.scene.resources.stone.toString(), "#9ca3af");
        this.DrawResource(renderer, startX + spacing * 4, "⭐", game.scene.resources.fame.toString(), "#c084fc");
        this.DrawResource(renderer, startX + spacing * 5, "👀", game.scene.stats.visitors.toString(), "#a7f3d0");

        this.buttons.forEach(b => b.Draw(renderer, camera));
        this.debugCheckbox.Draw(renderer, camera);
    }

    private DrawResource(renderer: Renderer, x: number, icon: string, value: string, color: string) {
        renderer.SetFont(`20px ${FONTS.emoji}`);
        renderer.SetFillStyle("white");
        renderer.SetTextAlign("right");
        renderer.DrawText(icon, x, 32);

        renderer.SetFont(`bold 18px ${FONTS.main}`);
        renderer.SetFillStyle(color);
        renderer.SetTextAlign("left");
        renderer.DrawText(value, x + 5, 32);
    }
}
