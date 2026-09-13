/**
 * LifeRPG — Master Interactive Game World Engine (2D/2.5D Voxel & Pixel Environment)
 * 
 * Implements:
 * - Persistent 100vh Full-Screen Game World & Camera Tracking
 * - Interactive Physical Buildings (Base, Library, Gym, Workshop, Garage, Shop, Trophies, Recovery)
 * - Hero Movement (Keyboard WASD, Click-to-Move, Touch Joystick) + Vehicles (Bike, Skateboard, Car, Jet)
 * - Contextual Action Prompts on Proximity
 * - Day/Night Cycle + Weather (Sun, Rain, Snow, Clouds) + Minimap Radar
 * - In-World Flying Quest Rewards & Particle Effects
 */

class LifeRPGWorldEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.minimapCanvas = null;
        this.minimapCtx = null;
        
        // World Map Boundaries
        this.worldWidth = 3200;
        this.worldHeight = 2200;
        
        // Camera State
        this.cameraX = 500;
        this.cameraY = 500;
        this.zoom = 1.0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        
        // Player Entity in World
        this.player = {
            x: 600,
            y: 700,
            targetX: null,
            targetY: null,
            speed: 4.5,
            direction: 'down', // down, up, left, right
            isMoving: false,
            animTimer: 0,
            walkFrame: 0,
            currentVehicle: 'walk', // walk, bicycle, skateboard, scooter, motorcycle, car, jet
            isCelebrating: false,
            celebrationTimer: 0,
            isSwimming: false,
            wasInWater: false
        };
        
        // Controls Input State
        this.keys = {
            w: false, a: false, s: false, d: false,
            ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
            Space: false
        };
        
        // Environment State
        this.timeOfDay = 'day'; // day, sunset, night
        this.weather = 'clear'; // clear, rain, snow, cloudy
        this.timeTick = 0;
        this.clouds = [];
        this.rainDrops = [];
        this.snowFlakes = [];
        this.floatingParticles = [];
        this.rewardGems = [];
        
        this.nearbyEntity = null;
        this.currentPromptEntityId = null;
        this.onContextActionTrigger = null;
        
        // Animation Loop
        this.loopId = null;
        this.lastFrameTime = performance.now();
        
        // Landmarks & Physical Buildings in World
        this.buildings = [
            {
                id: 'home_base',
                name: 'Your Base',
                sub: 'Personal Life Sanctuary',
                icon: '🏠',
                x: 520,
                y: 520,
                w: 220,
                h: 170,
                doorX: 630,
                doorY: 690,
                color: '#1e293b',
                roofColor: '#b45309',
                actionLabel: 'ENTER BASE',
                actionTab: 'home',
                unlocked: true
            },
            {
                id: 'scholar_library',
                name: 'Scholar Academy',
                sub: 'Study & Learning Quests',
                icon: '📚',
                x: 1250,
                y: 440,
                w: 260,
                h: 190,
                doorX: 1380,
                doorY: 630,
                color: '#1e1b4b',
                roofColor: '#4338ca',
                actionLabel: 'STUDY QUESTS',
                actionTab: 'quests',
                unlocked: true
            },
            {
                id: 'iron_gym',
                name: 'Iron Power Gym',
                sub: 'Fitness & Physical Growth',
                icon: '🏋️',
                x: 1950,
                y: 540,
                w: 250,
                h: 180,
                doorX: 2075,
                doorY: 720,
                color: '#450a0a',
                roofColor: '#dc2626',
                actionLabel: 'FITNESS QUESTS',
                actionTab: 'quests',
                unlocked: true
            },
            {
                id: 'focus_workshop',
                name: 'Tech Workshop',
                sub: 'Deep Work & Focus Timer',
                icon: '🛠️',
                x: 750,
                y: 1250,
                w: 240,
                h: 170,
                doorX: 870,
                doorY: 1420,
                color: '#0f172a',
                roofColor: '#0284c7',
                actionLabel: 'START FOCUS SPRINT',
                actionTab: 'quests',
                unlocked: true
            },
            {
                id: 'garage_depot',
                name: 'Vehicle Depot',
                sub: 'Mount & Upgrade Rides',
                icon: '🚲',
                x: 420,
                y: 920,
                w: 190,
                h: 150,
                doorX: 515,
                doorY: 1070,
                color: '#1c1917',
                roofColor: '#ea580c',
                actionLabel: 'RIDE VEHICLE',
                actionTab: 'shop',
                unlocked: true
            },
            {
                id: 'voxel_marketplace',
                name: 'Voxel Marketplace',
                sub: 'Gear & Cosmetics Shop',
                icon: '🎒',
                x: 1400,
                y: 1100,
                w: 260,
                h: 180,
                doorX: 1530,
                doorY: 1280,
                color: '#14532d',
                roofColor: '#16a34a',
                actionLabel: 'BROWSE SHOP',
                actionTab: 'shop',
                unlocked: true
            },
            {
                id: 'trophy_citadel',
                name: 'Hall of Trophies',
                sub: 'Achievements & Milestones',
                icon: '🏆',
                x: 2150,
                y: 1250,
                w: 280,
                h: 210,
                doorX: 2290,
                doorY: 1460,
                color: '#422006',
                roofColor: '#ca8a04',
                actionLabel: 'VIEW TROPHIES',
                actionTab: 'achievements',
                unlocked: true
            },
            {
                id: 'recovery_shrine',
                name: 'Zen Monastery',
                sub: 'Zero-Shame Recovery Deck',
                icon: '⛩️',
                x: 2450,
                y: 460,
                w: 220,
                h: 160,
                doorX: 2560,
                doorY: 620,
                color: '#064e3b',
                roofColor: '#10b981',
                actionLabel: 'RECOVERY MODE',
                actionTab: 'coach',
                unlocked: true
            },
            {
                id: 'goal_citadel',
                name: 'Campaign Obelisk',
                sub: 'Long-term Goal Roadmaps',
                icon: '🎯',
                x: 1450,
                y: 1680,
                w: 240,
                h: 190,
                doorX: 1570,
                doorY: 1870,
                color: '#312e81',
                roofColor: '#6366f1',
                actionLabel: 'VIEW GOALS',
                actionTab: 'campaigns',
                unlocked: true
            }
        ];
        
        // Active Quest Beacons
        this.questMarkers = [
            { id: 'qm_study', icon: '⭐', name: 'Deep Study Quest', buildingId: 'scholar_library', x: 1380, y: 400, color: '#38bdf8' },
            { id: 'qm_fit', icon: '🔥', name: 'Workout Habit', buildingId: 'iron_gym', x: 2075, y: 500, color: '#f87171' },
            { id: 'qm_focus', icon: '⚡', name: 'Sprint Milestone', buildingId: 'focus_workshop', x: 870, y: 1210, color: '#facc15' },
            { id: 'qm_goal', icon: '👑', name: 'Campaign Boss', buildingId: 'goal_citadel', x: 1570, y: 1640, color: '#c084fc' }
        ];
        
        // NPCs
        this.npcs = [
            { id: 'npc_guide', name: 'Master Chrono', role: 'Grand Guide', x: 780, y: 680, icon: '🧙‍♂️', speech: 'Welcome to LifeRPG! Every quest you finish in reality evolves this world!' },
            { id: 'npc_trainer', name: 'Coach Titan', role: 'Fitness Master', x: 1880, y: 740, icon: '🥋', speech: 'Discipline is your highest weapon. Hit the gym!' },
            { id: 'npc_scholar', name: 'Sage Minerva', role: 'Archivist', x: 1180, y: 650, icon: '👩‍🏫', speech: 'Deep knowledge unlocks rare legendary rewards!' }
        ];
        
        this.initWeather();
    }
    
    init(canvasId, minimapCanvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        if (minimapCanvasId) {
            this.minimapCanvas = document.getElementById(minimapCanvasId);
            if (this.minimapCanvas) {
                this.minimapCtx = this.minimapCanvas.getContext('2d');
            }
        }
        
        this.setupEventListeners();
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Set initial camera directly onto player
        this.cameraX = this.player.x - (this.canvas.width / 2);
        this.cameraY = this.player.y - (this.canvas.height / 2);
        
        this.startLoop();
    }
    
    initWeather() {
        this.clouds = [];
        for (let i = 0; i < 18; i++) {
            this.clouds.push({
                x: Math.random() * this.worldWidth,
                y: Math.random() * (this.worldHeight * 0.45),
                size: 60 + Math.random() * 90,
                speed: 0.2 + Math.random() * 0.4
            });
        }
        
        this.rainDrops = [];
        for (let i = 0; i < 90; i++) {
            this.rainDrops.push({
                x: Math.random() * this.worldWidth,
                y: Math.random() * this.worldHeight,
                len: 12 + Math.random() * 8,
                speed: 9 + Math.random() * 5
            });
        }
        
        this.snowFlakes = [];
        for (let i = 0; i < 70; i++) {
            this.snowFlakes.push({
                x: Math.random() * this.worldWidth,
                y: Math.random() * this.worldHeight,
                size: 2 + Math.random() * 3,
                speed: 1.2 + Math.random() * 1.5,
                drift: Math.random() * 2 - 1
            });
        }
    }
    
    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width || window.innerWidth;
        this.canvas.height = rect.height || (window.innerHeight - 70);
    }
    
    setupEventListeners() {
        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
                this.keys[e.key.toLowerCase()] = true;
            }
            if (['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.key)) {
                this.keys[e.key] = true;
                e.preventDefault();
            }
            if (e.code === 'Space' || e.key === 'e' || e.key === 'E') {
                this.triggerContextAction();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
                this.keys[e.key.toLowerCase()] = false;
            }
            if (['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(e.key)) {
                this.keys[e.key] = false;
            }
        });
        
        // Mouse / Pointer Click to Move & Drag Camera
        this.canvas.addEventListener('mousedown', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickScreenX = e.clientX - rect.left;
            const clickScreenY = e.clientY - rect.top;
            
            // Convert to World Coordinates
            const worldClickX = clickScreenX + this.cameraX;
            const worldClickY = clickScreenY + this.cameraY;
            
            // Check if clicked on a building or NPC
            const clickedBuilding = this.buildings.find(b => 
                worldClickX >= b.x && worldClickX <= b.x + b.w &&
                worldClickY >= b.y && worldClickY <= b.y + b.h
            );
            
            if (clickedBuilding) {
                // Walk player to the building's door
                this.player.targetX = clickedBuilding.doorX;
                this.player.targetY = clickedBuilding.doorY + 20;
                return;
            }
            
            const clickedNpc = this.npcs.find(npc => 
                Math.hypot(worldClickX - npc.x, worldClickY - npc.y) < 40
            );
            
            if (clickedNpc) {
                this.player.targetX = clickedNpc.x;
                this.player.targetY = clickedNpc.y + 35;
                if (window.showToast) window.showToast(`${clickedNpc.name}: "${clickedNpc.speech}"`, 'info');
                return;
            }
            
            // Standard Walk-to destination
            this.player.targetX = Math.max(50, Math.min(this.worldWidth - 50, worldClickX));
            this.player.targetY = Math.max(50, Math.min(this.worldHeight - 50, worldClickY));
            
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
        });
        
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        // Minimap Click Navigation
        if (this.minimapCanvas) {
            this.minimapCanvas.addEventListener('click', (e) => {
                const rect = this.minimapCanvas.getBoundingClientRect();
                const mX = (e.clientX - rect.left) / rect.width;
                const mY = (e.clientY - rect.top) / rect.height;
                this.player.targetX = mX * this.worldWidth;
                this.player.targetY = mY * this.worldHeight;
            });
        }
    }
    
    setVehicle(vehicleName) {
        this.player.currentVehicle = (vehicleName || 'walk').toLowerCase();
        const speeds = {
            'walk': 4.5,
            'bicycle': 7.5,
            'skateboard': 7.0,
            'scooter': 8.0,
            'motorcycle': 10.5,
            'cyber cruiser car': 12.0,
            'car': 12.0,
            'futuristic jet': 15.0
        };
        this.player.speed = speeds[this.player.currentVehicle] || 4.5;
    }
    
    setTimeOfDay(time) {
        this.timeOfDay = time;
    }
    
    setWeather(w) {
        this.weather = w;
    }
    
    celebrateReward(xp = 50, gold = 20, statName = 'INT') {
        this.player.isCelebrating = true;
        this.player.celebrationTimer = 90;
        
        // Spawn Floating Reward Gem in World
        this.rewardGems.push({
            x: this.player.x,
            y: this.player.y - 40,
            xp: xp,
            gold: gold,
            stat: statName,
            timer: 120,
            alpha: 1.0,
            vy: -1.8
        });
        
        // Spawn Sparkle Burst
        for (let i = 0; i < 20; i++) {
            this.floatingParticles.push({
                x: this.player.x + (Math.random() * 40 - 20),
                y: this.player.y - 30 + (Math.random() * 40 - 20),
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4 - 2,
                color: ['#facc15', '#38bdf8', '#4ade80', '#c084fc'][Math.floor(Math.random() * 4)],
                size: 3 + Math.random() * 3,
                life: 45
            });
        }
    }
    
    startLoop() {
        if (this.loopId) cancelAnimationFrame(this.loopId);
        
        const loop = (timestamp) => {
            const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
            this.lastFrameTime = timestamp;
            this.timeTick++;
            
            this.update(dt);
            this.render();
            
            this.loopId = requestAnimationFrame(loop);
        };
        this.loopId = requestAnimationFrame(loop);
    }
    
    getRiverBounds(x) {
        const t = Math.max(0, Math.min(1, x / this.worldWidth));
        const omt = 1 - t;
        // Cubic bezier matching renderTerrain river:
        // P0=(0, 800), P1=(900, 850), P2=(1500, 750), P3=(3200, 900)
        const yTop = (omt * omt * omt * 800) +
                     (3 * omt * omt * t * 850) +
                     (3 * omt * t * t * 750) +
                     (t * t * t * 900);
        const yBottom = yTop + 120;
        return { yTop, yBottom };
    }

    isPointInWater(x, y) {
        // Wooden Bridges across river allow normal dry walking:
        // Bridge 1: 580 to 690, Bridge 2: 1330 to 1440, Bridge 3: 2030 to 2140
        if ((x >= 575 && x <= 695) || 
            (x >= 1325 && x <= 1445) || 
            (x >= 2025 && x <= 2145)) {
            return false;
        }
        const { yTop, yBottom } = this.getRiverBounds(x);
        return (y >= yTop + 2 && y <= yBottom - 2);
    }

    canMoveTo(x, y) {
        // Prevent walking through solid building walls while keeping front door accessible
        for (const b of this.buildings) {
            const pad = 6;
            const bLeft = b.x + pad;
            const bRight = b.x + b.w - pad;
            const bTop = b.y + 35;
            const bBottom = b.y + b.h - 10;
            
            if (x >= bLeft && x <= bRight && y >= bTop && y <= bBottom) {
                const distToDoor = Math.hypot(x - b.doorX, y - b.doorY);
                if (distToDoor > 32) {
                    return false;
                }
            }
        }
        return true;
    }

    spawnWaterSplash(x, y, count = 3) {
        for (let i = 0; i < count; i++) {
            this.floatingParticles.push({
                x: x + (Math.random() * 20 - 10),
                y: y + 4 + (Math.random() * 8 - 4),
                vx: (Math.random() - 0.5) * 2.5,
                vy: (Math.random() - 0.5) * 2 - 0.5,
                color: ['#bae6fd', '#7dd3fc', '#38bdf8', '#ffffff'][Math.floor(Math.random() * 4)],
                size: 2 + Math.random() * 2,
                life: 14 + Math.floor(Math.random() * 8)
            });
        }
    }

    update(dt) {
        let dx = 0;
        let dy = 0;
        
        // Keyboard Movement
        if (this.keys.w || this.keys.ArrowUp) { dy -= 1; this.player.direction = 'up'; this.player.targetX = null; }
        if (this.keys.s || this.keys.ArrowDown) { dy += 1; this.player.direction = 'down'; this.player.targetX = null; }
        if (this.keys.a || this.keys.ArrowLeft) { dx -= 1; this.player.direction = 'left'; this.player.targetX = null; }
        if (this.keys.d || this.keys.ArrowRight) { dx += 1; this.player.direction = 'right'; this.player.targetX = null; }
        
        if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
        }
        
        // Click-to-move Target Pathing
        if (this.player.targetX !== null && this.player.targetY !== null) {
            const tdx = this.player.targetX - this.player.x;
            const tdy = this.player.targetY - this.player.y;
            const dist = Math.hypot(tdx, tdy);
            
            if (dist > 6) {
                dx = (tdx / dist);
                dy = (tdy / dist);
                
                if (Math.abs(tdx) > Math.abs(tdy)) {
                    this.player.direction = tdx > 0 ? 'right' : 'left';
                } else {
                    this.player.direction = tdy > 0 ? 'down' : 'up';
                }
            } else {
                this.player.x = this.player.targetX;
                this.player.y = this.player.targetY;
                this.player.targetX = null;
                this.player.targetY = null;
            }
        }
        
        // Water & Swimming State Detection
        const inWater = this.isPointInWater(this.player.x, this.player.y);
        if (!this.player.wasInWater && inWater) {
            this.spawnWaterSplash(this.player.x, this.player.y, 8);
        } else if (this.player.wasInWater && !inWater) {
            this.spawnWaterSplash(this.player.x, this.player.y, 5);
        }
        this.player.wasInWater = inWater;
        this.player.isSwimming = inWater;

        this.player.isMoving = (dx !== 0 || dy !== 0);
        
        if (this.player.isMoving) {
            let moveSpeed = this.player.speed;
            if (inWater && this.player.currentVehicle !== 'futuristic jet') {
                moveSpeed = 2.8; // Swimming pace with water resistance
                if (this.player.animTimer % 8 === 0) {
                    this.spawnWaterSplash(this.player.x, this.player.y, 2);
                }
            }

            const nextX = this.player.x + dx * moveSpeed;
            const nextY = this.player.y + dy * moveSpeed;

            // Slide along building walls if colliding
            if (this.canMoveTo(nextX, this.player.y)) {
                this.player.x = nextX;
            }
            if (this.canMoveTo(this.player.x, nextY)) {
                this.player.y = nextY;
            }

            this.player.animTimer++;
            if (this.player.animTimer % 8 === 0) {
                this.player.walkFrame = (this.player.walkFrame + 1) % 4;
            }
        } else {
            this.player.walkFrame = 0;
        }
        
        // Keep Player in Bounds
        this.player.x = Math.max(60, Math.min(this.worldWidth - 60, this.player.x));
        this.player.y = Math.max(60, Math.min(this.worldHeight - 60, this.player.y));
        
        // Smooth Camera Follow Lerp
        if (this.canvas) {
            const targetCamX = this.player.x - (this.canvas.width / 2);
            const targetCamY = this.player.y - (this.canvas.height / 2);
            
            this.cameraX += (targetCamX - this.cameraX) * 0.08;
            this.cameraY += (targetCamY - this.cameraY) * 0.08;
            
            // Clamp Camera to World
            this.cameraX = Math.max(0, Math.min(this.worldWidth - this.canvas.width, this.cameraX));
            this.cameraY = Math.max(0, Math.min(this.worldHeight - this.canvas.height, this.cameraY));
        }
        
        // Update Celebration State
        if (this.player.isCelebrating) {
            this.player.celebrationTimer--;
            if (this.player.celebrationTimer <= 0) {
                this.player.isCelebrating = false;
            }
        }
        
        // Update Weather Particles
        this.clouds.forEach(c => {
            c.x += c.speed;
            if (c.x > this.worldWidth + 100) c.x = -150;
        });
        
        if (this.weather === 'rain') {
            this.rainDrops.forEach(r => {
                r.y += r.speed;
                r.x += 1.5;
                if (r.y > this.worldHeight) { r.y = -20; r.x = Math.random() * this.worldWidth; }
            });
        }
        
        if (this.weather === 'snow') {
            this.snowFlakes.forEach(s => {
                s.y += s.speed;
                s.x += s.drift;
                if (s.y > this.worldHeight) { s.y = -10; s.x = Math.random() * this.worldWidth; }
            });
        }
        
        // Update Floating Particles
        for (let i = this.floatingParticles.length - 1; i >= 0; i--) {
            const p = this.floatingParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.floatingParticles.splice(i, 1);
        }
        
        // Update In-World Reward Gems
        for (let i = this.rewardGems.length - 1; i >= 0; i--) {
            const g = this.rewardGems[i];
            g.y += g.vy;
            g.timer--;
            if (g.timer < 30) g.alpha = g.timer / 30;
            if (g.timer <= 0) this.rewardGems.splice(i, 1);
        }
        
        // Detect Proximity to Nearest Building / NPC
        this.checkProximity();
    }
    
    checkProximity() {
        let closest = null;
        let minDist = 130; // proximity threshold
        
        // Check buildings doors
        this.buildings.forEach(b => {
            const dist = Math.hypot(this.player.x - b.doorX, this.player.y - b.doorY);
            if (dist < minDist) {
                minDist = dist;
                closest = {
                    type: 'building',
                    data: b,
                    dist: Math.round(dist)
                };
            }
        });
        
        // Check NPCs
        this.npcs.forEach(npc => {
            const dist = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
            if (dist < 90) {
                minDist = dist;
                closest = {
                    type: 'npc',
                    data: npc,
                    dist: Math.round(dist)
                };
            }
        });
        
        this.nearbyEntity = closest;
        this.updateContextPromptUI();
    }
    
    updateContextPromptUI() {
        const promptEl = document.getElementById('adv-context-prompt');
        if (!promptEl) return;
        
        if (window.currentAdvTab && window.currentAdvTab !== 'world') {
            promptEl.classList.add('hidden');
            this.currentPromptEntityId = null;
            return;
        }

        if (this.nearbyEntity) {
            const entityId = `${this.nearbyEntity.type}_${this.nearbyEntity.data.id}`;
            if (this.currentPromptEntityId === entityId) return;

            this.currentPromptEntityId = entityId;
            const item = this.nearbyEntity.data;
            promptEl.classList.remove('hidden');
            if (this.nearbyEntity.type === 'building') {
                promptEl.innerHTML = `
                    <div class="ctx-prompt-content">
                        <span class="ctx-icon">${item.icon}</span>
                        <div class="ctx-info">
                            <span class="ctx-title">${item.name}</span>
                            <span class="ctx-sub">${item.sub}</span>
                        </div>
                        <button type="button" class="pixel-btn btn-sm btn-cyan ctx-action-btn" onclick="window.worldEngine.triggerContextAction()">
                            [ ${item.actionLabel} ]
                        </button>
                    </div>
                `;
            } else if (this.nearbyEntity.type === 'npc') {
                promptEl.innerHTML = `
                    <div class="ctx-prompt-content">
                        <span class="ctx-icon">${item.icon}</span>
                        <div class="ctx-info">
                            <span class="ctx-title">${item.name} (${item.role})</span>
                            <span class="ctx-sub">"${item.speech.slice(0, 45)}..."</span>
                        </div>
                        <button type="button" class="pixel-btn btn-sm btn-gold ctx-action-btn" onclick="window.worldEngine.triggerContextAction()">
                            [ TALK ]
                        </button>
                    </div>
                `;
            }
        } else {
            promptEl.classList.add('hidden');
            this.currentPromptEntityId = null;
        }
    }
    
    triggerContextAction() {
        if (!this.nearbyEntity) return;
        const promptEl = document.getElementById('adv-context-prompt');
        if (promptEl) promptEl.classList.add('hidden');
        this.currentPromptEntityId = null;

        if (this.nearbyEntity.type === 'building') {
            const b = this.nearbyEntity.data;
            if (typeof window.switchAdvTab === 'function') {
                window.switchAdvTab(b.actionTab);
            } else if (typeof switchAdvTab === 'function') {
                switchAdvTab(b.actionTab);
            }
        } else if (this.nearbyEntity.type === 'npc') {
            const npc = this.nearbyEntity.data;
            if (window.showToast) window.showToast(`${npc.name}: "${npc.speech}"`, 'info');
        }
    }
    
    render() {
        if (!this.ctx || !this.canvas) return;
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        
        // Translate for Camera Tracking
        ctx.translate(-Math.round(this.cameraX), -Math.round(this.cameraY));
        
        // 1. TERRAIN & GROUND
        this.renderTerrain(ctx);
        
        // 2. ROADS & PATHWAYS
        this.renderRoads(ctx);
        
        // 3. ENVIRONMENTAL OBJECTS (Trees, water, lanterns)
        this.renderEnvironment(ctx);
        
        // 4. PHYSICAL BUILDINGS
        this.renderBuildings(ctx);
        
        // 5. NPCS
        this.renderNPCs(ctx);
        
        // 6. QUEST MARKERS & BEACONS
        this.renderQuestMarkers(ctx);
        
        // 7. PLAYER CHARACTER & VEHICLE
        this.renderPlayer(ctx);
        
        // 8. IN-WORLD PARTICLES & REWARD GEMS
        this.renderParticlesAndGems(ctx);
        
        // 9. WEATHER & SKY LIGHTING OVERLAY
        this.renderWeatherAndLighting(ctx);
        
        ctx.restore();
        
        // 10. CORNER MINIMAP
        this.renderMinimap();
    }
    
    renderTerrain(ctx) {
        // Base Lush Voxel Grass
        ctx.fillStyle = '#14532d';
        ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
        
        // Voxel Grid Tile Accents
        ctx.fillStyle = '#166534';
        const tileSize = 64;
        for (let x = 0; x < this.worldWidth; x += tileSize * 2) {
            for (let y = 0; y < this.worldHeight; y += tileSize * 2) {
                ctx.fillRect(x, y, tileSize, tileSize);
                ctx.fillRect(x + tileSize, y + tileSize, tileSize, tileSize);
            }
        }
        
        // River / Water Stream
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(0, 800);
        ctx.bezierCurveTo(900, 850, 1500, 750, this.worldWidth, 900);
        ctx.lineTo(this.worldWidth, 1020);
        ctx.bezierCurveTo(1500, 870, 900, 970, 0, 920);
        ctx.closePath();
        ctx.fill();
        
        // Animated Water Waves
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        const waveOffset = (this.timeTick * 0.05);
        for (let x = 0; x < this.worldWidth; x += 120) {
            ctx.beginPath();
            const y = 860 + Math.sin((x * 0.01) + waveOffset) * 15;
            ctx.arc(x, y, 16, 0, Math.PI);
            ctx.stroke();
        }
    }
    
    renderRoads(ctx) {
        // Main Cobblestone Highway
        ctx.fillStyle = '#334155';
        
        // Horizontal Avenue
        ctx.fillRect(0, 680, this.worldWidth, 80);
        ctx.fillRect(0, 1400, this.worldWidth, 80);
        
        // Vertical Connectors
        ctx.fillRect(600, 0, 70, this.worldHeight);
        ctx.fillRect(1350, 0, 70, this.worldHeight);
        ctx.fillRect(2050, 0, 70, this.worldHeight);
        
        // Cobblestone Brick Edges
        ctx.fillStyle = '#475569';
        for (let x = 0; x < this.worldWidth; x += 24) {
            ctx.fillRect(x, 680, 20, 4);
            ctx.fillRect(x, 756, 20, 4);
            ctx.fillRect(x, 1400, 20, 4);
            ctx.fillRect(x, 1476, 20, 4);
        }
        
        // Wooden Bridges across River
        ctx.fillStyle = '#78350f';
        ctx.fillRect(580, 810, 110, 140);
        ctx.fillRect(1330, 770, 110, 140);
        ctx.fillRect(2030, 810, 110, 140);
        
        // Bridge Rails
        ctx.fillStyle = '#92400e';
        ctx.fillRect(580, 810, 8, 140);
        ctx.fillRect(682, 810, 8, 140);
        ctx.fillRect(1330, 770, 8, 140);
        ctx.fillRect(1432, 770, 8, 140);
    }
    
    renderEnvironment(ctx) {
        // Trees
        const treeLocs = [
            [200, 200], [350, 250], [500, 180], [800, 220], [1050, 280], [1650, 220], [1800, 260],
            [250, 600], [320, 850], [250, 1200], [380, 1600], [950, 950], [1150, 1600], [1750, 1650],
            [2350, 350], [2360, 520], [2740, 520], [2750, 700], [2500, 1100], [2700, 1400], [2850, 1600]
        ];
        
        treeLocs.forEach(([tx, ty]) => {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(tx, ty + 20, 22, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Trunk
            ctx.fillStyle = '#78350f';
            ctx.fillRect(tx - 6, ty - 10, 12, 30);
            
            // Foliage Triangles
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.moveTo(tx, ty - 55);
            ctx.lineTo(tx - 26, ty - 10);
            ctx.lineTo(tx + 26, ty - 10);
            ctx.fill();
            
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.moveTo(tx, ty - 70);
            ctx.lineTo(tx - 20, ty - 30);
            ctx.lineTo(tx + 20, ty - 30);
            ctx.fill();
        });
        
        // Lampposts with Glowing Lights
        const lampposts = [
            [580, 670], [690, 670], [1330, 670], [1440, 670], [2030, 670], [2140, 670],
            [580, 1390], [690, 1390], [1330, 1390], [1440, 1390], [2030, 1390], [2140, 1390]
        ];
        
        lampposts.forEach(([lx, ly]) => {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(lx - 2, ly - 35, 4, 35);
            ctx.fillRect(lx - 7, ly - 37, 14, 4);
            
            // Glow halo at night
            if (this.timeOfDay === 'night' || this.timeOfDay === 'sunset') {
                const glowGrad = ctx.createRadialGradient(lx, ly - 35, 2, lx, ly - 35, 30);
                glowGrad.addColorStop(0, 'rgba(253, 224, 71, 0.8)');
                glowGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
                ctx.fillStyle = glowGrad;
                ctx.beginPath();
                ctx.arc(lx, ly - 35, 30, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.fillStyle = '#fde047';
            ctx.fillRect(lx - 4, ly - 35, 8, 6);
        });
    }
    
    renderBuildings(ctx) {
        this.buildings.forEach(b => {
            // Ground Drop Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(b.x - 10, b.y + b.h - 10, b.w + 20, 25);
            
            // Building Main Body (2.5D Voxel Block)
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y + 40, b.w, b.h - 40);
            
            // Roof
            ctx.fillStyle = b.roofColor;
            ctx.beginPath();
            ctx.moveTo(b.x - 15, b.y + 40);
            ctx.lineTo(b.x + b.w / 2, b.y);
            ctx.lineTo(b.x + b.w + 15, b.y + 40);
            ctx.closePath();
            ctx.fill();
            
            // Roof Ridge
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Building Front Plaque & Icon
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(b.x + b.w / 2 - 60, b.y + 50, 120, 30);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x + b.w / 2 - 60, b.y + 50, 120, 30);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${b.icon} ${b.name.toUpperCase().slice(0, 11)}`, b.x + b.w / 2, b.y + 70);
            
            // Door
            ctx.fillStyle = '#78350f';
            ctx.fillRect(b.doorX - 22, b.doorY - 50, 44, 50);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2;
            ctx.strokeRect(b.doorX - 22, b.doorY - 50, 44, 50);
            
            // Glowing Door Step
            ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.fillRect(b.doorX - 26, b.doorY - 2, 52, 6);
            
            // Windows
            ctx.fillStyle = (this.timeOfDay === 'night' || this.timeOfDay === 'sunset') ? '#fef08a' : '#38bdf8';
            ctx.fillRect(b.x + 25, b.y + 90, 30, 30);
            ctx.fillRect(b.x + b.w - 55, b.y + 90, 30, 30);
            
            // Window Frames
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.strokeRect(b.x + 25, b.y + 90, 30, 30);
            ctx.strokeRect(b.x + b.w - 55, b.y + 90, 30, 30);
        });
    }
    
    renderNPCs(ctx) {
        this.npcs.forEach(npc => {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.ellipse(npc.x, npc.y + 15, 14, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // NPC Sprite Avatar
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(npc.icon, npc.x, npc.y + 10);
            
            // Name Tag
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.fillRect(npc.x - 45, npc.y - 30, 90, 16);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1;
            ctx.strokeRect(npc.x - 45, npc.y - 30, 90, 16);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '6px "Press Start 2P"';
            ctx.fillText(npc.name, npc.x, npc.y - 19);
        });
    }
    
    renderQuestMarkers(ctx) {
        this.questMarkers.forEach(qm => {
            const bob = Math.sin(this.timeTick * 0.1) * 6;
            const myY = qm.y + bob;
            
            // Floating Beacon Diamond
            ctx.fillStyle = qm.color;
            ctx.beginPath();
            ctx.moveTo(qm.x, myY - 20);
            ctx.lineTo(qm.x + 14, myY);
            ctx.lineTo(qm.x, myY + 20);
            ctx.lineTo(qm.x - 14, myY);
            ctx.closePath();
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.fillStyle = '#0f172a';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(qm.icon, qm.x, myY + 4);
            
            // Distance Calculation
            const dist = Math.round(Math.hypot(this.player.x - qm.x, this.player.y - qm.y) / 10);
            
            // Floating Label
            ctx.fillStyle = 'rgba(7, 11, 20, 0.9)';
            ctx.fillRect(qm.x - 45, myY - 40, 90, 16);
            ctx.strokeStyle = qm.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(qm.x - 45, myY - 40, 90, 16);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '6px "Press Start 2P"';
            ctx.fillText(`${qm.name.slice(0, 7)} ${dist}m`, qm.x, myY - 29);
        });
    }
    
    renderPlayer(ctx) {
        const px = this.player.x;
        let py = this.player.y;
        
        // Celebration Jump
        if (this.player.isCelebrating) {
            const jump = Math.sin((this.player.celebrationTimer / 90) * Math.PI) * 22;
            py -= jump;
        }

        const hero = window.hero || {};
        const skin = hero.skin_color || '#f5c29a';
        const hair = hero.hair_color || '#3b2219';
        const top = hero.top_color || '#2563eb';
        const bot = hero.bottom_color || '#1e293b';
        
        const v = this.player.currentVehicle;
        const isSwimming = this.player.isSwimming && (v !== 'futuristic jet');

        // =====================================================================
        // SWIMMING SPRITE & WATER INTERACTIONS (When in River / Outside Bridges)
        // =====================================================================
        if (isSwimming) {
            const rippleTime = this.timeTick * 0.08;
            const r1 = (rippleTime % 1);
            const r2 = ((rippleTime + 0.5) % 1);

            // Expanding Outer Water Ripple 1
            ctx.strokeStyle = `rgba(186, 230, 253, ${0.75 * (1 - r1)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(px, py + 4, 16 + r1 * 14, 6 + r1 * 5, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Expanding Outer Water Ripple 2
            ctx.strokeStyle = `rgba(125, 211, 252, ${0.65 * (1 - r2)})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(px, py + 4, 16 + r2 * 14, 6 + r2 * 5, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Inner Foam Surface Wake
            ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
            ctx.beginPath();
            ctx.ellipse(px, py + 3, 14, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Submerged lower body / legs silhouette (water refraction)
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(px - 5, py + 4, 10, 8);
            ctx.restore();

            // Water Bobbing Motion
            const swimBob = this.player.isMoving 
                ? Math.sin(this.player.animTimer * 0.25) * 2.5 
                : Math.sin(this.timeTick * 0.08) * 1.5;

            // Torso / Shirt (partially submerged)
            ctx.fillStyle = top;
            ctx.fillRect(px - 7, py - 6 + swimBob, 14, 10);

            // Head / Skin
            ctx.fillStyle = skin;
            ctx.fillRect(px - 6, py - 18 + swimBob, 12, 12);

            // Hair
            ctx.fillStyle = hair;
            ctx.fillRect(px - 7, py - 22 + swimBob, 14, 6);
            ctx.fillRect(px - 7, py - 18 + swimBob, 3, 5);

            // Eyes
            ctx.fillStyle = '#0f172a';
            if (this.player.direction === 'down' || this.player.direction === 'right') {
                ctx.fillRect(px + 1, py - 14 + swimBob, 2, 2);
            }
            if (this.player.direction === 'down' || this.player.direction === 'left') {
                ctx.fillRect(px - 3, py - 14 + swimBob, 2, 2);
            }

            // Swimming Arms & Paddling Strokes
            const stroke = Math.sin(this.player.animTimer * 0.25);
            ctx.fillStyle = skin;
            if (this.player.isMoving) {
                if (this.player.direction === 'left') {
                    // Left arm forward reach
                    ctx.fillRect(px - 14 - stroke * 4, py - 2 + swimBob, 8, 4);
                    ctx.fillRect(px + 4, py + 1 + swimBob, 6, 4);
                    // Splash foam
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(px - 16 - stroke * 4, py - 1 + swimBob, 3, 3);
                } else if (this.player.direction === 'right') {
                    // Right arm forward reach
                    ctx.fillRect(px + 6 + stroke * 4, py - 2 + swimBob, 8, 4);
                    ctx.fillRect(px - 10, py + 1 + swimBob, 6, 4);
                    // Splash foam
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(px + 13 + stroke * 4, py - 1 + swimBob, 3, 3);
                } else if (this.player.direction === 'up') {
                    // Reaching forward into the water
                    ctx.fillRect(px - 10, py - 10 + stroke * 3 + swimBob, 4, 7);
                    ctx.fillRect(px + 6, py - 10 - stroke * 3 + swimBob, 4, 7);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(px - 11, py - 11 + stroke * 3 + swimBob, 3, 3);
                    ctx.fillRect(px + 7, py - 11 - stroke * 3 + swimBob, 3, 3);
                } else {
                    // Down / freestyle crawl
                    ctx.fillRect(px - 11, py - 2 + stroke * 4 + swimBob, 5, 5);
                    ctx.fillRect(px + 6, py - 2 - stroke * 4 + swimBob, 5, 5);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(px - 13, py + stroke * 4 + swimBob, 3, 3);
                    ctx.fillRect(px + 9, py - stroke * 4 + swimBob, 3, 3);
                }
            } else {
                // Treading water
                const paddle = Math.sin(this.timeTick * 0.1) * 2;
                ctx.fillRect(px - 11, py - 1 + paddle + swimBob, 5, 4);
                ctx.fillRect(px + 6, py - 1 - paddle + swimBob, 5, 4);
            }

            // Floating Player Name Tag with Swimming Indicator
            ctx.fillStyle = 'rgba(7, 11, 20, 0.85)';
            ctx.fillRect(px - 40, py - 38 + swimBob, 80, 14);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1;
            ctx.strokeRect(px - 40, py - 38 + swimBob, 80, 14);

            ctx.fillStyle = '#38bdf8';
            ctx.font = '6px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(`🏊 ${hero.name || 'WARRIOR'}`, px, py - 28 + swimBob);
            return;
        }

        // =====================================================================
        // NORMAL DRY-LAND & ON-BRIDGE RENDERING
        // =====================================================================
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(px, this.player.y + 16, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // VEHICLE UNDERLAY (Bicycle, Skateboard, Car, Jet)
        if (v === 'bicycle') {
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(px - 14, py + 8, 28, 4);
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(px - 14, py + 12, 6, 0, Math.PI * 2);
            ctx.arc(px + 14, py + 12, 6, 0, Math.PI * 2);
            ctx.fill();
        } else if (v === 'skateboard') {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(px - 16, py + 12, 32, 4);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(px - 14, py + 16, 4, 3);
            ctx.fillRect(px + 10, py + 16, 4, 3);
        } else if (v === 'cyber cruiser car' || v === 'car') {
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(px - 32, py - 4, 64, 22);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(px - 20, py - 12, 40, 10);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px - 26, py + 14, 12, 8);
            ctx.fillRect(px + 14, py + 14, 12, 8);
            return; // Car encloses character
        } else if (v === 'futuristic jet') {
            ctx.fillStyle = '#6366f1';
            ctx.beginPath();
            ctx.moveTo(px, py - 20);
            ctx.lineTo(px + 28, py + 15);
            ctx.lineTo(px - 28, py + 15);
            ctx.closePath();
            ctx.fill();
            // Thruster fire
            ctx.fillStyle = '#f97316';
            ctx.fillRect(px - 6, py + 15, 12, 8 + Math.random() * 6);
            return;
        }
        
        // PLAYER SPRITE (Layered Pixel Character)
        const walkBounce = (this.player.isMoving && this.player.walkFrame % 2 !== 0) ? -2 : 0;
        
        // Body / Legs
        ctx.fillStyle = bot;
        ctx.fillRect(px - 6, py + 4 + walkBounce, 5, 10);
        ctx.fillRect(px + 1, py + 4 + (this.player.isMoving ? -walkBounce : walkBounce), 5, 10);
        
        // Torso / Shirt
        ctx.fillStyle = top;
        ctx.fillRect(px - 7, py - 8 + walkBounce, 14, 13);
        
        // Head / Skin
        ctx.fillStyle = skin;
        ctx.fillRect(px - 6, py - 20 + walkBounce, 12, 12);
        
        // Hair
        ctx.fillStyle = hair;
        ctx.fillRect(px - 7, py - 24 + walkBounce, 14, 6);
        ctx.fillRect(px - 7, py - 20 + walkBounce, 3, 5);
        
        // Eyes
        ctx.fillStyle = '#0f172a';
        if (this.player.direction === 'down' || this.player.direction === 'right') {
            ctx.fillRect(px + 1, py - 16 + walkBounce, 2, 2);
        }
        if (this.player.direction === 'down' || this.player.direction === 'left') {
            ctx.fillRect(px - 3, py - 16 + walkBounce, 2, 2);
        }
        
        // Floating Player Name Tag
        ctx.fillStyle = 'rgba(7, 11, 20, 0.85)';
        ctx.fillRect(px - 36, py - 38 + walkBounce, 72, 14);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(px - 36, py - 38 + walkBounce, 72, 14);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '6px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(hero.name || 'WARRIOR', px, py - 28 + walkBounce);
    }
    
    renderParticlesAndGems(ctx) {
        // Floating Sparkles
        this.floatingParticles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });
        
        // Reward Gems Floating Up
        this.rewardGems.forEach(g => {
            ctx.globalAlpha = g.alpha;
            
            // Text Banner
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.fillRect(g.x - 55, g.y - 12, 110, 24);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(g.x - 55, g.y - 12, 110, 24);
            
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 7px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(`+${g.xp} XP`, g.x - 22, g.y + 4);
            
            ctx.fillStyle = '#facc15';
            ctx.fillText(`+${g.gold}G`, g.x + 28, g.y + 4);
            
            ctx.globalAlpha = 1.0;
        });
    }
    
    renderWeatherAndLighting(ctx) {
        const W = this.worldWidth;
        const H = this.worldHeight;
        
        // Drifting Clouds
        this.clouds.forEach(c => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.size * 0.4, 0, Math.PI * 2);
            ctx.arc(c.x + c.size * 0.3, c.y - 10, c.size * 0.5, 0, Math.PI * 2);
            ctx.arc(c.x + c.size * 0.6, c.y, c.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Rain Overlay
        if (this.weather === 'rain') {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
            ctx.lineWidth = 1.5;
            this.rainDrops.forEach(r => {
                ctx.beginPath();
                ctx.moveTo(r.x, r.y);
                ctx.lineTo(r.x + 3, r.y + r.len);
                ctx.stroke();
            });
        }
        
        // Snow Overlay
        if (this.weather === 'snow') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            this.snowFlakes.forEach(s => {
                ctx.fillRect(s.x, s.y, s.size, s.size);
            });
        }
        
        // Day/Night Ambient Tint Overlay
        if (this.timeOfDay === 'night') {
            ctx.fillStyle = 'rgba(7, 12, 28, 0.55)';
            ctx.fillRect(0, 0, W, H);
        } else if (this.timeOfDay === 'sunset') {
            ctx.fillStyle = 'rgba(234, 88, 12, 0.22)';
            ctx.fillRect(0, 0, W, H);
        }
    }
    
    renderMinimap() {
        if (!this.minimapCtx || !this.minimapCanvas) return;
        const mctx = this.minimapCtx;
        const mW = this.minimapCanvas.width;
        const mH = this.minimapCanvas.height;
        
        mctx.clearRect(0, 0, mW, mH);
        
        // Background radar
        mctx.fillStyle = '#090e17';
        mctx.fillRect(0, 0, mW, mH);
        mctx.strokeStyle = '#1e293b';
        mctx.strokeRect(0, 0, mW, mH);
        
        const scaleX = mW / this.worldWidth;
        const scaleY = mH / this.worldHeight;
        
        // Buildings on Radar
        this.buildings.forEach(b => {
            mctx.fillStyle = '#38bdf8';
            mctx.fillRect(b.x * scaleX, b.y * scaleY, 6, 6);
        });
        
        // Quest Markers on Radar
        this.questMarkers.forEach(qm => {
            mctx.fillStyle = '#facc15';
            mctx.fillRect(qm.x * scaleX - 2, qm.y * scaleY - 2, 5, 5);
        });
        
        // Player Blip
        const pX = this.player.x * scaleX;
        const pY = this.player.y * scaleY;
        
        mctx.fillStyle = '#22c55e';
        mctx.beginPath();
        mctx.arc(pX, pY, 4, 0, Math.PI * 2);
        mctx.fill();
        
        mctx.strokeStyle = '#ffffff';
        mctx.lineWidth = 1;
        mctx.stroke();
    }
}

// Global Singleton Instance
window.worldEngine = new LifeRPGWorldEngine();
