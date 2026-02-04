import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB, SPELL_TYPES } from '../context.js';
import { drawGlobalHeader, drawText, drawButton, drawRoundedStroke, drawRoundedRect, addToast, drawHeroCard, calculateTotalStats } from '../utils/uiHelpers.js';
import { NetworkSystem } from '../utils/network.js';
import { PvPPlayState } from './PvPPlayState.js';

export var PvPMenuState = new Enjine.GameState();

PvPMenuState.rooms = Array(10).fill({ count: 0, status: "" });
PvPMenuState.view = "lobby";
PvPMenuState.selectedRoom = -1;
PvPMenuState.status = "";
PvPMenuState.isReady = false;
PvPMenuState.opponentReady = false;
PvPMenuState.opponentBonuses = ['none'];
PvPMenuState.opponentTeamIds = null; // To store opponent hero IDs
PvPMenuState.opponentHeroes = null; // Resolved heroes
PvPMenuState.opponentSpells = []; // Opponent castle skills
PvPMenuState.connected = false;
PvPMenuState.networkError = false;

// Bonus Logic with Costs
PvPMenuState.bonuses = [
    { id: 'none', name: 'Không', icon: '❌', cost: 0 },
    { id: 'atk', name: 'Công +20%', icon: '⚔️', cost: 1 },
    { id: 'hp', name: 'Máu +20%', icon: '❤️', cost: 1 },
    { id: 'spd', name: 'Tốc độ +20%', icon: '⚡', cost: 1 }
];
PvPMenuState.selectedBonuses = [0]; // Array of Indices

const ROOM_PREFIX = "ELDORADO_VIBE_ROOM_";

PvPMenuState.Enter = function () {
    // Randomize Background Theme (1 to 3)
    let themeId = Math.floor(Math.random() * 3) + 1;
    BackgroundSystem.setTheme(themeId);

    // Check if we are already connected (returning from game)
    if (this.connected && NetworkSystem.socket && NetworkSystem.socket.connected) {
        this.view = "room";
        this.status = "Đã quay lại phòng.";
        this.isReady = false;
        this.opponentReady = false;
        // Optionally reset bonuses or keep them? Keeping them is better UX.
        // this.selectedBonuses = [0]; 

        // setupNetworkHandlers MUST be called again because PvPPlayState overwrites the handlers!
        this.setupNetworkHandlers();

        // Re-announce presence and loadout
        this.sendLoadoutPreview();
        // Request opponent status (in case they are already ready)
        NetworkSystem.send({ type: "check_status" });
    } else {
        // Fresh entry
        this.view = "lobby";
        this.isReady = false;
        this.opponentReady = false;
        this.connected = false;
        this.networkError = false;
        this.status = "Đang tải danh sách phòng...";
        this.selectedBonuses = [0];
        this.opponentTeamIds = null;
        this.opponentHeroes = null;
        this.opponentBonuses = ['none']; // Reset opponent bonuses

        this.refreshRooms();
        this.refreshTimer = setInterval(() => this.refreshRooms(), 5000);
    }
};

PvPMenuState.refreshRooms = async function () {
    if (this.networkError || this.view !== "lobby") return;

    this.status = "Đang cập nhật danh sách phòng...";

    // Run all checks in parallel
    const checks = Array.from({ length: 10 }, async (_, i) => {
        const roomId = `${ROOM_PREFIX}${i + 1}`;
        try {
            let count = await NetworkSystem.checkRoomStatus(roomId);
            if (this.view === "lobby") {
                this.rooms[i] = { count: count, status: count > 0 ? "1/2" : "0/2" };
            }
        } catch (e) {
            if (this.view === "lobby") this.rooms[i] = { count: 0, status: "?" };
        }
    });

    await Promise.all(checks);

    if (this.view === "lobby") this.status = "Đã cập nhật danh sách phòng.";
};

PvPMenuState.joinRoom = async function (index) {
    const roomId = `${ROOM_PREFIX}${index + 1}`;
    this.selectedRoom = index;
    this.view = "room";
    this.status = "Đang kết nối vào phòng...";
    this.networkError = false;
    this.isReady = false;
    this.opponentReady = false;
    this.opponentTeamIds = null;
    this.opponentHeroes = null;

    try {
        await NetworkSystem.init(roomId);
        this.status = `Phòng ${index + 1}`;
        this.connected = true; // Socket connected, room joined
        this.setupNetworkHandlers();

        // Initial opponent state depends on room count
        // If I am Host (count=1), opponent is NOT connected yet.
        // If I am Guest (count=2), Host is ALREADY connected.
        this.opponentConnected = !NetworkSystem.isHost;

        // Heartbeat init
        this.lastOpponentTime = Date.now();
        this.heartbeatTimer = 0;

        // Broadcast presence
        try {
            this.sendLoadoutPreview();
        } catch (e) {
            console.error("Failed to send loadout preview:", e);
        }
        NetworkSystem.send({ type: "check_status" });

    } catch (err) {
        console.error("Join Room Failed:", err);
        this.connected = false;
        this.status = "Không thể vào phòng. Đã đầy hoặc lỗi.";
        addToast("Vào phòng thất bại: " + (err.message || err), "#F44336");
        this.view = "lobby";
    }
};

// joinAsHost/joinAsGuest removed - logic unified in joinRoom via Server


PvPMenuState.Update = function (dt) {
    if (this.view !== "room") return;

    if (this.connected) {
        // --- HEARTBEAT LOGIC ---
        this.heartbeatTimer = (this.heartbeatTimer || 0) + dt;
        if (this.heartbeatTimer > 2.0) {
            this.heartbeatTimer = 0;
            // console.log("Sending ping...");
            NetworkSystem.send({ type: "ping" });
        }

        // Check for timeout (True disconnect)
        if (this.lastOpponentTime && (Date.now() - this.lastOpponentTime > 6000)) { // 6s timeout
            // In Socket.io, the server sends 'player_left' event which triggers handleDisconnect.
            // This timer is just a backup safety net.
            if (this.connected) {
                // console.log("Opponent silent for too long...");
                // We don't force disconnect here immediately, let the server handle it
                // or maybe show a warning?
            }
        }

        // --- SYNC RETRY LOGIC (Wait for loadout) ---
        if (!this.opponentHeroes || !this.opponentTeamIds) {
            this.syncTimer = (this.syncTimer || 0) + dt;
            if (this.syncTimer > 2.0) {
                this.syncTimer = 0;
                NetworkSystem.send({ type: "request_loadout" });
            }
        }
    }
    // Removed legacy 'else' block for Zombie Reclaim (Server handles this now)
};

PvPMenuState.handleDisconnect = function (reason) {
    // Only reset opponent state, keep user in the room unless server connection is lost
    this.isReady = false;
    this.opponentReady = false;
    this.opponentTeamIds = null;
    this.opponentHeroes = null;
    this.opponentItems = null;

    // Reset sync timer to allow retry
    this.syncTimer = 0;

    // We stay in the room view, server will notify when someone else joins
    this.status = reason || "Đối thủ đã thoát.";
    addToast(reason || "Đối thủ ngắt kết nối", "#FFC107");
};

PvPMenuState.sendLoadoutPreview = function () {
    // Optimization: Only send the heroes actually in the team to reduce payload
    let activeHeroes = [];
    let relevantItems = [];

    // Build a map of items for local stats calculation if needed
    const localItemMap = new Map();
    if (DB.data.inventory) DB.data.inventory.forEach(i => localItemMap.set(i.id, i));

    DB.data.team.forEach(tid => {
        if (tid) {
            let h = DB.data.heroes.find(x => x.id === tid);
            if (h) {
                // Normalize equipments to array [weapon, armor, accessory, artifact]
                let normalizedEquips = [null, null, null, null];
                if (h.equipments) {
                    if (Array.isArray(h.equipments)) {
                        normalizedEquips = [...h.equipments];
                    } else if (typeof h.equipments === 'object') {
                        // Try both integer and string keys
                        normalizedEquips[0] = h.equipments[0] || h.equipments['0'] || h.equipments.weapon || null;
                        normalizedEquips[1] = h.equipments[1] || h.equipments['1'] || h.equipments.armor || null;
                        normalizedEquips[2] = h.equipments[2] || h.equipments['2'] || h.equipments.accessory || null;
                        normalizedEquips[3] = h.equipments[3] || h.equipments['3'] || h.equipments.artifact || null;
                    }
                }

                // Sanitize hero object: Plain values only. Send BASE stats, receiver calculates totals.
                activeHeroes.push({
                    id: h.id,
                    type: h.type,
                    level: h.level || 1,
                    maxLevel: h.maxLevel || 50, // Default to 50 if missing
                    stars: h.stars || 1,
                    equipments: normalizedEquips,
                    hp: h.hp,
                    atk: h.atk,
                    def: h.def,
                    spd: h.spd,
                    atkSpd: h.atkSpd,
                    crit: h.crit,
                    eva: h.eva,
                    regen: h.regen
                });

                // Collect equipment details (Sanitized)
                normalizedEquips.forEach(eid => {
                    if (eid) {
                        let item = DB.data.inventory.find(i => i.id == eid); // Loose compare
                        if (item) {
                            // Sanitize item object
                            relevantItems.push({
                                id: item.id,
                                type: item.type,
                                rarity: item.rarity,
                                mainStat: item.mainStat ? { ...item.mainStat } : null,
                                subStat: item.subStat ? { ...item.subStat } : null
                            });
                        } else {
                            console.warn(`Item not found for ID: ${eid}`);
                        }
                    }
                });
            }
        }
    });

    NetworkSystem.send({
        type: "loadout_preview",
        payload: {
            team: DB.data.team,
            heroes: activeHeroes,
            items: relevantItems,
            spells: DB.data.spellSlots
        }
    });
};

PvPMenuState.setupNetworkHandlers = function () {
    NetworkSystem.onStatus((s) => {
        if (s === "Connected" || s === "Opponent Joined") {
            if (s === "Opponent Joined") this.opponentConnected = true;

            // Only host sends loadout first if guest joins
            // If I just connected as guest, I wait or send mine?
            // Current logic: joinRoom calls sendLoadoutPreview immediately

            // If opponent joined, share update
            this.sendLoadoutPreview();
        } else if (s === "Disconnected") {
            this.opponentConnected = false;
            this.handleDisconnect("ĐỐI THỦ ĐÃ RỜI PHÒNG");
        } else {
            this.status = s;
        }
    });

    NetworkSystem.onMessage((data) => {
        // Any message proves life
        this.lastOpponentTime = Date.now();

        if (data.type === "ping") {
            NetworkSystem.send({ type: "pong" });
            return; // Don't process checks for ping
        }
        if (data.type === "pong") {
            return;
        }

        if (data.type === "ready") {
            this.opponentReady = data.value;
            if (NetworkSystem.isHost && this.isReady && this.opponentReady) {
                NetworkSystem.send({ type: "start" });
                this.startGame();
            }
        }
        if (data.type === "bonus") {
            this.opponentBonuses = data.value || ['none'];
        }
        if (data.type === "request_loadout") {
            // Opponent requested our loadout, send it!
            this.sendLoadoutPreview();
        }
        if (data.type === "loadout_preview") {
            this.opponentTeamIds = data.payload.team;
            this.opponentHeroes = data.payload.heroes;
            this.opponentSpells = data.payload.spells || [];

            // Convert received items to a Map for hero cards
            console.log(`Received Loadout: ${data.payload.heroes?.length} heroes, ${data.payload.items?.length} items.`);
            this.opponentItems = new Map();
            if (data.payload.items) {
                data.payload.items.forEach(item => {
                    this.opponentItems.set(item.id, item);
                });
            }
            console.log("Opponent Item Map keys:", Array.from(this.opponentItems.keys()));
        }
        if (data.type === "start") {
            this.startGame();
        }
        if (data.type === "check_status") {
            // Opponent wants to know if we are ready
            NetworkSystem.send({ type: "status_update", ready: this.isReady });
        }
        if (data.type === "status_update") {
            this.opponentReady = data.ready;
            // Validating start condition if we are Host and just got sync
            if (NetworkSystem.isHost && this.isReady && this.opponentReady) {
                NetworkSystem.send({ type: "start" });
                this.startGame();
            }
        }
    });
};

PvPMenuState.startGame = function () {
    // Deduct Diamonds for Bonuses
    let totalCost = 0;
    this.selectedBonuses.forEach(idx => {
        totalCost += this.bonuses[idx].cost;
    });

    // Final check (should have been checked at selection, but safety first)
    if ((DB.data.diamonds || 0) >= totalCost) {
        if (!DB.data.diamonds) DB.data.diamonds = 0;
        DB.data.diamonds -= totalCost;
        DB.save(); // Persist Deduction
    } else {
        // Fallback: reset bonuses if out of money (edge case)
        this.selectedBonuses = [0];
    }

    PvPPlayState.pvp = {
        enabled: true,
        myBonuses: this.selectedBonuses.map(i => this.bonuses[i].id)
    };
    GAME.ChangeState(PvPPlayState);
};

PvPMenuState.Draw = function (ctx) {
    BackgroundSystem.Draw(ctx, GAME.Canvas.Width, GAME.Canvas.Height);

    // Global Header
    drawGlobalHeader(ctx, GAME.Canvas.Width);

    // Centered Title "ĐẤU TRƯỜNG ONLINE" (Yellow)
    // Override the previous separate drawText
    let title = "ĐẤU TRƯỜNG ONLINE";
    if (this.view === "room" && this.selectedRoom >= 0) {
        title = `${title} - PHÒNG ${this.selectedRoom + 1}`;
    }
    drawText(ctx, title, GAME.Canvas.Width / 2, 35, "#FFD700", 30, "center");

    if (this.view === "lobby") {
        this.drawLobby(ctx);
    } else {
        this.drawRoom(ctx);
    }
};

PvPMenuState.drawLobby = function (ctx) {
    drawText(ctx, this.status, GAME.Canvas.Width / 2, 130, "yellow", 16, "center");

    const btnW = 180;
    const btnH = 180;
    const gap = 20;
    const totalW = 5 * btnW + 4 * gap;
    const startX = (GAME.Canvas.Width - totalW) / 2;
    const startY = 160;

    for (let i = 0; i < 10; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const x = startX + col * (btnW + gap);
        const y = startY + row * (btnH + gap);

        const room = this.rooms[i];
        const color = room.count > 0 ? "#FF9800" : "#2196F3";

        drawRoundedStroke(ctx, x, y, btnW, btnH, 10, "#444", 5);
        drawButton(ctx, `PHÒNG ${i + 1}`, x, y, btnW, btnH, color, () => {
            this.joinRoom(i);
        }, "white", 30);
        drawText(ctx, room.status, x + btnW / 2, y + btnH - 30, "white", 14, "center");
    }

    drawButton(ctx, "LÀM MỚI", GAME.Canvas.Width / 2 - 75, GAME.Canvas.Height - 70, 150, 40, "#0066ff", () => this.refreshRooms());
    drawRoundedStroke(ctx, GAME.Canvas.Width / 2 - 75, GAME.Canvas.Height - 70, 150, 40, 10, "black", 1);

    drawButton(ctx, "QUAY LẠI", 20, GAME.Canvas.Height - 70, 150, 50, "#607D8B", () => {
        if (this.refreshTimer) clearInterval(this.refreshTimer);
        import('./MainMenuState.js').then(m => GAME.ChangeState(m.MainMenuState));
    });
    drawRoundedStroke(ctx, 20, GAME.Canvas.Height - 70, 150, 50, 10, "black", 1);
};

PvPMenuState.drawRoom = function (ctx) {
    const w = GAME.Canvas.Width;
    const h = GAME.Canvas.Height;
    const cx = w / 2;

    // Split Line
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath(); ctx.moveTo(cx, 80); ctx.lineTo(cx, h - 100); ctx.stroke();

    // --- LEFT SIDE: PLAYER ---
    drawText(ctx, "BẠN", cx / 2, 110, "#4CAF50", 24, "center");
    // Draw Team
    this.drawTeamPreview(ctx, cx / 2, 150, DB.data.team, DB.data.heroes);

    // Draw Bonuses
    let bonusY = 420; // CORRECTED TO 420
    drawText(ctx, "GÓI HỖ TRỢ CHIẾN ĐẤU", cx / 2, bonusY, "#DDD", 18, "center");
    // Player Bonuses (Interactive)
    this.drawBonusRow(ctx, cx / 2, bonusY + 30, this.selectedBonuses, true);

    // Player Skills
    drawText(ctx, "KỸ NĂNG NHÀ CHÍNH", cx / 2, bonusY + 110, "#DDD", 18, "center");
    if (DB.data.spellSlots) {
        this.drawSkillRow(ctx, cx / 2, bonusY + 140, DB.data.spellSlots);
    }


    // --- RIGHT SIDE: OPPONENT ---
    drawText(ctx, "ĐỐI THỦ", cx + cx / 2, 110, "#F44336", 24, "center");

    // Only show opponent details if they are connected
    if (this.connected && this.opponentConnected) {
        if (this.opponentHeroes && this.opponentTeamIds) {
            this.drawTeamPreview(ctx, cx + cx / 2, 150, this.opponentTeamIds, this.opponentHeroes, true);
        } else {
            drawText(ctx, "Đang tải đội hình...", cx + cx / 2, 230, "#AAA", 16, "center");
        }

        // Opponent Bonuses (Non-interactive, visual only)
        drawText(ctx, "ĐỐI THỦ ĐÃ CHỌN:", cx + cx / 2, bonusY, "#DDD", 18, "center");

        let oppIndices = this.opponentBonuses.map(bid => this.bonuses.findIndex(b => b.id === bid)).filter(i => i !== -1);
        this.drawBonusRow(ctx, cx + cx / 2, bonusY + 30, oppIndices, false);

        // Opponent Skills
        drawText(ctx, "KỸ NĂNG ĐỐI THỦ", cx + cx / 2, bonusY + 110, "#DDD", 18, "center");
        if (this.opponentSpells) {
            this.drawSkillRow(ctx, cx + cx / 2, bonusY + 140, this.opponentSpells);
        }

        drawText(ctx, this.opponentReady ? "SẴN SÀNG" : "ĐANG CHUẨN BỊ...", cx + cx / 2, bonusY + 220, this.opponentReady ? "#4CAF50" : "#FF9800", 20, "center");

    } else {
        // Connected to room but alone
        drawText(ctx, "Đang chờ đối thủ...", cx + cx / 2, 230, "#AAA", 16, "center");
        drawText(ctx, "(Chưa có ai)", cx + cx / 2, 260, "#555", 14, "center");
    }

    // --- BOTTOM CONTROLS ---

    // --- BOTTOM CONTROLS ---
    // Ready Button
    if (this.connected) {
        let rBtnTxt = this.isReady ? "HỦY SẴN SÀNG" : "SẴN SÀNG CHIẾN ĐẤU";
        let rBtnClr = this.isReady ? "#F44336" : "#4CAF50";
        drawRoundedStroke(ctx, cx - 125, h - 80, 250, 60, 10, "black", 5);
        drawButton(ctx, rBtnTxt, cx - 125, h - 80, 250, 60, rBtnClr, () => {
            this.isReady = !this.isReady;
            NetworkSystem.send({ type: "ready", value: this.isReady });

            if (NetworkSystem.isHost && this.isReady && this.opponentReady) {
                NetworkSystem.send({ type: "start" });
                this.startGame();
            }
        });
    }

    // Leave Button
    drawButton(ctx, "RỜI PHÒNG", 20, h - 70, 150, 50, "#555", () => {
        NetworkSystem.disconnect();
        this.view = "lobby";
        this.connected = false; // Reset connection state
        this.isReady = false;
        this.selectedBonuses = [0];
    });
    drawRoundedStroke(ctx, 20, h - 70, 150, 50, 10, "black", 1);
};

PvPMenuState.drawTeamPreview = function (ctx, cx, y, teamIds, heroList, isOpponent = false) {
    let scale = 1.0; // FULL SCALE 1.0
    let cardW = 160;
    let cardH = 220;
    let displayW = cardW * scale; // 160
    let displayH = cardH * scale; // 220
    let gap = 8; // Small gap

    let totalW = 4 * displayW + 3 * gap;
    let startX = cx - totalW / 2;

    // Build item map ONCE per preview to save performance
    let itemMap = null;
    if (isOpponent) {
        itemMap = this.opponentItems;
    } else {
        itemMap = new Map();
        if (DB.data.inventory) {
            DB.data.inventory.forEach(i => itemMap.set(i.id, i));
        }
    }

    for (let i = 0; i < 4; i++) {
        let dx = startX + i * (displayW + gap);
        let dy = y;

        drawRoundedRect(ctx, dx, dy, displayW, displayH, 8, "#222");

        let hId = teamIds[i];
        if (hId !== null && hId !== undefined) { // Fix for ID 0
            let hero = heroList.find(h => h.id === hId);
            if (hero) {
                ctx.save();
                ctx.translate(dx, dy);
                ctx.scale(scale, scale);
                drawHeroCard(ctx, hero, 0, 0, cardW, cardH, false, false, false, null, itemMap);
                ctx.restore();
            }
        } else {
            drawText(ctx, "?", dx + displayW / 2, dy + displayH / 2 + 5, "#555", 40, "center");
        }
    }
};

PvPMenuState.drawBonusRow = function (ctx, cx, y, selectionList, interactive) {
    // Show only indices 1, 2, 3 (Atk, HP, Spd). Skip 0 (None).
    let displayIndices = [1, 2, 3];
    let btnW = 120, btnH = 60, gap = 10;

    // Horizontal Row
    let totalW = displayIndices.length * btnW + (displayIndices.length - 1) * gap;
    let startX = cx - totalW / 2;

    displayIndices.forEach((bIdx, i) => {
        let b = this.bonuses[bIdx];
        let bx = startX + i * (btnW + gap);
        let by = y;

        // Check if this index is in the selection list (indices)
        let isSel = selectionList.includes(bIdx);

        let color = isSel ? "#4CAF50" : "#333";
        let txtColor = "white";

        // Logic for Interactive Mode (Dim if can't afford and not selected)
        if (interactive) {
            let canAfford = (DB.data.diamonds || 0) >= b.cost;
            if (!isSel && !canAfford) {
                color = "#222";
                txtColor = "#888";
            }
        } else {
            // Non-interactive mode (Opponent)
            if (!isSel) {
                color = "#222";
                txtColor = "#555";
            } else {
                color = "#4CAF50"; // GREEN for opponent
            }
        }

        drawButton(ctx, "", bx, by, btnW, btnH, color, () => {
            if (!interactive) return;

            // Toggle logic for Player
            if (this.selectedBonuses.includes(bIdx)) {
                this.selectedBonuses = this.selectedBonuses.filter(x => x !== bIdx);
            } else {
                // Check Cost
                let currentCost = 0;
                this.selectedBonuses.forEach(bi => {
                    // CAUTION: selectedBonuses stores indices logic
                    // If 0 is in there, ignore cost of 0.
                    if (bi !== 0) currentCost += this.bonuses[bi].cost;
                });

                if ((DB.data.diamonds || 0) >= currentCost + b.cost) {
                    this.selectedBonuses.push(bIdx);
                    // Ensure 'none' (0) is removed if we pick something
                    this.selectedBonuses = this.selectedBonuses.filter(x => x !== 0);
                } else {
                    addToast("Không đủ Kim Cương!", "#F44336");
                }
            }

            // If empty, revert to [0] (None)
            if (this.selectedBonuses.length === 0) this.selectedBonuses = [0];

            NetworkSystem.send({ type: "bonus", value: this.selectedBonuses.map(idx => this.bonuses[idx].id) });
        });

        // Icon & Text
        drawText(ctx, b.icon, bx + btnW / 2, by + 25, txtColor, 20, "center");
        // drawText(ctx, b.name.replace(" +20%", ""), bx + btnW / 2, by + 42, txtColor, 12, "center");
        // Simplify name? "Công", "Máu", "Tốc"
        let shortName = b.name.split(" ")[0]; // "Công", "Máu", "Tốc độ" -> "Tốc" is "Tốc độ"
        if (b.name.includes("Tốc độ")) shortName = "Tốc độ";
        drawText(ctx, shortName, bx + btnW / 2, by + 42, txtColor, 12, "center");

        if (b.cost > 0) {
            drawText(ctx, `${b.cost}💎`, bx + btnW - 5, by + 15, "#00BCD4", 12, "right");
        }
    });
};

PvPMenuState.drawSkillRow = function (ctx, cx, y, spells) {
    let size = 50;
    let gap = 10;
    let totalW = spells.length * size + (spells.length - 1) * gap;
    let startX = cx - totalW / 2;

    spells.forEach((sId, i) => {
        let sx = startX + i * (size + gap);
        let spell = SPELL_TYPES[sId];

        // Slot bg
        drawRoundedRect(ctx, sx, y, size, size, 5, "#333");

        if (spell) {
            drawText(ctx, spell.icon, sx + size / 2, y + size / 2 + 8, "white", 30, "center");
        }
    });
};

PvPMenuState.Exit = function () {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
};

// End of state definition
