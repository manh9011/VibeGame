/**
 * --- BACKGROUND SYSTEM ---
 */
export var BackgroundSystem = {
    clouds: [],
    colors: null,

    Initialize: function () {
        this.clouds = [];
        for (let i = 0; i < 15; i++) {
            this.clouds.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * (window.innerHeight / 2),
                size: 30 + Math.random() * 50,
                speed: 10 + Math.random() * 20
            });
        }
        if (!this.colors) this.setTheme(1);
    },

    Update: function () {
        for (let c of this.clouds) {
            c.x -= c.speed * 0.05;
            if (c.x < -100) c.x = window.innerWidth + 100;
        }
    },

    setTheme: function (level) {
        let idx = Math.floor((level - 1) / 20) % 5;
        const themes = [
            { t: "#87CEEB", b: "#E0F7FA", g: "#8BC34A", m: "#5D4037" }, // Default
            { t: "#FF9800", b: "#FFF3E0", g: "#F4A460", m: "#8D6E63" }, // Desert
            { t: "#212121", b: "#424242", g: "#3E2723", m: "#D84315" }, // Volcanic
            { t: "#B3E5FC", b: "#FFFFFF", g: "#E0F2F1", m: "#90CAF9" }, // Ice
            { t: "#1A237E", b: "#311B92", g: "#4A148C", m: "#2c2c2c" }  // Space
        ];
        let t = themes[idx];
        this.colors = { skyTop: t.t, skyBot: t.b, ground: t.g, mountain: t.m };
    },

    Draw: function (ctx, width, height, startX = 0, startY = 0) {
        if (!this.colors) this.setTheme(1);

        let bottomY = startY + height;

        let grd = ctx.createLinearGradient(0, startY, 0, bottomY);
        grd.addColorStop(0, this.colors.skyTop);
        grd.addColorStop(1, this.colors.skyBot);
        ctx.fillStyle = grd;
        ctx.fillRect(startX, startY, width, height);

        // Sun
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        // Sun relative to view
        let sunX = startX + width - 100 - (startX / 10);
        let sunY = startY + 100;
        ctx.arc(sunX, sunY, 50, 0, Math.PI * 2);
        ctx.fill();

        // Mountains (Parallax)
        ctx.fillStyle = this.colors.mountain;
        ctx.beginPath();
        ctx.moveTo(startX, bottomY);
        for (let i = 0; i <= width / 50 + 2; i++) {
            let mx = startX + i * 50 - (startX / 5) % 100;
            // Adjust to align with bottomY
            let my = bottomY - 100 - Math.abs(Math.sin(i + startX / 500) * 80);
            ctx.lineTo(mx, my);
        }
        ctx.lineTo(startX + width, bottomY);
        ctx.fill();

        // Ground
        ctx.fillStyle = this.colors.ground;
        ctx.beginPath();
        ctx.fillRect(startX, bottomY - 120, width, 120);

        // Clouds (BackgroundSystem clouds)
        // These are simulated in 0..InnerWidth but we need to draw them in World Space?
        // Or just draw them relative to startX/startY?
        // The Simulation uses window.innerWidth.
        // Let's just draw them relative to startX to keep them in view.
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        for (let c of this.clouds) {
            ctx.beginPath();
            // Wrap cloud x to current view
            let drawX = startX + (c.x % width);
            let drawY = startY + c.y; // Relative to top
            ctx.arc(drawX, drawY, c.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
};
