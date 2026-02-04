import { GameScene } from '@/engine/scene/gameScene';
import { Renderer } from '@/engine/renderer/renderer';
import { SceneGame } from '@/code/scenes/game';
import { instance as game } from '@/code/scenes/game/GameManager';
import { FONTS } from '@/code/Options';
import { Button } from '@/code/objects/Button';
import { Label } from '@/code/objects/Label';
import { TextBox } from '@/code/objects/TextBox';
import { Canvas2DRenderer } from '@/engine/renderer/canvas2dRenderer';
import { GameSceneContext } from '@/engine/scene/gameSceneContext';

export class SceneLogin extends GameScene {
    private loggedIn: boolean = false;
    private savedToken: string = "";
    private savedUrl: string = "";

    private txtToken: TextBox | null = null;
    private txtUrl: TextBox | null = null;
    private lblStatus: Label | null = null;

    constructor() {
        super();
    }

    public Enter(): void {
        super.Enter();
        this.savedToken = localStorage.getItem('tycoon_token') || "";
        this.savedUrl = localStorage.getItem('tycoon_url') || "";
        this.InitUI();
    }

    public Exit(): void {
        if (this.txtToken) this.txtToken.Dispose();
        if (this.txtUrl) this.txtUrl.Dispose();
        super.Exit();
    }

    private InitUI() {
        this.uiObjects.Clear();

        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;

        const title = new Label(cx, cy - 180, "VƯƠNG QUỐC TYCOON", "#facc15", `bold 48px ${FONTS.main}`);
        title.align = "center";
        // Add shadow to title
        // Note: ObjLabel doesn't support shadow directly but we can simulate or just rely on text
        this.AddUIObject(title);

        const sub = new Label(cx, cy - 130, "Cloud Edition", "#94a3b8", `24px ${FONTS.main}`);
        sub.align = "center";
        this.AddUIObject(sub);

        // Token Input
        const lblToken = new Label(cx - 150, cy - 70, "Token:", "white", `20px ${FONTS.main}`);
        this.AddUIObject(lblToken);

        this.txtToken = new TextBox(cx - 80, cy - 85, 300, 36, this.savedToken);
        this.txtToken.placeholder = "Nhập Token (Upstash Redis)...";
        this.txtToken.isPassword = true; // Mask by default
        this.AddUIObject(this.txtToken);

        // URL Input
        const lblUrl = new Label(cx - 150, cy - 10, "URL:", "white", `20px ${FONTS.main}`);
        this.AddUIObject(lblUrl);

        this.txtUrl = new TextBox(cx - 80, cy - 25, 300, 36, this.savedUrl);
        this.txtUrl.placeholder = "Nhập Rest URL...";
        this.AddUIObject(this.txtUrl);

        // Login Button
        // Glossy Green
        const btnLogin = new Button(cx - 100, cy + 50, 200, 50, "BẮT ĐẦU GAME");
        btnLogin.bgColor = "#16a34a"; // Green
        btnLogin.hoverColor = "#15803d";
        btnLogin.onClick = () => this.HandleLogin();
        this.AddUIObject(btnLogin);



        this.lblStatus = new Label(cx, cy + 180, "", "#ef4444", `16px ${FONTS.main}`);
        this.lblStatus.align = "center";
        this.AddUIObject(this.lblStatus);
    }

    private isChecking: boolean = false;

    private async HandleLogin() {
        if (this.isChecking) return;

        const token = this.txtToken?.text.trim() || "";
        const url = this.txtUrl?.text.trim() || "";

        if (!token) {
            if (this.lblStatus) this.lblStatus.text = "Vui lòng nhập Token!";
            return;
        }

        if (token === 'demo') {
            game.cloud.login('demo', '');
            this.loggedIn = true;
            return;
        }

        if (!url) {
            if (this.lblStatus) this.lblStatus.text = "Vui lòng nhập URL!";
            return;
        }

        // Start checking
        this.isChecking = true;
        if (this.lblStatus) this.lblStatus.text = "Đang kết nối Cloud...";

        // 1. Set credentials immediately (stores them for usage)
        game.cloud.login(token, url);

        // 2. Verify them
        const isValid = await game.cloud.verifyCredentials();

        if (isValid) {
            if (this.lblStatus) this.lblStatus.text = "Đăng nhập thành công!";
            // Load data before switching? Or switch then load?
            // Switch then load is usually better for UI feedback, 
            // but we might want to ensure we CAN load.
            // verifyCredentials proved we can connect.
            this.loggedIn = true;
            game.cloud.load();
        } else {
            if (this.lblStatus) this.lblStatus.text = "Lỗi: Token hoặc URL không hợp lệ!";
            // Maybe clear them from cloud client if invalid to prevent accidental usage?
            // game.cloud.logout() would reload page, so maybe just leave them or overwrite.
        }

        this.isChecking = false;
    }

    public Update(delta: number): void {
        super.Update(delta);
    }

    public CheckForChange(context: GameSceneContext): void {
        if (this.loggedIn) {
            context.ChangeScene(new SceneGame());
        }
    }

    public Draw(renderer: Renderer): void {
        const w = renderer.width;
        const h = renderer.height;

        // Linear gradient background (approximate radial)
        const grad = renderer.CreateLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#1e293b"); // Top
        grad.addColorStop(1, "#0f172a"); // Bottom
        renderer.SetFillStyle(grad);
        renderer.FillRect(0, 0, w, h);

        // Optional pattern grid
        renderer.Save();
        renderer.SetStrokeStyle("rgba(255, 255, 255, 0.03)");
        renderer.SetLineWidth(1);
        const gridSize = 40;
        renderer.BeginPath();
        for (let x = 0; x < w; x += gridSize) {
            renderer.MoveTo(x, 0);
            renderer.LineTo(x, h);
        }
        for (let y = 0; y < h; y += gridSize) {
            renderer.MoveTo(0, y);
            renderer.LineTo(w, y);
        }
        renderer.Stroke();
        renderer.Restore();

        super.Draw(renderer);
    }
}
