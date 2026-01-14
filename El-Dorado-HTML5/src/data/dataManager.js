/**
 * --- DATA MANAGER ---
 */
export const CLASS_TYPES = {
    DRAGON: { id: 0, name: "Thanh Long", color: "#007F7F", desc: "Tầm xa (Xuyên)", icon: "🐉", category: "supernatural", effect: "🔥" },
    TIGER: { id: 1, name: "Bạch Hổ", color: "#7F7F7F", desc: "Tầm gần (Tốc độ)", icon: "🐅", category: "animal", effect: "💢" },
    BIRD: { id: 2, name: "Chu Tước", color: "#7F2200", desc: "Tầm xa (Thả dù)", icon: "🦅", category: "animal", effect: "⚡" },
    TORTOISE: { id: 3, name: "Huyền Vũ", color: "#196619", desc: "Đỡ đòn", icon: "🐢", category: "animal", effect: "💧" },
    BOMB: { id: 4, name: "Bom", color: "#2A2A2A", desc: "Cảm tử", icon: "💣", category: "human", effect: "💥" },
    KIRIN: { id: 5, name: "Kỳ Lân", color: "#7F007F", desc: "Tầm xa (Nổ lan)", icon: "🦄", category: "supernatural", effect: "✨" },
    MONKEY: { id: 6, name: "Hầu Vương", color: "#7F6B00", desc: "Sát thủ (Bạo kích)", icon: "🐵", category: "animal", effect: "🥖" },
    RAT: { id: 7, name: "Chuột Vàng", color: "#7F6B00", desc: "Cướp vàng", icon: "🐀", category: "animal", effect: "💰" },
    OX: { id: 8, name: "Ngưu Ma", color: "#452209", desc: "Đẩy lùi", icon: "🐂", category: "animal", effect: "🌪️" },
    RABBIT: { id: 9, name: "Thỏ Ngọc", color: "#7F6065", desc: "Né tránh cao", icon: "🐇", category: "animal", effect: "💨" },
    SNAKE: { id: 10, name: "Xà Tinh", color: "#007F00", desc: "Độc sát", icon: "🐍", category: "animal", effect: "☠️" },
    HORSE: { id: 11, name: "Chiến Mã", color: "#502916", desc: "Tốc chạy", icon: "🐎", category: "animal", effect: "🏇" },
    GOAT: { id: 12, name: "Dương Tiên", color: "#787346", desc: "Hồi máu", icon: "🐐", category: "animal", effect: "💚" },
    ROOSTER: { id: 13, name: "Kim Kê", color: "#7F5200", desc: "Buff tốc đánh", icon: "🐓", category: "animal", effect: "🎺" },
    DOG: { id: 14, name: "Khuyển Thần", color: "#66421F", desc: "Chặn đòn", icon: "🐕", category: "animal", effect: "🛡️" },
    PIG: { id: 15, name: "Trư Bát Giới", color: "#7F345A", desc: "Tự hồi phục", icon: "🐖", category: "animal", effect: "🍖" },
    CRANE: { id: 16, name: "Hạc Tiên", color: "#707F7F", desc: "Tầm xa (Xuyên)", icon: "🦢", category: "animal", effect: "🎐" },
    FOX: { id: 17, name: "Hồ Ly", color: "#49386D", desc: "Gây choáng", icon: "🦊", category: "animal", effect: "💫" },
    WOLF: { id: 18, name: "Sói Bạc", color: "#606060", desc: "Bạo kích cao", icon: "🐺", category: "animal", effect: "🩸" },
    LION: { id: 19, name: "Sư Tử", color: "#6D5210", desc: "Sát thương lan", icon: "🦁", category: "animal", effect: "🔊" },
    ELEPHANT: { id: 20, name: "Bạch Tượng", color: "#384048", desc: "Cận chiến (Lan)", icon: "🐘", category: "animal", effect: "🦶" },

    // Added missing category: animal
    PEACOCK: { id: 21, name: "Khổng Tước", color: "#006768", desc: "Đạn chùm", icon: "🦚", category: "animal", effect: "✨" },
    RHINO: { id: 22, name: "Tê Giác", color: "#343434", desc: "Siêu giáp", icon: "🦏", category: "animal", effect: "🧱" },
    BEAR: { id: 23, name: "Hùng Ca", color: "#450000", desc: "Sát thương lớn", icon: "🐻", category: "animal", effect: "🐾" },
    PANDA: { id: 24, name: "Gấu Trúc", color: "#7F7F7F", desc: "Thiền định (Hồi máu)", icon: "🐼", category: "animal", effect: "🎋" },
    KANGAROO: { id: 25, name: "Chuột Túi", color: "#69340F", desc: "Đấm bốc (Choáng)", icon: "🦘", category: "animal", effect: "🥊" },
    CROCODILE: { id: 26, name: "Cá Sấu", color: "#003200", desc: "Cắn xé", icon: "🐊", category: "animal", effect: "🦷" },
    TURTLE: { id: 27, name: "Rùa Biển", color: "#17452B", desc: "Giáp cứng", icon: "🐢", category: "animal", effect: "🛡️" },
    LIZARD: { id: 28, name: "Thằn Lằn", color: "#3E7E00", desc: "Hồi phục nhanh", icon: "🦎", category: "animal", effect: "🧬" },
    FROG: { id: 29, name: "Ếch Cốm", color: "#196619", desc: "Nhảy xa", icon: "🐸", category: "animal", effect: "🍥" },
    OCTOPUS: { id: 30, name: "Bạch Tuộc", color: "#400040", desc: "Trói chân", icon: "🐙", category: "animal", effect: "🕸️" },
    SQUID: { id: 31, name: "Mực Ống", color: "#7F2200", desc: "Phun mực (Mù)", icon: "🦑", category: "animal", effect: "⚫" },
    SHRIMP: { id: 32, name: "Tôm Hùm", color: "#7F3123", desc: "Kẹp (Sát thương)", icon: "🦞", category: "animal", effect: "✂️" },
    CRAB: { id: 33, name: "Cua Đá", color: "#662E2E", desc: "Giáp phản đòn", icon: "🦀", category: "animal", effect: "💢" },
    WHALE: { id: 34, name: "Cá Voi", color: "#23415A", desc: "Máu khủng", icon: "🐋", category: "animal", effect: "🌊" },
    DOLPHIN: { id: 35, name: "Cá Heo", color: "#436775", desc: "Tốc độ bơi", icon: "🐬", category: "animal", effect: "💨" },
    FISH: { id: 36, name: "Cá Chép", color: "#7F4600", desc: "May mắn", icon: "🐠", category: "animal", effect: "🍀" },
    PUFFER: { id: 37, name: "Cá Nóc", color: "#7F7F00", desc: "Gai (Phản đòn)", icon: "🐡", category: "animal", effect: "🐡" },
    SHARK: { id: 38, name: "Cá Mập", color: "#3B444C", desc: "Săn mồi (Hút máu)", icon: "🦈", category: "animal", effect: "🩸" },
    EAGLE: { id: 39, name: "Đại Bàng", color: "#521515", desc: "Tầm xa (Chí mạng)", icon: "🦅", category: "animal", effect: "🎯" },
    OWL: { id: 40, name: "Cú Mèo", color: "#452209", desc: "Nhìn đêm (Chính xác)", icon: "🦉", category: "animal", effect: "👁️" },
    BAT: { id: 41, name: "Dơi Quỷ", color: "#250041", desc: "Hút máu", icon: "🦇", category: "animal", effect: "💉" },
    BEE: { id: 42, name: "Ong Thợ", color: "#7F6B00", desc: "Bầy đàn", icon: "🐝", category: "animal", effect: "🍯" },
    BUTTERFLY: { id: 43, name: "Bướm Tiên", color: "#7F345A", desc: "Ru ngủ", icon: "🦋", category: "animal", effect: "💤" },
    LADYBUG: { id: 44, name: "Bọ Rùa", color: "#7F0000", desc: "Giáp nhẹ", icon: "🐞", category: "animal", effect: "🛡️" },
    ANT: { id: 45, name: "Kiến Lửa", color: "#591111", desc: "Sức mạnh", icon: "🐜", category: "animal", effect: "💪" },
    SPIDER: { id: 46, name: "Nhện Độc", color: "#172727", desc: "Giăng lưới (Chậm)", icon: "🕷️", category: "animal", effect: "🕸️" },
    SCORPION: { id: 47, name: "Bọ Cạp", color: "#450000", desc: "Độc tê liệt", icon: "🦂", category: "animal", effect: "💉" },
    MOSQUITO: { id: 48, name: "Muỗi", color: "#343434", desc: "Hút máu (Né)", icon: "🦟", category: "animal", effect: "🩸" },
    SNAIL: { id: 49, name: "Ốc Sên", color: "#6F5C43", desc: "Siêu giáp (Chậm)", icon: "🐌", category: "animal", effect: "🐚" },
    SLOTH: { id: 50, name: "Lười", color: "#475E47", desc: "Siêu lỳ đòn", icon: "🦥", category: "animal", effect: "💤" },
    OTTER: { id: 51, name: "Rái Cá", color: "#695A46", desc: "Linh hoạt", icon: "🦦", category: "animal", effect: "🌊" },
    SKUNK: { id: 52, name: "Chồn Hôi", color: "#000000", desc: "Khí độc", icon: "🦨", category: "animal", effect: "💨" },
    BADGER: { id: 53, name: "Lửng Mật", color: "#7F7F7F", desc: "Bất tử (Ngắn)", icon: "🦡", category: "animal", effect: "🛡️" },
    HEDGEHOG: { id: 54, name: "Nhím", color: "#502916", desc: "Phản sát thương", icon: "🦔", category: "animal", effect: "🌵" },
    LLAMA: { id: 55, name: "Lạc Đà", color: "#7A5230", desc: "Phun nước", icon: "🦙", category: "animal", effect: "💦" },
    GIRAFFE: { id: 56, name: "Hươu Cao Cổ", color: "#7F6B00", desc: "Tầm xa", icon: "🦒", category: "animal", effect: "🔭" },
    ZEBRA: { id: 57, name: "Ngựa Vằn", color: "#7F7F7F", desc: "Hoang dã", icon: "🦓", category: "animal", effect: "🐎" },
    HIPPO: { id: 58, name: "Hà Mã", color: "#384048", desc: "Cục súc", icon: "🦛", category: "animal", effect: "💥" },
    CAMEL: { id: 59, name: "Lạc Đà Sa Mạc", color: "#6D5210", desc: "Bền bỉ", icon: "🐪", category: "animal", effect: "💧" },
    KOALA: { id: 60, name: "Gấu Túi", color: "#606060", desc: "Bám dính", icon: "🐨", category: "animal", effect: "🐨" },
    PENGUIN: { id: 61, name: "Chim Cánh Cụt", color: "#000000", desc: "Trượt băng", icon: "🐧", category: "animal", effect: "❄️" },
    FLAMINGO: { id: 62, name: "Hồng Hạc", color: "#7F345A", desc: "Đứng một chân", icon: "🦩", category: "animal", effect: "🦵" },
    PARROT: { id: 63, name: "Vẹt", color: "#7F0000", desc: "Sao chép", icon: "🦜", category: "animal", effect: "🗣️" },
    SWAN: { id: 64, name: "Thiên Nga", color: "#7F7F7F", desc: "Thanh tẩy", icon: "🦢", category: "animal", effect: "✨" },
    DOVE: { id: 65, name: "Bồ Câu", color: "#787C7F", desc: "Hòa bình (Buff)", icon: "🕊️", category: "animal", effect: "☮️" },
    DUCK: { id: 66, name: "Vịt", color: "#7F6B00", desc: "Kêu to (Choáng)", icon: "🦆", category: "animal", effect: "📢" },
    CHICKEN: { id: 67, name: "Gà Con", color: "#7F7F00", desc: "Dễ thương", icon: "🐥", category: "animal", effect: "❤️" },
    TURKEY: { id: 68, name: "Gà Tây", color: "#452209", desc: "Thịt ngon (Hồi máu)", icon: "🦃", category: "animal", effect: "🍗" },
    GORILLA: { id: 69, name: "Khỉ Đột", color: "#000000", desc: "Smash", icon: "🦍", category: "animal", effect: "👊" },
    ORANGUTAN: { id: 70, name: "Đười Ươi", color: "#69340F", desc: "Thông thái", icon: "🦧", category: "animal", effect: "🧠" },
    SLOTH_BEAR: { id: 71, name: "Gấu Lười", color: "#000000", desc: "Ngủ đông", icon: "🐻", category: "animal", effect: "💤" },
    POLAR_BEAR: { id: 72, name: "Gấu Bắc Cực", color: "#7F7F7F", desc: "Băng giá", icon: "🐻‍❄️", category: "animal", effect: "❄️" },
    HAMSTER: { id: 73, name: "Hamster", color: "#6F5C43", desc: "Chạy lẹ", icon: "🐹", category: "animal", effect: "🏃" },
    CHIPMUNK: { id: 74, name: "Sóc Chuột", color: "#69340F", desc: "Thu thập", icon: "🐿️", category: "animal", effect: "🌰" },
    BEAVER: { id: 75, name: "Hải Ly", color: "#452209", desc: "Xây đập (Chặn)", icon: "🦡", category: "animal", effect: "🚧" },
    MAMMOTH: { id: 76, name: "Voi Ma Mút", color: "#452209", desc: "Cổ đại", icon: "🦣", category: "animal", effect: "🏔️" },
    DODO: { id: 77, name: "Chim Dodo", color: "#006768", desc: "Tuyệt chủng", icon: "🦤", category: "animal", effect: "👻" },
    REX: { id: 78, name: "Khủng Long T-Rex", color: "#2A3517", desc: "Bạo chúa", icon: "🦖", category: "animal", effect: "👑" },
    TRICERA: { id: 79, name: "Khủng Long 3 Sừng", color: "#475E47", desc: "Húc", icon: "🦕", category: "animal", effect: "🛡️" },

    ALIEN: { id: 80, name: "Người Ngoài HT", color: "#196619", desc: "Công nghệ cao", icon: "👽", category: "supernatural", effect: "🛸" },
    GHOST: { id: 81, name: "Ma Trơi", color: "#73737D", desc: "Dọa ma (Sợ hãi)", icon: "👻", category: "supernatural", effect: "😱" },
    ROBOT: { id: 82, name: "Người Máy", color: "#606060", desc: "Tự động", icon: "🤖", category: "supernatural", effect: "🔋" },
    SKELETON: { id: 83, name: "Bộ Xương", color: "#7F7F7F", desc: "Bất tử", icon: "💀", category: "supernatural", effect: "🦴" },
    ZOMBIE: { id: 84, name: "Xác Sống", color: "#17452B", desc: "Lây nhiễm", icon: "🧟", category: "supernatural", effect: "🦠" },

    VAMPIRE: { id: 85, name: "Ma Cà Rồng", color: "#450000", desc: "Hút máu đêm", icon: "🧛", category: "supernatural", effect: "🩸" },
    MERMAID: { id: 86, name: "Tiên Cá", color: "#006768", desc: "Hát (Mê hoặc)", icon: "🧜", category: "supernatural", effect: "🎵" },
    ELF: { id: 87, name: "Yêu Tinh", color: "#196619", desc: "Cung thủ", icon: "🧝", category: "supernatural", effect: "🏹" },
    GENIE: { id: 88, name: "Thần Đèn", color: "#203470", desc: "Ước nguyện", icon: "🧞", category: "supernatural", effect: "🧞" },
    FAIRY: { id: 89, name: "Tiên Nữ", color: "#7F345A", desc: "Phép thuật", icon: "🧚", category: "supernatural", effect: "✨" },

    NINJA: { id: 90, name: "Ninja", color: "#000000", desc: "Ám sát", icon: "🥷", category: "human", effect: "🗡️" },
    SAMURAI: { id: 91, name: "Samurai", color: "#591111", desc: "Kiếm đạo", icon: "👹", category: "supernatural", effect: "⚔️" },
    MAGE: { id: 92, name: "Pháp Sư", color: "#250041", desc: "Bão lửa", icon: "🧙", category: "supernatural", effect: "🔥" },

    KING: { id: 93, name: "Vua", color: "#7F6B00", desc: "Ra lệnh", icon: "🤴", category: "human", effect: "👑" },
    QUEEN: { id: 94, name: "Nữ Hoàng", color: "#7F6B00", desc: "Quyền uy", icon: "👸", category: "human", effect: "💅" },
    GUARD: { id: 95, name: "Lính Gác", color: "#7F0000", desc: "Trung thành", icon: "💂", category: "human", effect: "🧱" },
    DETECTIVE: { id: 96, name: "Thám Tử", color: "#343434", desc: "Soi mói", icon: "🕵️", category: "human", effect: "🔍" },
    WORKER: { id: 97, name: "Công Nhân", color: "#7F4600", desc: "Xây dựng", icon: "👷", category: "human", effect: "🔨" },
    CHEF: { id: 98, name: "Đầu Bếp", color: "#7F7F7F", desc: "Nấu ăn (Buff)", icon: "👨‍🍳", category: "human", effect: "🍳" },
    DOCTOR: { id: 99, name: "Bác Sĩ", color: "#006768", desc: "Chữa trị", icon: "👨‍⚕️", category: "human", effect: "💉" },
    FARMER: { id: 100, name: "Nông Dân", color: "#6D5210", desc: "Trồng trọt", icon: "👨‍🌾", category: "human", effect: "🌾" },
    ASTRONAUT: { id: 101, name: "Phi Hành Gia", color: "#7F7F7F", desc: "Bay lượn", icon: "👨‍🚀", category: "human", effect: "🚀" },
    FIREFIGHTER: { id: 102, name: "Lính Cứu Hỏa", color: "#7F2200", desc: "Chống lửa", icon: "👨‍🚒", category: "human", effect: "🚒" },
    POLICE: { id: 103, name: "Cảnh Sát", color: "#00007F", desc: "Bắt trói", icon: "👮", category: "human", effect: "🚓" },
};


// --- CENTRALIZED CLASS STATS CONFIGURATION ---
(function () {
    const FLYING_IDS = [0, 2, 16, 39, 40, 41, 42, 43, 48, 64, 65, 77, 80, 81, 88, 89];

    function getRawStats(type, stars) {
        let hp = 100 + stars * 50, atk = 10 + stars * 5, spd = 2, atkSpd = 1.0, cost = 100 + stars * 20;
        let atkType = 'melee', projType = 1, range = 60, def = 0, crit = 5, eva = 0, regen = 0;

        const id = type.id;
        if (id === 0) { atk *= 2; cost *= 1.2; atkType = 'range'; range = 400; projType = 0; crit += 5; }
        if (id === 1) { spd *= 2; atkSpd *= 2; atkType = 'melee'; range = 60; crit += 10; }
        if (id === 2) { hp *= 1.2; atk *= 1.2; atkType = 'range'; range = 400; projType = 2; eva += 10; }
        if (id === 3) { hp *= 3; spd *= 0.7; atk *= 0.3; atkType = 'melee'; range = 60; def += 10; regen += 5; }
        if (id === 4) { atkType = 'bomb'; hp *= 0.5; spd *= 5; cost *= 0.5; range = 50; eva += 20; }
        if (id === 5) { atk *= 1.3; cost *= 1.4; atkType = 'range'; range = 350; projType = 5; regen += 2; }
        if (id === 6) { atk *= 2.5; hp *= 0.7; spd *= 2.5; atkSpd *= 1.5; atkType = 'melee'; range = 60; crit += 20; eva += 15; }
        if (id === 7) { spd *= 3; atk *= 0.8; hp *= 0.8; cost *= 0.8; atkType = 'melee'; range = 60; }
        if (id === 8) { hp *= 2.5; spd *= 0.6; atkType = 'melee'; range = 60; }
        if (id === 9) { spd *= 4; hp *= 0.6; eva += 40; cost *= 0.9; atkType = 'melee'; range = 60; }
        if (id === 10) { atk *= 0.8; atkType = 'range'; range = 300; projType = 1; }
        if (id === 11) { spd *= 3; hp *= 1.2; atkType = 'melee'; range = 60; }
        if (id === 12) { atk = 0; range = 300; cost *= 1.5; atkType = 'none'; }
        if (id === 13) { atk *= 0.5; range = 300; cost *= 1.5; atkType = 'none'; }
        if (id === 14) { hp *= 1.5; def += 20; atkType = 'melee'; range = 60; }
        if (id === 15) { hp *= 4; atk *= 0.5; regen += 50; cost *= 1.5; atkType = 'melee'; range = 60; }
        if (id === 16) { atk *= 1.5; range = 500; spd *= 0.8; atkType = 'range'; projType = 0; }
        if (id === 17) { atk *= 0.8; range = 350; atkType = 'range'; projType = 5; }
        if (id === 18) { atk *= 1.8; crit += 30; spd *= 1.5; hp *= 0.8; atkType = 'melee'; range = 60; }
        if (id === 19) { atk *= 1.5; hp *= 1.5; cost *= 1.5; atkType = 'melee'; range = 80; }
        if (id === 20) { hp *= 3; atk *= 1.2; spd *= 0.5; cost *= 2.0; atkType = 'melee'; range = 60; }
        if (id === 21) { atk *= 0.7; range = 350; atkType = 'range'; projType = 1; }
        if (id === 22) { hp *= 2; def += 40; spd *= 0.6; atkType = 'melee'; range = 60; }
        if (id === 23) { atk *= 3; hp *= 1.5; spd *= 0.7; atkSpd *= 0.5; atkType = 'melee'; range = 60; }
        if (id === 24) { hp *= 1.5; regen += 20; atkType = 'melee'; range = 60; } // Panda
        if (id === 25) { atk *= 1.5; crit += 15; atkType = 'melee'; range = 60; } // Kangaroo
        if (id === 26) { atk *= 2.0; atkType = 'melee'; range = 60; } // Crocodile
        if (id === 27) { def += 30; hp *= 1.2; spd *= 0.5; atkType = 'melee'; range = 60; } // Turtle
        if (id === 28) { regen += 30; atkType = 'melee'; range = 60; } // Lizard
        if (id === 29) { spd *= 2.0; range = 200; atkType = 'range'; projType = 1; } // Frog
        if (id === 30) { atkType = 'melee'; range = 80; atkSpd *= 1.5; } // Octopus
        if (id === 31) { range = 300; atkType = 'range'; projType = 1; } // Squid
        if (id === 32) { atk *= 1.3; def += 10; atkType = 'melee'; range = 60; } // Lobster
        if (id === 33) { def += 20; hp *= 0.8; atkType = 'melee'; range = 60; } // Crab
        if (id === 34) { hp *= 5.0; spd *= 0.5; atk *= 0.5; atkType = 'melee'; range = 60; } // Whale
        if (id === 35) { spd *= 3.0; atkType = 'melee'; range = 60; } // Dolphin
        if (id === 36) { hp *= 0.8; eva += 20; atkType = 'melee'; range = 60; } // Fish
        if (id === 37) { def += 10; hp *= 1.2; atkType = 'melee'; range = 60; } // Puffer
        if (id === 38) { atk *= 1.5; regen += 10; atkType = 'melee'; range = 60; } // Shark
        if (id === 39) { atk *= 1.8; range = 450; crit += 10; atkType = 'range'; projType = 1; } // Eagle
        if (id === 40) { range = 400; crit += 5; eva += 10; atkType = 'range'; projType = 1; } // Owl
        if (id === 41) { regen += 15; range = 60; atkType = 'melee'; } // Bat
        if (id === 42) { spd *= 2; cost *= 0.6; hp *= 0.5; atkType = 'melee'; range = 60; } // Bee
        if (id === 43) { range = 300; atkType = 'range'; projType = 5; } // Butterfly
        if (id === 44) { def += 5; hp *= 0.6; atkType = 'melee'; range = 60; } // Ladybug
        if (id === 45) { atk *= 2.0; hp *= 0.5; atkType = 'melee'; range = 60; } // Ant
        if (id === 46) { range = 300; spd *= 1.2; atkType = 'range'; projType = 1; } // Spider
        if (id === 47) { atk *= 1.2; crit += 10; atkType = 'melee'; range = 60; } // Scorpion
        if (id === 48) { eva += 30; hp *= 0.4; atkType = 'melee'; range = 60; } // Mosquito
        if (id === 49) { def += 50; spd *= 0.2; hp *= 1.5; atkType = 'melee'; range = 60; } // Snail
        if (id === 50) { hp *= 2.0; spd *= 0.3; def += 10; atkType = 'melee'; range = 60; } // Sloth
        if (id === 51) { spd *= 1.5; atkSpd *= 1.5; atkType = 'melee'; range = 60; } // Otter
        if (id === 52) { range = 200; atkType = 'range'; projType = 5; } // Skunk (Gas)
        if (id === 53) { hp *= 0.5; regen += 100; atkType = 'melee'; range = 60; } // Badger
        if (id === 54) { def += 15; atk *= 0.8; atkType = 'melee'; range = 60; } // Hedgehog
        if (id === 55) { range = 300; atkType = 'range'; projType = 5; } // Llama
        if (id === 56) { range = 350; atkType = 'range'; projType = 1; } // Giraffe
        if (id === 57) { spd *= 2.5; atkType = 'melee'; range = 60; } // Zebra
        if (id === 58) { hp *= 2.5; atk *= 1.2; spd *= 0.6; atkType = 'melee'; range = 60; } // Hippo
        if (id === 59) { hp *= 1.8; regen += 5; atkType = 'melee'; range = 60; } // Camel
        if (id === 60) { hp *= 1.2; spd *= 0.5; atkType = 'melee'; range = 60; } // Koala
        if (id === 61) { spd *= 1.5; atkType = 'melee'; range = 60; } // Penguin
        if (id === 62) { atkType = 'melee'; range = 60; } // Flamingo
        if (id === 63) { range = 250; atkType = 'range'; projType = 5; } // Parrot
        if (id === 64) { range = 300; atkType = 'range'; projType = 5; } // Swan
        if (id === 65) { range = 300; regen += 10; atkType = 'range'; projType = 5; } // Dove
        if (id === 66) { range = 50; atkType = 'melee'; } // Duck
        if (id === 67) { hp *= 0.5; cost *= 0.5; atkType = 'melee'; range = 60; } // Chicken
        if (id === 68) { hp *= 1.2; regen += 10; atkType = 'melee'; range = 60; } // Turkey
        if (id === 69) { atk *= 2.5; hp *= 1.5; spd *= 0.8; atkType = 'melee'; range = 60; } // Gorilla
        if (id === 70) { atk *= 1.2; eva += 10; atkType = 'melee'; range = 60; } // Orangutan
        if (id === 71) { hp *= 2.0; regen += 20; atkType = 'melee'; range = 60; } // Sloth Bear
        if (id === 72) { atk *= 1.5; hp *= 1.5; atkType = 'melee'; range = 60; } // Polar Bear
        if (id === 73) { spd *= 3.0; hp *= 0.4; atkType = 'melee'; range = 60; } // Hamster
        if (id === 74) { spd *= 2.5; cost *= 0.8; atkType = 'melee'; range = 60; } // Chipmunk
        if (id === 75) { def += 20; atkType = 'melee'; range = 60; } // Beaver
        if (id === 76) { hp *= 4.0; atk *= 2.0; spd *= 0.4; cost *= 2.5; atkType = 'melee'; range = 60; } // Mammoth
        if (id === 77) { hp *= 0.8; atkType = 'melee'; range = 60; } // Dodo
        if (id === 78) { atk *= 4.0; hp *= 2.0; spd *= 0.8; cost *= 3.0; atkType = 'melee'; range = 80; } // T-Rex
        if (id === 79) { def += 50; hp *= 2.0; atkType = 'melee'; range = 60; } // Triceratops
        if (id === 80) { range = 500; atkType = 'range'; projType = 5; atkSpd *= 1.5; } // Alien
        if (id === 81) { eva += 50; hp *= 0.5; atkType = 'melee'; range = 60; } // Ghost
        if (id === 82) { def += 30; hp *= 1.5; range = 400; atkType = 'range'; projType = 5; } // Robot
        if (id === 83) { hp *= 0.8; regen += 100; atkType = 'melee'; range = 60; } // Skeleton
        if (id === 84) { hp *= 1.5; atk *= 0.8; atkType = 'melee'; range = 60; } // Zombie
        if (id === 85) { regen += 30; atk *= 1.2; atkType = 'melee'; range = 60; } // Vampire
        if (id === 86) { range = 350; atkType = 'range'; projType = 5; } // Mermaid
        if (id === 87) { range = 550; atkType = 'range'; projType = 1; crit += 20; } // Elf
        if (id === 88) { hp *= 1.5; atk *= 1.5; range = 300; atkType = 'range'; projType = 5; } // Genie
        if (id === 89) { hp *= 0.5; cost *= 2.0; range = 300; atkType = 'range'; projType = 5; regen += 10; } // Fairy
        if (id === 90) { spd *= 2.5; crit += 30; atkType = 'melee'; range = 60; } // Ninja
        if (id === 91) { atk *= 2.0; spd *= 1.2; range = 80; atkType = 'melee'; } // Samurai
        if (id === 92) { atk *= 3.0; hp *= 0.6; range = 400; atkType = 'range'; projType = 4; } // Mage (Meteor/Fire)
        if (id === 93) { cost *= 2.0; hp *= 1.5; atk *= 1.2; atkType = 'melee'; range = 60; } // King
        if (id === 94) { cost *= 2.0; hp *= 1.2; range = 300; atkType = 'range'; projType = 5; } // Queen
        if (id === 95) { def += 20; hp *= 1.2; atkType = 'melee'; range = 60; } // Guard
        if (id === 96) { crit += 10; range = 300; atkType = 'range'; projType = 1; } // Detective
        if (id === 97) { hp *= 1.2; atkType = 'melee'; range = 60; } // Worker
        if (id === 98) { regen += 10; atkType = 'melee'; range = 60; } // Chef
        if (id === 99) { regen += 30; atk *= 0.5; range = 200; atkType = 'range'; projType = 5; } // Doctor
        if (id === 100) { hp *= 1.1; atkType = 'melee'; range = 60; } // Farmer
        if (id === 101) { spd *= 0.5; atkType = 'melee'; range = 60; } // Astronaut
        if (id === 102) { def += 10; atkType = 'melee'; range = 60; } // Firefighter
        if (id === 103) { atk *= 1.2; atkType = 'range'; projType = 1; range = 300; } // Police

        return { hp, atk, def, spd, atkSpd, crit, eva, regen, range, atkType, projType, cost };
    }

    Object.values(CLASS_TYPES).forEach(t => {
        let s1 = getRawStats(t, 1);
        let s2 = getRawStats(t, 2);

        t.baseStats = {
            hp: Math.round(s1.hp), atk: Math.round(s1.atk), def: Math.round(s1.def),
            spd: parseFloat(s1.spd.toFixed(2)), atkSpd: parseFloat(s1.atkSpd.toFixed(2)),
            crit: s1.crit, eva: s1.eva, regen: s1.regen, cost: s1.cost
        };

        t.growth = {
            hp: Math.round(s2.hp - s1.hp),
            atk: Math.round(s2.atk - s1.atk),
            def: Math.round(s2.def - s1.def),
            regen: Math.round(s2.regen - s1.regen),
            spd: parseFloat((s2.spd - s1.spd).toFixed(2)),
            atkSpd: parseFloat((s2.atkSpd - s1.atkSpd).toFixed(2)),
            cost: Math.round(s2.cost - s1.cost)
        };

        t.levelRate = { hp: 1.05, atk: 1.05, def: 1.02, regen: 1.05, spd: 1, atkSpd: 1, crit: 1, eva: 1 };

        let dmgType = 'single';
        if (t.id === 0 || t.id === 16) dmgType = 'pierce';
        if ([5, 19, 20].includes(t.id)) dmgType = 'area';
        if (t.id === 21) dmgType = 'multi';

        let special = null;
        if (t.id === 21) special = 'multishot';
        else if (t.id === 12) special = 'heal';
        else if (t.id === 13) special = 'buff_spd';
        else if (t.id === 10) special = 'poison';
        else if (t.id === 17) special = 'stun';

        t.combat = {
            type: s1.atkType, range: s1.range, projType: s1.projType,
            flying: FLYING_IDS.includes(t.id), dmgType: dmgType, special: special
        };
    });
})();

export const MEDAL_TYPES = ['Đồng', 'Bạc', 'Vàng'];
export const MEDAL_BUFFS = [
    "% Máu Nhà", "% Mineral Max", "% Hồi Mineral", "% Công Tên Lửa",
    "% Tốc Tên Lửa", "% Thủ Nhà", "-% Cost Tướng", "% Công Thiên Thạch",
    "% EXP Nhận", "% Vàng Nhận"
];

export const ITEM_TYPES = {
    SWORD: { id: 0, name: "Kiếm", icon: "⚔️", mainStat: "atk", exclude: "atk" },
    SHIELD: { id: 1, name: "Khiên", icon: "🛡️", mainStat: "def", exclude: "def" },
    BOOTS: { id: 2, name: "Giày", icon: "👢", mainStat: "spd", exclude: "spd" },
    WATCH: { id: 3, name: "Đồng Hồ", icon: "⌚", mainStat: "atkSpd", exclude: "atkSpd" } // Xuất chiến -> AtkSpd
};

export const RARITY = {
    F: { id: 0, name: "F", color: "#9E9E9E", mult: 1, chance: 0.28 }, // Reduced from 0.3
    E: { id: 1, name: "E", color: "#FFFFFF", mult: 2, chance: 0.24 }, // Reduced from 0.25
    D: { id: 2, name: "D", color: "#8BC34A", mult: 3, chance: 0.19 }, // Reduced from 0.2
    C: { id: 3, name: "C", color: "#00BCD4", mult: 4, chance: 0.095 }, // Reduced from 0.1
    B: { id: 4, name: "B", color: "#2196F3", mult: 5, chance: 0.075 }, // Reduced from 0.08
    A: { id: 5, name: "A", color: "#9C27B0", mult: 6, chance: 0.038 }, // Reduced from 0.04
    R: { id: 6, name: "R", color: "#FF9800", mult: 8, chance: 0.019 }, // Reduced from 0.02
    SR: { id: 7, name: "SR", color: "#FFEB3B", mult: 10, chance: 0.009 }, // Reduced from 0.01
    SSR: { id: 8, name: "SSR", color: "#FF1744", mult: 12, chance: 0.005 }, // NEW
    SSSR: { id: 9, name: "SSSR", color: "#E040FB", mult: 15, chance: 0.001 } // NEW
};

// Rate: % success. BonusRef: Key for bonus increments
export const UPGRADE_RATES = {
    F: { rate: 100, bonus: 0 },
    E: { rate: 80, bonus: 5 },
    D: { rate: 60, bonus: 4 },
    C: { rate: 40, bonus: 3 },
    B: { rate: 20, bonus: 2 },
    A: { rate: 10, bonus: 1 },
    R: { rate: 5, bonus: 0.5 },
    SR: { rate: 1, bonus: 0.1 },
    SSR: { rate: 0.5, bonus: 0.05 }, // NEW
    SSSR: { rate: 0.1, bonus: 0.01 } // NEW
};

export const SPELL_TYPES = {
    0: { id: 0, name: "Hồi Phục", icon: "❤️", desc: "Hồi máu nhà chính", cost: 50, duration: 5, val: 100 },
    1: { id: 1, name: "Tiếp Tế", icon: "💊", desc: "Hồi máu quân lính", cost: 80, duration: 5, val: 50 },
    2: { id: 2, name: "Hộ Mệnh", icon: "🛡️", desc: "Triệu hồi thần bảo vệ", cost: 100, duration: 5, val: 1 },
    3: { id: 3, name: "Tường Chắn", icon: "🧱", desc: "Chặn quân địch", cost: 70, duration: 5, val: 1 },
    4: { id: 4, name: "Đóng Băng", icon: "❄️", desc: "Đóng băng đội địch 5s", cost: 90, duration: 5, val: 1 },
    5: { id: 5, name: "Khói Độc", icon: "☠️", desc: "Độc -5% HP mỗi quái", cost: 85, duration: 5, val: 0.05 },
    6: { id: 6, name: "Cuồng Nhiệt", icon: "⚡", desc: "+100% Tốc đánh (5s)", cost: 120, duration: 5, val: 1 },
    7: { id: 7, name: "Cuồng Nộ", icon: "😡", desc: "+100% Tấn công (5s)", cost: 150, duration: 5, val: 1 }
};

export class DataManager {
    constructor() {
        this.load();
    }

    getDefaultData() {
        return {
            gold: 500000,
            level: 1,
            exp: 0,
            heroes: [],
            team: [null, null, null, null],
            baseStats: { hpLvl: 1, defLvl: 1, atkLvl: 1, minMaxLvl: 1, minRateLvl: 1 },
            limitLevels: { unit: 0, hero: 0, item: 0 }, // New Limits Levels
            limitUnits: 10, // Max deployable in stage (10 -> 20)
            limitHeroes: 30, // Inventory bag (30 -> 100)
            limitItems: 30, // Item bag (30 -> 100)
            maxStage: 1,
            medals: [],
            medals: [],
            inventory: [], // Store items here
            upgradeBonus: {}, // { "SWORD_E": 10, "SHIELD_D": 5 ... } - Cumulative failure bonus %
            spells: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 }, // 0: Locked. 1+: Active Level
            spellSlots: [0, 1, 2, 3, 4, 5], // Default Key Bindings: 5->0, 6->1, 7->2, 8->3, 9->4, 0->5
            config: { expMultiplier: 1.2 }
        };
    }

    upgradeUnitLimit() {
        if (this.data.limitUnits >= 20) return false;
        let lvl = this.data.limitLevels.unit;
        let cost = 10000 * Math.pow(2, lvl);
        if (this.data.gold >= cost) {
            this.data.gold -= cost;
            this.data.limitLevels.unit++;
            this.data.limitUnits++;
            this.save();
            return true;
        }
        return false;
    }

    upgradeHeroLimit() {
        if (this.data.limitHeroes >= 100) return false;
        let step = (this.data.limitHeroes - 30) / 5;
        let cost = 5000 + step * 1000;

        if (this.data.gold >= cost) {
            this.data.gold -= cost;
            this.data.limitLevels.hero++;
            this.data.limitHeroes += 5;
            if (this.data.limitHeroes > 100) this.data.limitHeroes = 100;
            this.save();
            return true;
        }
        return false;
    }

    upgradeItemLimit() {
        if (this.data.limitItems >= 100) return false;
        let step = (this.data.limitItems - 30) / 5;
        let cost = 5000 + step * 1000;

        if (this.data.gold >= cost) {
            this.data.gold -= cost;
            this.data.limitLevels.item++;
            this.data.limitItems += 5;
            if (this.data.limitItems > 100) this.data.limitItems = 100;
            this.save();
            return true;
        }
        return false;
    }

    upgradeSpell(spellId) {
        // Initialize spell if not exists (for new spells added after save)
        if (this.data.spells[spellId] === undefined) {
            this.data.spells[spellId] = 0;
        }

        let lvl = this.data.spells[spellId];
        let cost = (lvl + 1) * 500; // Example cost scaling
        if (this.data.gold >= cost) {
            this.data.gold -= cost;
            this.data.spells[spellId]++;
            this.save();
            return true;
        }
        return false;
    }

    save() {
        try {
            localStorage.setItem('nguhanh_save_v2', JSON.stringify(this.data));
        } catch (e) { console.error("Save failed", e); }
    }

    load() {
        const saved = localStorage.getItem('nguhanh_save_v2');
        if (saved) {
            try {
                let parsed = JSON.parse(saved);
                let def = this.getDefaultData();
                this.data = { ...def, ...parsed }; // Merge default with parsed to ensure new keys exist

                // Ensure strict types for nested objects if spread doesn't handle deep merge
                if (!this.data.inventory) this.data.inventory = [];
                if (!this.data.upgradeBonus) this.data.upgradeBonus = {};
                if (!this.data.spells) this.data.spells = { 0: 0, 1: 0, 2: 0, 3: 0 };

                // Polyfill limit levels if missing (handled by spread above? No, parsed overwrites def. If parsed lacks it, def is used. OK. 
                // But if parsed has old structure? Old structure didn't have limitLevels. 
                // spread {limitLevels: ...}, {oldData} -> limitLevels preserved from def if valid.
                // Wait, if oldData doesn't have limitLevels key, safe.

                // Ensure heroes have equipments
                this.data.heroes.forEach(h => {
                    if (!h.equipments) h.equipments = { 0: null, 1: null, 2: null, 3: null };
                    // Fix missing maxLevel for old heroes
                    if (!h.maxLevel) h.maxLevel = 20 + (h.stars - 1) * 10;
                });

                if (this.data.medals.length < 1000) {
                    for (let i = this.data.medals.length; i < 1000; i++) this.data.medals.push(0);
                }
            } catch (e) { this.reset(); }
        } else {
            this.reset();
        }
    }

    reset() {
        this.data = this.getDefaultData();
        this.save();
    }

    invalidateHeroCache() {
        // Clear equipment cache flags
        if (this.data.heroes) {
            this.data.heroes.forEach(h => {
                delete h._cachedIsEquipped;
            });
        }
    }

    createHero(starOverride = null, allowedTypes = null, autoSave = true) {
        // 1. Determine Type & Stars
        let typeKeys = Object.keys(CLASS_TYPES);
        if (allowedTypes && allowedTypes.length > 0) {
            // Filter keys to only those allowed
            // allowedTypes is Array of IDs.
            // CLASS_TYPES keys are names. Need to filter by ID.
            typeKeys = typeKeys.filter(k => allowedTypes.includes(CLASS_TYPES[k].id));
        }
        let typeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        let typeInfo = CLASS_TYPES[typeKey];
        let typeId = typeInfo.id;

        let stars = starOverride;
        if (!stars) {
            let r = Math.random();
            if (r < 0.50) stars = 1; else if (r < 0.80) stars = 2; else if (r < 0.95) stars = 3; else if (r < 0.99) stars = 4; else stars = 5;
        }

        const s = typeInfo.baseStats;
        const g = typeInfo.growth;
        const st = stars - 1;

        const hero = {
            id: Date.now() + Math.random(),
            type: typeId,
            stars: stars,
            maxStars: 10,
            level: 1,
            maxLevel: 20 + (stars - 1) * 10,
            exp: 0,

            hp: Math.round(s.hp + st * g.hp),
            atk: Math.round(s.atk + st * g.atk),
            def: Math.round(s.def + st * g.def),
            spd: parseFloat((s.spd + st * g.spd).toFixed(2)),
            atkSpd: parseFloat((s.atkSpd + st * g.atkSpd).toFixed(2)),
            crit: s.crit,
            eva: s.eva,
            regen: Math.round(s.regen + st * g.regen),

            range: typeInfo.combat.range,
            atkType: typeInfo.combat.type,
            projType: typeInfo.combat.projType,
            cost: Math.round(s.cost + st * g.cost),
            equipments: { weapon: null, armor: null, accessory: null, artifact: null }
        };

        this.data.heroes.push(hero);
        if (autoSave) this.save();
        return hero;
    }

    gacha() {
        if (this.data.heroes.length >= this.data.limitHeroes) return "FULL";
        if (this.data.gold < 1000) return null;
        this.data.gold -= 1000;
        return this.createHero();
    }

    gachaBulk(type, count, costOverride = null, filters = null) {
        let cost = (costOverride != null) ? costOverride : count * 1000;
        if (this.data.gold < cost) return { error: "Không đủ vàng!" };

        if (type === 'hero') {
            if (this.data.heroes.length + count > this.data.limitHeroes) return { error: "Kho tướng không đủ chỗ!" };
        } else {
            if (this.data.inventory.length + count > this.data.limitItems) return { error: "Kho đồ không đủ chỗ!" };
        }

        this.data.gold -= cost;
        let items = [];
        for (let i = 0; i < count; i++) {
            if (type === 'hero') {
                let allowed = filters ? filters.classes : null;
                items.push(this.createHero(null, allowed, false));
            }
            else {
                let allowed = filters ? filters.types : null;
                items.push(this.createItem(null, null, allowed, false));
            }
        }
        this.save();
        return { items: items, cost: cost };
    }

    // Deprecated? No, used in gachaItem
    gachaItem() {
        if (this.data.inventory.length >= this.data.limitItems) return "FULL";
        if (this.data.gold < 1000) return null;
        this.data.gold -= 1000;
        let item = this.createItem();
        return item;
    }

    mergeHeroes(mainHeroId, materialIds) {
        let main = this.data.heroes.find(h => h.id === mainHeroId);
        if (!main) return { success: false };

        materialIds.forEach(mId => {
            let matIdx = this.data.heroes.findIndex(h => h.id === mId);
            if (matIdx !== -1) {
                let mat = this.data.heroes[matIdx];
                // Ensure we don't merge main hero into itself (sanity check)
                if (mat.id === main.id) return;

                if (mat.type === main.type) {
                    main.maxLevel += 5;
                } else {
                    let expGain = mat.stars * mat.level * 1000 * 100; // Increased 100x
                    this.addHeroExp(main, expGain);
                }
                this.unequipAll(mat);
                this.data.heroes.splice(matIdx, 1);
            }
        });
        this.invalidateHeroCache();
        this.save();
        return { success: true };
    }

    sellHeroes(heroIds) {
        let totalGold = 0;
        heroIds.forEach(id => {
            let idx = this.data.heroes.findIndex(h => h.id === id);
            if (idx !== -1) {
                let h = this.data.heroes[idx];
                totalGold += Math.floor(h.level * 100 * h.stars * 100); // Increased 100x
                this.unequipAll(h);
                this.data.heroes.splice(idx, 1);
            }
        });
        this.data.gold += totalGold;
        this.invalidateHeroCache();
        this.save();
        return totalGold;
    }

    addHeroExp(hero, amount) {
        let leveledUp = false;
        hero.exp += amount;
        let expReq = hero.level * 100;

        let typeInfo = Object.values(CLASS_TYPES).find(t => t.id === hero.type);
        const rate = typeInfo ? typeInfo.levelRate : { hp: 1.05, atk: 1.05, def: 1.02, regen: 1.05, spd: 1, atkSpd: 1 };

        while (hero.exp >= expReq && hero.level < hero.maxLevel) {
            hero.exp -= expReq;
            hero.level++;
            hero.hp = Math.floor(hero.hp * rate.hp);
            hero.atk = Math.floor(hero.atk * rate.atk);
            hero.def = Math.floor(hero.def * rate.def);
            hero.regen = Math.floor(hero.regen * rate.regen);
            if (rate.spd && rate.spd !== 1) hero.spd = parseFloat((hero.spd * rate.spd).toFixed(2));
            if (rate.atkSpd && rate.atkSpd !== 1) hero.atkSpd = parseFloat((hero.atkSpd * rate.atkSpd).toFixed(2));

            expReq = hero.level * 100;
            leveledUp = true;
        }
        return leveledUp;
    }

    upgradeHeroStar(heroId) {
        let hero = this.data.heroes.find(h => h.id === heroId);
        if (!hero) return { success: false, msg: "Không tìm thấy tướng!" };

        if (hero.stars >= 10) return { success: false, msg: "Đã đạt sao tối đa!" };

        let cost = hero.stars * 10000;
        if (this.data.gold < cost) return { success: false, msg: "Không đủ vàng!" };

        this.data.gold -= cost;
        hero.stars++;

        if (hero.stars >= 9) hero.maxLevel += 5; else hero.maxLevel += 10;

        let typeInfo = Object.values(CLASS_TYPES).find(t => t.id === hero.type);
        const growth = typeInfo ? typeInfo.growth : { hp: 50, atk: 5, def: 0, regen: 0, spd: 0, atkSpd: 0 };

        hero.hp = Math.round(hero.hp + growth.hp);
        hero.atk = Math.round(hero.atk + growth.atk);
        hero.def = Math.round(hero.def + growth.def);
        hero.regen = Math.round(hero.regen + growth.regen);
        if (growth.spd) hero.spd = parseFloat((hero.spd + growth.spd).toFixed(2));
        if (growth.atkSpd) hero.atkSpd = parseFloat((hero.atkSpd + growth.atkSpd).toFixed(2));

        this.save();
        return { success: true, msg: `Nâng lên ${hero.stars} sao thành công!` };
    }

    getBuffs() {
        let buffs = Array(10).fill(0);
        for (let r = 0; r < 20; r++) {
            let start = r * 5;
            let end = start + 5;
            let rowMedals = this.data.medals.slice(start, end);
            if (rowMedals.every(m => m >= 1)) {
                let type = r % 10;
                let minMedal = Math.min(...rowMedals);
                let val = minMedal === 1 ? 5 : (minMedal === 2 ? 10 : 20);
                buffs[type] += val;
            }
        }
        return buffs;
    }

    // --- ITEM SYSTEM ---

    createItem(targetRarity = null, level = null, allowedTypes = null, autoSave = true) {
        // Rarity
        let rarityKey = "F";
        if (targetRarity) {
            rarityKey = targetRarity;
        } else if (level !== null) {
            let allowed = ["F"];
            if (level <= 20) allowed = ["F"];
            else if (level <= 40) allowed = ["F", "E"];
            else if (level <= 60) allowed = ["E"];
            else if (level <= 80) allowed = ["E", "D"];
            else if (level <= 100) allowed = ["D"];
            else if (level <= 120) allowed = ["D", "C"];
            else if (level <= 140) allowed = ["C"];
            else if (level <= 160) allowed = ["C", "B"];
            else if (level <= 180) allowed = ["B"];
            else if (level <= 200) allowed = ["B", "A"];
            else allowed = ["B", "A", "SR"]; // > 200

            rarityKey = allowed[Math.floor(Math.random() * allowed.length)];
        } else {
            let r = Math.random();
            let accum = 0;
            let keys = Object.keys(RARITY);
            for (let k of keys) {
                accum += RARITY[k].chance;
                if (r < accum) { rarityKey = k; break; }
            }
        }
        let rarity = RARITY[rarityKey];

        // Type
        let typeKeys = Object.keys(ITEM_TYPES);
        if (allowedTypes && allowedTypes.length > 0) {
            typeKeys = typeKeys.filter(k => allowedTypes.includes(ITEM_TYPES[k].id));
        }
        let typeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
        let type = ITEM_TYPES[typeKey];

        // Main Stat
        let mainVal = 0;
        if (type.mainStat === 'atk') mainVal = 10 * rarity.mult;
        if (type.mainStat === 'def') mainVal = 5 * rarity.mult;
        if (type.mainStat === 'spd') mainVal = 0.2 * rarity.mult;
        if (type.mainStat === 'atkSpd') mainVal = 0.1 * rarity.mult;

        // Sub Stat (Random option excluding main stat)
        let options = ['atk', 'def', 'spd', 'atkSpd'].filter(o => o !== type.exclude);
        let subOpt = options[Math.floor(Math.random() * options.length)];
        let subVal = 0;
        if (subOpt === 'atk') subVal = 5 * rarity.mult;
        if (subOpt === 'def') subVal = 3 * rarity.mult;
        if (subOpt === 'spd') subVal = 0.1 * rarity.mult;
        if (subOpt === 'atkSpd') subVal = 0.05 * rarity.mult;

        let item = {
            id: Date.now() + Math.random(),
            type: type.id,
            rarity: rarityKey,
            mainStat: { type: type.mainStat, val: mainVal },
            subStat: { type: subOpt, val: subVal },
            equippedTo: null
        };
        this.data.inventory.push(item);
        if (autoSave) this.save();
        return item;
    }

    equipItem(heroId, itemId, slot) {
        let hero = this.data.heroes.find(h => h.id === heroId);
        let item = this.data.inventory.find(i => i.id === itemId);
        if (!hero || !item) return false;

        // Unequip current item in slot
        if (hero.equipments[slot]) {
            let currentItemId = hero.equipments[slot];
            let currentItem = this.data.inventory.find(i => i.id === currentItemId);
            if (currentItem) currentItem.equippedTo = null;
            hero.equipments[slot] = null;
        }

        // Check if item equipped elsewhere
        if (item.equippedTo) {
            let otherHero = this.data.heroes.find(h => h.id === item.equippedTo);
            if (otherHero) {
                // Remove from other hero
                for (let s = 0; s < 4; s++) {
                    if (otherHero.equipments[s] === itemId) {
                        otherHero.equipments[s] = null;
                        break;
                    }
                }
            }
        }

        hero.equipments[slot] = itemId;
        item.equippedTo = heroId;
        delete hero._cachedIsEquipped; // Clear cache
        this.save();
        return true;
    }

    unequipItem(heroId, slot) {
        let hero = this.data.heroes.find(h => h.id === heroId);
        if (!hero) return;
        let itemId = hero.equipments[slot];
        if (itemId) {
            let item = this.data.inventory.find(i => i.id === itemId);
            if (item) item.equippedTo = null;
            hero.equipments[slot] = null;
            delete hero._cachedIsEquipped; // Clear cache
            this.save();
        }
    }

    unequipAll(hero) {
        for (let i = 0; i < 4; i++) this.unequipItem(hero.id, i);
    }

    upgradeItem(baseId, materialIds, useCharm = false) {
        let base = this.data.inventory.find(i => i.id === baseId);
        if (!base) return { success: false, msg: "Không tìm thấy đồ chính!" };

        // Validate Materials
        let mats = [];
        for (let mid of materialIds) {
            let m = this.data.inventory.find(i => i.id === mid);
            if (!m) return { success: false, msg: "Thiếu nguyên liệu!" };
            if (m.equippedTo) return { success: false, msg: "Nguyên liệu đang được trang bị!" };
            if (m.type !== base.type || m.rarity !== base.rarity) return { success: false, msg: "Nguyên liệu không cùng loại/cấp bậc!" };
            mats.push(m);
        }

        if (mats.length !== 3) return { success: false, msg: "Cần 3 nguyên liệu!" };

        // Lucky Charm Cost Check
        if (useCharm) {
            if (this.data.gold < 500000) return { success: false, msg: "Không đủ 500k vàng cho Bùa May Mắn!" };
        }

        // Determine Rate
        let rateInfo = UPGRADE_RATES[base.rarity];
        if (!rateInfo) return { success: false, msg: "Không thể nâng cấp!" };
        if (base.rarity === 'SSSR') return { success: false, msg: "Đã đạt cấp tối đa!" };

        // Get Bonus
        let bonusKey = `${base.type}_${base.rarity}`;
        let bonus = this.data.upgradeBonus[bonusKey] || 0;
        let totalRate = rateInfo.rate + bonus;

        // Apply Charm
        if (useCharm) {
            totalRate += 50;
        }

        if (totalRate > 100) totalRate = 100;

        // Roll
        let roll = Math.random() * 100;
        let success = roll < totalRate;

        // Deduct Gold for Charm
        if (useCharm) {
            this.data.gold -= 500000;
        }

        // Consume Materials (Remove from inventory)
        materialIds.forEach(id => {
            let idx = this.data.inventory.findIndex(i => i.id === id);
            if (idx !== -1) this.data.inventory.splice(idx, 1);
        });

        if (success) {
            // Upgrade Base
            let nextRarityKey = null;
            let keys = Object.keys(RARITY);
            let idx = keys.indexOf(base.rarity);
            if (idx !== -1 && idx < keys.length - 1) {
                nextRarityKey = keys[idx + 1];
            } else {
                return { success: false, msg: "Lỗi dữ liệu cấp bậc!" };
            }

            let nextRarity = RARITY[nextRarityKey];
            base.rarity = nextRarityKey;

            // Recalculate Stats based on new rarity mult
            let typeData = Object.values(ITEM_TYPES).find(t => t.id === base.type);

            // Re-calculate Main Stat
            let mainVal = 0;
            if (typeData.mainStat === 'atk') mainVal = 10 * nextRarity.mult;
            if (typeData.mainStat === 'def') mainVal = 5 * nextRarity.mult;
            if (typeData.mainStat === 'spd') mainVal = 0.2 * nextRarity.mult;
            if (typeData.mainStat === 'atkSpd') mainVal = 0.1 * nextRarity.mult;
            base.mainStat.val = mainVal;

            // Re-calculate Sub Stat (keep type, update val)
            let subVal = 0;
            if (base.subStat.type === 'atk') subVal = 5 * nextRarity.mult;
            if (base.subStat.type === 'def') subVal = 3 * nextRarity.mult;
            if (base.subStat.type === 'spd') subVal = 0.1 * nextRarity.mult;
            if (base.subStat.type === 'atkSpd') subVal = 0.05 * nextRarity.mult;
            base.subStat.val = subVal;

            // Reset Bonus
            this.data.upgradeBonus[bonusKey] = 0;
            this.save();
            return { success: true, msg: `Nâng cấp thành công lên ${nextRarityKey}!`, newRarity: nextRarityKey };
        } else {
            // Failure
            // Add Bonus
            this.data.upgradeBonus[bonusKey] = (this.data.upgradeBonus[bonusKey] || 0) + rateInfo.bonus;
            this.save();
            return { success: false, msg: `Thất bại! Tỷ lệ +${rateInfo.bonus}% (${this.data.upgradeBonus[bonusKey]}%)` };
        }
    }
}
