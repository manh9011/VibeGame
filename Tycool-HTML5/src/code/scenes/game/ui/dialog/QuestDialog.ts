import { Dialog } from '@/code/objects/Dialog';
import { ListView } from '@/code/objects/ListView';
import { QuestItem } from '@/code/scenes/game/ui/dialog/QuestItem';
import { QUESTS_DB } from '@/code/Options';
import { instance as game } from '@/code/scenes/game/GameManager';

/**
 * QuestPanel - Quest selection panel
 */
export class QuestPanel extends Dialog {
    private uiManager: any; // Reference to ObjUIManager for Notify
    private listView: ListView;

    constructor(uiManager: any) {
        super(150, 50, 500, 500, "Nhiệm Vụ");
        this.uiManager = uiManager;

        this.listView = new ListView(0, 0, 480, 440);
        (this.listView as any).relX = 10;
        (this.listView as any).relY = 50;
        this.AddChild(this.listView);
    }

    public Refresh() {
        this.listView.Clear();
        const idleHeroes = game.scene.heroes.filter(h => h.status === 'idle');

        QUESTS_DB.forEach(q => {
            const item = new QuestItem(q, idleHeroes, (heroId) => {
                if (!heroId) {
                    this.uiManager.Notify("Chưa chọn anh hùng!", "error");
                    return;
                }
                game.StartQuest(heroId, q.id);
                this.Refresh();
            });
            this.listView.AddItem(item);
        });
    }
}
