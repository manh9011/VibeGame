import { instance as game } from '@/code/scenes/game/GameManager';

export class CloudClient {
    private url: string = '';
    private token: string = '';

    public login(token: string, url: string): boolean {
        this.token = token;
        // If demo, we might not set URL or just ignore it
        if (token === 'demo') {
            return true;
        }

        this.url = url;

        if (!this.token) return false;
        if (!this.url && token !== 'demo') return false;

        // Save to local storage
        localStorage.setItem('tycoon_token', this.token);
        localStorage.setItem('tycoon_url', this.url);

        return true;
    }

    public async verifyCredentials(): Promise<boolean> {
        if (this.token === 'demo') return true;
        if (!this.token || !this.url) return false;

        try {
            // Attempt a lightweight operation, e.g., asking for a key that might not exist, 
            // just to check auth success vs 401/403.
            // Redis "EXISTS" or just getting the save key is fine.
            const response = await fetch(this.url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(["EXISTS", "tycoon_save"])
            });

            if (!response.ok) return false;

            const result = await response.json();
            if (result.error) return false;

            return true;
        } catch (e) {
            console.error("Verification failed:", e);
            return false;
        }
    }

    public logout() {
        localStorage.removeItem('tycoon_token');
        localStorage.removeItem('tycoon_url');
        location.reload();
    }

    public async save(isAutoSave = false) {
        if (!this.token || this.token === 'demo' || !this.url) {
            if (!isAutoSave) {
                this.showNotification("⚠️ Demo Mode - Không thể lưu!", "error");
            }
            return;
        }

        if (!isAutoSave) {
            this.showNotification("💾 Đang lưu game...", "info");
        } else {
            console.log("Auto-saving...");
        }

        try {
            const data = JSON.stringify(game.scene);
            const response = await fetch(this.url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(["SET", "tycoon_save", data])
            });

            const result = await response.json();
            if (result.error) throw new Error(result.error);

            if (!isAutoSave) this.showNotification("✅ Đã lưu lên Cloud!", "success");
        } catch (e) {
            console.error(e);
            if (!isAutoSave) this.showNotification("❌ Lỗi khi lưu!", "error");
        }
    }

    public async load() {
        if (!this.token || !this.url) return;

        console.log("Loading from cloud...");
        try {
            const response = await fetch(this.url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(["GET", "tycoon_save"])
            });

            const result = await response.json();
            if (result.result) {
                const saveData = JSON.parse(result.result);
                game.HydrateScene(saveData);
            } else {
                console.log("No save data found.");
            }
        } catch (e) {
            console.error("Load error:", e);
        }
    }

    private showNotification(msg: string, type: 'info' | 'error' | 'success') {
        const notifications = document.getElementById('notifications');
        if (notifications) {
            const notif = document.createElement('div');
            const colors = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-blue-600';
            notif.className = `${colors} text-white p-2 rounded shadow-lg pixel-font text-sm notif-item border border-white/20`;
            notif.innerText = msg;
            notifications.appendChild(notif);
            setTimeout(() => notif.remove(), 3000);
        }
    }
}
