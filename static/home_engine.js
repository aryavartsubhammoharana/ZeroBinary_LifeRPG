/**
 * LifeRPG — Base & Home Building Engine ("Build Your Life")
 * Interactive 2D pixel-art dollhouse/cross-section builder where real-life
 * achievements, study, workouts, and discipline physically build your personal RPG home!
 */

// =============================================================================
// 1. DATA-DRIVEN BUILDING BLOCKS & FURNITURE CATALOG
// =============================================================================

const HOME_CATALOG = {
    foundations: [
        { id: 'fnd_wood', name: 'Wood Foundation', icon: '🪵', coins: 20, cxp: 5, color: '#8b5a2b', borderColor: '#5c3a1e', reqLevel: 1 },
        { id: 'fnd_stone', name: 'Stone Foundation', icon: '🪨', coins: 35, cxp: 8, color: '#64748b', borderColor: '#334155', reqLevel: 1 },
        { id: 'fnd_brick', name: 'Brick Foundation', icon: '🧱', coins: 50, cxp: 12, color: '#b91c1c', borderColor: '#7f1d1d', reqLevel: 3 },
        { id: 'fnd_marble', name: 'Marble Foundation', icon: '🏛️', coins: 120, cxp: 30, color: '#f1f5f9', borderColor: '#94a3b8', reqLevel: 10 }
    ],
    walls: [
        { id: 'wall_wood', name: 'Wood Plank Wall', icon: '🪵', coins: 20, cxp: 5, color: '#a05a2c', pattern: 'wood', reqLevel: 1 },
        { id: 'wall_stone', name: 'Cobblestone Wall', icon: '🪨', coins: 40, cxp: 10, color: '#475569', pattern: 'stone', reqLevel: 1 },
        { id: 'wall_brick', name: 'Red Brick Wall', icon: '🧱', coins: 60, cxp: 15, color: '#991b1b', pattern: 'brick', reqLevel: 2 },
        { id: 'wall_glass', name: 'Panoramic Glass Wall', icon: '🪟', coins: 100, cxp: 25, color: 'rgba(56,189,248,0.4)', pattern: 'glass', reqLevel: 5 },
        { id: 'wall_modern', name: 'Modern Studio Wall', icon: '🏢', coins: 140, cxp: 30, color: '#1e293b', pattern: 'modern', reqLevel: 8 },
        { id: 'wall_premium', name: 'Royal Gold Plated Wall', icon: '👑', coins: 350, cxp: 80, color: '#ca8a04', pattern: 'gold', reqLevel: 15 }
    ],
    floors: [
        { id: 'flr_wood', name: 'Oak Hardwood Floor', icon: '🪵', coins: 15, cxp: 2, color: '#b45309', pattern: 'planks', reqLevel: 1 },
        { id: 'flr_stone', name: 'Polished Stone Floor', icon: '🪨', coins: 30, cxp: 5, color: '#64748b', pattern: 'tiles', reqLevel: 1 },
        { id: 'flr_carpet', name: 'Plush Red Carpet', icon: '🧶', coins: 45, cxp: 10, color: '#be123c', pattern: 'carpet', reqLevel: 3 },
        { id: 'flr_marble', name: 'Luxury Marble Tiles', icon: '🏛️', coins: 90, cxp: 20, color: '#e2e8f0', pattern: 'marble', reqLevel: 8 },
        { id: 'flr_cyber', name: 'Cyber Neon Tech Floor', icon: '⚡', coins: 180, cxp: 40, color: '#0f172a', pattern: 'neon', reqLevel: 15 }
    ],
    roofs: [
        { id: 'roof_wood', name: 'Wood Shingle Roof', icon: '🛖', coins: 25, cxp: 5, color: '#78350f', reqLevel: 1 },
        { id: 'roof_tile', name: 'Clay Tile Roof', icon: '🏠', coins: 50, cxp: 10, color: '#c2410c', reqLevel: 2 },
        { id: 'roof_modern', name: 'Modern Slate Roof', icon: '🏢', coins: 90, cxp: 20, color: '#334155', reqLevel: 6 },
        { id: 'roof_crystal', name: 'Prismatic Crystal Roof', icon: '✨', coins: 280, cxp: 60, color: '#0284c7', reqLevel: 20 }
    ],
    windows_doors: [
        { id: 'win_small', name: 'Cozy Small Window', icon: '🪟', coins: 35, cxp: 5, w: 1, h: 1, type: 'window', reqLevel: 1 },
        { id: 'win_large', name: 'Large Arch Window', icon: '🖼️', coins: 65, cxp: 12, w: 2, h: 2, type: 'window', reqLevel: 3 },
        { id: 'door_wood', name: 'Oak Wood Door', icon: '🚪', coins: 30, cxp: 5, w: 1, h: 2, type: 'door', reqLevel: 1 },
        { id: 'door_double', name: 'Double French Door', icon: '🚪', coins: 110, cxp: 20, w: 2, h: 2, type: 'door', reqLevel: 6 }
    ],
    furniture: [
        // 🛏️ Bedroom
        { id: 'furn_bed_starter', name: 'Starter Wood Bed', icon: '🛏️', category: 'Bedroom', coins: 80, cxp: 10, w: 2, h: 1, rarity: 'Common', reqLevel: 1 },
        { id: 'furn_bed_king', name: 'Royal Canopy Bed', icon: '👑', category: 'Bedroom', coins: 450, cxp: 80, w: 3, h: 2, rarity: 'Epic', reqLevel: 10 },
        { id: 'furn_wardrobe', name: 'Oak Wardrobe', icon: '🚪', category: 'Bedroom', coins: 90, cxp: 15, w: 1, h: 2, rarity: 'Common', reqLevel: 1 },
        { id: 'furn_lamp', name: 'Warm Nightstand Lamp', icon: '💡', category: 'Bedroom', coins: 40, cxp: 5, w: 1, h: 1, rarity: 'Common', reqLevel: 1 },

        // 📚 Study & Knowledge
        { id: 'furn_desk_study', name: 'Scholar Study Desk', icon: '🪵', category: 'Study', coins: 120, cxp: 20, w: 2, h: 1, rarity: 'Common', reqLevel: 2 },
        { id: 'furn_bookshelf', name: 'Grand Library Bookshelf', icon: '📚', category: 'Study', coins: 150, cxp: 25, w: 2, h: 2, rarity: 'Uncommon', reqLevel: 3 },
        { id: 'furn_laptop_desk', name: 'Coding Laptop Station', icon: '💻', category: 'Study', coins: 260, cxp: 45, w: 2, h: 1, rarity: 'Rare', reqLevel: 5 },

        // 🏋️ Gym & Fitness
        { id: 'furn_dumbbells', name: 'Heavy Dumbbell Rack', icon: '🏋️', category: 'Gym', coins: 180, cxp: 30, w: 2, h: 1, rarity: 'Uncommon', reqLevel: 4 },
        { id: 'furn_treadmill', name: 'Digital Cardio Treadmill', icon: '🏃', category: 'Gym', coins: 380, cxp: 60, w: 2, h: 1, rarity: 'Rare', reqLevel: 5 },
        { id: 'furn_bench_press', name: 'Olympic Weight Bench', icon: '🏋️‍♂️', category: 'Gym', coins: 320, cxp: 50, w: 2, h: 1, rarity: 'Rare', reqLevel: 6 },
        { id: 'furn_punch_bag', name: 'Heavy Boxing Punch Bag', icon: '🥊', category: 'Gym', coins: 160, cxp: 25, w: 1, h: 2, rarity: 'Uncommon', reqLevel: 5 },

        // 🎮 Gaming Lounge & Office
        { id: 'furn_gaming_rig', name: 'RGB Battlestation PC', icon: '🖥️', category: 'Gaming', coins: 650, cxp: 100, w: 2, h: 2, rarity: 'Epic', reqLevel: 7 },
        { id: 'furn_gaming_chair', name: 'Ergonomic Gaming Chair', icon: '💺', category: 'Gaming', coins: 220, cxp: 35, w: 1, h: 1, rarity: 'Rare', reqLevel: 7 },
        { id: 'furn_arcade', name: 'Retro 80s Arcade Machine', icon: '🕹️', category: 'Gaming', coins: 800, cxp: 120, w: 1, h: 2, rarity: 'Legendary', reqLevel: 12 },

        // 🍳 Kitchen & Dining
        { id: 'furn_kitchen_stove', name: 'Chef Stove & Range', icon: '🍳', category: 'Kitchen', coins: 280, cxp: 45, w: 2, h: 1, rarity: 'Rare', reqLevel: 10 },
        { id: 'furn_fridge', name: 'Smart Stainless Refrigerator', icon: '🧊', category: 'Kitchen', coins: 310, cxp: 50, w: 1, h: 2, rarity: 'Rare', reqLevel: 10 },
        { id: 'furn_dining_table', name: 'Festive Dining Table', icon: '🪑', category: 'Kitchen', coins: 240, cxp: 35, w: 3, h: 1, rarity: 'Uncommon', reqLevel: 10 },

        // 🌿 Garden & Outdoor
        { id: 'furn_bonsai_tree', name: 'Ancient Bonsai Tree', icon: '🌳', category: 'Garden', coins: 90, cxp: 15, w: 2, h: 2, rarity: 'Uncommon', reqLevel: 3 },
        { id: 'furn_fountain', name: 'Grecian Stone Fountain', icon: '⛲', category: 'Garden', coins: 500, cxp: 80, w: 2, h: 2, rarity: 'Epic', reqLevel: 15 },
        { id: 'furn_flower_bed', name: 'Lush Blooming Flowerbed', icon: '🌸', category: 'Garden', coins: 60, cxp: 10, w: 2, h: 1, rarity: 'Common', reqLevel: 2 },
        { id: 'furn_patio_chair', name: 'Patio Sunlounger', icon: '🏖️', category: 'Garden', coins: 110, cxp: 20, w: 2, h: 1, rarity: 'Common', reqLevel: 4 },

        // 🏆 Special & Milestone Items
        { id: 'furn_trophy_case', name: 'Achievement Trophy Case', icon: '🏆', category: 'Special', coins: 300, cxp: 50, w: 2, h: 2, rarity: 'Epic', reqLevel: 8 },
        { id: 'furn_gold_throne', name: 'Emperor Golden Throne', icon: '👑', category: 'Special', coins: 2000, cxp: 350, w: 2, h: 2, rarity: 'Legendary', reqLevel: 20 },
        { id: 'furn_cosmic_portal', name: 'Interdimensional Cosmic Portal', icon: '🌌', category: 'Special', coins: 5000, cxp: 1000, w: 3, h: 3, rarity: 'Mythic', reqLevel: 50 }
    ]
};

// =============================================================================
// 2. ROOM BLUEPRINTS & UNLOCK TIERS
// =============================================================================

const ROOM_BLUEPRINTS = [
    { id: 'bedroom', name: 'Starter Bedroom', icon: '🛏️', reqLevel: 1, coins: 0, cxp: 0, perk: 'Your personal resting sanctuary' },
    { id: 'study', name: 'Scholar Study Room', icon: '📚', reqLevel: 3, coins: 350, cxp: 60, perk: '+10% Knowledge XP gain environment' },
    { id: 'gym', name: 'Iron Power Gym', icon: '🏋️', reqLevel: 5, coins: 700, cxp: 120, perk: '+10% Fitness XP & Workout Area' },
    { id: 'garage', name: 'Vehicle Garage & Workshop', icon: '🚲', reqLevel: 5, coins: 500, cxp: 80, perk: 'Houses your unlocked vehicles' },
    { id: 'gaming', name: 'Neon Gaming Lounge', icon: '🎮', reqLevel: 7, coins: 950, cxp: 160, perk: 'Guilt-free entertainment hub' },
    { id: 'office', name: 'Executive Master Office', icon: '💼', reqLevel: 10, coins: 1500, cxp: 250, perk: 'Deep Work focus zone' },
    { id: 'kitchen', name: 'Gourmet Kitchen & Cafe', icon: '🍳', reqLevel: 15, coins: 2200, cxp: 350, perk: 'Vitality & recovery meals' },
    { id: 'garden', name: 'Zen Garden & Courtyard', icon: '🌿', reqLevel: 20, coins: 3000, cxp: 500, perk: 'Outdoor peace & tranquility' },
    { id: 'trophy', name: 'Grand Hall of Trophies', icon: '🏆', reqLevel: 30, coins: 5000, cxp: 800, perk: 'Showcase your life victories' },
    { id: 'pool', name: 'Cosmic Resort Pool', icon: '🏊', reqLevel: 50, coins: 10000, cxp: 1500, perk: 'Peak luxury lifestyle status' }
];

const HOME_TITLES = [
    { level: 1, title: 'Starter Hut' },
    { level: 2, title: 'Small Cottage' },
    { level: 3, title: 'Comfortable House' },
    { level: 5, title: 'Large Residence' },
    { level: 7, title: 'Designer Villa' },
    { level: 10, title: 'Modern Villa' },
    { level: 15, title: 'Luxury Estate' },
    { level: 20, title: 'Grand Manor' },
    { level: 30, title: 'Imperial Mansion' },
    { level: 50, title: 'Legendary Citadel' }
];

// =============================================================================
// 3. HOME ENGINE CLASS & CANVAS RENDERER
// =============================================================================

class HomeBuildingEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gridCols = 36;
        this.gridRows = 16;
        this.cellSize = 24; // 24x24 px pixel block
        
        this.homeLevel = 1;
        this.homeXp = 0;
        this.constructionXp = 100;
        this.unlockedRooms = ['bedroom'];
        
        // Grid layers: blocks (foundations, walls, floors, roofs) & furniture
        this.gridBlocks = {}; // key: "col,row" -> { type, id, cat }
        this.furnitureItems = []; // [{ id, catId, col, row, w, h, name, icon }]
        
        // Build mode states
        this.isBuildMode = false;
        this.activeTool = 'block'; // 'block' | 'furniture' | 'remove' | 'move'
        this.selectedCatalogItem = null;
        this.hoverCol = -1;
        this.hoverRow = -1;
        this.undoStack = [];
        this.redoStack = [];

        // Interactive Home Avatar state
        this.avatar = {
            col: 10,
            row: 11,
            targetCol: 10,
            activity: 'idle', // 'idle' | 'sleep' | 'study' | 'workout' | 'garage'
            activityTimer: 180,
            frame: 0
        };

        this.dayTimePhase = 0; // 0..360 for ambient lighting
        this.particles = [];
        this.animFrame = null;
    }

    init() {
        this.canvas = document.getElementById('home-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        this.loadHomeData();
        this.bindEvents();
        this.startLoop();
        this.updateHomeHUD();
    }

    bindEvents() {
        if (!this.canvas) return;

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            this.hoverCol = Math.floor(x / this.cellSize);
            this.hoverRow = Math.floor(y / this.cellSize);
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoverCol = -1;
            this.hoverRow = -1;
        });

        this.canvas.addEventListener('click', () => {
            if (!this.isBuildMode) {
                // Click to send character to location
                if (this.hoverCol >= 4 && this.hoverCol <= 32) {
                    this.avatar.targetCol = this.hoverCol;
                    this.avatar.activity = 'idle';
                    this.avatar.activityTimer = 240;
                }
                return;
            }
            this.handleCanvasClick();
        });
    }

    // =========================================================================
    // STARTER HOME & PERSISTENCE
    // =========================================================================

    initStarterHome() {
        this.gridBlocks = {};
        this.furnitureItems = [];
        this.unlockedRooms = ['bedroom'];

        // Starter Ground & Foundation (cols 6 to 22, ground at row 12)
        for (let c = 6; c <= 22; c++) {
            this.gridBlocks[`${c},12`] = { cat: 'foundations', id: 'fnd_wood', name: 'Wood Foundation' };
            this.gridBlocks[`${c},11`] = { cat: 'floors', id: 'flr_wood', name: 'Oak Hardwood Floor' };
        }

        // Walls (Height: 4 blocks from row 7 to 10)
        for (let r = 7; r <= 10; r++) {
            this.gridBlocks[`6,${r}`] = { cat: 'walls', id: 'wall_wood', name: 'Wood Plank Wall' };
            this.gridBlocks[`22,${r}`] = { cat: 'walls', id: 'wall_wood', name: 'Wood Plank Wall' };
            // Interior partition
            this.gridBlocks[`14,${r}`] = { cat: 'walls', id: 'wall_wood', name: 'Wood Plank Wall' };
        }

        // Windows & Doors
        this.gridBlocks[`10,9`] = { cat: 'windows_doors', id: 'win_small', name: 'Cozy Small Window' };
        this.gridBlocks[`18,9`] = { cat: 'windows_doors', id: 'win_small', name: 'Cozy Small Window' };
        this.gridBlocks[`6,11`] = { cat: 'windows_doors', id: 'door_wood', name: 'Oak Wood Door' };

        // Roof (row 6)
        for (let c = 5; c <= 23; c++) {
            this.gridBlocks[`${c},6`] = { cat: 'roofs', id: 'roof_wood', name: 'Wood Shingle Roof' };
        }

        // Starter Furniture
        this.furnitureItems.push({
            id: 'bed_starter_1',
            catId: 'furn_bed_starter',
            col: 8,
            row: 10,
            w: 2,
            h: 1,
            name: 'Starter Wood Bed',
            icon: '🛏️'
        });

        this.furnitureItems.push({
            id: 'lamp_1',
            catId: 'furn_lamp',
            col: 7,
            row: 10,
            w: 1,
            h: 1,
            name: 'Warm Nightstand Lamp',
            icon: '💡'
        });

        this.furnitureItems.push({
            id: 'desk_1',
            catId: 'furn_desk_study',
            col: 16,
            row: 10,
            w: 2,
            h: 1,
            name: 'Scholar Study Desk',
            icon: '🪵'
        });

        this.saveHomeData();
    }

    loadHomeData() {
        const saved = localStorage.getItem('liferpg_home_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.homeLevel = data.homeLevel || 1;
                this.homeXp = data.homeXp || 0;
                this.constructionXp = data.constructionXp !== undefined ? data.constructionXp : 100;
                this.unlockedRooms = data.unlockedRooms || ['bedroom'];
                this.gridBlocks = data.gridBlocks || {};
                this.furnitureItems = data.furnitureItems || [];
            } catch (e) {
                this.initStarterHome();
            }
        } else {
            this.initStarterHome();
        }

        if (Object.keys(this.gridBlocks).length === 0) {
            this.initStarterHome();
        }
    }

    saveHomeData() {
        const payload = {
            homeLevel: this.homeLevel,
            homeXp: this.homeXp,
            constructionXp: this.constructionXp,
            unlockedRooms: this.unlockedRooms,
            gridBlocks: this.gridBlocks,
            furnitureItems: this.furnitureItems
        };
        localStorage.setItem('liferpg_home_data', JSON.stringify(payload));

        if (typeof currentUser !== 'undefined' && currentUser) {
            try {
                fetchWithRefresh(`${baseUrl}/home/save`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        home_level: this.homeLevel,
                        home_xp: this.homeXp,
                        construction_xp: this.constructionXp,
                        home_data: JSON.stringify(payload)
                    })
                });
            } catch (e) {}
        }
    }

    // =========================================================================
    // BUILD MODE ACTIONS (PLACE, REMOVE, MOVE, UNDO/REDO)
    // =========================================================================

    toggleBuildMode() {
        playSound('click');
        this.isBuildMode = !this.isBuildMode;
        const btn = document.getElementById('btn-toggle-build-mode');
        const toolbar = document.getElementById('home-build-toolbar');
        
        if (btn) {
            btn.textContent = this.isBuildMode ? '🔨 EXIT BUILD MODE' : '🔨 BUILD MODE';
            btn.classList.toggle('active', this.isBuildMode);
        }
        if (toolbar) {
            toolbar.classList.toggle('hidden', !this.isBuildMode);
        }

        if (this.isBuildMode) {
            if (!this.selectedCatalogItem) {
                this.selectCatalogItem(HOME_CATALOG.walls[0]);
            }
            renderBuildQuickPalette();
        }
    }

    selectCatalogItem(item) {
        playSound('step');
        this.selectedCatalogItem = item;
        this.activeTool = item.category ? 'furniture' : 'block';

        // Update live preview card
        const iconEl = document.getElementById('bipc-icon');
        if (iconEl) iconEl.textContent = item.icon || '🧱';

        setText('build-cur-item-name', item.name);
        setText('bipc-gold', `🪙 ${item.coins} Coins`);
        setText('bipc-cxp', `⭐ ${item.cxp} Build XP`);
        const xpGain = Math.max(5, Math.floor((item.coins + item.cxp * 2) * 0.15));
        setText('bipc-perk', `+${xpGain} Home XP • Level ${item.reqLevel || 1}+`);

        document.querySelectorAll('.build-palette-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`cat-item-${item.id}`);
        if (btn) btn.classList.add('active');
    }

    setTool(tool) {
        playSound('click');
        this.activeTool = tool;
        document.querySelectorAll('.build-tool-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`tool-btn-${tool}`);
        if (btn) btn.classList.add('active');
    }

    handleCanvasClick() {
        if (this.hoverCol < 0 || this.hoverRow < 0) return;

        const key = `${this.hoverCol},${this.hoverRow}`;

        if (this.activeTool === 'remove') {
            // Remove block or furniture
            const furnIndex = this.furnitureItems.findIndex(f => 
                this.hoverCol >= f.col && this.hoverCol < f.col + f.w &&
                this.hoverRow >= f.row && this.hoverRow < f.row + f.h
            );

            if (furnIndex >= 0) {
                const removed = this.furnitureItems.splice(furnIndex, 1)[0];
                this.recordUndo({ type: 'remove_furniture', item: removed });
                playSound('magic');
                this.spawnBuildParticle(this.hoverCol, this.hoverRow, '#ef4444');
                this.saveHomeData();
                return;
            }

            if (this.gridBlocks[key]) {
                const removedBlock = this.gridBlocks[key];
                delete this.gridBlocks[key];
                this.recordUndo({ type: 'remove_block', key, block: removedBlock });
                playSound('magic');
                this.spawnBuildParticle(this.hoverCol, this.hoverRow, '#ef4444');
                this.saveHomeData();
                return;
            }
            return;
        }

        if (!this.selectedCatalogItem) return;

        const item = this.selectedCatalogItem;
        const currentGold = hero.gold || 1000;

        if (currentGold < item.coins) {
            playSound('error');
            alert(`🔒 Insufficient Coins! You need 🪙 ${item.coins} Coins. Complete quests to earn more.`);
            return;
        }
        if (this.constructionXp < item.cxp) {
            playSound('error');
            alert(`🔒 Insufficient Construction XP! You need ⭐ ${item.cxp} Build XP. Complete daily quests to earn build XP.`);
            return;
        }

        // Deduct resource
        hero.gold = currentGold - item.coins;
        this.constructionXp -= item.cxp;
        
        // Add Home XP
        const xpGain = Math.max(5, Math.floor((item.coins + item.cxp * 2) * 0.15));
        this.addHomeXP(xpGain);

        // Place Furniture
        if (item.category) {
            const newFurn = {
                id: `furn_${Date.now()}`,
                catId: item.id,
                col: this.hoverCol,
                row: this.hoverRow,
                w: item.w || 1,
                h: item.h || 1,
                name: item.name,
                icon: item.icon
            };
            this.furnitureItems.push(newFurn);
            this.recordUndo({ type: 'place_furniture', item: newFurn });
        } else {
            // Place Block
            const newBlock = {
                cat: this.getItemCategoryKey(item),
                id: item.id,
                name: item.name,
                color: item.color,
                pattern: item.pattern
            };
            const prevBlock = this.gridBlocks[key] || null;
            this.gridBlocks[key] = newBlock;
            this.recordUndo({ type: 'place_block', key, block: newBlock, prev: prevBlock });
        }

        playSound('victory');
        this.spawnBuildParticle(this.hoverCol, this.hoverRow, '#38bdf8');
        spawnFloatingReward(`-${item.coins} COINS`, 'gold', this.hoverCol * this.cellSize, this.hoverRow * this.cellSize - 10);
        setTimeout(() => spawnFloatingReward(`+${xpGain} HOME XP`, 'xp', this.hoverCol * this.cellSize, this.hoverRow * this.cellSize - 30), 150);

        this.saveHomeData();
        this.updateHomeHUD();
        if (typeof updateAdvDashboardUI === 'function') updateAdvDashboardUI();
    }

    getItemCategoryKey(item) {
        if (HOME_CATALOG.foundations.some(x => x.id === item.id)) return 'foundations';
        if (HOME_CATALOG.walls.some(x => x.id === item.id)) return 'walls';
        if (HOME_CATALOG.floors.some(x => x.id === item.id)) return 'floors';
        if (HOME_CATALOG.roofs.some(x => x.id === item.id)) return 'roofs';
        if (HOME_CATALOG.windows_doors.some(x => x.id === item.id)) return 'windows_doors';
        return 'blocks';
    }

    addHomeXP(amount) {
        this.homeXp += amount;
        let leveledUp = false;
        while (this.homeXp >= 100) {
            this.homeXp -= 100;
            this.homeLevel++;
            leveledUp = true;
        }
        if (leveledUp) {
            playSound('victory');
            alert(`🎉 HOME LEVEL UP! Reached Home Level ${this.homeLevel} (${this.getHomeTitle()})!\nNew building blocks and rooms are now unlocked in the Home Shop!`);
        }
        this.updateHomeHUD();
    }

    getHomeTitle() {
        const found = [...HOME_TITLES].reverse().find(t => this.homeLevel >= t.level);
        return found ? found.title : 'Starter Hut';
    }

    recordUndo(action) {
        this.undoStack.push(action);
        if (this.undoStack.length > 30) this.undoStack.shift();
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length === 0) return;
        playSound('step');
        const act = this.undoStack.pop();
        this.redoStack.push(act);

        if (act.type === 'place_block') {
            if (act.prev) this.gridBlocks[act.key] = act.prev;
            else delete this.gridBlocks[act.key];
        } else if (act.type === 'remove_block') {
            this.gridBlocks[act.key] = act.block;
        } else if (act.type === 'place_furniture') {
            this.furnitureItems = this.furnitureItems.filter(f => f.id !== act.item.id);
        } else if (act.type === 'remove_furniture') {
            this.furnitureItems.push(act.item);
        }

        this.saveHomeData();
    }

    redo() {
        if (this.redoStack.length === 0) return;
        playSound('step');
        const act = this.redoStack.pop();
        this.undoStack.push(act);

        if (act.type === 'place_block') {
            this.gridBlocks[act.key] = act.block;
        } else if (act.type === 'remove_block') {
            delete this.gridBlocks[act.key];
        } else if (act.type === 'place_furniture') {
            this.furnitureItems.push(act.item);
        } else if (act.type === 'remove_furniture') {
            this.furnitureItems = this.furnitureItems.filter(f => f.id !== act.item.id);
        }

        this.saveHomeData();
    }

    // =========================================================================
    // RENDERING LOOP & PIXEL ART GRAPHICS
    // =========================================================================

    startLoop() {
        const render = () => {
            this.render();
            this.animFrame = requestAnimationFrame(render);
        };
        if (!this.animFrame) {
            this.animFrame = requestAnimationFrame(render);
        }
    }

    render() {
        if (!this.ctx || !this.canvas) return;
        const w = this.canvas.width;
        const h = this.canvas.height;

        this.ctx.clearRect(0, 0, w, h);
        this.dayTimePhase += 0.05;

        // 1. Sky & Outdoor Landscape
        this.renderSky(w, h);
        this.renderLandscape(w, h);

        // 2. Base Grid Blocks (Foundations, Floors, Walls, Roofs, Windows)
        this.renderBlocks();

        // 3. Garage & Vehicle Display
        this.renderGarage(w, h);

        // 4. Furniture Sprites
        this.renderFurniture();

        // 5. Interactive Living Avatar
        this.updateAndRenderAvatar();

        // 6. Particles (Chimney smoke, build sparkles)
        this.renderParticles();

        // 7. Build Mode Grid & Ghost Preview
        if (this.isBuildMode) {
            this.renderBuildGrid(w, h);
            this.renderGhostPreview();
        }
    }

    renderSky(w, h) {
        const grad = this.ctx.createLinearGradient(0, 0, 0, h * 0.7);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#312e81');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, w, h);

        // Stars / Moon
        this.ctx.fillStyle = '#fef08a';
        this.ctx.beginPath();
        this.ctx.arc(w - 60, 40, 14, 0, Math.PI * 2);
        this.ctx.fill();

        // Clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(50 + (this.dayTimePhase * 2) % (w + 100) - 100, 30, 80, 16);
        this.ctx.fillRect(240 + (this.dayTimePhase * 1.5) % (w + 100) - 100, 50, 110, 20);
    }

    renderLandscape(w, h) {
        const groundY = 12 * this.cellSize;

        // Distant Mountains
        this.ctx.fillStyle = '#1e1b4b';
        this.ctx.beginPath();
        this.ctx.moveTo(0, groundY);
        this.ctx.lineTo(120, groundY - 80);
        this.ctx.lineTo(260, groundY);
        this.ctx.lineTo(440, groundY - 110);
        this.ctx.lineTo(600, groundY);
        this.ctx.lineTo(760, groundY - 90);
        this.ctx.lineTo(w, groundY);
        this.ctx.fill();

        // Green Grass & Earth
        this.ctx.fillStyle = '#166534';
        this.ctx.fillRect(0, groundY, w, h - groundY);

        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillRect(0, groundY, w, 4);

        // Outdoor Trees & Garden Left Zone
        this.renderPixelTree(40, groundY - 60);
        this.renderPixelTree(90, groundY - 70);
    }

    renderPixelTree(x, y) {
        // Trunk
        this.ctx.fillStyle = '#78350f';
        this.ctx.fillRect(x + 12, y + 30, 8, 30);
        // Foliage
        this.ctx.fillStyle = '#15803d';
        this.ctx.fillRect(x, y + 10, 32, 24);
        this.ctx.fillStyle = '#16a34a';
        this.ctx.fillRect(x + 4, y, 24, 20);
    }

    renderBlocks() {
        for (const [key, block] of Object.entries(this.gridBlocks)) {
            const [c, r] = key.split(',').map(Number);
            const x = c * this.cellSize;
            const y = r * this.cellSize;

            this.ctx.save();
            if (block.cat === 'foundations') {
                this.ctx.fillStyle = block.color || '#64748b';
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                this.ctx.strokeStyle = '#334155';
                this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
            } else if (block.cat === 'floors') {
                this.ctx.fillStyle = block.color || '#b45309';
                this.ctx.fillRect(x, y + this.cellSize - 6, this.cellSize, 6);
                this.ctx.strokeStyle = '#78350f';
                this.ctx.strokeRect(x, y + this.cellSize - 6, this.cellSize, 6);
            } else if (block.cat === 'walls') {
                this.ctx.fillStyle = block.color || '#a05a2c';
                this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
                this.ctx.strokeStyle = '#1e293b';
                this.ctx.strokeRect(x, y, this.cellSize, this.cellSize);
            } else if (block.cat === 'roofs') {
                this.ctx.fillStyle = block.color || '#78350f';
                this.ctx.fillRect(x, y + 12, this.cellSize, 12);
                this.ctx.fillStyle = '#9a3412';
                this.ctx.fillRect(x, y + 8, this.cellSize, 4);
            } else if (block.cat === 'windows_doors') {
                if (block.id.includes('win')) {
                    this.ctx.fillStyle = '#fef08a'; // Warm glowing window
                    this.ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
                    this.ctx.strokeStyle = '#854d0e';
                    this.ctx.strokeRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
                } else {
                    this.ctx.fillStyle = '#854d0e';
                    this.ctx.fillRect(x + 2, y, this.cellSize - 4, this.cellSize * 2);
                }
            }
            this.ctx.restore();
        }
    }

    renderGarage(w, h) {
        // Garage Zone (Columns 25 to 33)
        const gx = 25 * this.cellSize;
        const gy = 8 * this.cellSize;
        const gw = 8 * this.cellSize;
        const gh = 4 * this.cellSize;

        // Garage Roof & Sign
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(gx, gy, gw, 6);

        this.ctx.fillStyle = '#38bdf8';
        this.ctx.font = '7px "Press Start 2P", monospace';
        this.ctx.fillText('GARAGE', gx + 15, gy - 4);

        // Parked Vehicle (Reads current unlocked/equipped transportation)
        const transport = (typeof hero !== 'undefined' && hero.transportation) ? hero.transportation : 'Walk';
        const vx = gx + 30;
        const vy = 11 * this.cellSize + 4;

        this.renderGarageVehicle(transport, vx, vy);
    }

    renderGarageVehicle(transport, x, y) {
        this.ctx.save();
        if (transport === 'Bicycle') {
            // Wheels
            this.ctx.strokeStyle = '#94a3b8';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y + 8, 7, 0, Math.PI * 2);
            this.ctx.arc(x + 24, y + 8, 7, 0, Math.PI * 2);
            this.ctx.stroke();
            // Frame
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + 8);
            this.ctx.lineTo(x + 12, y + 2);
            this.ctx.lineTo(x + 24, y + 8);
            this.ctx.lineTo(x + 12, y + 8);
            this.ctx.closePath();
            this.ctx.stroke();
        } else if (transport === 'Motorcycle' || transport === 'Scooter') {
            this.ctx.fillStyle = '#eab308';
            this.ctx.fillRect(x, y + 2, 28, 10);
            this.ctx.fillStyle = '#1e293b';
            this.ctx.beginPath();
            this.ctx.arc(x + 4, y + 12, 6, 0, Math.PI * 2);
            this.ctx.arc(x + 24, y + 12, 6, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (transport.includes('Car')) {
            this.ctx.fillStyle = '#3b82f6';
            this.ctx.fillRect(x - 10, y + 2, 44, 12);
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.fillRect(x, y - 4, 24, 8);
            this.ctx.fillStyle = '#0f172a';
            this.ctx.beginPath();
            this.ctx.arc(x - 2, y + 14, 6, 0, Math.PI * 2);
            this.ctx.arc(x + 26, y + 14, 6, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Skateboard or starter kickstand
            this.ctx.fillStyle = '#10b981';
            this.ctx.fillRect(x + 2, y + 10, 20, 3);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(x + 4, y + 13, 3, 3);
            this.ctx.fillRect(x + 17, y + 13, 3, 3);
        }
        this.ctx.restore();
    }

    renderFurniture() {
        this.furnitureItems.forEach(f => {
            const x = f.col * this.cellSize;
            const y = f.row * this.cellSize;
            const w = f.w * this.cellSize;
            const h = f.h * this.cellSize;

            this.ctx.save();

            if (f.catId.includes('bed')) {
                // Bed Frame & Blanket
                this.ctx.fillStyle = '#991b1b';
                this.ctx.fillRect(x, y + h - 14, w, 14);
                this.ctx.fillStyle = '#f8fafc'; // Pillow
                this.ctx.fillRect(x + 4, y + h - 18, 12, 6);
            } else if (f.catId.includes('desk')) {
                // Study Desk
                this.ctx.fillStyle = '#78350f';
                this.ctx.fillRect(x, y + h - 12, w, 4);
                this.ctx.fillRect(x + 2, y + h - 8, 4, 8);
                this.ctx.fillRect(x + w - 6, y + h - 8, 4, 8);
                // Laptop Glow
                this.ctx.fillStyle = '#38bdf8';
                this.ctx.fillRect(x + 8, y + h - 20, 10, 8);
            } else if (f.catId.includes('bookshelf')) {
                // Bookshelf
                this.ctx.fillStyle = '#451a03';
                this.ctx.fillRect(x, y, w, h);
                this.ctx.fillStyle = '#3b82f6';
                this.ctx.fillRect(x + 4, y + 6, 8, 12);
                this.ctx.fillStyle = '#ef4444';
                this.ctx.fillRect(x + 14, y + 6, 6, 12);
                this.ctx.fillStyle = '#eab308';
                this.ctx.fillRect(x + 6, y + 24, 12, 14);
            } else if (f.catId.includes('gaming')) {
                // RGB Gaming PC
                this.ctx.fillStyle = '#0f172a';
                this.ctx.fillRect(x, y + h - 14, w, 14);
                // RGB Rainbow cycling glow
                const hue = (this.dayTimePhase * 50) % 360;
                this.ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
                this.ctx.fillRect(x + 4, y + h - 26, 18, 12);
            } else if (f.catId.includes('dumbbell') || f.catId.includes('gym')) {
                // Gym Equipment
                this.ctx.fillStyle = '#334155';
                this.ctx.fillRect(x, y + h - 8, w, 8);
                this.ctx.fillStyle = '#0f172a';
                this.ctx.beginPath();
                this.ctx.arc(x + 6, y + h - 6, 5, 0, Math.PI * 2);
                this.ctx.arc(x + w - 6, y + h - 6, 5, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Generic Icon Tile
                this.ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
                this.ctx.fillRect(x, y, w, h);
                this.ctx.font = '16px serif';
                this.ctx.fillText(f.icon || '📦', x + 4, y + h - 6);
            }

            this.ctx.restore();
        });
    }

    updateAndRenderAvatar() {
        // Move avatar toward targetCol
        if (this.avatar.col < this.avatar.targetCol) {
            this.avatar.col += 0.05;
        } else if (this.avatar.col > this.avatar.targetCol) {
            this.avatar.col -= 0.05;
        } else {
            // Activity Timer cycle
            this.avatar.activityTimer--;
            if (this.avatar.activityTimer <= 0) {
                // Pick new living activity in home
                const activities = ['sleep', 'study', 'workout', 'garage', 'idle'];
                this.avatar.activity = activities[Math.floor(Math.random() * activities.length)];
                this.avatar.activityTimer = 240;

                if (this.avatar.activity === 'sleep') this.avatar.targetCol = 8;
                else if (this.avatar.activity === 'study') this.avatar.targetCol = 16;
                else if (this.avatar.activity === 'workout') this.avatar.targetCol = 20;
                else if (this.avatar.activity === 'garage') this.avatar.targetCol = 27;
                else this.avatar.targetCol = 10 + Math.floor(Math.random() * 8);
            }
        }

        const ax = this.avatar.col * this.cellSize;
        const ay = 11 * this.cellSize - 6;

        this.ctx.save();
        
        if (this.avatar.activity === 'sleep' && Math.abs(this.avatar.col - this.avatar.targetCol) < 0.2) {
            // Sleeping in Bed (Zzz bubbles)
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.font = '8px "Press Start 2P", monospace';
            const zStep = Math.floor(this.dayTimePhase * 2) % 3;
            this.ctx.fillText(zStep === 0 ? 'z' : zStep === 1 ? 'zz' : 'zzz', ax + 14, ay - 8);
        } else {
            // Standing / Walking avatar (Retro 16-bit body)
            this.renderAvatarMini(ax, ay);

            // Activity Bubble
            if (this.avatar.activity === 'study') {
                this.ctx.fillText('💡', ax + 4, ay - 6);
            } else if (this.avatar.activity === 'workout') {
                this.ctx.fillText('💪', ax + 4, ay - 6);
            }
        }

        this.ctx.restore();
    }

    renderAvatarMini(x, y) {
        const skin = (typeof hero !== 'undefined' && hero.skin_color) ? hero.skin_color : '#f5c29a';
        const hair = (typeof hero !== 'undefined' && hero.hair_color) ? hero.hair_color : '#2c1a0e';
        const top = (typeof hero !== 'undefined' && hero.top_color) ? hero.top_color : '#2563eb';
        const bot = (typeof hero !== 'undefined' && hero.bottom_color) ? hero.bottom_color : '#1e293b';

        // Head
        this.ctx.fillStyle = skin;
        this.ctx.fillRect(x + 4, y - 10, 10, 8);
        // Hair
        this.ctx.fillStyle = hair;
        this.ctx.fillRect(x + 3, y - 14, 12, 5);
        // Eyes
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(x + 10, y - 8, 2, 2);
        // Body Top
        this.ctx.fillStyle = top;
        this.ctx.fillRect(x + 3, y - 2, 12, 10);
        // Legs Bottom
        this.ctx.fillStyle = bot;
        this.ctx.fillRect(x + 4, y + 8, 4, 8);
        this.ctx.fillRect(x + 10, y + 8, 4, 8);
    }

    spawnBuildParticle(col, row, color = '#38bdf8') {
        const x = col * this.cellSize + this.cellSize / 2;
        const y = row * this.cellSize + this.cellSize / 2;
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                life: 25,
                color
            });
        }
    }

    renderParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x, p.y, 3, 3);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    renderBuildGrid(w, h) {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        this.ctx.lineWidth = 1;

        for (let c = 0; c <= this.gridCols; c++) {
            this.ctx.beginPath();
            this.ctx.moveTo(c * this.cellSize, 0);
            this.ctx.lineTo(c * this.cellSize, h);
            this.ctx.stroke();
        }
        for (let r = 0; r <= this.gridRows; r++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, r * this.cellSize);
            this.ctx.lineTo(w, r * this.cellSize);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    renderGhostPreview() {
        if (this.hoverCol < 0 || this.hoverRow < 0 || !this.selectedCatalogItem) return;

        const x = this.hoverCol * this.cellSize;
        const y = this.hoverRow * this.cellSize;
        const item = this.selectedCatalogItem;
        const w = (item.w || 1) * this.cellSize;
        const h = (item.h || 1) * this.cellSize;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(34, 197, 94, 0.35)'; // Green valid highlight
        this.ctx.strokeStyle = '#22c55e';
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(x, y, w, h);
        this.ctx.strokeRect(x, y, w, h);

        this.ctx.font = '14px serif';
        this.ctx.fillText(item.icon || '🧱', x + 2, y + h - 4);
        this.ctx.restore();
    }

    updateHomeHUD() {
        setText('home-hud-level', `LVL ${this.homeLevel}`);
        setText('home-hud-title', this.getHomeTitle());
        setText('home-hud-coins', `${(hero.gold || 1000).toLocaleString()} Coins`);
        setText('home-hud-cxp', `${this.constructionXp.toLocaleString()} Build XP`);
        setText('home-xp-val', `${this.homeXp} / 100 XP`);

        const bar = document.getElementById('home-xp-fill-bar');
        if (bar) bar.style.width = `${Math.min(100, this.homeXp)}%`;
    }
}

// Global Singleton Instance
window.homeEngine = new HomeBuildingEngine();

// UI Integration Handlers
function openHomeShopModal() {
    playSound('click');
    document.getElementById('home-shop-modal')?.classList.remove('hidden');
    renderHomeShopCatalog();
}

function closeHomeShopModal() {
    playSound('click');
    document.getElementById('home-shop-modal')?.classList.add('hidden');
}

function renderHomeShopCatalog() {
    const grid = document.getElementById('home-shop-items-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const allItems = [
        ...HOME_CATALOG.walls,
        ...HOME_CATALOG.floors,
        ...HOME_CATALOG.roofs,
        ...HOME_CATALOG.furniture
    ];

    allItems.forEach(item => {
        const isLocked = window.homeEngine.homeLevel < (item.reqLevel || 1);
        const card = document.createElement('div');
        card.className = `home-shop-card ${isLocked ? 'locked' : ''}`;
        card.innerHTML = `
            <div class="hsc-icon">${item.icon || '🧱'}</div>
            <h4 class="hsc-title">${item.name}</h4>
            <div class="hsc-meta">
                <span class="hsc-price">🪙 ${item.coins} G</span>
                <span class="hsc-cxp">⭐ ${item.cxp} XP</span>
            </div>
            ${isLocked 
                ? `<div class="hsc-lock-tag">🔒 HOME LVL ${item.reqLevel}</div>`
                : `<button type="button" class="pixel-btn btn-sm btn-cyan" onclick="buyAndSelectHomeItem('${item.id}')">SELECT & BUILD</button>`}
        `;
        grid.appendChild(card);
    });
}

function buyAndSelectHomeItem(itemId) {
    const allItems = [
        ...HOME_CATALOG.foundations,
        ...HOME_CATALOG.walls,
        ...HOME_CATALOG.floors,
        ...HOME_CATALOG.roofs,
        ...HOME_CATALOG.windows_doors,
        ...HOME_CATALOG.furniture
    ];
    const found = allItems.find(i => i.id === itemId);
    if (found) {
        window.homeEngine.selectCatalogItem(found);
        if (!window.homeEngine.isBuildMode) {
            window.homeEngine.toggleBuildMode();
        }
        closeHomeShopModal();
    }
}

// Global Category Filter State
let currentBuildCategory = 'walls';

function switchBuildCategory(cat) {
    playSound('click');
    currentBuildCategory = cat;
    document.querySelectorAll('.b-cat-tab').forEach(t => t.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    renderBuildQuickPalette();
}

function renderBuildQuickPalette() {
    const list = document.getElementById('build-quick-items-list');
    if (!list) return;
    list.innerHTML = '';

    let items = [];
    if (currentBuildCategory === 'walls') items = HOME_CATALOG.walls;
    else if (currentBuildCategory === 'floors') items = HOME_CATALOG.floors;
    else if (currentBuildCategory === 'roofs') items = HOME_CATALOG.roofs;
    else if (currentBuildCategory === 'doors_windows') items = HOME_CATALOG.windows_doors;
    else if (currentBuildCategory === 'furniture') items = HOME_CATALOG.furniture.filter(f => f.category === 'Bedroom' || f.category === 'Kitchen' || f.category === 'Gaming' || f.category === 'Garden');
    else if (currentBuildCategory === 'gym_study') items = HOME_CATALOG.furniture.filter(f => f.category === 'Study' || f.category === 'Gym' || f.category === 'Special');
    else {
        items = [
            ...HOME_CATALOG.walls,
            ...HOME_CATALOG.floors,
            ...HOME_CATALOG.roofs,
            ...HOME_CATALOG.windows_doors,
            ...HOME_CATALOG.furniture
        ];
    }

    items.forEach(item => {
        const isSelected = window.homeEngine?.selectedCatalogItem?.id === item.id;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `build-palette-btn ${isSelected ? 'active' : ''}`;
        btn.id = `cat-item-${item.id}`;
        btn.innerHTML = `
            <span class="bpb-icon">${item.icon || '🧱'}</span>
            <div class="bpb-info">
                <span class="bpb-name">${item.name}</span>
                <span class="bpb-cost">🪙 ${item.coins} G</span>
            </div>
        `;
        btn.onclick = () => {
            window.homeEngine?.selectCatalogItem(item);
            renderBuildQuickPalette();
        };
        list.appendChild(btn);
    });
}

function openRoomBlueprintsModal() {
    playSound('click');
    document.getElementById('room-blueprints-modal')?.classList.remove('hidden');
    renderRoomBlueprints();
}

function closeRoomBlueprintsModal() {
    playSound('click');
    document.getElementById('room-blueprints-modal')?.classList.add('hidden');
}

function renderRoomBlueprints() {
    const grid = document.getElementById('blueprints-cards-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const currentLvl = window.homeEngine?.homeLevel || 1;

    ROOM_BLUEPRINTS.forEach(bp => {
        const isUnlocked = currentLvl >= bp.reqLevel;
        const card = document.createElement('div');
        card.className = `blueprint-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <div class="bpc-header">
                <span class="bpc-icon">${bp.icon}</span>
                <div class="bpc-titles">
                    <h4 class="bpc-name">${bp.name}</h4>
                    <span class="bpc-perk">${bp.perk}</span>
                </div>
            </div>
            <div class="bpc-reqs">
                <span class="bpc-tag ${isUnlocked ? 'ok' : 'locked'}">REQ LVL ${bp.reqLevel}</span>
                ${bp.coins ? `<span class="bpc-cost">🪙 ${bp.coins} G</span>` : '<span class="bpc-cost free">FREE</span>'}
                ${bp.cxp ? `<span class="bpc-cxp">⭐ ${bp.cxp} CXP</span>` : ''}
            </div>
            <div class="bpc-action">
                ${isUnlocked 
                    ? `<button type="button" class="pixel-btn btn-sm btn-green" onclick="unlockRoomBlueprint('${bp.id}', '${bp.name.replace(/'/g, "\\'")}', ${bp.coins}, ${bp.cxp}, ${bp.reqLevel})">CONSTRUCT WING</button>`
                    : `<span class="bpc-locked-label">🔒 Requires Base Level ${bp.reqLevel}</span>`}
            </div>
        `;
        grid.appendChild(card);
    });
}

async function unlockRoomBlueprint(roomId, roomName, coins, cxp, reqLevel) {
    playSound('click');
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/home/unlock-room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: roomId,
                    room_name: roomName,
                    coin_cost: coins || 0,
                    construction_xp_cost: cxp || 0,
                    required_level: reqLevel || 1
                })
            });
            if (res.ok) {
                const data = await res.json();
                hero.gold = data.new_gold;
                if (window.homeEngine) {
                    window.homeEngine.constructionXp = data.new_construction_xp;
                    window.homeEngine.updateHomeHUD();
                }
                playSound('victory');
                alert(`🏰 ${data.message}`);
                closeRoomBlueprintsModal();
                updateAdvDashboardUI();
            } else {
                const err = await res.json();
                playSound('error');
                alert(`❌ ${err.detail || 'Could not unlock room.'}`);
            }
        } catch (e) {}
    } else {
        playSound('victory');
        alert(`🏰 Constructed Room Wing: ${roomName}!`);
        closeRoomBlueprintsModal();
    }
}

