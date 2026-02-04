import { Dialog } from '@/code/objects/Dialog';
import { Label } from '@/code/objects/Label';
import { ListView } from '@/code/objects/ListView';
import { HeroItem } from '@/code/scenes/game/ui/dialog/HeroItem';
import { instance as game } from '@/code/scenes/game/GameManager';

/**
 * HeroPanel - Hero management and recruitment panel
 */
export class HeroPanel extends Dialog {
    private listTeam: ListView;
    private listRecruit: ListView;

    constructor() {
        super(100, 50, 700, 500, "Anh Hùng", () => { });

        // Left - Team
        const lblTeam = new Label(20, 50, "Đội ngũ của bạn", "#cbd5e1");
        (lblTeam as any).relX = 20; (lblTeam as any).relY = 50;
        this.AddChild(lblTeam);

        this.listTeam = new ListView(0, 0, 310, 400);
        (this.listTeam as any).relX = 20;
        (this.listTeam as any).relY = 80;
        this.AddChild(this.listTeam);

        // Right - Recruit
        const lblRecruit = new Label(350, 50, "Chiêu mộ", "#4ade80");
        (lblRecruit as any).relX = 350; (lblRecruit as any).relY = 50;
        this.AddChild(lblRecruit);

        this.listRecruit = new ListView(0, 0, 310, 400);
        (this.listRecruit as any).relX = 350;
        (this.listRecruit as any).relY = 80;
        this.AddChild(this.listRecruit);
    }

    public Refresh() {
        // Refresh Team List
        this.listTeam.Clear();
        game.scene.heroes.forEach(h => {
            const item = new HeroItem(h);
            this.listTeam.AddItem(item);
        });

        // Refresh Recruit List
        this.listRecruit.Clear();
        if (game.recruitList.length === 0) {
            // Can add a placeholder item or just empty
            // Maybe a label inside list? or just leave empty.
        } else {
            game.recruitList.forEach((r, idx) => {
                const item = new HeroItem(r, "Thuê", () => {
                    game.Hire(idx);
                    this.Refresh();
                });
                this.listRecruit.AddItem(item);
            });
        }
    }
}
