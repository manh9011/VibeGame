import { instance as game } from '@/code/scenes/game/GameManager';
import { FONTS } from '@/code/Options';
import { Dialog } from '@/code/objects/Dialog';
import { ImageButton } from '@/code/objects/ImageButton';
import { Label } from '@/code/objects/Label';
import { Renderer } from '@/engine/renderer/renderer';
import { Camera } from '@/engine/scene/camera';
import { GameObject } from '@/engine/object/gameObject';
import { Combobox } from '@/code/objects/Combobox';
import { BuildPanel } from '@/code/scenes/game/ui/dialog/BuildDialog';
import { HeroPanel } from '@/code/scenes/game/ui/dialog/HeroDialog';
import { ObjMarketPanel } from '@/code/scenes/game/ui/dialog/MarketDialog';
import { QuestPanel } from '@/code/scenes/game/ui/dialog/QuestDialog';
import { ListView } from '@/code/objects/ListView';

export class UIManager extends GameObject {
    public mainButtons: ImageButton[] = [];
    public panels: { [key: string]: Dialog } = {};
    public labels: Label[] = [];
    public notifications: Label[] = [];
    public floatingTexts: Label[] = [];

    constructor() {
        super(0, 0);
        this.Layer = 1; // UI layer
        this.ZOrder = 3000;
        this.InitHUD();
        this.InitPanels();
    }

    public Init() {
        (window as any).ui = this;
        game.onNotify = (msg, type) => this.Notify(msg, type);
    }

    private InitHUD() {
        const createMenuBtn = (iconName: string, panelId: string) => {
            const btn = new ImageButton(
                0, 0, 64, 64,
                `/images/icon-${iconName}.png`,
                `/images/icon-${iconName}-hover.png`
            );
            btn.showBackground = false;
            btn.onClick = () => this.TogglePanel(panelId);
            this.mainButtons.push(btn);
        };

        createMenuBtn("build", "build");
        createMenuBtn("hero", "hero");
        createMenuBtn("quest", "quest");
        createMenuBtn("trade", "market");
    }

    private InitPanels() {
        this.panels['build'] = new BuildPanel(this);
        this.panels['hero'] = new HeroPanel();
        this.panels['market'] = new ObjMarketPanel();
        this.panels['quest'] = new QuestPanel(this);
    }

    public Update(delta: number) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Scale button size based on screen height (64px base for 720p, scales up for larger screens)
        const baseSize = 64;
        const scaleFactor = Math.min(height / 720, 1.5); // Cap at 1.5x
        const btnSize = Math.floor(baseSize * scaleFactor);
        const gap = Math.floor(8 * scaleFactor);
        const margin = Math.floor(16 * scaleFactor);
        const startX = margin;
        const startY = height - btnSize - margin;

        if (game.scene.selection.mode !== 'build') {
            this.mainButtons.forEach((b, i) => {
                b.width = btnSize;
                b.height = btnSize;
                b.x = startX + (i * (btnSize + gap));
                b.y = startY;
                b.Update(1);
            });
        }

        if (this.panels['market'].active) {
            (this.panels['market'] as ObjMarketPanel).UpdatePrices();
        }

        Object.values(this.panels).forEach(p => p.Update(1));

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const f = this.floatingTexts[i];
            f.y += (f as any).velocityY;
            (f as any).life -= 1;
        }
        this.floatingTexts = this.floatingTexts.filter(f => (f as any).life > 0);
    }

    public HasActivePanel(): boolean {
        return Object.values(this.panels).some(p => p.active);
    }

    public TogglePanel(id: string) {
        const p = this.panels[id];
        if (!p) return;

        if (p.active) {
            this.CloseAllPanels();
        } else {
            this.CloseAllPanels();
            p.active = true;

            const width = window.innerWidth;
            const height = window.innerHeight;
            p.x = Math.floor((width - p.width) / 2);
            p.y = Math.floor((height - p.height) / 2);

            if ((p as any).Refresh) (p as any).Refresh();
        }
    }

    public CloseAllPanels() {
        Object.values(this.panels).forEach(p => p.active = false);
    }

    public Draw(renderer: Renderer, camera: Camera) {
        // Draw floating texts first (behinds UI)
        this.floatingTexts.forEach(f => f.Draw(renderer, camera));

        if (this.HasActivePanel()) {
            renderer.SetFillStyle("rgba(0,0,0,0.6)");
            renderer.FillRect(0, 0, renderer.width, renderer.height, "rgba(0,0,0,0.6)");
        }

        this.labels.forEach(l => l.Draw(renderer, camera));

        if (game.scene.selection.mode !== 'build') {
            this.mainButtons.forEach(b => b.Draw(renderer, camera));
        }

        Object.values(this.panels).forEach(p => p.Draw(renderer, camera));

        this.DrawTopLayer(renderer, camera);
        this.DrawNotifications(renderer, camera);
    }

    private DrawNotifications(renderer: Renderer, camera: Camera) {
        if (this.notifications.length === 0) return;

        let y = 80;
        const x = renderer.width - 250;

        this.notifications.forEach((n, i) => {
            renderer.FillRect(x - 10, y - 5, 240, 30, (n as any).bgColor || "#334155");
            n.x = x;
            n.y = y;
            n.Draw(renderer, camera);
            y += 40;

            (n as any).life -= 1;
        });

        this.notifications = this.notifications.filter(n => (n as any).life > 0);
    }

    public Notify(msg: string, type: string) {
        const color = type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#2563eb';
        const lbl = new Label(0, 0, msg, "white", `14px ${FONTS.main}`);
        (lbl as any).bgColor = color;
        (lbl as any).life = 200;
        this.notifications.push(lbl);
    }

    public FloatText(msg: string, x: number, y: number) {
        const lbl = new Label(x, y, msg, "#fbbf24", `bold 20px ${FONTS.main}`);
        (lbl as any).life = 60;
        (lbl as any).velocityY = -1;
        (lbl as any).isFloat = true;
        this.floatingTexts.push(lbl);
    }

    public DrawTopLayer(renderer: Renderer, camera: Camera) {
        Object.values(this.panels).forEach(p => {
            if (!p.active) return;

            const checkObject = (obj: any) => {
                // If it is a combobox
                if (obj instanceof Combobox && obj.isOpen) {
                    obj.DrawDropdown(renderer, camera);
                }

                // If it is a ListView, recurse items
                if (obj instanceof ListView) {
                    obj.items.forEach(item => checkObject(item));
                }

                // If it has a comboHero property (ObjQuestItem)
                if (obj.comboHero && obj.comboHero instanceof Combobox && obj.comboHero.isOpen) {
                    obj.comboHero.DrawDropdown(renderer, camera);
                }
            };

            p.children.forEach(c => checkObject(c));
        });
    }
}
