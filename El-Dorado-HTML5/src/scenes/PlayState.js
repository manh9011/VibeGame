/**
 * --- PLAY STATE ---
 */
import { Enjine } from '../engine/core.js';
import { BackgroundSystem } from '../engine/background.js';
import { GAME, DB, CLASS_TYPES, MEDAL_TYPES, MEDAL_BUFFS, ITEM_TYPES } from '../context.js';
import {
    drawGlobalHeader, drawText, drawRect, drawRoundedRect, drawCircle, drawButton, drawBadge,
    drawPlayerBase, drawEnemyBase, drawItemIcon, addToast
} from '../utils/uiHelpers.js';
import { StageSelectState } from './StageSelectState.js';
import { NetworkSystem } from '../utils/network.js';

export var PlayState = new Enjine.GameState();
PlayState.level = 1;

PlayState.explodeMissile = function (x, dmg, radius = 150, teamWhoFired = 0) {
    let targetTeam = teamWhoFired === 0 ? 1 : 0;
    for (let u of this.units) {
        if (u.team === targetTeam && Math.abs(u.x - x) < radius) {
            u.hp -= dmg; u.hitTimer = 0.3;
        }
    }

    let targetBase = targetTeam === 0 ? this.playerBase : this.enemyBase;
    if (Math.abs(targetBase.x - x) + (targetBase === this.enemyBase ? 0 : targetBase.w) < radius + 100) {
        // Simple x distance check for base? Base is wide.
        // PlayerBase: 100 to 200. EnemyBase: 2200 to 2300 (example).
        // Better: Check overlap of Explosion Radius vs Base Rect.
        // Base Base X is left side.
        if (x + radius > targetBase.x && x - radius < targetBase.x + targetBase.w) {
            targetBase.hp -= dmg;
        }
    }

    this.createEffect('explosion', x, this.baseY);
};

PlayState.createEffect = function (type, x, y, options = {}) {
    this.particles.push({
        x: x, y: y, life: 1, type: type,
        vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100,
        ...options
    });
};

PlayState.endGame = function (win) {
    this.gameOver = true;
    let itemDropped = null;
    if (win && this.level % 5 === 0) {
        itemDropped = DB.createItem(null, this.level);
    }

    let medal = 0;
    let expPerHero = this.level * 100;
    if (win) expPerHero *= 1.5;

    let heroResults = [];
    if (win) {
        let baseGoldReward = this.level * 1000;
        let baseExpReward = this.level * 500;
        this.goldEarned += baseGoldReward;
        expPerHero += baseExpReward;
        expPerHero = Math.floor(expPerHero * 1.2);

        let rand = Math.random();
        // 3x Probabilities:
        // M3: 5% -> 15%
        // M2: 10% -> 30%
        // M1: 30% -> 55% (Total 100%)
        if (rand < 0.55) medal = 1;
        else if (rand < 0.85) medal = 2;
        else medal = 3; // Guaranteed medal

        if (medal > DB.data.medals[this.level - 1]) {
            DB.data.medals[this.level - 1] = medal;
        }
        if (this.level >= DB.data.maxStage) DB.data.maxStage++;
        DB.data.gold += this.goldEarned;
    }

    let activeHeroesCount = 0;
    for (let i = 0; i < 4; i++) {
        if (DB.data.team[i]) activeHeroesCount++;
    }
    expPerHero = activeHeroesCount > 0 ? Math.floor(expPerHero / activeHeroesCount) : 0;

    for (let i = 0; i < 4; i++) {
        let hIdx = DB.data.team[i];
        if (hIdx !== null) {
            let h = DB.data.heroes.find(x => x.id === hIdx);
            if (h) {
                let leveledUp = DB.addHeroExp(h, expPerHero);
                let typeKey = Object.keys(CLASS_TYPES).find(k => CLASS_TYPES[k].id === h.type);
                let icon = typeKey ? CLASS_TYPES[typeKey].icon : "?";

                heroResults.push({
                    icon: icon,
                    stars: h.stars,
                    level: h.level,
                    expGain: expPerHero,
                    leveledUp: leveledUp
                });
            }
        }
    }

    DB.save();

    this.resultData = {
        win: win,
        gold: this.goldEarned,
        medal: medal,
        heroes: heroResults,
        item: itemDropped
    };
};

PlayState.Enter = function () {
    this.units = [];
    BackgroundSystem.setTheme(this.level);
    this.particles = [];
    this.projectiles = [];
    this.camera = { x: 0, y: 0, scale: 1 };
    this.baseY = GAME.Canvas.Height - 200;
    let buffs = DB.getBuffs();

    this.playerBase = {
        x: 100, hp: 1000 * DB.data.baseStats.hpLvl * (1 + buffs[0] / 100),
        maxHp: 1000 * DB.data.baseStats.hpLvl * (1 + buffs[0] / 100),
        team: 0, w: 100, h: 200
    };

    let baseDist = 2200;
    if (this.level < 5) baseDist = 800 + this.level * 200;
    else if (this.level < 10) baseDist = 1600 + (this.level - 5) * 100;

    let hpMult = 1.5;
    if (this.level < 5) hpMult = 0.5 + this.level * 0.1;

    let diff = this.level * hpMult;
    this.enemyBase = {
        x: Math.min(baseDist, 2200),
        hp: 1000 * diff, maxHp: 1000 * diff,
        team: 1, w: 100, h: 200
    };

    this.mineral = 300 + DB.data.baseStats.minMaxLvl * 100;
    this.maxMineral = this.mineral;
    this.mineralRate = 1 + DB.data.baseStats.minRateLvl * 0.1 + buffs[2] / 100;
    this.mineralLevel = 1;

    this.goldEarned = 0;
    this.gameOver = false;
    this.enemySpawnTimer = 0;
    this.missileCD = 0;
    this.enemyMissileCD = 5; // Initial delay
    this.zoomLevel = 1;
    this.heroCDs = [0, 0, 0, 0];
    this.confirmExit = false;

    this.showBoosterDialog = true;
    this.boosters = { atk: 1, spd: 1, meteor: 0 };
    this.meteorCharges = 1;
    this.lastDragX = null;
    this.isDragging = false;
    this.resultData = null;
    this.regenTimer = 0;

    // Meteor State
    this.meteorActive = false;
    this.meteorTimer = 0;
    this.meteorWaveCount = 0;

    // Spell States
    this.spellFlags = { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false }; // True if used
    this.spells = {};
    if (DB.data.spells) this.spells = DB.data.spells;

    // Spell Logic State
    this.spellActive = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 }; // Timers for active effects

    // Pause State
    this.isPaused = false;

    // Keyboard Handler
    this.keyHandler = this.handleKeyPress.bind(this);
    window.addEventListener('keydown', this.keyHandler);

    this.clouds = [];
    for (let i = 0; i < 10; i++) {
        this.clouds.push({
            x: Math.random() * 3000,
            y: Math.random() * (this.baseY - 100),
            w: 100 + Math.random() * 100,
            speed: 10 + Math.random() * 20
        });
    }

    this.bossSpawned = false; // Reset Boss Spawn Flag

    // Force Boss Spawn immediately (Start of level)
    if (this.level % 20 === 0 && !this.pvp?.enabled) {
        this.enemySpawnTimer = 999;
    }

    // PvP Initialization
    if (this.pvp?.enabled) {
        this.showBoosterDialog = false; // Skip boosters in PvP
        this.isHost = this.pvp.isHost;
        this.opponentTeam = null;

        if (this.isHost) {
            // Host waits for client team info
            NetworkSystem.onMessage((data) => {
                if (data.type === "init") {
                    this.opponentTeam = data.team;
                }
                if (data.type === "input") {
                    this.handleOpponentInput(data);
                }
            });
        } else {
            // Client sends team info and waits for state
            NetworkSystem.send({
                type: "init",
                team: {
                    heroes: DB.data.heroes,
                    team: DB.data.team
                }
            });

            NetworkSystem.onMessage((data) => {
                if (data.type === "state") {
                    this.syncState(data.state);
                }
            });
        }
    }
};

PlayState.handleOpponentInput = function (data) {
    if (data.key >= '1' && data.key <= '4') {
        this.spawnTargetUnit(parseInt(data.key) - 1, 1);
    }
    if (data.key === 's' || data.key === 'S') {
        this.fireTargetMissile(1);
    }
};

PlayState.syncState = function (state) {
    // Basic sync: units, bases, projectiles
    this.units = state.units;
    this.playerBase.hp = state.pBaseHp;
    this.enemyBase.hp = state.eBaseHp;
    this.projectiles = state.projectiles;
    this.particles = state.particles;
    this.mineral = state.mineral;
    this.maxMineral = state.maxMineral;
    this.mineralLevel = state.mineralLevel;
};

PlayState.Exit = function () {
    // Clean up keyboard event listener to prevent stacking
    if (this.keyHandler) {
        window.removeEventListener('keydown', this.keyHandler);
        this.keyHandler = null;
    }
};

PlayState.castSpell = function (id) {
    if (this.spellFlags[id]) { addToast("Đã sử dụng trong màn này!", "#F44336"); return; }

    // Check Level & Unlock
    let lvl = this.spells[id];
    if (!lvl || lvl <= 0) { addToast("Chưa học kỹ năng này!", "#9E9E9E"); return; }

    // Check Gold Cost (Battle Cost)? 
    // User: "tieu hao vang tuy cap do" -> Consume Gold depending on Level.
    // Let's deduce gold.
    import('../data/dataManager.js').then(({ SPELL_TYPES }) => {
        let type = SPELL_TYPES[id];
        let cost = type.cost * lvl;

        // Wait, active cost or upgrade cost? "skill use will consume gold".
        // Let's assume cost is manageable, e.g. 50 * lvl.

        if (DB.data.gold < cost) { addToast("Không đủ vàng để dùng!", "#F44336"); return; }

        DB.data.gold -= cost;
        this.spellFlags[id] = true;
        addToast(`Đã dùng ${type.name}!`, "#0F0");

        // Logic
        if (id === 0) { // Heal Base
            this.spellActive[0] = 5; // 5s duration
        }
        else if (id === 1) { // Supply Drop
            // Spawn Supply Unit (Static, Heals nearby)
            this.units.push({
                x: this.playerBase.x + 150, y: this.baseY,
                team: 0, type: 999, // Supply
                hp: 500 * lvl, maxHp: 500 * lvl,
                atk: 0, spd: 0, range: 0,
                state: 'idle', w: 60, h: 60, dead: false,
                hitTimer: 0,
                isSupply: true,
                healVal: type.val * lvl, // 50 * lvl
                life: 5 + lvl * 1 // Scale duration: 5s + 1s/lvl
            });
        }
        else if (id === 2) { // Guardian
            // Spawn Guardian Unit
            this.units.push({
                x: this.playerBase.x + 200, y: this.baseY,
                team: 0, type: 888, // Guardian
                hp: 2000 * lvl, maxHp: 2000 * lvl,
                atk: 100 * lvl, spd: 4, range: 100,
                state: 'move', w: 80, h: 80, dead: false,
                atkSpd: 2.0, atkCD: 0,
                hitTimer: 0,
                isGuardian: true,
                isGuardian: true,
                life: 5 + lvl * 1 // Scale duration: 5s + 1s/lvl
            });
        }
        else if (id === 3) { // Wall
            this.units.push({
                x: this.playerBase.x + 250, y: this.baseY,
                team: 0, type: 777, // Wall
                hp: 5000 * lvl, maxHp: 5000 * lvl,
                atk: 0, spd: 0, range: 0,
                state: 'idle', w: 60, h: 120, dead: false,
                hitTimer: 0,
                isWall: true,
                isWall: true,
                life: 5 + lvl * 1 // Scale duration: 5s + 1s/lvl
            });
        }
        else if (id === 4) { // Freeze - Đóng băng
            let duration = 5 + (lvl - 1) * 0.5; // Scale duration
            this.spellActive[4] = duration;
            // Freeze all enemy units
            this.units.forEach(u => {
                if (u.team === 1) {
                    u.frozen = true;
                    u.frozenTimer = duration;
                }
            });
        }
        else if (id === 5) { // Poison Gas - Khói độc
            this.spellActive[5] = 5; // 5s duration for visual
            let percentage = 0.05 + (lvl - 1) * 0.01; // 5% + 1% per level

            // Deal damage over time to all enemy units
            this.units.forEach(u => {
                if (u.team === 1) {
                    u.poisonTimer = 5; // 5s duration
                    u.poisonDamageRate = (u.maxHp * percentage) / 5; // Damage per second
                    u.poisoned = true; // For potential visual extensions

                    // Create poison effect
                    this.createEffect('blood', u.x, u.y - 20, { life: 0.5, color: 'lime' });
                }
            });
        }
        else if (id === 6) { // Frenzy - Cuồng Nhiệt
            let duration = 5 + (lvl - 1) * 1;
            this.spellActive[6] = duration;
            // Visual feedback
            this.units.forEach(u => {
                if (u.team === 0) this.createEffect('crit', u.x, u.y - 40, { life: 0.5, val: "FRENZY!" });
            });
        }
        else if (id === 7) { // Rage - Cuồng Nộ
            let duration = 5 + (lvl - 1) * 1;
            this.spellActive[7] = duration;
            // Visual feedback
            this.units.forEach(u => {
                if (u.team === 0) this.createEffect('crit', u.x, u.y - 40, { life: 0.5, val: "RAGE!" });
            });
        }
    });
};

PlayState.handleKeyPress = function (e) {
    // IMPORTANT: Prevent default and stop propagation FIRST
    // IMPORTANT: Prevent default and stop propagation FIRST
    if (['Escape', 'a', 'A', 's', 'S', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) ||
        (e.key >= '0' && e.key <= '9')) {
        e.preventDefault();
        e.stopPropagation();
    }

    if (this.gameOver) return;

    if (e.key === 'Escape') { this.isPaused = !this.isPaused; return; }
    if (this.isPaused) return;

    // Mineral Upgrade (A key)
    if (e.key === 'a' || e.key === 'A') {
        let minCost = this.mineralLevel * 200;
        if (this.mineral >= minCost && this.mineralLevel < 8) {
            this.mineral -= minCost; this.mineralLevel++; this.maxMineral += 300;
            addToast("Mineral upgraded!", "#00FF00");
        }
        return;
    }

    // Fire Missile (S key)
    if (e.key === 's' || e.key === 'S') {
        this.fireMissile();
        return;
    }

    // Hero Spawn Shortcuts (1-4)
    if (e.key >= '1' && e.key <= '4') {
        let heroIdx = parseInt(e.key) - 1;
        if (this.pvp?.enabled && !this.isHost) {
            NetworkSystem.send({ type: "input", key: e.key });
        } else {
            this.spawnPlayerUnit(heroIdx);
        }
        return;
    }

    // Spell Shortcuts (5-9, 0)
    let spellSlotIdx = -1;
    if (e.key >= '5' && e.key <= '9') spellSlotIdx = parseInt(e.key) - 5;
    if (e.key === '0') spellSlotIdx = 5;

    if (spellSlotIdx !== -1) {
        if (!DB.data.spellSlots) DB.data.spellSlots = [0, 1, 2, 3, 4, 5];
        let spellId = DB.data.spellSlots[spellSlotIdx];
        if (spellId !== null && spellId !== undefined) this.castSpell(spellId);
        return;
    }

    // Zoom Toggle (Arrow Up)
    if (e.key === 'ArrowUp') {
        this.zoomLevel = this.zoomLevel === 1 ? 2 : 1;
        addToast(this.zoomLevel === 1 ? "Zoom: Normal" : "Zoom: Wide", "#00FFFF");
        return;
    }

    // Fire Meteor (Arrow Down)
    if (e.key === 'ArrowDown') {
        this.fireMeteor();
        return;
    }
};

PlayState.drawSpellButtons = function (ctx) {
    // Re-importing SPELL_TYPES inside Draw loop is bad perf.
    // CACHE IT.
    if (!this.spellTypes) {
        import('../data/dataManager.js').then(({ SPELL_TYPES }) => { this.spellTypes = SPELL_TYPES; });
        return;
    }

    // Place spell buttons horizontally, behind hero buttons at the bottom
    let bY = GAME.Canvas.Height - 100;
    let btnW = 60, btnH = 60;
    let gap = 10;

    // START ALIGNMENT FROM LEFT
    // Mineral(90) + Gap(10) + Missile(90) + Gap(10) + 4*Heroes(80*4 + 10*3) = 100 + 100 + 350 = 550 roughly
    // Let's use exact calculation matching Draw logic:
    // StartX = 20
    // MissileX = 20 + 90 + 10 = 120
    // HeroStartX = 120 + 90 + 10 = 220
    // HeroWidth = 4*80 + 3*10 = 320 + 30 = 350
    // SpellStartX = 220 + 350 + 20 = 590

    let leftMargin = 20;
    let mineralW = 90;
    let missileW = 90;
    let heroW = 80;
    let spacing = 10;

    let heroTotalW = 4 * heroW + 3 * spacing;
    let startX = leftMargin + mineralW + spacing + missileW + spacing + heroTotalW + 20;

    let spellSlots = DB.data.spellSlots || [0, 1, 2, 3, 4, 5];
    for (let idx = 0; idx < 6; idx++) {
        let x = startX + idx * (btnW + gap);
        let y = bY + 10;

        let spellId = spellSlots[idx];

        let numIcons = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
        let scShort = (idx + 5) === 10 ? 0 : (idx + 5);
        let shortcut = numIcons[scShort];

        if (spellId === null || spellId === undefined) {
            drawRoundedRect(ctx, x, y, btnW, btnH, 10, "#222");
            drawText(ctx, shortcut, x + 5, y + 15, "gray", 14, "left");
            continue;
        }
        let spell = this.spellTypes[spellId];
        if (!spell) continue;

        let lvl = this.spells[spell.id];
        let unlocked = lvl > 0;
        let used = this.spellFlags[spell.id];
        let cost = spell.cost * (lvl || 1); // Show cost even if not unlocked

        drawButton(ctx, spell.icon, x, y, btnW, btnH,
            (!unlocked) ? "#333" : (used ? "#555" : "#9C27B0"), // Purple color for skills
            () => this.castSpell(spell.id),
            "white", 30, false, "sans-serif"
        );

        // Cooldown/Used overlay
        if (used) {
            drawText(ctx, "X", x + btnW / 2, y + btnH / 2 + 5, "red", 30, "center");
        } else if (unlocked) {
            // Show Shortcut in corner
            drawText(ctx, shortcut, x + 5, y + 15, "white", 14, "left");
            // Show Level inside button, bottom area
            drawText(ctx, `Lv${lvl}`, x + btnW / 2, y + btnH - 3, "yellow", 11, "center");
        } else {
            // Show Shortcut even when locked
            drawText(ctx, shortcut, x + 5, y + 15, "gray", 14, "left");
        }

        // Show cost below button with gold icon
        drawText(ctx, `${cost}🟡`, x + btnW / 2, y + btnH + 13, unlocked ? "yellow" : "#666", 11, "center");
    }
};

PlayState.Draw = function (ctx) {
    // ... Existing Draw code ...
    // Delegate to original logic or replicate?
    // I need to inject `drawSpellButtons` call.
    // Since I can't effectively inject into the middle of `Draw` without viewing it all,
    // I'll append `drawSpellButtons` call at the end of `Draw` if I can find `PlayState.Draw = ...` end.
    // But `PlayState.Draw` is likely massive.
    // Instead, I'll rely on the fact that I'm editing `Update` and `Enter`. 
    // I need to replace `Draw`.
    // Wait, the snippet provided in `view_file` didn't show `Draw`.
    // I will view `Draw` first before attempting to replace it.
};

PlayState.Update = function (dt) {
    if (this.gameOver || this.confirmExit || this.showBoosterDialog || this.resultData) return;

    if (this.pvp?.enabled && !this.isHost) {
        BackgroundSystem.Update(dt);
        // Guest only updates background and camera (optional, or sync camera)
        // Physics and units are synced from host
        return;
    }

    BackgroundSystem.Update(dt);

    // Spell Effects Update
    if (this.spellActive[0] > 0) { // Heal Base
        this.spellActive[0] -= dt;
        let healAmount = 100 * (this.spells[0] || 1) * dt;
        this.playerBase.hp = Math.min(this.playerBase.maxHp, this.playerBase.hp + healAmount);
        if (Math.random() < 0.3) this.createEffect('shield_block', this.playerBase.x + 50, this.baseY - 50, { life: 0.5, color: 'lime' });
    }

    // Supply/Guardian/Wall Decay
    for (let u of this.units) {
        if (u.isSupply || u.isGuardian || u.isWall) {
            u.life -= dt;
            if (u.life <= 0) u.hp = 0; // Die

            if (u.isSupply) {
                // AoE Heal
                this.units.forEach(ally => {
                    if (ally.team === 0 && Math.abs(ally.x - u.x) < 200) {
                        ally.hp = Math.min(ally.maxHp, ally.hp + u.healVal * dt);
                    }
                });
                if (Math.random() < 0.1) this.createEffect('shield_block', u.x, u.y - 30, { life: 0.5, color: '#00FA9A' });
            }
        }
    }

    if (this.zoomLevel === 1) {

        this.camera.scale = 1; // RESET SCALE
        this.camera.y = 0;
        if (Enjine.Mouse.Down) {
            if (this.lastDragX !== null) {
                let dx = Enjine.Mouse.X - this.lastDragX;
                if (Math.abs(dx) > 0) this.isDragging = true;
                this.camera.x -= dx;
                this.camera.x = Math.max(0, Math.min(this.camera.x, 2400 - GAME.Canvas.Width));
            }
            this.lastDragX = Enjine.Mouse.X;
        } else {
            this.lastDragX = null;
            this.isDragging = false;
            let frontX = 0;
            this.units.forEach(u => { if (u.team === 0 && u.x > frontX) frontX = u.x; });
            let targetCamX = frontX - GAME.Canvas.Width / 3;
            targetCamX = Math.max(0, Math.min(targetCamX, 2400 - GAME.Canvas.Width));
            this.camera.x += (targetCamX - this.camera.x) * 0.1;
        }
    } else {
        this.camera.x = 0;
        this.camera.scale = GAME.Canvas.Width / 2400;
        // Align bottom of map (baseY + 200) with bottom of screen
        this.camera.y = (this.baseY + 200) - (GAME.Canvas.Height / this.camera.scale);
        // If the calculated y is positive (panning down), clamp it?
        // Actually, normally camera.y should be negative or 0 to show higher up?
        // No, positive camera.y translates by -y.
        // Wait, `ctx.translate(-camera.x, -camera.y)`.
        // If `camera.y` is -100, translate(0, 100). Shifts world DOWN.
        // If we want to verify:
        // Screen Bottom = `camera.y + Height / scale`.
        // We set `camera.y = (baseY + 200) - Height / scale`.
        // So Screen Bottom = `baseY + 200`. Correct.
        // This ensures the bottom of the ground (baseY+200) is exactly at the bottom of the viewport.
    }

    if (this.mineral < this.maxMineral) {
        this.mineral += this.mineralRate * (1 + this.mineralLevel * 0.2);
        if (this.mineral > this.maxMineral) this.mineral = this.maxMineral;
    }

    if (this.missileCD > 0) this.missileCD -= dt;
    for (let i = 0; i < 4; i++) if (this.heroCDs[i] > 0) this.heroCDs[i] -= dt;

    this.enemySpawnTimer += dt;
    let spawnRate = 5 - (this.level * 0.04);
    if (this.level < 5) spawnRate = 12 - this.level;
    if (spawnRate < 1) spawnRate = 1;

    if (this.enemySpawnTimer > spawnRate) {
        this.spawnEnemy();
        this.enemySpawnTimer = 0;
    }

    this.regenTimer += dt;
    if (this.regenTimer >= 0.5) {
        this.units.forEach(u => {
            if (u.regen > 0 && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + u.regen);
        });
        this.regenTimer = 0;
    }

    // Meteor Shower Logic
    if (this.meteorActive) {
        this.meteorTimer += dt;
        if (this.meteorWaveCount === 0 && this.meteorTimer >= 0) {
            this.spawnMeteorWave();
            this.meteorWaveCount++;
        } else if (this.meteorWaveCount === 1 && this.meteorTimer >= 1.0) {
            this.spawnMeteorWave();
            this.meteorWaveCount++;
        } else if (this.meteorWaveCount === 2 && this.meteorTimer >= 2.0) {
            this.spawnMeteorWave();
            this.meteorWaveCount++;
        }

        if (this.meteorTimer >= 3.0) {
            this.meteorActive = false;
        }
    }

    for (let i = this.units.length - 1; i >= 0; i--) {
        let u = this.units[i];
        this.updateUnit(u, dt);
        if (u.dead) this.units.splice(i, 1);
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
        let p = this.projectiles[i];

        if (p.type === 3 || p.type === 4 || p.type === 5) {
            if (p.type === 5 && p.targetUnit && !p.targetUnit.dead) {
                p.targetX = p.targetUnit.x;
                p.targetY = p.targetUnit.y;
            }
            p.timer += dt * p.speed;
            if (p.timer >= 1) {
                let rad = 150;
                let damage = p.dmg;
                if (p.type === 5) { rad = 100; damage = p.dmg * 0.8; }
                this.explodeMissile(p.targetX, damage, rad, p.team);
                this.projectiles.splice(i, 1);
                continue;
            }
            if (p.type === 3) {
                p.x = p.startX + (p.targetX - p.startX) * p.timer;
                let arcHeight = 300;
                let linearY = p.startY + (p.targetY - p.startY) * p.timer;
                let curve = 4 * arcHeight * p.timer * (1 - p.timer);
                p.y = linearY - curve;
            } else {
                p.x = p.startX + (p.targetX - p.startX) * p.timer;
                p.y = p.startY + (p.targetY - p.startY) * p.timer;
            }
            if (Math.random() < 0.3) { // Reduced smoke for performance
                this.createEffect('smoke', p.x, p.y, { life: 0.5 });
            }
            continue;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        let targetTeam = p.team === 0 ? 1 : 0;
        let hit = false;

        let targetBase = targetTeam === 0 ? this.playerBase : this.enemyBase;
        if (p.x > targetBase.x && p.x < targetBase.x + targetBase.w && p.y > this.baseY - targetBase.h) {
            targetBase.hp -= p.dmg;
            hit = true;
        }

        for (let u of this.units) {
            if (u.team === targetTeam && Math.abs(u.x - p.x) < 20) {
                if (u.type === 4 && p.type !== 2 && p.type !== 3 && p.type !== 4 && p.type !== 5) continue;

                if (Math.random() * 100 < u.eva) continue;

                let realDmg = p.dmg * (100 / (100 + (u.def || 0)));
                // DOG Block Chance
                if (u.type === 14 && Math.random() < 0.3) {
                    realDmg = 0;
                    this.createEffect('shield_block', u.x, u.y - 30, { life: 0.4 });
                }

                u.hp -= realDmg;
                hit = true;

                // SNAKE Poison & FOX Stun (Ranged)
                let attackerInfo = Object.values(CLASS_TYPES).find(t => t.id === 10 || t.id === 17); // This is weak logic, p doesn't store attacker type...
                // PROJECTILE TYPES DON'T STORE ATTACKER INFO.
                // We need to pass attacker props to projectile if we want ranged effects. 
                // For now, Snake/Fox ranged effects are implemented as Special Projectiles logic or simplified?
                // Let's rely on type mapping? 
                // Wait, snake is type 10, Fox is 17. 
                // Projectile struct needs to know source type or effect.
                // Simplified: We didn't add effect prop to projectile. 
                // Let's assume standardized effects for now or update projectile creation.
                // Update: Snake uses projType 1 (arrow), Fox uses 5 (magic).

                if (p.type === 5 && Math.random() < 0.2) u.stunTimer = 1.0; // Magic (Fox/Kirin) stuns?
                if (p.type === 1) break;
            }
        }
        if (hit && p.type !== 0) p.life = 0;
        if (p.life <= 0) this.projectiles.splice(i, 1);
    }

    if (this.playerBase.hp <= 0) this.endGame(false);
    if (this.enemyBase.hp <= 0) this.endGame(true);

    // Enemy Missile Logic
    if (this.enemyMissileCD > 0) this.enemyMissileCD -= dt;
    else {
        let cd = 10 - this.level * 0.2;
        if (cd < 5) cd = 5;
        this.enemyMissileCD = cd;

        let targetX = this.playerBase.x + 50; // Default to base
        let targetY = this.baseY;

        // Priority: Hit player units if any exist
        let playerUnits = this.units.filter(u => u.team === 0 && !u.dead);
        if (playerUnits.length > 0) {
            let r = Math.floor(Math.random() * playerUnits.length);
            targetX = playerUnits[r].x;
            targetY = playerUnits[r].y; // Target unit position
        }

        this.projectiles.push({
            type: 3,
            startX: this.enemyBase.x,
            startY: this.baseY - 150,
            targetX: targetX,
            targetY: targetY,
            x: this.enemyBase.x,
            y: this.baseY - 150,
            timer: 0,
            speed: 1.0,
            dmg: this.level * 50, // Enemy missile damage
            team: 1
        });
    }

    // PvP State Sync (Host to Guest)
    if (this.pvp?.enabled && this.isHost) {
        NetworkSystem.send({
            type: "state",
            state: {
                units: this.units,
                pBaseHp: this.playerBase.hp,
                eBaseHp: this.enemyBase.hp,
                projectiles: this.projectiles,
                particles: this.particles,
                mineral: this.mineral,
                maxMineral: this.maxMineral,
                mineralLevel: this.mineralLevel
            }
        });
    }
};

PlayState.spawnEnemy = function () {
    if (this.pvp?.enabled) return;
    let allTypes = Object.values(CLASS_TYPES);
    // Unlock new enemies progressively: Start with 5, add 1 every level
    let availableCount = Math.min(allTypes.length, 5 + this.level);
    let type = allTypes[Math.floor(Math.random() * availableCount)];

    let isBoss = false;
    let isSuperBoss = false;

    // Level 20, 40, 60... Boss Logic
    if (this.level % 20 === 0) {
        if (this.bossSpawned) return; // Only spawn Boss once per level

        // Define Boss Types for each milestone
        const BOSS_MAP = {
            20: 45, // Ant (Kiến)
            40: 46, // Spider (Nhện)
            60: 10, // Snake (Rắn)
            80: 22, // Rhino (Tê Giác)
            100: 1, // Tiger (Hổ)
            120: 23, // Bear (Gấu)
            140: 26, // Crocodile (Cá Sấu)
            160: 69, // Gorilla (Khỉ Đột)
            180: 76, // Mammoth (Voi Ma Mút)
            200: 78, // T-Rex
            220: 34, // Whale (Cá Voi)
            240: 38, // Shark (Cá Mập)
            260: 20, // Elephant (Bạch Tượng)
            280: 79, // Triceratops
            300: 0,  // Dragon (Thanh Long)
            320: 60, // Koala 
            340: 58, // Hippo (Hà Mã)
            360: 19, // Lion (Sư Tử)
            380: 18, // Wolf (Sói Bạc)
            400: 4,  // Bomb (Cảm tử - Giant Bomb!)
            420: 82, // Robot
            440: 80, // Alien
            460: 91, // Samurai
            480: 90, // Ninja
            500: 85  // Vampire
        };

        let bossTypeId = BOSS_MAP[this.level];
        // If > 500 or undefined, pick random large unit from pool
        if (!bossTypeId) {
            let bigIds = [45, 46, 10, 22, 1, 23, 26, 69, 76, 78, 34, 38, 20, 79, 0, 58, 19, 18, 82, 80, 85];
            bossTypeId = bigIds[this.level % bigIds.length]; // Deterministic cycle based on level
        }

        let bossType = CLASS_TYPES[Object.keys(CLASS_TYPES).find(k => CLASS_TYPES[k].id === bossTypeId)];
        type = bossType || type; // Safety fallback

        isBoss = true;
        isSuperBoss = true; // Use Super Boss scaling
        this.bossSpawned = true;

        // VISUAL FEEDBACK
        addToast("⚠️ CẢNH BÁO: BOSS XUẤT HIỆN! ⚠️", "#FF0000");
    }

    if (this.level % 10 === 0 && this.level % 20 !== 0 && Math.random() < 0.2) isBoss = true;

    // Super Boss every 100 levels (Handled by % 20 logic now for 100/200)

    // Scaling Logic
    // Original: Math.pow(1.1, this.level - 1) -> Too steep for lvl 1000
    // New: Linear + Soft Exponential
    // 1-50: 1.1^L
    // 50+: Fixed base * 1.02^(L-50) ?
    let statsScale = 1;
    if (this.level <= 50) {
        statsScale = Math.pow(1.1, this.level - 1);
    } else {
        // Base at 50 is ~117.
        // From 50 to 1000, we want it to grow but not to infinity.
        // Let's use 1.05 per level? 1.05^950 is still huge.
        // Let's use Polynomial: L^2 / X?
        // Let's go with linear multiplier after 50 for stability or very low exp.
        // 1.02^950 = ~1.4e8. Manageable for BigInt or large numbers, but HP bars display might look ugly.
        // Let's stick strictly to what User might expect: Tougher but possible.
        // Let's use 1.015 for post-50.
        let base50 = Math.pow(1.1, 49);
        statsScale = base50 * Math.pow(1.02, this.level - 50);
    }

    let u = {
        x: this.enemyBase.x,
        y: this.baseY + (Math.random() * 40 - 20),
        team: 1,
        hp: type.id === 3 ? statsScale * 900 : statsScale * 300,
        maxHp: type.id === 3 ? statsScale * 900 : statsScale * 300,
        atk: statsScale * 30,
        spd: type.id === 1 ? 12.5 : 7.5,
        range: type.id === 0 || type.id === 2 ? 400 : 50,
        color: type.color,
        icon: type.icon,
        cd: 0,
        atkSpd: 1.0,
        state: "move",
        type: type.id,
        effect: type.effect
    };

    // Assign Projectile Types
    // Alien(80) and Tank(82) use Missiles
    if (type.id === 80 || type.id === 82) u.projType = 5;
    if (type.id === 0) u.projType = 2; // Dragon uses Lightning/Breath

    if (this.level % 20 === 0 && isSuperBoss) {
        // BOSS STATS (5x Size - Reduced from 10x)
        u.hp *= 100;
        u.maxHp *= 100;
        u.atk *= 2;
        u.w = 200; // 5x normal (~40)
        u.h = 200;
        u.y = this.baseY - 100; // Correctly on ground for 200px height (Center is at BaseY-100, Feet at BaseY)
        u.spd = 2; // Slow
        u.isLevelBoss = true;
        u.minionTimer = 10; // Spawn every 10s
        u.minionType = type.id;
        u.minionStatsScale = statsScale;
    } else if (isBoss) {
        u.hp *= 5;
        u.maxHp *= 5;
        u.atk *= 1.5;
        u.w = 80;
        u.h = 80;
    }

    // Apply Class Mods
    if (type.id === 0 || type.id === 2 || type.id === 5) { u.range = 300; u.spd = 1.5; }
    if (type.id === 3 || type.id === 22 || type.id === 50) { u.hp *= 2; u.spd = 1.0; }
    if (type.id === 1 || type.id === 6 || type.id === 11) { u.spd = 5.0; }
    if (type.id === 4) { u.spd = 8.0; } // Suicide Bombers - Very Fast

    // Flying Units - Fly High & Fixed
    const FLYING_IDS = [0, 2, 16, 39, 40, 41, 42, 43, 48, 64, 65, 77, 80, 81, 88, 89];
    if (FLYING_IDS.includes(type.id)) {
        u.y = this.baseY - 150; // High altitude, no random
    }

    this.units.push(u);
};

PlayState.spawnTargetUnit = function (slotIdx, team) {
    // Special logic for spawning opponent units in PvP
    if (!this.opponentTeam) return;
    let hId = this.opponentTeam.team[slotIdx];
    if (!hId) return;
    let hero = this.opponentTeam.heroes.find(h => h.id === hId);

    // Scaling/Costs for PvP units? For now, assume same logic but for Team 1
    // We'll skip mineral check for opponent for simplicity or implement opponent minerals

    let typeInfo = Object.values(CLASS_TYPES).find(t => t.id === hero.type);

    this.units.push({
        x: this.enemyBase.x - 100, y: this.baseY,
        team: 1, type: hero.type,
        hp: hero.hp, maxHp: hero.hp,
        atk: hero.atk,
        baseAtk: hero.atk,
        spd: hero.spd, range: hero.range,
        atkSpd: hero.atkSpd,
        baseAtkSpd: hero.atkSpd,
        def: hero.def, crit: hero.crit, eva: hero.eva, regen: hero.regen,
        cd: 0, state: 'move', w: 40, h: 40, dead: false,
        projType: hero.projType, atkType: hero.atkType,
        hitTimer: 0,
        effect: typeInfo ? typeInfo.effect : "💥"
    });
};

PlayState.fireTargetMissile = function (team) {
    let sourceBase = team === 0 ? this.playerBase : this.enemyBase;
    let targetTeam = team === 0 ? 1 : 0;
    let targetX = team === 0 ? this.enemyBase.x : this.playerBase.x;

    let minDistance = 99999;
    this.units.forEach(u => {
        if (u.team === targetTeam && !u.dead) {
            let d = Math.abs(u.x - (team === 0 ? 0 : 2400)); // Simple focus logic
            if (d < minDistance) {
                minDistance = d;
                targetX = u.x;
            }
        }
    });

    this.projectiles.push({
        type: 3,
        startX: sourceBase.x + (team === 0 ? 100 : 0),
        startY: this.baseY - 150,
        targetX: targetX,
        targetY: this.baseY,
        x: sourceBase.x, y: this.baseY - 150, timer: 0, speed: 1.0,
        dmg: 500, // Fixed PvP missile dmg for now
        team: team
    });
};

PlayState.spawnPlayerUnit = function (slotIdx) {
    let hId = DB.data.team[slotIdx];
    if (!hId) return;
    let hero = DB.data.heroes.find(h => h.id === hId);

    if (this.mineral >= hero.cost && this.heroCDs[slotIdx] <= 0) {
        if (this.units.filter(u => u.team === 0).length >= DB.data.limitUnits) {
            addToast(`Giới hạn quân: ${DB.data.limitUnits} !`, "#E91E63");
            return;
        }
        this.mineral -= hero.cost;
        this.heroCDs[slotIdx] = hero.cost / 20;

        let moveSpeed = hero.spd;
        if (hero.type === 4) moveSpeed *= 8;

        // Apply Equipment Stats
        let bonusAtk = 0, bonusDef = 0, bonusSpd = 0, bonusAtkSpd = 0;
        if (hero.equipments) {
            Object.values(hero.equipments).forEach(itemId => {
                if (itemId) {
                    let item = DB.data.inventory.find(i => i.id === itemId);
                    if (item) {
                        if (item.mainStat.type === 'atk') bonusAtk += item.mainStat.val;
                        if (item.mainStat.type === 'def') bonusDef += item.mainStat.val;
                        if (item.mainStat.type === 'spd') bonusSpd += item.mainStat.val;
                        if (item.mainStat.type === 'atkSpd') bonusAtkSpd += item.mainStat.val;

                        if (item.subStat.type === 'atk') bonusAtk += item.subStat.val;
                        if (item.subStat.type === 'def') bonusDef += item.subStat.val;
                        if (item.subStat.type === 'spd') bonusSpd += item.subStat.val;
                        if (item.subStat.type === 'atkSpd') bonusAtkSpd += item.subStat.val;
                    }
                }
            });
        }

        let finalAtk = (hero.atk + bonusAtk) * this.boosters.atk;
        let finalSpd = (moveSpeed + bonusSpd) * this.boosters.spd; // Apply booster to base+bonus? usually base+bonus * multiplier
        let finalAtkSpd = (hero.atkSpd + bonusAtkSpd) * this.boosters.spd;

        // Get combat effect from CLASS_TYPES
        let typeInfo = Object.values(CLASS_TYPES).find(t => t.id === hero.type);

        this.units.push({
            x: this.playerBase.x + 100, y: this.baseY,
            team: 0, type: hero.type,
            hp: hero.hp, maxHp: hero.hp,
            atk: finalAtk,
            baseAtk: finalAtk, // Store base for multipliers
            spd: finalSpd, range: hero.range,
            atkSpd: finalAtkSpd,
            baseAtkSpd: finalAtkSpd, // Store base for multipliers
            def: hero.def + bonusDef, crit: hero.crit, eva: hero.eva, regen: hero.regen,
            cd: 0, state: 'move', w: 40, h: 40, dead: false,
            projType: hero.projType, atkType: hero.atkType,
            hitTimer: 0,
            effect: typeInfo ? typeInfo.effect : "💥" // Combat effect emoji
        });
    }
};

PlayState.updateUnit = function (u, dt) {
    if (u.hp <= 0 || isNaN(u.hp)) { u.dead = true; if (u.team === 1) { this.goldEarned += 100; DB.data.gold += 100; } return; }

    if (u.hitTimer > 0) u.hitTimer -= dt;

    // Handle frozen status
    if (u.frozen) {
        u.frozenTimer -= dt;
        if (u.frozenTimer <= 0) {
            u.frozen = false;
            delete u.frozenTimer;
        } else {
            return; // Skip all updates while frozen
        }
    }

    // Handle poisoned visual indicator (doesn't stop movement)
    if (u.poisoned) {
        u.poisonedTimer -= dt;
        if (u.poisonedTimer <= 0) {
            u.poisoned = false;
            delete u.poisonedTimer;
        }
    }

    // STATUS EFFECTS
    if (u.stunTimer > 0) { u.stunTimer -= dt; return; } // Stunned units can't do anything
    if (u.poisonTimer > 0) {
        u.poisonTimer -= dt;
        let pDmg = u.poisonDamageRate || 20; // Use calculated rate or default
        u.hp -= pDmg * dt;
        if (u.poisonTick > 0) u.poisonTick -= dt;
        else { u.poisonTick = 0.5; this.createEffect('blood', u.x, u.y - 20, { life: 0.3, color: 'lime' }); }
    }
    if (u.buffTimer > 0) u.buffTimer -= dt;

    // Dynamic Stat Calculation (Re-apply buffs every frame)
    if (!u.baseAtk) u.baseAtk = u.atk;
    if (!u.baseAtkSpd) u.baseAtkSpd = u.atkSpd;

    let currentAtk = u.baseAtk;
    let currentAtkSpd = u.baseAtkSpd;

    // Rooster Buff (+50% Speed)
    if (u.buffTimer > 0) currentAtkSpd *= 1.5;

    // Spell Buffs (Team 0 only)
    if (u.team === 0) {
        if (this.spellActive[6] > 0) currentAtkSpd *= 2; // Frenzy (+100% Speed)
        if (this.spellActive[7] > 0) currentAtk *= 2;    // Rage (+100% Atk)
    }

    u.atk = currentAtk;
    u.atkSpd = currentAtkSpd;

    // Boss Minion Spawning
    if (u.isLevelBoss) {
        if (!u.minionTimer) u.minionTimer = 10;
        u.minionTimer -= dt;
        if (u.minionTimer <= 0) {
            u.minionTimer = 10; // Reset to 10s
            // Spawn 10 minions
            let minionType = Object.values(CLASS_TYPES).find(t => t.id === u.minionType);
            if (minionType) {
                addToast("BOSS GỌI ĐỆ!", "#FFA500");
                for (let i = 0; i < 10; i++) {
                    let mx = u.x + (Math.random() * 200 - 100);
                    let statsScale = u.minionStatsScale || 1;

                    let minion = {
                        x: mx,
                        y: this.baseY + (Math.random() * 40 - 20),
                        team: 1,
                        hp: statsScale * 300 * 0.5, // Weaker than normal?
                        maxHp: statsScale * 300 * 0.5,
                        atk: statsScale * 30 * 0.8,
                        spd: 15, // Fast minions
                        range: 50,
                        color: minionType.color,
                        icon: minionType.icon,
                        cd: 0,
                        atkSpd: 1.0,
                        state: "move",
                        type: minionType.id,
                        effect: minionType.effect,
                        w: 30, h: 30 // Small
                    };
                    this.units.push(minion);
                }
            }
        }
    }

    // if (u.hp <= 0) ... // Moved up

    // PASSIVE ABILITIES (Goat & Rooster)
    if (u.type === 12 || u.type === 13) {
        if (u.cd <= 0) {
            let handled = false;
            this.units.forEach(ally => {
                if (ally.team === u.team && ally !== u && Math.abs(ally.x - u.x) < 300) {
                    if (u.type === 12 && ally.hp < ally.maxHp) { // Goat Heal
                        ally.hp = Math.min(ally.maxHp, ally.hp + u.atk + 50); // Heal calc
                        this.createEffect('shield_block', ally.x, ally.y - 40, { life: 0.5, color: 'lime' });
                        handled = true;
                    }
                    if (u.type === 13 && (!ally.buffTimer || ally.buffTimer <= 0)) { // Rooster Buff
                        ally.buffTimer = 5;
                        this.createEffect('crit', ally.x, ally.y - 60, { life: 0.5, val: "SPEED UP" });
                        handled = true;
                    }
                }
            });
            if (handled) u.cd = 3; // Cooldown for support skills
        } else {
            u.cd -= dt;
        }
        if (u.type === 12 || u.type === 13) { // Support units stay back
            // AI for support? Just move forward until enemy base is semi-close?
            // For now, let's keep them moving like normal units but they stop to cast.
        }
    }

    let target = null;
    let dist = 9999;

    let enemyBase = u.team === 0 ? this.enemyBase : this.playerBase;
    let baseDist = Math.abs(u.x - (u.team === 0 ? enemyBase.x : enemyBase.x + enemyBase.w));

    if (u.type === 4 && baseDist < 50) target = enemyBase;
    else {
        if (baseDist < u.range) { target = enemyBase; dist = baseDist; }
        else {
            for (let e of this.units) {
                if (e.team !== u.team && !e.dead) {
                    if (e.type === 4 && u.projType !== 2 && u.projType !== 5) continue;
                    let d = Math.abs(u.x - e.x);
                    if (d < u.range && d < dist) { dist = d; target = e; }
                }
            }
        }
    }

    if (target) {
        u.state = 'attack';
        if (u.type === 4) {
            u.hp = 0; target.hp -= u.atk * 5;
            this.createEffect('explosion', u.x, u.y - 100); return;
        }

        if (u.cd <= 0) {
            u.cd = 1 / u.atkSpd;

            let damage = u.atk;
            if (Math.random() * 100 < u.crit) damage *= 2;

            // PEACOCK Multi-shot
            if (u.type === 21) {
                for (let k = -1; k <= 1; k++) {
                    this.projectiles.push({
                        x: u.x, y: u.y - 20, vx: (u.team === 0 ? 300 : -300), vy: k * 50, life: 2, dmg: damage * 0.4, team: u.team, type: 1
                    });
                }
                u.cd = 1 / u.atkSpd;
                return; // Skip default attack
            }

            if (u.range > 60) {
                let vx = u.team === 0 ? 300 : -300;
                let type = u.projType || 1;

                if (type === 5) {
                    this.projectiles.push({
                        type: 5, startX: u.x, startY: u.y - 20, targetX: target.x, targetY: target.y,
                        x: u.x, y: u.y - 20, timer: 0, speed: 2.0, dmg: damage, team: u.team, targetUnit: target
                    });
                } else if (type === 2) {
                    if (!target.eva || Math.random() * 100 > target.eva) {
                        let finalDmg = damage * (100 / (100 + (target.def || 0)));
                        target.hp -= finalDmg;
                        if (target.hitTimer !== undefined) target.hitTimer = 0.2;
                        this.createEffect('smoke', target.x, target.y - 50, { life: 0.5 });
                        if (u.type === 2) this.createEffect('lightning', target.x, target.y, { life: 0.5 });
                    }
                } else {
                    this.projectiles.push({
                        x: u.x, y: u.y - 20, vx: vx, vy: 0, life: 2, dmg: damage, team: u.team, type: type
                    });
                }
            } else {
                if (!target.eva || Math.random() * 100 > target.eva) {
                    let finalDmg = damage * (100 / (100 + (target.def || 0)));
                    target.hp -= finalDmg;
                    if (target.hitTimer !== undefined) target.hitTimer = 0.2;

                    // TARGET ON HIT EFFECTS
                    if (target.type === 3) this.createEffect('shield_block', target.x, target.y - 40, { life: 0.5 });
                    else {
                        this.createEffect('blood', target.x, target.y - 40, { life: 0.5 });
                        this.createEffect(u.effect || 'slash', target.x, target.y - 40, { life: 0.4 }); // Use Class Effect
                    }

                    // ATTACKER EFFECTS
                    // if (u.type === 1) this.createEffect('slash', target.x, target.y - 40, { life: 0.3 }); // Already generic now
                    if (u.type === 6 && damage > u.atk) this.createEffect('crit', target.x, target.y - 80, { life: 1.0, val: Math.floor(finalDmg) });

                    // RAT Gold Steal
                    if (u.type === 7 && u.team === 0) { DB.data.gold += 10; this.goldEarned += 10; this.createEffect('crit', u.x, u.y - 60, { life: 0.5, val: "+10G" }); }
                    // OX Knockback
                    if (u.type === 8) { target.x += (u.team === 0 ? 50 : -50); }
                    // SNAKE Poison
                    if (u.type === 10) { target.poisonTimer = 5; }
                    // FOX Stun
                    if (u.type === 17) { if (Math.random() < 0.3) target.stunTimer = 1.5; }
                    // LION / ELEPHANT AoE
                    if (u.type === 19 || u.type === 20) {
                        this.units.forEach(e => {
                            if (e.team !== u.team && Math.abs(e.x - target.x) < 100 && e !== target) {
                                e.hp -= (u.type === 19 ? damage * 0.5 : damage * 0.3); // Splash dmg
                                this.createEffect('explosion', e.x, e.y, { life: 0.3 });
                            }
                        });
                    }
                }
            }
        } else {
            u.cd -= dt;
        }
    } else {
        u.state = 'move';
        u.x += (u.team === 0 ? 1 : -1) * u.spd * 20 * dt;
    }
};

PlayState.fireMissile = function () {
    if (this.missileCD <= 0) {
        this.missileCD = 10;
        let targetX = this.enemyBase.x;
        let found = false;
        let minX = 99999;
        this.units.forEach(u => {
            if (u.team === 1 && !u.dead) {
                if (u.x < minX) {
                    minX = u.x;
                    targetX = u.x;
                    found = true;
                }
            }
        });
        this.projectiles.push({
            type: 3, startX: this.playerBase.x, startY: this.baseY - 150, targetX: targetX, targetY: this.baseY,
            x: this.playerBase.x, y: this.baseY - 150, timer: 0, speed: 1.0, dmg: DB.data.baseStats.atkLvl * 50
        });
    }
};

PlayState.fireMeteor = function () {
    if (this.meteorCharges > 0) {
        this.meteorCharges--;
        this.meteorActive = true;
        this.meteorTimer = 0;
        this.meteorWaveCount = 0;
        addToast("MƯA THIÊN THẠCH!", "#E91E63");
    }
};

PlayState.spawnMeteorWave = function () {
    // Target all enemies
    let targets = this.units.filter(u => u.team === 1);

    // Also target Enemy Base if alive
    if (this.enemyBase.hp > 0) {
        targets.push({ x: this.enemyBase.x + 50, y: this.baseY }); // Target base center
    }

    // Spawn on targets
    targets.forEach(t => {
        // Randomize start height for "random height" effect logic
        // We simulate height by startY. 
        let startY = -100 - Math.random() * 400; // Random height between -100 and -500

        this.projectiles.push({
            type: 4,
            startX: t.x - 200 + (Math.random() - 0.5) * 100, // Slight x offset start
            startY: startY,
            targetX: t.x + (Math.random() - 0.5) * 50, // Slight inaccuracy
            targetY: this.baseY,
            x: 0, y: 0,
            timer: 0,
            speed: 1.5 + Math.random() * 0.5,
            dmg: DB.data.baseStats.atkLvl * 100,
            team: 0 // Player team
        });
    });

    // Random filler meteors (Map wide)
    for (let k = 0; k < 5; k++) {
        let tx = Math.random() * 2400; // Anywhere on map
        let startY = -100 - Math.random() * 400;

        this.projectiles.push({
            type: 4,
            startX: tx - 200,
            startY: startY,
            targetX: tx,
            targetY: this.baseY,
            x: 0, y: 0,
            timer: 0,
            speed: 1.5 + Math.random() * 0.5,
            dmg: DB.data.baseStats.atkLvl * 50, // Half damage for random ones? or full? Let's keep consistent.
            team: 0
        });
    }
};

PlayState.Draw = function (ctx) {
    ctx.save();
    ctx.scale(this.camera.scale, this.camera.scale);
    ctx.translate(-this.camera.x, -this.camera.y);

    BackgroundSystem.Draw(ctx, GAME.Canvas.Width / this.camera.scale, GAME.Canvas.Height / this.camera.scale, this.camera.x, this.camera.y);

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    this.clouds.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.w / 2, 0, Math.PI * 2);
        ctx.arc(c.x + c.w / 3, c.y - c.w / 4, c.w / 2, 0, Math.PI * 2);
        ctx.arc(c.x + c.w / 1.5, c.y, c.w / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = "#4E342E";
    ctx.fillRect(0, this.baseY, 2400, 200);
    ctx.fillStyle = "#7CB342";
    ctx.fillRect(0, this.baseY, 2400, 20);
    ctx.fillStyle = "#33691E";
    for (let i = 0; i < 50; i++) ctx.fillRect((i * 50) % 2400, this.baseY + 5, 5, 5);
    ctx.fillStyle = "#3E2723";
    for (let i = 0; i < 50; i++) ctx.fillRect((i * 60) % 2400, this.baseY + 50, 8, 8);

    drawPlayerBase(ctx, this.playerBase.x, this.baseY - 200, 100, 200);
    drawRect(ctx, this.playerBase.x, this.baseY + 10, 100, 10, "red");
    drawRect(ctx, this.playerBase.x, this.baseY + 10, 100 * (Math.max(0, this.playerBase.hp) / this.playerBase.maxHp), 10, "green");
    drawText(ctx, `${Math.max(0, Math.floor(this.playerBase.hp))} `, this.playerBase.x + 50, this.baseY + 35, "white", 16, "center");

    drawEnemyBase(ctx, this.enemyBase.x, this.baseY - 200, 100, 200);
    drawRect(ctx, this.enemyBase.x, this.baseY + 10, 100, 10, "red");
    drawRect(ctx, this.enemyBase.x, this.baseY + 10, 100 * (Math.max(0, this.enemyBase.hp) / this.enemyBase.maxHp), 10, "green");
    drawText(ctx, `${Math.max(0, Math.floor(this.enemyBase.hp))} `, this.enemyBase.x + 50, this.baseY + 35, "white", 16, "center");

    for (let u of this.units) {
        let typeInfo = Object.values(CLASS_TYPES).find(t => t.id == u.type);
        if (!typeInfo) typeInfo = { icon: "🧱", color: "#FFFFFF", name: "Unknown" };
        if (u.hitTimer > 0) {
            ctx.globalAlpha = 0.5; ctx.fillStyle = "red";
            ctx.beginPath(); ctx.arc(u.x, u.y - 20, 30, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1.0;
        }
        ctx.save();
        let drawY = u.y;
        if (u.type === 4) { ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(u.x, u.y, 15, 5, 0, 0, Math.PI * 2); ctx.fill(); drawY -= 120; }

        ctx.translate(u.x, drawY); // Center at x,y (which is center of unit)
        if (u.team === 0) ctx.scale(-1, 1);

        // Dynamic Size
        let size = u.w || 40;
        ctx.font = `${size}px "Noto Sans", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "white";

        // Icon Logic: Use u.icon (Boss logic) or typeInfo.icon
        let icon = u.icon || typeInfo.icon;

        // Legacy Team 1 Override (If u.icon NOT set)
        if (u.team === 1 && !u.icon) {
            if (u.type === 0) icon = "👻"; if (u.type === 1) icon = "🦇"; if (u.type === 2) icon = "👾";
            if (u.type === 3) icon = "🦈"; if (u.type === 4) icon = "💀"; if (u.type === 5) icon = "👹"; if (u.type === 6) icon = "🐺";
        }
        ctx.fillText(icon, 0, 20); // Removed negative offset. 20px down usually centers better for emojis with top-padding
        ctx.restore();

        // Draw frozen indicator
        if (u.frozen) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = "#00D9FF";
            let r = (u.w || 40) / 2 + 5;
            ctx.beginPath();
            ctx.arc(u.x, drawY - 20, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        let hpY = u.y - (u.h || 50) - 10;
        let hpW = u.w || 40;
        drawRect(ctx, u.x - hpW / 2, hpY, hpW, 5, "red");
        drawRect(ctx, u.x - hpW / 2, hpY, hpW * (Math.max(0, u.hp) / u.maxHp), 5, "green");
    }

    for (let p of this.projectiles) {
        if (p.type === 3 || p.type === 5) {
            ctx.save(); ctx.translate(p.x, p.y);
            let slope = p.type === 5 ? 400 : 1200;
            let angle = Math.atan2((p.targetY - p.startY) + slope * (2 * p.timer - 1), (p.targetX - p.startX));
            if (p.type === 5) { ctx.rotate(angle); drawCircle(ctx, 0, 0, 8, "magenta"); }
            else if (p.type === 0) { // Dragon Breath
                let grad = ctx.createLinearGradient(0, 0, -40, 0);
                grad.addColorStop(0, "orange"); grad.addColorStop(1, "transparent");
                ctx.fillStyle = grad;
                ctx.fillRect(-50, -5, 50, 10);
            }
            else { ctx.rotate(angle + Math.PI / 4); ctx.font = "30px \"Noto Sans\", \"Noto Color Emoji\", sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🚀", 0, 0); }
            ctx.restore();
        } else if (p.type === 4) {
            ctx.save(); ctx.translate(p.x, p.y); ctx.scale(-1, 1); let scale = 1 + p.timer; ctx.scale(scale, scale);
            ctx.font = "30px \"Noto Sans\", \"Noto Color Emoji\", sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("☄️", 0, 0); ctx.restore();
        } else { drawRect(ctx, p.x, p.y, 10, 5, "yellow"); }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
        let p = this.particles[i];

        ctx.save();
        if (p.type === 'blood') {
            p.x += p.vx * 0.016; p.y += p.vy * 0.016; p.vy += 300 * 0.016;
            drawCircle(ctx, p.x, p.y, 10 * p.life, `rgba(200, 0, 0, ${p.life})`); // Bigger blood
        }
        else if (p.type === 'smoke') { drawCircle(ctx, p.x, p.y, 10 + 10 * (1 - p.life), `rgba(100, 100, 100, ${p.life * 0.5})`); }
        else if (p.type === 'explosion') { drawCircle(ctx, p.x, p.y, 50 + 50 * (1 - p.life), `rgba(255, 100, 0, ${p.life})`); }
        else if (p.type === 'slash') {
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
            ctx.fillRect(-30, -4, 60, 8); // Bigger slash
            ctx.rotate(Math.PI / 2);
            ctx.fillRect(-30, -4, 60, 8); // Cross slash
        }
        else if (p.type === 'hit') { // New Generic Hit
            ctx.fillStyle = `rgba(255, 255, 0, ${p.life})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 20 * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (p.type === 'lightning') {
            ctx.strokeStyle = `rgba(0, 255, 255, ${p.life})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - 300);
            ctx.lineTo(p.x - 10, p.y - 150);
            ctx.lineTo(p.x + 10, p.y - 50);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        }
        else if (p.type === 'shield_block') {
            ctx.strokeStyle = `rgba(50, 205, 50, ${p.life})`;
            ctx.lineWidth = 3; // Thicker
            ctx.beginPath();
            ctx.arc(p.x, p.y, 40, 0, Math.PI * 2); // Bigger
            ctx.stroke();
        }
        else if (p.type === 'crit') {
            drawText(ctx, "CRITICAL!", p.x, p.y - 30 * (1 - p.life), "red", 24, "center");
            drawText(ctx, `- ${p.val} `, p.x, p.y, "orange", 28, "center");
            p.y -= 1;
        }
        else {
            // Assume emoji or generic string effect from class data
            ctx.font = `${50 + 50 * (1 - p.life)}px Arial`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
            ctx.shadowBlur = 10; ctx.shadowColor = "white";
            drawText(ctx, p.type, p.x, p.y - 40 * (1 - p.life), "white", 40, "center"); // Use drawText helper or ctx.fillText logic
            // Simple render:
            // ctx.fillText(p.type, 0, 0); // We are not translated except for 'slash'. 'crit' handles positions.
            // Let's rely on drawText since it's cleaner.
            // p.type contains the emoji e.g. "🔥"
        }
        ctx.restore();

        p.life -= 0.02; // Slower fade
        if (p.life <= 0) this.particles.splice(i, 1);
    }
    ctx.restore();

    drawGlobalHeader(ctx, GAME.Canvas.Width);
    drawText(ctx, `Màn ${this.level} `, GAME.Canvas.Width / 2, 32, "white", 24, "center");
    drawText(ctx, `+ ${Math.floor(this.goldEarned)} `, GAME.Canvas.Width - 20, 60, "#FFFF00", 16, "right");
    let bH = 100; let bY = GAME.Canvas.Height - bH; drawRect(ctx, 0, bY, GAME.Canvas.Width, bH, "#111");

    // LEFT: Zoom & Meteor
    let meteorColor = this.meteorCharges > 0 ? "#E91E63" : "#555";
    drawButton(ctx, "☄️\n🔻", 10, 60, 50, 50, meteorColor, () => this.fireMeteor(), "white", 18, false, "sans-serif");
    if (this.meteorCharges > 0) drawBadge(ctx, 60, 60, this.meteorCharges);

    // SPELL BUTTONS
    this.drawSpellButtons(ctx);

    let zoomIcon = this.zoomLevel === 1 ? "🔍-" : "🔍+";
    drawButton(ctx, `${zoomIcon}\n🔺`, 10, 120, 50, 50, "#555", () => { this.zoomLevel = this.zoomLevel === 1 ? 2 : 1; }, "white", 18);

    // START ALIGNMENT FROM LEFT
    let startX = 20; // Left margin with gap for Mineral/Missile buttons

    // Mineral Button (Leftmost)
    let minCost = this.mineralLevel * 200;
    let minColor = "#553300";
    drawRoundedRect(ctx, startX, bY + 10, 90, 80, 10, minColor);
    ctx.save();
    ctx.globalAlpha = 0.1;
    drawRoundedRect(ctx, startX, bY + 10, 90, 40, 10, "#FFFFFF"); // Gloss effect
    ctx.restore();
    drawText(ctx, "💎", startX + 45, bY + 50, "white", 40, "center", "sans-serif"); // Large icon
    drawText(ctx, "🅰️", startX + 10, bY + 25, "white", 14, "left"); // Shortcut in corner
    drawText(ctx, `${Math.floor(this.mineral)}/${this.maxMineral}`, startX + 45, bY + 70, "cyan", 11, "center");
    drawText(ctx, `Lv${this.mineralLevel}`, startX + 45, bY + 85, "yellow", 10, "center");

    if (Enjine.Mouse.Clicked && Enjine.Mouse.X >= startX && Enjine.Mouse.X <= startX + 90 && Enjine.Mouse.Y >= bY + 10 && Enjine.Mouse.Y <= bY + 90) {
        Enjine.Mouse.Clicked = false;
        if (this.mineral >= minCost && this.mineralLevel < 8) { this.mineral -= minCost; this.mineralLevel++; this.maxMineral += 300; }
    }

    // Missile Button (Next to Mineral)
    let missileX = startX + 100; // 90 width + 10 gap
    let misText = this.missileCD > 0 ? `${Math.ceil(this.missileCD)} s` : "Sẵn Sàng";
    drawButton(ctx, "", missileX, bY + 10, 90, 80, this.missileCD > 0 ? "#333" : "#C00", () => this.fireMissile());
    drawText(ctx, "🚀", missileX + 45, bY + 50, "white", 40, "center", "sans-serif"); // Large icon
    drawText(ctx, "⚡", missileX + 10, bY + 25, "white", 14, "left"); // Shortcut in corner
    drawText(ctx, misText, missileX + 45, bY + 75, "cyan", 12, "center"); // Status text

    // HERO BUTTONS (Next to Missile)
    let btnW = 80, btnH = 80;
    let heroStartX = missileX + 100; // Missile(90) + gap(10)

    for (let i = 0; i < 4; i++) {
        let x = heroStartX + i * 90;
        let hId = DB.data.team[i];
        if (hId) {
            let h = DB.data.heroes.find(hero => hero.id === hId);
            if (h) {
                let typeInfo = Object.values(CLASS_TYPES).find(t => t.id == h.type);
                let ready = this.mineral >= h.cost && this.heroCDs[i] <= 0;
                drawButton(ctx, "", x, bY + 10, btnW, btnH, ready ? "#444" : "#222", () => this.spawnPlayerUnit(i));
                // Removed class background rect as requested
                drawText(ctx, typeInfo.icon, x + 40, bY + 50, "white", 45, "center");
                let numIcons = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];
                drawText(ctx, numIcons[i], x + 10, bY + 25, "white", 14, "left"); // Shortcut label
                drawText(ctx, `${h.cost} `, x + 40, bY + 75, "cyan", 14, "center");
                if (this.heroCDs[i] > 0) drawRoundedRect(ctx, x, bY + 10, btnW, btnH * (this.heroCDs[i] / (h.cost / 20)), 10, "rgba(0,0,0,0.5)");
            }
        } else {
            drawRoundedRect(ctx, x, bY + 10, btnW, btnH, 10, "#222"); drawText(ctx, "Trống", x + 40, bY + 50, "#555", 14, "center");
        }
    }

    if (Enjine.Mouse.Clicked && Enjine.Mouse.X >= heroStartX - 200 && Enjine.Mouse.X <= heroStartX - 110 && Enjine.Mouse.Y >= bY + 10 && Enjine.Mouse.Y <= bY + 90) {
        Enjine.Mouse.Clicked = false;
        if (this.mineral >= minCost && this.mineralLevel < 8) { this.mineral -= minCost; this.mineralLevel++; this.maxMineral += 300; }
    }

    drawButton(ctx, "Thoát\n(Esc)", GAME.Canvas.Width - 80, bY + 10, 70, 80, "#C00", () => { this.isPaused = true; }, "white", 18);

    if (this.showBoosterDialog) {
        drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.8)");
        let mw = 400, mh = 300; let mx = (GAME.Canvas.Width - mw) / 2; let my = (GAME.Canvas.Height - mh) / 2;
        drawRoundedRect(ctx, mx, my, mw, mh, 15, "#222"); ctx.strokeStyle = "#4CAF50"; ctx.lineWidth = 2; ctx.strokeRect(mx, my, mw, mh);
        drawText(ctx, "MUA VẬT PHẨM HỖ TRỢ", GAME.Canvas.Width / 2, my + 40, "#4CAF50", 24, "center");
        let canBuyAtk = DB.data.gold >= 1000;
        let hasAtk = this.boosters.atk > 1;
        drawButton(ctx, `⚔️ Công +50% (1000 G)${hasAtk ? " [ĐÃ MUA]" : ""}`, mx + 20, my + 80, 360, 40, hasAtk ? "#5D4037" : "#555", () => {
            if (hasAtk) { DB.data.gold += 1000; this.boosters.atk = 1; }
            else if (canBuyAtk) { DB.data.gold -= 1000; this.boosters.atk = 1.5; }
        });

        let canBuySpd = DB.data.gold >= 1000;
        let hasSpd = this.boosters.spd > 1;
        drawButton(ctx, `⚡ Tốc Đánh +50% (1000 G)${hasSpd ? " [ĐÃ MUA]" : ""}`, mx + 20, my + 130, 360, 40, hasSpd ? "#F57C00" : "#555", () => {
            if (hasSpd) { DB.data.gold += 1000; this.boosters.spd = 1; }
            else if (canBuySpd) { DB.data.gold -= 1000; this.boosters.spd = 1.5; }
        });

        let canBuyMeteor = DB.data.gold >= 2000;
        let hasMeteor = this.boosters.meteor > 0;
        drawButton(ctx, `☄️ +1 Thiên Thạch (2000 G)${hasMeteor ? " [ĐÃ MUA]" : ""}`, mx + 20, my + 180, 360, 40, hasMeteor ? "#7B1FA2" : "#555", () => {
            if (hasMeteor) { DB.data.gold += 2000; this.boosters.meteor = 0; this.meteorCharges = 1; }
            else if (canBuyMeteor) { DB.data.gold -= 2000; this.boosters.meteor = 1; this.meteorCharges = 2; }
        });
        drawButton(ctx, "BẮT ĐẦU", mx + 100, my + 240, 200, 40, "#4CAF50", () => { this.showBoosterDialog = false; });
    }

    if (this.resultData) {
        drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.85)");
        let rw = 600, rh = 500; // Increased from 500x400 to fit all content
        let rx = (GAME.Canvas.Width - rw) / 2; let ry = (GAME.Canvas.Height - rh) / 2;
        drawRoundedRect(ctx, rx, ry, rw, rh, 20, "#222"); ctx.lineWidth = 3; ctx.strokeStyle = this.resultData.win ? "#FFD700" : "#C00"; ctx.strokeRect(rx, ry, rw, rh);
        let title = this.resultData.win ? "CHIẾN THẮNG!" : "THẤT BẠI";
        drawText(ctx, title, GAME.Canvas.Width / 2, ry + 50, this.resultData.win ? "#FFD700" : "#C00", 40, "center");
        drawText(ctx, `Vàng nhận: +${this.resultData.gold}`, rx + 50, ry + 100, "white", 20, "left");
        if (this.resultData.medal > 0) drawText(ctx, `Huy chương: ${MEDAL_TYPES[this.resultData.medal - 1]}`, rx + 50, ry + 130, "white", 20, "left");

        let hY = ry + 170;
        if (this.resultData.item) {
            drawText(ctx, "NHẬN ĐƯỢC:", rx + 50, ry + 160, "#00BCD4", 20, "left");
            let it = this.resultData.item;
            drawItemIcon(ctx, it, rx + 180, ry + 140, 50);
            let typeInfo = Object.values(ITEM_TYPES).find(t => t.id === it.type);
            drawText(ctx, `${typeInfo.name}`, rx + 240, ry + 160, "white", 18, "left");
            hY += 50;
        }

        this.resultData.heroes.forEach(h => {
            drawText(ctx, `${h.icon} Lv.${h.level}`, rx + 50, hY, "white", 18, "left");
            drawText(ctx, `+${h.expGain} EXP`, rx + 150, hY, "#4CAF50", 18, "left");
            if (h.leveledUp) drawText(ctx, "LÊN CẤP!", rx + 300, hY, "yellow", 18, "left");
            hY += 40;
        });
        drawButton(ctx, "TRỞ về Menu", GAME.Canvas.Width / 2 - 100, ry + rh - 70, 200, 50, "#2196F3", () => {
            GAME.ChangeState(StageSelectState);
        });
    }

    // PAUSE DIALOG - Must be last to overlay everything
    if (this.isPaused) {
        drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.7)");
        let pw = 400, ph = 250;
        let px = (GAME.Canvas.Width - pw) / 2, py = (GAME.Canvas.Height - ph) / 2;
        drawRoundedRect(ctx, px, py, pw, ph, 15, "#222");
        ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 3; ctx.strokeRect(px, py, pw, ph);

        drawText(ctx, "⏸ ĐÃ TẠM DỪNG", GAME.Canvas.Width / 2, py + 60, "#FFD700", 32, "center");
        drawText(ctx, "Bấm ESC hoặc HỦY BỎ để tiếp tục", GAME.Canvas.Width / 2, py + 100, "white", 16, "center");

        drawButton(ctx, "HỦY BỎ (Esc)", px + 50, py + 140, 140, 50, "#4CAF50", () => {
            this.isPaused = false;
        }, "white", 16);

        drawButton(ctx, "THOÁT", px + pw - 190, py + 140, 140, 50, "#C00", () => {
            if (this.keyHandler) window.removeEventListener('keydown', this.keyHandler);
            GAME.ChangeState(StageSelectState);
        }, "white", 16);
    }
    if (this.confirmExit) {
        drawRect(ctx, 0, 0, GAME.Canvas.Width, GAME.Canvas.Height, "rgba(0,0,0,0.7)");
        let mw = 300, mh = 200; let mx = (GAME.Canvas.Width - mw) / 2; let my = (GAME.Canvas.Height - mh) / 2;
        drawRoundedRect(ctx, mx, my, mw, mh, 15, "#222"); ctx.strokeStyle = "#C00"; ctx.lineWidth = 2; ctx.strokeRect(mx, my, mw, mh);
        drawText(ctx, "CẢNH BÁO", GAME.Canvas.Width / 2, my + 40, "red", 24, "center");
        drawText(ctx, "Thoát trận sẽ bị tính là THUA.", GAME.Canvas.Width / 2, my + 80, "white", 16, "center");
        drawButton(ctx, "HỦY", mx + 20, my + 130, 120, 40, "#555", () => { this.confirmExit = false; });
        drawButton(ctx, "THOÁT", mx + 160, my + 130, 120, 40, "#C00", () => { this.confirmExit = false; this.endGame(false); });
    }
};
