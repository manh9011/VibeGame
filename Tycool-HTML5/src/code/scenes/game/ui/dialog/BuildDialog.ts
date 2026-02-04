import { Dialog } from '@/code/objects/Dialog';
import { ListView } from '@/code/objects/ListView';
import { BuildItem } from '@/code/scenes/game/ui/dialog/BuildItem';
import { BUILDINGS_DB } from '@/code/Options';
import { instance as game } from '@/code/scenes/game/GameManager';

/**
 * ObjBuildPanel - Building selection panel
 */
export class BuildPanel extends Dialog {
    private uiManager: any; // Reference to ObjUIManager
    private listView: ListView;

    constructor(uiManager: any) {
        super(100, 50, 600, 400, "Xây Dựng", () => { });
        this.uiManager = uiManager;

        // Create ListView
        // Panel content area starts roughly at y+40 (title bar)
        // Panel width 600, height 400.
        // Let's scroll the full content area.
        this.listView = new ListView(0, 0, 580, 340);
        // relX/relY for Panel to handle position directly or add as child?
        // ObjPanel handles children with relative positions.
        (this.listView as any).relX = 10;
        (this.listView as any).relY = 50;

        this.AddChild(this.listView);

        this.InitContent();
    }

    private InitContent() {
        this.listView.Clear();

        Object.values(BUILDINGS_DB).forEach(b => {
            const item = new BuildItem(b, () => {
                this.uiManager.CloseAllPanels();
                game.scene.selection.mode = 'build';
                game.scene.selection.buildingId = b.id;
                this.uiManager.Notify(`Chọn vị trí để xây ${b.name}`, "info");
            });
            this.listView.AddItem(item);
        });
    }
}
