import { Dialog } from '@/code/objects/Dialog';
import { ListView } from '@/code/objects/ListView';
import { ObjMarketItem } from '@/code/scenes/game/ui/dialog/MarketItem';
import { instance as game } from '@/code/scenes/game/GameManager';

/**
 * ObjMarketPanel - Market trading panel
 */
export class ObjMarketPanel extends Dialog {
    private listView: ListView;
    private items: { [key: string]: ObjMarketItem } = {};

    constructor() {
        super(200, 100, 400, 300, "Thị Trường");

        this.listView = new ListView(0, 0, 380, 240);
        (this.listView as any).relX = 10;
        (this.listView as any).relY = 50;
        this.AddChild(this.listView);

        this.InitContent();
    }

    private InitContent() {
        this.listView.Clear();
        this.createMarketRow('wood', '🪵');
        this.createMarketRow('stone', '🪨');
    }

    private createMarketRow(res: 'wood' | 'stone', icon: string) {
        const item = new ObjMarketItem(res, icon, game.GetPrice(res),
            () => game.Trade(res, 'buy'),
            () => game.Trade(res, 'sell')
        );
        this.items[res] = item;
        this.listView.AddItem(item);
    }

    public UpdatePrices() {
        if (this.items['wood']) this.items['wood'].SetPrice(game.GetPrice('wood'));
        if (this.items['stone']) this.items['stone'].SetPrice(game.GetPrice('stone'));
    }
}
