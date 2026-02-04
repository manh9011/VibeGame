/**
 * --- PvP PLAY STATE ---
 * Symmetric Input-Sync Logic
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB, CLASS_TYPES, SPELL_TYPES } from '../context.js';
import {
    drawGlobalHeader, drawText, drawRect, drawRoundedRect, drawCircle, drawButton, drawBadge,
    drawPlayerBase, drawEnemyBase, addToast, calculateTotalStats
} from '../utils/uiHelpers.js';
import { NetworkSystem } from '../utils/network.js';
import { PvPMenuState } from './PvPMenuState.js';

export var PvPPlayState = new Enjine.GameState();

PvPPlayState.Enter = function () {
    this.units = [];
    this.particles = [];
    this.projectiles = [];
    this.camera = { x: 0, y: 0, zoom: 1.0 };
    this.baseY = GAME.Canvas.Height - 200;

    // Apply multiple bonuses
    this.myBonuses = this.pvp?.myBonuses || ['none'];
    // Check if 'hp' is in the array
    let hpMult = this.myBonuses.includes('hp') ? 1.2 : 1.0;

    // Setup Bases
    this.playerBase = { x: 100, hp: 10000 * hpMult, maxHp: 10000 * hpMult, team: 0, w: 100, h: 200 };
    this.enemyBase = { x: 2200, hp: 10000, maxHp: 10000, team: 1, w: 100, h: 200 };

    this.mineral = 500;
    this.maxMineral = 1000;
    this.mineralRate = 2;
    this.mineralLevel = 1;

    this.heroCDs = [0, 0, 0, 0];
    this.missileCD = 0;

    this.meteorCharges = 1;
    this.meteorActive = false;
    this.meteorTimer = 0;

    this.spellFlags = {};
    this.spellActive = {};
    this.spellSlots = DB.data.spellSlots || [0, 1, 2, 3, 4, 5];
    this.spellCDs = {};

    this.opponentTeamData = null;
    this.opponentBonuses = ['none'];
    this.waitingForOpponent = true;

    this.gameOver = false;
    this.result = null;


    this.showExitConfirm = false; // Flag for confirmation dialog

    // Heartbeat for persistence
    this.heartbeatTimer = 0;
    this.lastOpponentTime = Date.now();
    this.resultsTimer = 5.0; // Reset return-to-lobby timer
    this.syncTimer = 0;

    this.setupNetwork();
    this.keyHandler = this.handleKeyPress.bind(this);
    window.addEventListener('keydown', this.keyHandler);
    BackgroundSystem.setTheme(1);

    this.sendLoadout();
};

PvPPlayState.createEffect = function (type, x, y, opts = {}) {
    let p = {
        type: type,
        x: x,
        y: y,
        life: opts.life || 1.0,
        vx: (Math.random() - 0.5) * 100,
        vy: (Math.random() - 0.5) * 100,
        val: opts.val || null,
        color: opts.color || 'white'
    };
    if (type === 'blood') {
        p.vx = (Math.random() - 0.5) * 200;
        p.vy = -Math.random() * 200;
        p.life = 0.5;
    }
    this.particles.push(p);
};

PvPPlayState.setupNetwork = function () {
    // Handle status updates (Disconnected)
    NetworkSystem.onStatus((status) => {
        if (status === 'Disconnected' && !this.gameOver) {
            addToast("Đối thủ đã thoát trận!", "#FFC107");
            this.endGame(true); // Auto win if opponent disconnects
        }
    });

    NetworkSystem.onMessage((data) => {
        // Any message proves life
        this.lastOpponentTime = Date.now();

        if (data.type === "ping") {
            NetworkSystem.send({ type: "pong" });
            return;
        }
        if (data.type === "pong") return;

        if (data.type === "loadout") {
            addToast("Đã nhận dữ liệu đối thủ!", "#4CAF50");
            this.opponentTeamData = data.payload.team;
            this.opponentBonuses = data.payload.bonuses || ['none'];
            this.waitingForOpponent = false;

            if (this.opponentBonuses.includes('hp')) {
                this.enemyBase.hp *= 1.2;
                this.enemyBase.maxHp *= 1.2;
            }
            addToast("ĐỐI THỦ ĐÃ SẴN SÀNG!", "#FF9800");
        }
        if (data.type === "request_loadout") {
            addToast("Đối thủ yêu cầu dữ liệu...", "#2196F3");
            this.sendLoadout();
        }
        if (data.type === "action") {
            this.handleOpponentAction(data.payload);
        }
        if (data.type === "gg") {
            this.endGame(true);
        }
    });
};

PvPPlayState.sendLoadout = function () {
    // Build item map for local performance
    const itemMap = new Map();
    DB.data.inventory.forEach(i => itemMap.set(i.id, i));

    // Sanitize hero data to prevent NaN/Infinity/Circular structure issues in msgpack
    const safeHeroes = DB.data.heroes.map(h => {
        const total = calculateTotalStats(h, itemMap);
        return {
            id: h.id,
            type: h.type,
            level: h.level || 1,
            stars: h.stars || 1,
            // Use boosted stats for combat!
            hp: Math.floor(total.hp || 100),
            maxHp: Math.floor(total.hp || 100),
            atk: Math.floor(total.atk || 10),
            def: Math.floor(total.def || 0),
            spd: parseFloat((total.spd || 2).toFixed(2)),
            atkSpd: parseFloat((total.atkSpd || 1).toFixed(2)),
            range: h.range || 60,
            atkType: h.atkType || 'melee',
            projType: h.projType || 1,
            cost: Math.floor(h.cost || 100),
            crit: total.crit || 0,
            eva: total.eva || 0,
            regen: total.regen || 0,
            effect: h.effect || null
        };
    });

    // Sanitize IDs
    const safeIds = DB.data.team.map(id => (id && typeof id === 'number') ? id : null);

    NetworkSystem.send({
        type: "loadout",
        payload: {
            team: {
                heroes: safeHeroes,
                ids: safeIds
            },
            bonuses: this.myBonuses
        }
    });
    // Debug Toast
    addToast("Đã gửi dữ liệu...", "#555");
};

PvPPlayState.handleOpponentAction = function (action) {
    if (this.waitingForOpponent) return;

    if (action.bg === "spawn") {
        this.spawnEnemyUnit(action.slotIdx);
    }
    else if (action.bg === "missile") {
        this.fireMissile(1);
    }
    else if (action.bg === "meteor") {
        this.fireMeteor(1);
    }
    else if (action.bg === "spell") {
        this.castEnemySpell(action.id);
    }
};

PvPPlayState.Exit = function () {
    if (this.keyHandler) {
        window.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
    }
    // Do NOT disconnect here. We want to return to the room.
    // NetworkSystem.disconnect(); 
};

PvPPlayState.Update = function (dt) {
    // --- HEARTBEAT LOGIC ---
    // Must run even during gameOver to keep room connection alive
    this.heartbeatTimer = (this.heartbeatTimer || 0) + dt;
    if (this.heartbeatTimer > 2.0) {
        this.heartbeatTimer = 0;
        NetworkSystem.send({ type: "ping" });
    }

    // Check for timeout
    if (this.lastOpponentTime && (Date.now() - this.lastOpponentTime > 15000)) { // 15s timeout in game for better tolerance
        if (!this.gameOver) {
            addToast("Mất kết nối với đối thủ!", "#F44336");
            this.endGame(true); // Auto-win
        }
    }

    // --- SYNC RETRY LOGIC ---
    if (this.waitingForOpponent) {
        this.syncTimer = (this.syncTimer || 0) + dt;
        if (this.syncTimer > 1.0) {
            this.syncTimer = 0;
            this.sendLoadout();
            NetworkSystem.send({ type: "request_loadout" });
        }
    }

    if (this.gameOver) {
        // Auto-return timer logic
        this.resultsTimer = (this.resultsTimer || 5.0) - dt;
        if (this.resultsTimer <= 0) {
            GAME.ChangeState(PvPMenuState);
            return;
        }
    }

    if (this.gameOver || this.waitingForOpponent) return;

    BackgroundSystem.Update(dt);
    this.updateInput(); // Handle Visual/Camera Input
    this.cameraUpdate(dt);

    let rate = this.mineralRate * (1 + this.mineralLevel * 0.2);
    if (this.myBonuses.includes('spd')) rate *= 1.2;

    this.mineral += rate * dt * 30;
    if (this.mineral > this.maxMineral) this.mineral = this.maxMineral;

    if (this.missileCD > 0) this.missileCD -= dt;
    this.heroCDs.forEach((cd, i) => { if (cd > 0) this.heroCDs[i] -= dt; });

    for (let k in this.spellCDs) {
        if (this.spellCDs[k] > 0) this.spellCDs[k] -= dt;
    }
    for (let k in this.spellActive) {
        if (this.spellActive[k] > 0) this.spellActive[k] -= dt;
    }

    this.updateEntities(dt);

    if (this.playerBase.hp <= 0 && !this.gameOver) {
        NetworkSystem.send({ type: "gg" });
        this.endGame(false);
    }
    if (this.enemyBase.hp <= 0 && !this.gameOver) {
        this.endGame(true);
    }
};

PvPPlayState.updateEntities = function (dt) {
    for (let i = this.units.length - 1; i >= 0; i--) {
        let u = this.units[i];
        if (u.hp <= 0) {
            u.dead = true;
            this.units.splice(i, 1);
            continue;
        }

        if (u.frozen) {
            u.frozenTimer -= dt;
            if (u.frozenTimer <= 0) u.frozen = false;
            else continue;
        }

        let dir = u.team === 0 ? 1 : -1;
        let enemyBase = u.team === 0 ? this.enemyBase : this.playerBase;
        let distToBase = u.team === 0 ? (enemyBase.x - u.x) : (u.x - (enemyBase.x + 100));

        let target = null;
        if (Math.abs(distToBase) <= u.range) {
            target = enemyBase;
        } else {
            let minD = u.range;
            for (let e of this.units) {
                if (e.team !== u.team && !e.dead) {
                    let d = Math.abs(u.x - e.x);
                    if (d < minD) { minD = d; target = e; }
                }
            }
        }

        if (target) {
            u.state = 'attack';
            if (u.cd <= 0) {
                u.cd = 1 / u.atkSpd;
                let bonusAtk = 1.0;
                if (u.team === 0 && this.myBonuses.includes('atk')) bonusAtk = 1.2;
                if (u.team === 1 && this.opponentBonuses.includes('atk')) bonusAtk = 1.2;

                target.hp -= u.atk * bonusAtk;

                // COMBAT EFFECTS
                this.createEffect('blood', target.x, target.y - 40, { life: 0.5 });
                this.createEffect('slash', target.x, target.y - 40, { life: 0.3 });
                this.createEffect('hit', target.x, target.y - 40, { life: 0.2 });

                // Skill Emoji Effect (Floating Up)
                if (u.effect) {
                    this.createEffect('emoji_float', target.x, target.y - 50, { val: u.effect, life: 0.8 });
                }

                // Critical Hit Effect (Random 20% chance for simulation)
                if (Math.random() < 0.2) {
                    this.createEffect('crit', target.x, target.y - 60, { life: 1.0, val: Math.floor(u.atk * bonusAtk) });
                }
            } else u.cd -= dt;

            // Handle Z key for Zoom inside Update - REMOVED (Moved to updateInput)
        } else {
            u.state = 'move';
            let bonusSpd = 1.0;
            if (u.team === 0 && this.myBonuses.includes('spd')) bonusSpd = 1.2;
            if (u.team === 1 && this.opponentBonuses.includes('spd')) bonusSpd = 1.2;

            u.x += dir * u.spd * 20 * dt * bonusSpd;
        }

        // BOUNDS CHECK: Despawn units that fall off the world to prevent camera dragging
        if (u.x < -200 || u.x > 2600) {
            u.dead = true;
            this.units.splice(i, 1);
        }
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
        let p = this.projectiles[i];
        p.timer += dt * (p.speed || 1);

        // SMOKE TRAIL for Missiles (3) and Meteors (4)
        if (p.type === 3 || p.type === 4) {
            if (Math.random() < 0.3) {
                this.createEffect('smoke', p.x, p.y + (p.type === 4 ? -20 : 0), { life: 0.5 });
            }
        }

        if (p.timer >= 1) {
            this.explode(p.targetX, p.dmg, p.team);
            this.projectiles.splice(i, 1);
        } else {
            if (p.type === 3) {
                p.x = p.startX + (p.targetX - p.startX) * p.timer;
                let h = 300;
                let ly = p.startY + (p.targetY - p.startY) * p.timer;
                let curve = 4 * h * p.timer * (1 - p.timer);
                p.y = ly - curve;

                let dx = p.targetX - p.startX;
                let dy = (p.targetY - p.startY) - (4 * h * (1 - 2 * p.timer));
                p.angle = Math.atan2(dy, dx);
            } else if (p.type === 4) {
                p.x = p.startX + (p.targetX - p.startX) * p.timer;
                p.y = p.startY + (p.targetY - p.startY) * p.timer;
            }
        }
    }

    if (this.meteorActive) {
        this.meteorTimer += dt;
        if (this.meteorWaveCount < 3 && this.meteorTimer >= this.meteorWaveCount) {
            this.spawnMeteorWave(this.meteorTeam);
            this.meteorWaveCount++;
        }
        if (this.meteorTimer > 3) this.meteorActive = false;
    }
};


PvPPlayState.cameraUpdate = function (dt) {
    let viewW = GAME.Canvas.Width / this.camera.zoom;
    let mapW = 2400;
    let minZ = Math.max(0.5, GAME.Canvas.Width / 2400);

    // PANNING LOGIC
    // If panning is active (mouse held and moving), we override auto-cam
    if (this.isPanning && Enjine.Mouse.Down) {
        // Panning is handled in updateInput via Mouse difference
        // Just ensure clamping here
        // Clamp Left
        if (this.camera.x < 0) this.camera.x = 0;
        // Clamp Right
        if (this.camera.x + viewW > mapW) this.camera.x = mapW - viewW;
        if (this.camera.x < 0) this.camera.x = 0; // Double safety

        return; // Skip auto-follow
    } else {
        this.isPanning = false; // Reset if mouse released
    }

    // AUTO FOLLOW LOGIC (Farthest Unit)
    // Target logic: Farthest Unit from Base (Max X) OR Base itself if no units
    let targetX = this.playerBase.x;
    let farthestX = -Infinity; // Start low

    this.units.forEach(u => {
        if (u.team === 0 && u.x > farthestX) farthestX = u.x; // Find MAX X
    });

    if (farthestX !== -Infinity) {
        // We want the leader to be at ~1/3 or 1/2 of the screen, not dead center?
        // User asked for "Auto Camera" like before. 
        // Previously: targetCamX = frontX - viewW / 3;
        targetX = farthestX;
    }

    // Determine Desired Camera X
    // Default: Center the target? Or keep it at right side?
    // "Auto automatic movement" implies tracking forward.
    // If target is Front Unit, we usually want to see ahead.
    // targetCamX = targetX - viewW / 2; (Center)
    // Let's use Center for now, or match previous "1/3" logic if preferred. 
    // "thay điều hướng camera bằng hero xa nhà nhất... tự về cơ chế tự động như cũ"
    // The "old" mechanism (from logs) was: `targetCamX = frontX - viewW / 3`.
    let targetCamX = targetX - viewW / 2; // Let's try Centering first, it's safer.

    // Bounds Clamping
    // Clamp Left
    if (targetCamX < 0) targetCamX = 0;

    // Clamp Right
    if (targetCamX + viewW > mapW) targetCamX = mapW - viewW;

    // Final hard clamp
    if (targetCamX < 0) targetCamX = 0;

    // Smooth Lerp
    this.camera.x += (targetCamX - this.camera.x) * 0.1;

    // Safety Clamp current camera.x
    if (this.camera.x < 0) this.camera.x = 0;
    if (this.camera.x + viewW > mapW) this.camera.x = mapW - viewW; // Only clamp right if not zoomed out fully
    // If zoomed out fully (viewW >= mapW), camera.x should be 0 (or centered). 
    // If viewW > mapW, maxCamX is negative? 
    // Logic above: `if (targetCamX + viewW > mapW)`. If viewW > mapW, mapW - viewW is negative.
    // targetCamX becomes negative.
    // Then `if (targetCamX < 0) targetCamX = 0`.
    // So if View > Map, Target = 0.
    // Camera Correctly stays at 0.
};



// --- ACTIONS ---

PvPPlayState.spawnPlayerUnit = function (slotIdx) {
    let hId = DB.data.team[slotIdx];
    if (!hId) return;
    let hero = DB.data.heroes.find(h => h.id === hId);
    if (this.mineral >= hero.cost && this.heroCDs[slotIdx] <= 0) {
        this.mineral -= hero.cost;
        this.heroCDs[slotIdx] = hero.cost / 20;
        this.units.push(this.createUnitData(hero, 0));
        NetworkSystem.send({ type: "action", payload: { bg: "spawn", slotIdx: slotIdx } });
    }
};

PvPPlayState.spawnEnemyUnit = function (slotIdx) {
    let ids = this.opponentTeamData.ids;
    if (!ids) return;
    let hId = ids[slotIdx];
    let hero = this.opponentTeamData.heroes.find(h => h.id === hId);
    if (hero) this.units.push(this.createUnitData(hero, 1));
};

PvPPlayState.createUnitData = function (hero, team) {
    let typeInfo = Object.values(CLASS_TYPES).find(t => t.id === hero.type);
    return {
        x: team === 0 ? 150 : 2250,
        y: this.baseY,
        team: team,
        type: hero.type,
        hp: hero.hp, maxHp: hero.hp,
        atk: hero.atk, spd: hero.spd, range: hero.range,
        atkSpd: hero.atkSpd, cd: 0,
        state: 'move', w: 40, h: 40, dead: false,
        effect: typeInfo ? typeInfo.effect : "💥",
        frozen: false, frozenTimer: 0
    };
};

PvPPlayState.fireMissile = function (team) {
    if (team === 0) {
        if (this.missileCD > 0) return;
        this.missileCD = 10;
        NetworkSystem.send({ type: "action", payload: { bg: "missile" } });
    }
    let isT0 = team === 0;
    this.projectiles.push({
        type: 3,
        startX: isT0 ? 150 : 2250,
        startY: this.baseY - 100,
        targetX: isT0 ? 2200 : 200,
        targetY: this.baseY,
        timer: 0, speed: 1, dmg: 1000, team, angle: 0
    });
};

PvPPlayState.fireMeteor = function (team) {
    if (team === 0) {
        if (this.meteorCharges <= 0) return;
        this.meteorCharges--;
        NetworkSystem.send({ type: "action", payload: { bg: "meteor" } });
    }
    this.meteorActive = true;
    this.meteorTimer = 0;
    this.meteorWaveCount = 0;
    this.meteorTeam = team;
};

PvPPlayState.spawnMeteorWave = function (team) {
    let targetX = team === 0 ? 2000 : 400;
    for (let k = 0; k < 8; k++) {
        let tx = targetX + (Math.random() - 0.5) * 800;
        // Team 0: Left->Right (tx - 200), Team 1: Right->Left (tx + 200)
        let sx = team === 0 ? tx - 200 : tx + 200;
        this.projectiles.push({
            type: 4, startX: sx, startY: -500, targetX: tx, targetY: this.baseY, timer: 0, speed: 2, dmg: 400, team
        });
    }
};

PvPPlayState.castSpell = function (id) {
    if (this.spellCDs[id] > 0) return;

    let type = SPELL_TYPES[id];
    let cd = 30;
    this.spellCDs[id] = cd;

    NetworkSystem.send({ type: "action", payload: { bg: "spell", id: id } });
    this.applySpellEffect(id, 0);
    addToast(`Đã dùng ${type.name}`, "#00FFFF");
};

PvPPlayState.castEnemySpell = function (id) {
    this.applySpellEffect(id, 1);
    addToast("Địch dùng Kỹ năng!", "#FF5722");
};

PvPPlayState.applySpellEffect = function (id, team) {
    if (id === 0) { // Heal
        let base = team === 0 ? this.playerBase : this.enemyBase;
        base.hp = Math.min(base.maxHp, base.hp + 5000);
        this.particles.push({ type: 'shield_block', x: base.x + 50, y: base.y + 100, life: 1 });
    }
    else if (id === 4) { // Freeze
        let targetTeam = team === 0 ? 1 : 0;
        this.units.forEach(u => {
            if (u.team === targetTeam) {
                u.frozen = true;
                u.frozenTimer = 5;
            }
        });
    }
};

PvPPlayState.explode = function (x, dmg, team) {
    let targetTeam = team === 0 ? 1 : 0;
    this.units.forEach(u => {
        if (u.team === targetTeam && Math.abs(u.x - x) < 100) u.hp -= dmg;
    });
    let base = targetTeam === 0 ? this.playerBase : this.enemyBase;
    if (Math.abs(base.x - x) < 150) base.hp -= dmg;
    this.particles.push({ type: 'explosion', x, y: this.baseY, life: 0.5 });
    // Also create some smoke
    for (let k = 0; k < 5; k++) {
        this.createEffect('smoke', x + (Math.random() - 0.5) * 50, this.baseY - Math.random() * 50, { life: 0.8 });
    }
};

PvPPlayState.handleKeyPress = function (e) {
    if (this.gameOver) return;
    if (e.key >= '1' && e.key <= '4') this.spawnPlayerUnit(parseInt(e.key) - 1);
    // Skills 1-6 (keys 5-0)
    if (e.key >= '5' && e.key <= '9') {
        let idx = parseInt(e.key) - 5;
        if (this.spellSlots[idx] !== undefined) this.castSpell(this.spellSlots[idx]);
    }
    if (e.key === '0') {
        if (this.spellSlots[5] !== undefined) this.castSpell(this.spellSlots[5]);
    }

    if (e.key === 's' || e.key === 'S') this.fireMissile(0);
    if (e.key === 'ArrowDown') this.fireMeteor(0);
    if (e.key === 'a' || e.key === 'A') {
        let cost = this.mineralLevel * 200;
        if (this.mineral >= cost && this.mineralLevel < 8) {
            this.mineral -= cost;
            this.mineralLevel++;
            this.maxMineral += 500;
        }
    }
};

PvPPlayState.endGame = function (win) {
    if (this.gameOver) return;
    this.gameOver = true;
    this.result = win ? 'win' : 'lose';
    if (win) {
        DB.data.diamonds = (DB.data.diamonds || 0) + 10;
        DB.save(); // Persist Rewards
    }
};

PvPPlayState.updateInput = function () {
    // Zoom Toggle (Z)
    if (Enjine.Keyboard.IsKeyDown(Enjine.Keys.Z)) {
        if (!this.zPressed) {
            // Calculate minimum zoom to fit map exactly (Max Width 2400)
            let minZ = Math.max(0.5, GAME.Canvas.Width / 2400);
            // If current is roughly 1, go to min. Else go to 1.
            this.camera.zoom = this.camera.zoom > 0.9 ? minZ : 1.0;
            this.zPressed = true;
        }
    } else {
        this.zPressed = false;
    }

    // PAN CONTROLS (Drag to scroll)
    // Only enabled if NOT in full view mode (Zoom > minZ)
    let minZ = Math.max(0.5, GAME.Canvas.Width / 2400);
    // Tolerance for float comparison
    let isFullView = Math.abs(this.camera.zoom - minZ) < 0.05 || this.camera.zoom < minZ;

    if (!isFullView) {
        if (Enjine.Mouse.Down) {
            // Check if click is in UI area (Bottom 120px)
            // If Y > Height - 120, ignore pan (interaction with buttons)
            let uiY = GAME.Canvas.Height - 120;
            if (Enjine.Mouse.Y < uiY) {
                if (!this.lastMousePanX) {
                    this.lastMousePanX = Enjine.Mouse.X;
                    this.isPanning = true;
                } else {
                    let diff = Enjine.Mouse.X - this.lastMousePanX;
                    // Move camera opposite to drag? Or same?
                    // "Drag Left to Move Left" usually means grabbing the world.
                    // If I drag mouse LEFT (Diff Negative), Camera should move RIGHT? 
                    // No. User said: "kéo sang trái thì move sang trái".
                    // If I move mouse Left, Camera moves Left.
                    // This implies "Pushing" the camera. Or simply Direct mapping.
                    // Let's assume Direct: Mouse Left -> Cam Left.
                    // Camera X decreases.
                    // Diff < 0. Cam X += Diff.
                    // So: this.camera.x -= diff / this.camera.zoom; (Grab Style is usually opposite)
                    // "Drag Left -> Move Left": If I start at 100, drag to 50. Mouse moved -50.
                    // Camera should move Left (-50).
                    // So `camera.x += diff`. 
                    // Let's try direct mapping. `camera.x += diff / zoom`.
                    // But usually "Pan" means Grabbing world. If I drag Left, World moves Left? 
                    // If World moves Left, Camera moves Right.
                    // If user says "Move Camera Left", they mean View moves Left (seeing left things).
                    // So World moves Right.
                    // If Mouse moves Left (-), Camera moves Left (-).
                    this.camera.x += diff / this.camera.zoom;
                    this.lastMousePanX = Enjine.Mouse.X;
                    this.isPanning = true;
                }
            }
        } else {
            this.lastMousePanX = null;
            this.isPanning = false; // Will reset to auto in update
        }
    } else {
        this.isPanning = false;
    }
};

PvPPlayState.Draw = function (ctx) {
    ctx.save();

    // 1. Scale
    ctx.scale(this.camera.zoom, this.camera.zoom);

    // 2. Calculate Y offset to pin ground to bottom
    // Logic: ScreenH = (WorldH + TransY) * Zoom
    // WorldH + TransY = ScreenH / Zoom
    // TransY = ScreenH/Zoom - WorldH
    let transY = GAME.Canvas.Height / this.camera.zoom - GAME.Canvas.Height;

    // 3. Translate (Camera X and Y Logic)
    ctx.translate(-this.camera.x, transY);

    // 4. Draw Background
    // We want background ground at World Y = GAME.Canvas.Height
    // BackgroundSystem draws ground at (startY + height) - 120
    // So startY + height = GAME.Canvas.Height
    let bgH = (GAME.Canvas.Height / this.camera.zoom) * 2; // Double height for safety
    let bgStartY = GAME.Canvas.Height - bgH;

    BackgroundSystem.Draw(ctx, GAME.Canvas.Width / this.camera.zoom, bgH, this.camera.x, bgStartY);

    // --- GROUND & BASES ---
    // Ensure base ground matches background ground logic
    // Background draws ground at bottomY - 120.
    // We draw extra ground if needed or rely on background.
    // But we need to draw the interactable area (bases)


    // Background System needs custom scaling or we accept it scales with context
    // Ideally background should be drawn BEFORE scaling if it's static, 
    // but here we want it to zoom too for cohesion.
    // However, BackgroundSystem.Draw typically covers screen. 
    // We might need to draw a larger rect.
    // Let's rely on standard draw for now, but fill clear rect first?
    // Actually, background is drawn at start of Draw() usually.
    // Let's Redraw Background scaled properly if needed, or assume the previous clear/draw is fine.
    // The issue is if we zoom out, we see black edges?
    // We'll trust the pivot keeps it reasonable.

    ctx.fillStyle = "#4E342E"; ctx.fillRect(0, this.baseY, 2400, 200);
    ctx.fillStyle = "#7CB342"; ctx.fillRect(0, this.baseY, 2400, 20);

    // Draw Player Base (Castle)
    drawPlayerBase(ctx, this.playerBase.x, this.baseY - 200, 100, 200);

    // Draw Enemy Base as CASTLE (Tier 3 look)
    drawPlayerBase(ctx, this.enemyBase.x, this.baseY - 200, 100, 200, 50);

    this.drawHP(ctx, this.playerBase); this.drawHP(ctx, this.enemyBase);

    this.units.forEach(u => {
        ctx.save(); ctx.translate(u.x, u.y);
        if (u.team === 0) ctx.scale(-1, 1);

        // Font Stack for Emoji
        let fontStack = '"Noto Color Emoji", "Segoe UI Emoji", "Segoe UI", Arial, sans-serif';
        ctx.font = `40px ${fontStack}`;
        ctx.textAlign = "center";

        let icon = Object.values(CLASS_TYPES).find(t => t.id === u.type)?.icon || "🧱";
        ctx.fillText(icon, 0, 0);
        if (u.frozen) {
            ctx.fillStyle = "rgba(0, 200, 255, 0.5)"; ctx.beginPath(); ctx.arc(0, -20, 30, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        drawRect(ctx, u.x - 20, u.y - 50, 40, 5, "red");
        drawRect(ctx, u.x - 20, u.y - 50, 40 * (Math.max(0, u.hp) / u.maxHp), 5, "green");
    });

    this.projectiles.forEach(p => {
        ctx.save(); ctx.translate(p.x, p.y);
        if (p.type === 3) {
            // Missile 🚀 (Faces NE/-45deg by default)
            // To align with trajectory p.angle, we need to rotate by p.angle + 45deg
            ctx.rotate(p.angle + Math.PI / 4);
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🚀", 0, 0);
        } else if (p.type === 4) {
            if (p.team === 0) ctx.scale(-1, 1); // Flip only for player (Left->Right)
            ctx.font = "30px Arial"; ctx.fillText("☄️", 0, 0);
        }
        ctx.restore();
    });

    this.particles.forEach(p => {
        // Update life
        if (p.type === 'blood') {
            p.x += p.vx * 0.016; p.y += p.vy * 0.016; p.vy += 300 * 0.016; // Simple gravity
            ctx.save();
            drawCircle(ctx, p.x, p.y, 10 * p.life, `rgba(200, 0, 0, ${p.life})`);
            ctx.restore();
        }
        else if (p.type === 'smoke') {
            ctx.save();
            drawCircle(ctx, p.x, p.y, 10 + 10 * (1 - p.life), `rgba(100, 100, 100, ${p.life * 0.5})`);
            ctx.restore();
        }
        else if (p.type === 'explosion') {
            ctx.save();
            drawCircle(ctx, p.x, p.y, 50 + 50 * (1 - p.life), `rgba(255, 100, 0, ${p.life})`);
            ctx.restore();
        }
        else if (p.type === 'slash') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
            ctx.fillRect(-30, -4, 60, 8);
            ctx.rotate(Math.PI / 2);
            ctx.fillRect(-30, -4, 60, 8);
            ctx.restore();
        }
        else if (p.type === 'hit') {
            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 0, ${p.life})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, 20 * p.life, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        else if (p.type === 'shield_block') {
            ctx.save();
            ctx.strokeStyle = `rgba(50, 205, 50, ${p.life})`; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(p.x, p.y, 40, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }
        else if (p.type === 'crit') {
            ctx.save();
            drawText(ctx, "CRITICAL!", p.x, p.y - 30 * (1 - p.life), "red", 24, "center");
            drawText(ctx, `- ${p.val} `, p.x, p.y, "orange", 28, "center");
            p.y -= 1; // Float up
            ctx.restore();
        }
        else {
            // Generic fallback / Text effect
            ctx.save();
            ctx.font = `${40 * p.life}px Arial`;
            ctx.fillStyle = `rgba(255,255,255,${p.life})`;
            ctx.fillText(p.val || "", p.x, p.y);
            ctx.restore();
        }

        p.life -= 0.05;
    });
    this.particles = this.particles.filter(p => p.life > 0);

    ctx.restore();

    // Draw Diamonds in Global Header using standard UI (Top Right) -> Moved to uiHelpers
    // drawText(ctx, `💎 ${DB.data.diamonds || 0}`, GAME.Canvas.Width - 30, 85, "#FFD700", 24, "right");

    drawGlobalHeader(ctx, GAME.Canvas.Width);
    this.drawControls(ctx);

    // --- EXIT DIALOG OVERLAY ---
    if (this.showExitConfirm) {
        ctx.save();
        // ctx.setTransform(1, 0, 0, 1, 0, 0); // Removed to respect engine scaling

        ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(0, 0, GAME.Canvas.Width, GAME.Canvas.Height);

        let dw = 400, dh = 250;
        let dx = (GAME.Canvas.Width - dw) / 2;
        let dy = (GAME.Canvas.Height - dh) / 2;

        drawRoundedRect(ctx, dx, dy, dw, dh, 15, "#222");
        drawRoundedStroke(ctx, dx, dy, dw, dh, 15, "#F44336", 3);

        drawText(ctx, "XÁC NHẬN THOÁT?", dx + dw / 2, dy + 60, "#F44336", 28, "center");
        drawText(ctx, "Bạn sẽ bị xử THUA ngay lập tức.", dx + dw / 2, dy + 100, "white", 16, "center");

        // Buttons - Pass explicit white color and size 16
        drawButton(ctx, "HỦY", dx + 30, dy + 160, 150, 50, "#555", () => {
            this.showExitConfirm = false;
        }, "white", 16);

        drawButton(ctx, "THOÁT", dx + 220, dy + 160, 150, 50, "#D32F2F", () => {
            this.showExitConfirm = false;
            NetworkSystem.send({ type: "gg" }); // Tell opponent we surrender
            this.endGame(false); // We lose
        }, "white", 16);

        ctx.restore();
    }

    if (this.waitingForOpponent) {
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, GAME.Canvas.Width, GAME.Canvas.Height);
        drawText(ctx, "ĐANG TẢI DỮ LIỆU ĐỐI THỦ...", GAME.Canvas.Width / 2, GAME.Canvas.Height / 2, "white", 30, "center");

        let dbg = `Net: ${NetworkSystem.socket && NetworkSystem.socket.connected ? "Connected" : "Disconnected"} | Timer: ${this.syncTimer ? this.syncTimer.toFixed(1) : 0}`;
        drawText(ctx, dbg, GAME.Canvas.Width / 2, GAME.Canvas.Height / 2 + 50, "#AAA", 16, "center");
    }

    if (this.gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, GAME.Canvas.Width, GAME.Canvas.Height);
        let rw = 600, rh = 400;
        let rx = (GAME.Canvas.Width - rw) / 2, ry = (GAME.Canvas.Height - rh) / 2;

        drawRoundedRect(ctx, rx, ry, rw, rh, 20, "#222");
        ctx.lineWidth = 3; ctx.strokeStyle = this.result === 'win' ? "#FFD700" : "#C00"; ctx.strokeRect(rx, ry, rw, rh);

        let msg = this.result === 'win' ? "CHIẾN THẮNG!" : "THẤT BẠI";
        drawText(ctx, msg, GAME.Canvas.Width / 2, ry + 60, this.result === 'win' ? "#FFD700" : "#C00", 50, "center");

        if (this.result === 'win') {
            drawText(ctx, "Phần thưởng:", rx + 50, ry + 150, "white", 24, "left");
            drawText(ctx, "💎 +10 Kim Cương", rx + 50, ry + 200, "#00BCD4", 24, "left"); // Cyan for Diamond text
        } else {
            drawText(ctx, "Đừng nản chí! Hãy thử lại.", GAME.Canvas.Width / 2, ry + 150, "#AAA", 20, "center");
        }

        let timerText = `Tự động quay về phòng sau ${Math.ceil(this.resultsTimer || 5)}s...`;
        drawText(ctx, timerText, GAME.Canvas.Width / 2, ry + rh - 120, "#888", 16, "center");

        drawButton(ctx, "QUAY VỀ PHÒNG", GAME.Canvas.Width / 2 - 100, ry + rh - 80, 200, 60, "#4CAF50", () => {
            import('./PvPMenuState.js').then(m => GAME.ChangeState(m.PvPMenuState));
        });
    }
};

PvPPlayState.drawHP = function (ctx, base) {
    drawRect(ctx, base.x, this.baseY + 10, 100, 10, "red");
    drawRect(ctx, base.x, this.baseY + 10, 100 * (Math.max(0, base.hp) / base.maxHp), 10, "green");
};

PvPPlayState.drawControls = function (ctx) {
    let bY = GAME.Canvas.Height - 100; // Define bY here as it's used by the bottom bar background

    // Draw Bottom Bar Background first
    drawRect(ctx, 0, bY, GAME.Canvas.Width, 100, "#111");

    // --- LEFT SIDE BUTTONS (Match PvE) ---
    // Meteor (Top Left: 10, 60)
    let mClr = this.meteorCharges > 0 ? "#E91E63" : "#555";
    drawButton(ctx, "☄️\n🔻", 10, 60, 50, 50, mClr, () => this.fireMeteor(0), "white", 18);
    if (this.meteorCharges > 0) drawBadge(ctx, 60, 60, this.meteorCharges);

    // Zoom (Left: 10, 120) - Matches PvE
    let zIcon = this.camera.zoom < 1 ? "🔍" : "🔍";
    let zText = this.camera.zoom < 1 ? "1x" : "-"; // Logic flipped in PvE? 
    // PvE: zoomLevel 1 -> "🔍-" (Zoom Out available), zoomLevel 2 (0.7??) -> "🔍+" (Zoom In available)
    // Here: zoom < 1 (0.7) -> "🔍 1x" (Restore), zoom 1.0 -> "🔍 -" (Zoom Out)
    let zLvl = this.camera.zoom < 1 ? "🔍\n1x" : "🔍\n-";
    drawButton(ctx, zLvl, 10, 120, 50, 50, "#555", () => {
        this.camera.zoom = this.camera.zoom < 1 ? 1.0 : 0.7;
    }, "white", 18);

    // Exit Button (Bottom Right)
    if (!this.waitingForOpponent) {
        let exitY = GAME.Canvas.Height - 100 + 10;
        // Match PvE: X = Width - 80, W = 70
        drawButton(ctx, "THOÁT", GAME.Canvas.Width - 80, exitY, 70, 80, "#C00", () => {
            if (this.gameOver) return;
            this.showExitConfirm = !this.showExitConfirm;
        }, "white", 14);
    }

    let startX = 20;

    // 1. Mineral (Was Moon 🟡 -> Now Diamond 💎)
    // Leftmost button
    let minX = startX;
    let minCost = this.mineralLevel * 200;
    drawRoundedRect(ctx, minX, bY + 10, 90, 80, 10, "#553300");
    drawText(ctx, "💎", minX + 45, bY + 40, "white", 30, "center"); // Changed from 🟡 to 💎
    drawText(ctx, "A", minX + 10, bY + 25, "white", 14, "left"); // Shortcut A

    let minColor = this.mineral >= minCost && this.mineralLevel < 8 ? "cyan" : "red";
    if (this.mineralLevel >= 8) minColor = "gold";
    drawText(ctx, `${Math.floor(this.mineral)}`, minX + 45, bY + 65, "white", 12, "center");
    drawText(ctx, `Lv${this.mineralLevel}`, minX + 45, bY + 80, minColor, 10, "center");

    if (Enjine.Mouse.Clicked && Enjine.Mouse.X >= minX && Enjine.Mouse.X <= minX + 90 && Enjine.Mouse.Y >= bY + 10 && Enjine.Mouse.Y <= bY + 90) {
        Enjine.Mouse.Clicked = false;
        if (this.mineral >= minCost && this.mineralLevel < 8) {
            this.mineral -= minCost; this.mineralLevel++; this.maxMineral += 300;
        }
    }

    // 2. Missile
    let misX = minX + 100;
    drawButton(ctx, "", misX, bY + 10, 90, 80, this.missileCD > 0 ? "#333" : "#C00", () => this.fireMissile(0));
    drawText(ctx, "🚀", misX + 45, bY + 40, "white", 30, "center");
    drawText(ctx, this.missileCD > 0 ? Math.ceil(this.missileCD) : "Ready", misX + 45, bY + 70, "white", 12, "center");
    drawText(ctx, "S", misX + 10, bY + 25, "white", 14, "left");

    // 3. Heroes (Shortcuts 1-4)
    let heroX = misX + 100;
    for (let i = 0; i < 4; i++) {
        let x = heroX + i * 90;
        let hId = DB.data.team[i];
        if (hId) {
            let hero = DB.data.heroes.find(h => h.id === hId);
            let icon = Object.values(CLASS_TYPES).find(t => t.id === hero.type).icon;
            let cd = this.heroCDs[i];
            drawButton(ctx, "", x, bY + 10, 80, 80, cd > 0 ? "#333" : "#444", () => this.spawnPlayerUnit(i));
            drawText(ctx, icon, x + 40, bY + 40, "white", 30, "center");
            drawText(ctx, `${hero.cost}`, x + 40, bY + 70, "cyan", 14, "center");
            drawText(ctx, `${i + 1}`, x + 10, bY + 25, "white", 14, "left"); // Shortcut
            if (cd > 0) drawRoundedRect(ctx, x, bY + 10, 80, 80 * (cd / (hero.cost / 20)), 10, "rgba(0,0,0,0.5)");
        }
    }

    // 4. Castle Skills (Shortcuts 5, 6, 7, 8, 9, 0)
    let spellX = heroX + 4 * 90 + 20;
    this.spellSlots.forEach((sid, idx) => {
        let type = SPELL_TYPES[sid];
        if (type) {
            let x = spellX + idx * 70;
            let cd = this.spellCDs[sid] || 0;
            drawButton(ctx, type.icon, x, bY + 20, 60, 60, cd > 0 ? "#333" : "#9C27B0", () => this.castSpell(sid));
            if (cd > 0) drawText(ctx, Math.ceil(cd), x + 30, bY + 50, "white", 20, "center");

            // Shortcut badge
            let key = (idx + 5).toString();
            if (idx + 5 === 10) key = "0";
            drawText(ctx, key, x + 10, bY + 35, "white", 10, "left");
        }
    });
};
