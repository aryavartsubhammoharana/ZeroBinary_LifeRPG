/**
 * LifeRPG — Deep Retro Character Creator & Sprite Engine
 * Inspired by 16-bit RPG character customization with modular layered pixel art.
 */

// =============================================================================
// GLOBAL STATE & CONSTANTS
// =============================================================================

const baseUrl = '';
let currentUser = null;
let soundEnabled = true;

// Sound Synthesizer via Web Audio API (Retro 8-bit Sound FX)
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
    }
}

function playSound(type) {
    if (!soundEnabled) return;
    try {
        initAudio();
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'click') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'tab') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (type === 'step') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.setValueAtTime(680, now + 0.03);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
        } else if (type === 'random') {
            osc.type = 'sawtooth';
            for (let i = 0; i < 5; i++) {
                const f = 200 + Math.random() * 600;
                osc.frequency.setValueAtTime(f, now + i * 0.03);
            }
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'magic') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.08);
            osc.frequency.setValueAtTime(783.99, now + 0.16);
            osc.frequency.setValueAtTime(1046.50, now + 0.24);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        } else if (type === 'victory') {
            const notes = [440, 554.37, 659.25, 880, 783.99, 880];
            const duration = 0.12;
            notes.forEach((freq, idx) => {
                const o = audioCtx.createOscillator();
                const g = audioCtx.createGain();
                o.type = 'square';
                o.connect(g);
                g.connect(audioCtx.destination);
                const t = now + idx * duration;
                o.frequency.setValueAtTime(freq, t);
                g.gain.setValueAtTime(0.14, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.95);
                o.start(t);
                o.stop(t + duration);
            });
        }
    } catch (e) {}
}

function toggleSoundFx() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('btn-sound-toggle');
    if (btn) btn.textContent = soundEnabled ? '🔊 SFX ON' : '🔇 SFX OFF';
    const hudBtn = document.getElementById('hud-sound-btn');
    if (hudBtn) {
        hudBtn.textContent = soundEnabled ? '🔊' : '🔇';
        hudBtn.classList.toggle('muted', !soundEnabled);
    }
    if (soundEnabled) playSound('click');
}

function showGoldTip() {
    playSound('magic');
    alert("🪙 GOLD CURRENCY\n\nYou earn Gold by completing real-world daily quests and habits!\n\n• Current Balance: " + (hero.gold || 1000).toLocaleString() + " Gold\n• Quest Reward: +50 Gold each\n• Use Gold to upgrade your gear, companions, and status!");
}

// =============================================================================
// CHARACTER MODEL DATA & OPTIONS LIBRARY
// =============================================================================

const TITLES = [
    'The Beginner',
    'The Student',
    'The Builder',
    'The Dreamer',
    'The Athlete',
    'The Creator',
    'The Explorer',
    'The Strategist',
    'The Leader',
    'The Challenger'
];

const LIFESTYLES = [
    { id: 'creator', name: 'Creator / Artist', desc: 'Visual arts, music and creative storytelling' },
    { id: 'student', name: 'Student', desc: 'Focus on knowledge, academia and growth' },
    { id: 'fitness', name: 'Fitness / Athlete', desc: 'Peak physical energy and athletic strength' },
    { id: 'entrepreneur', name: 'Entrepreneur', desc: 'Business builder, risk taker, visionary' },
    { id: 'professional', name: 'Professional', desc: 'Sharp career advancement and prestige' },
    { id: 'tech', name: 'Developer / Tech', desc: 'Code architect and digital craftsperson' },
    { id: 'gamer', name: 'Gamer', desc: 'Strategic mastery and gaming passion' },
    { id: 'traveler', name: 'Traveler', desc: 'Wanderer exploring world cultures' },
    { id: 'reader', name: 'Reader / Intellectual', desc: 'Philosopher and book enthusiast' },
    { id: 'minimalist', name: 'Minimalist', desc: 'Clarity, essentialism and pure focus' },
    { id: 'fashion', name: 'Fashion-focused', desc: 'Expressive aesthetics and modern couture' },
    { id: 'adventurer', name: 'Adventurer', desc: 'Outdoor explorer ready for rugged terrain' },
    { id: 'leader', name: 'Leader', desc: 'Commanding presence and team motivator' },
    { id: 'balanced', name: 'Balanced Lifestyle', desc: 'Harmony across health, mind and life' },
    { id: 'custom', name: 'Custom', desc: 'Your own bespoke personal path' }
];

const STYLES = [
    { id: 'creative', name: 'Creative', icon: '🎨' },
    { id: 'casual', name: 'Casual', icon: '👕' },
    { id: 'minimal', name: 'Minimal', icon: '◻️' },
    { id: 'streetwear', name: 'Streetwear', icon: '👟' },
    { id: 'formal', name: 'Formal', icon: '👔' },
    { id: 'smart-casual', name: 'Smart Casual', icon: '🕶️' },
    { id: 'athletic', name: 'Athletic', icon: '⚡' },
    { id: 'sporty', name: 'Sporty', icon: '🏀' },
    { id: 'academic', name: 'Academic', icon: '📚' },
    { id: 'tech', name: 'Tech', icon: '💻' },
    { id: 'luxury', name: 'Luxury', icon: '👑' },
    { id: 'outdoor', name: 'Outdoor', icon: '🌲' },
    { id: 'adventurer', name: 'Adventurer', icon: '🧭' },
    { id: 'traditional', name: 'Traditional', icon: '🏮' },
    { id: 'modern', name: 'Modern', icon: '🏙️' },
    { id: 'retro', name: 'Retro', icon: '🕹️' },
    { id: 'futuristic', name: 'Futuristic', icon: '🚀' }
];

const PALETTES = [
    { id: 'Royal', name: 'Royal', colors: ['#3b0764', '#7e22ce', '#c084fc', '#facc15', '#ffffff'] },
    { id: 'Midnight', name: 'Midnight', colors: ['#0f172a', '#1e293b', '#3b82f6', '#93c5fd', '#ffffff'] },
    { id: 'Ocean', name: 'Ocean', colors: ['#082f49', '#0284c7', '#38bdf8', '#bae6fd', '#ffffff'] },
    { id: 'Forest', name: 'Forest', colors: ['#14532d', '#15803d', '#4ade80', '#bbf7d0', '#fef08a'] },
    { id: 'Sunset', name: 'Sunset', colors: ['#4c0519', '#be123c', '#f97316', '#fde047', '#fff1f2'] },
    { id: 'Monochrome', name: 'Monochrome', colors: ['#000000', '#334155', '#64748b', '#cbd5e1', '#ffffff'] },
    { id: 'Earth', name: 'Earth', colors: ['#451a03', '#78350f', '#b45309', '#fcd34d', '#fef3c7'] },
    { id: 'Neon', name: 'Neon', colors: ['#09090b', '#06b6d4', '#ec4899', '#a855f7', '#22c55e'] },
    { id: 'Pastel', name: 'Pastel', colors: ['#fda4af', '#fcd34d', '#86efac', '#93c5fd', '#c084fc'] }
];

const SKIN_TONES = [
    '#f5c29a', '#ffdbb4', '#e0a370', '#c68642', '#8d5524', '#5c3317', '#3d2314', '#ffe3d1'
];

const EYE_COLORS = [
    '#4a2e18', '#6b4226', '#2563eb', '#16a34a', '#854d0e', '#64748b', '#7c3aed', '#dc2626'
];

const HAIR_COLORS = [
    { name: 'Dark Brown', hex: '#3b2219' },
    { name: 'Black', hex: '#1a1818' },
    { name: 'Brown', hex: '#5c3826' },
    { name: 'Light Brown', hex: '#8c593b' },
    { name: 'Blonde', hex: '#d4af37' },
    { name: 'Platinum', hex: '#f0e6d2' },
    { name: 'Red', hex: '#b91c1c' },
    { name: 'Gray', hex: '#94a3b8' },
    { name: 'White', hex: '#f8fafc' },
    { name: 'Blue', hex: '#2563eb' },
    { name: 'Purple', hex: '#9333ea' },
    { name: 'Green', hex: '#16a34a' }
];

const HAIR_STYLES = [
    'Curtains', 'Textured crop', 'Side part', 'Middle part', 'Buzz cut', 'Crew cut', 'Side fade', 'Caesar',
    'Short messy', 'Messy', 'Wavy', 'Layered', 'Long straight', 'Long wavy', 'Ponytail', 'Man bun',
    'Shoulder length', 'Mohawk', 'Undercut', 'Spiky', 'Curly', 'Dread-style', 'Fantasy'
];

const BODY_TYPES = ['Athletic', 'Slim', 'Average', 'Muscular', 'Broad'];
const HEIGHTS = ['Average', 'Short', 'Tall'];
const BUILDS = ['Balanced', 'Lean', 'Strong'];

const FACE_SHAPES = ['Standard', 'Chiseled', 'Soft', 'Square', 'Oval'];
const EYE_SHAPES = ['Standard', 'Almond', 'Sharp', 'Wide', 'Focused'];
const EYEBROWS = ['Default', 'Thick', 'Arched', 'Sharp', 'Thin'];
const EXPRESSIONS = ['Confident', 'Neutral', 'Happy', 'Focused', 'Serious', 'Energetic', 'Calm'];
const MOUTHS = ['Smile', 'Smirk', 'Neutral', 'Determined', 'Open'];

const TOPS = [
    'Bomber jacket', 'Hoodie', 'T-shirt', 'Oversized T-shirt', 'Shirt', 'Sweatshirt', 'Jacket',
    'Denim jacket', 'Blazer', 'Formal suit', 'Tank top', 'Sports jersey', 'Traditional-inspired outfit', 'Adventurer outfit'
];

const BOTTOMS = [
    'Formal trousers', 'Joggers', 'Jeans', 'Shorts', 'Cargo pants',
    'Track pants', 'Athletic shorts', 'Skirt', 'Long pants'
];

const SHOES = [
    'Formal shoes', 'Sneakers', 'Running shoes', 'Basketball shoes', 'Boots',
    'Sandals', 'Casual shoes'
];

const MAIN_GEAR = [
    { label: 'Sunglasses', slot: 'face', val: 'Sunglasses' },
    { label: 'Glasses', slot: 'face', val: 'Glasses' },
    { label: 'Backpack', slot: 'body', val: 'Backpack' },
    { label: 'Smartwatch', slot: 'wrist', val: 'Smartwatch' },
    { label: 'Fitness Band', slot: 'wrist', val: 'Fitness band' },
    { label: 'Headphones', slot: 'head', val: 'Headphones' },
    { label: 'Cap', slot: 'head', val: 'Cap' },
    { label: 'Beanie', slot: 'head', val: 'Beanie' },
    { label: 'Laptop', slot: 'other', val: 'Laptop' },
    { label: 'Water Bottle', slot: 'other', val: 'Water bottle' },
    { label: 'Camera', slot: 'other', val: 'Camera' },
    { label: 'Guitar', slot: 'other', val: 'Guitar' },
    { label: 'Skateboard', slot: 'other', val: 'Skateboard' },
    { label: 'None', slot: 'body', val: 'None' }
];

const AURAS = [
    { id: 'Mysterious', name: 'Mysterious', icon: '🌑', color: '#7c3aed' },
    { id: 'Energetic', name: 'Energetic', icon: '⚡', color: '#f97316' },
    { id: 'Calm', name: 'Calm', icon: '🌊', color: '#38bdf8' },
    { id: 'Confident', name: 'Confident', icon: '👑', color: '#facc15' },
    { id: 'Disciplined', name: 'Disciplined', icon: '🛡️', color: '#60a5fa' },
    { id: 'Creative', name: 'Creative', icon: '🎨', color: '#ec4899' },
    { id: 'Adventurous', name: 'Adventurous', icon: '🧭', color: '#22c55e' },
    { id: 'Competitive', name: 'Competitive', icon: '🔥', color: '#ef4444' },
    { id: 'Friendly', name: 'Friendly', icon: '✨', color: '#fde047' },
    { id: 'Leader', name: 'Leader', icon: '⚔️', color: '#fbbf24' },
    { id: 'Balanced', name: 'Balanced', icon: '☯️', color: '#10b981' }
];

const POSES = [
    { id: 'Confident', name: 'Confident', icon: '😎' },
    { id: 'Standing', name: 'Standing', icon: '🧍' },
    { id: 'Relaxed', name: 'Relaxed', icon: '🍃' },
    { id: 'Thinking', name: 'Thinking', icon: '🤔' },
    { id: 'Athletic', name: 'Athletic', icon: '🏃' },
    { id: 'Hands-on-hips', name: 'Hands-on-hips', icon: '💪' },
    { id: 'Adventurer', name: 'Adventurer', icon: '🧭' },
    { id: 'Victory', name: 'Victory', icon: '🏆' }
];

const COMPANIONS = [
    { id: 'Dog', name: 'Dog', icon: '🐕' },
    { id: 'Cat', name: 'Cat', icon: '🐈' },
    { id: 'Bird', name: 'Bird', icon: '🐦' },
    { id: 'Robot', name: 'Robot', icon: '🤖' },
    { id: 'Dragon', name: 'Dragon', icon: '🐲' },
    { id: 'Fox', name: 'Fox', icon: '🦊' },
    { id: 'Fairy', name: 'Fairy', icon: '🧚' },
    { id: 'None', name: 'None', icon: '🚫' }
];

const AI_GOALS = [
    { id: 'creative', label: 'Unleash artistic creativity', icon: '🎨', preset: 'creator', style: 'Creative', top: 'Bomber jacket', bottom: 'Formal trousers', shoes: 'Formal shoes', hair: 'Curtains', aura: 'Mysterious', pose: 'Confident', gear: 'Sunglasses', why: 'A refined, avant-garde aesthetic combining artistic flair with modern polish.' },
    { id: 'fit', label: 'Get fit & athletic', icon: '🏋️‍♂️', preset: 'fitness', style: 'Athletic', top: 'Tank top', bottom: 'Joggers', shoes: 'Running shoes', hair: 'Textured crop', aura: 'Energetic', pose: 'Athletic', gear: 'Fitness Band', why: 'Emphasizes high energy, peak athletic readiness and physical drive.' },
    { id: 'study', label: 'Study harder & master skills', icon: '🎓', preset: 'student', style: 'Academic', top: 'Hoodie', bottom: 'Jeans', shoes: 'Sneakers', hair: 'Curtains', aura: 'Intelligent', pose: 'Thinking', gear: 'Glasses', why: 'Sharp focus, quiet discipline and relentless curiosity.' },
    { id: 'career', label: 'Build a great career', icon: '💼', preset: 'professional', style: 'Formal', top: 'Shirt', bottom: 'Formal trousers', shoes: 'Formal shoes', hair: 'Side part', aura: 'Confident', pose: 'Confident', gear: 'Smartwatch', why: 'Presents executive polish, leadership authority and professional ambition.' },
    { id: 'finance', label: 'Become financially wealthy', icon: '💎', preset: 'entrepreneur', style: 'Luxury', top: 'Blazer', bottom: 'Formal trousers', shoes: 'Formal shoes', hair: 'Side fade', aura: 'Leader', pose: 'Confident', gear: 'Smartwatch', why: 'Exudes confidence, strategic mastery and compounding success.' },
    { id: 'business', label: 'Build a business / startup', icon: '🚀', preset: 'entrepreneur', style: 'Tech', top: 'Oversized T-shirt', bottom: 'Joggers', shoes: 'Sneakers', hair: 'Buzz cut', aura: 'Disciplined', pose: 'Hands-on-hips', gear: 'Laptop', why: 'Represents the modern founder: agile, sharp and focused on building value.' },
    { id: 'discipline', label: 'Become deeply disciplined', icon: '⚔️', preset: 'balanced', style: 'Minimal', top: 'T-shirt', bottom: 'Long pants', shoes: 'Casual shoes', hair: 'Crew cut', aura: 'Disciplined', pose: 'Standing', gear: 'None', why: 'Clean lines, zero clutter and unbreakable daily consistency.' },
    { id: 'health', label: 'Improve vitality & well-being', icon: '🍃', preset: 'balanced', style: 'Outdoor', top: 'Tank top', bottom: 'Joggers', shoes: 'Sandals', hair: 'Short messy', aura: 'Calm', pose: 'Relaxed', gear: 'Water Bottle', why: 'Harmony of mind and body in tune with nature.' },
    { id: 'social', label: 'Become charismatic & social', icon: '🤝', preset: 'leader', style: 'Smart Casual', top: 'Bomber jacket', bottom: 'Jeans', shoes: 'Sneakers', hair: 'Middle part', aura: 'Friendly', pose: 'Victory', gear: 'Sunglasses', why: 'Magnetic, warm, and inspiring presence to everyone around.' },
    { id: 'explore', label: 'Explore the world & travel', icon: '🌍', preset: 'traveler', style: 'Adventurer', top: 'Adventurer outfit', bottom: 'Cargo pants', shoes: 'Boots', hair: 'Layered', aura: 'Adventurous', pose: 'Adventurer', gear: 'Backpack', why: 'Ready for any expedition across unknown horizons.' },
    { id: 'best-self', label: 'Become the ultimate version of myself', icon: '⭐', preset: 'balanced', style: 'Modern', top: 'Denim jacket', bottom: 'Joggers', shoes: 'Sneakers', hair: 'Spiky', aura: 'Confident', pose: 'Victory', gear: 'Smartwatch', why: 'A complete synergy of power, intellect, style, and ambition.' }
];

// =============================================================================
// CURRENT HERO PROFILE STATE (Default configured to user specifications)
// =============================================================================

let hero = {
    name: 'GSJustin',
    title: 'The Creator',
    gender: 'M',
    lifestyle: 'Creator / Artist',
    style: 'Creative',
    body_type: 'Athletic',
    height: 'Average',
    build: 'Balanced',
    skin_color: '#f5c29a',
    face_shape: 'Standard',
    eye_shape: 'Standard',
    eye_color: '#4a2e18',
    eyebrows: 'Default',
    nose_style: 'Standard',
    mouth_style: 'Smile',
    expression: 'Confident',
    hair_category: 'MEDIUM',
    hair_style: 'Curtains',
    hair_color: '#3b2219',
    hair_highlight: '#8c593b',
    hair_highlight_enabled: false,
    top_type: 'Bomber jacket',
    top_color: '#8b5cf6',
    bottom_type: 'Formal trousers',
    bottom_color: '#1e293b',
    shoes_type: 'Formal shoes',
    shoes_color: '#18181b',
    jacket_color: '#4c1d95',
    palette: 'Royal',
    accessories: {
        head: 'None',
        face: 'Sunglasses',
        wrist: 'None',
        body: 'None',
        other: 'None'
    },
    aura: 'Mysterious',
    pose: 'Confident',
    companion: 'Dog',
    gold: 1000,
    level: 1,
    xp: 0,
    health: 100,
    energy: 100,
    focus: 50,
    discipline: 10,
    confidence: 10,
    wisdom: 10
};

const DEFAULT_STARTER_QUESTS_JS = [
    // 🏫 SCHOOL / ACADEMICS (INT / Knowledge)
    {
        id: 101,
        title: "Complete a concept of P/C/M (Physics/Chem/Math)",
        description: "Master 1 core formula, theory, or concept in Physics, Chemistry, or Math",
        category: "School",
        difficulty: "EASY",
        stat_type: "knowledge",
        stat_val: 5,
        xp_reward: 20,
        gold_reward: 20,
        completed: false
    },
    {
        id: 102,
        title: "Complete homework of 1 subject",
        description: "Finish all assigned problems and chapter questions for 1 subject",
        category: "School",
        difficulty: "EASY",
        stat_type: "knowledge",
        stat_val: 5,
        xp_reward: 20,
        gold_reward: 20,
        completed: false
    },
    {
        id: 103,
        title: "Write 15 pages",
        description: "Complete 15 pages of structured handwritten notes or assignment drafting",
        category: "School",
        difficulty: "MED",
        stat_type: "knowledge",
        stat_val: 10,
        xp_reward: 40,
        gold_reward: 40,
        completed: false
    },
    {
        id: 104,
        title: "Outdoor recreation & games (2 hrs)",
        description: "Go outside and engage in active outdoor sports or team play for 2 hours",
        category: "School",
        difficulty: "MED",
        stat_type: "vitality",
        stat_val: 10,
        xp_reward: 40,
        gold_reward: 40,
        completed: false
    },
    {
        id: 105,
        title: "Complete a full revision / PYQ of a subject",
        description: "Solve previous year exam questions & comprehensive chapter revision",
        category: "School",
        difficulty: "HARD",
        stat_type: "knowledge",
        stat_val: 15,
        xp_reward: 60,
        gold_reward: 60,
        completed: false
    },

    // 🏋️ EXERCISE / FITNESS (STR / Strength)
    {
        id: 106,
        title: "Complete 10 squats",
        description: "Proper form bodyweight squats for leg strength and mobility",
        category: "Exercise",
        difficulty: "EASY",
        stat_type: "fitness",
        stat_val: 5,
        xp_reward: 20,
        gold_reward: 20,
        completed: false
    },
    {
        id: 107,
        title: "Complete 10 push-ups",
        description: "Clean standard chest-to-floor push-up repetitions",
        category: "Exercise",
        difficulty: "EASY",
        stat_type: "fitness",
        stat_val: 5,
        xp_reward: 20,
        gold_reward: 20,
        completed: false
    },
    {
        id: 108,
        title: "Run for 1.5 KM",
        description: "Steady endurance run or intervals for cardio stamina",
        category: "Exercise",
        difficulty: "MED",
        stat_type: "fitness",
        stat_val: 10,
        xp_reward: 40,
        gold_reward: 40,
        completed: false
    },
    {
        id: 109,
        title: "Walk for 5 KM",
        description: "Brisk continuous distance walking for recovery and calorie burn",
        category: "Exercise",
        difficulty: "MED",
        stat_type: "fitness",
        stat_val: 10,
        xp_reward: 40,
        gold_reward: 40,
        completed: false
    },
    {
        id: 110,
        title: "Weightlifting workout (3 x 15 reps)",
        description: "3 sets of 15 reps of focused resistance / dumbbell lifting",
        category: "Exercise",
        difficulty: "HARD",
        stat_type: "fitness",
        stat_val: 15,
        xp_reward: 60,
        gold_reward: 60,
        completed: false
    },

    // 💧 HEALTH CARE / VITALITY (VIT / Vitality & Health)
    {
        id: 111,
        title: "Complete 1L water intake",
        description: "Stay hydrated throughout the day with clean fresh water",
        category: "Health Care",
        difficulty: "EASY",
        stat_type: "vitality",
        stat_val: 5,
        xp_reward: 20,
        gold_reward: 20,
        completed: false
    },
    {
        id: 112,
        title: "Complete 5,000 steps",
        description: "Daily movement tracker target reached for active metabolism",
        category: "Health Care",
        difficulty: "EASY",
        stat_type: "vitality",
        stat_val: 5,
        xp_reward: 20,
        gold_reward: 20,
        completed: false
    },
    {
        id: 113,
        title: "Complete target protein intake (Weight x 1.2g)",
        description: "Hit daily macronutrient goal for muscle repair and energy",
        category: "Health Care",
        difficulty: "MED",
        stat_type: "vitality",
        stat_val: 10,
        xp_reward: 40,
        gold_reward: 40,
        completed: false
    },
    {
        id: 114,
        title: "Complete full refreshing body wash & hygiene",
        description: "Shower, hygiene, and full grooming reset after workouts",
        category: "Health Care",
        difficulty: "MED",
        stat_type: "vitality",
        stat_val: 10,
        xp_reward: 40,
        gold_reward: 40,
        completed: false
    }
];

let guestQuests = JSON.parse(JSON.stringify(DEFAULT_STARTER_QUESTS_JS));

// =============================================================================
// INITIALIZATION & UI BUILDERS
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    checkAuth();
    startCanvasAnimationLoop();
});

function initUI() {
    // 1. Build Studio Palette Grid
    const pGrid = document.getElementById('palette-grid');
    if (pGrid) {
        pGrid.innerHTML = '';
        PALETTES.forEach(pal => {
            const card = document.createElement('div');
            card.className = `palette-card ${hero.palette === pal.id ? 'active' : ''}`;
            card.innerHTML = `
                <div class="palette-name">${pal.name}</div>
                <div class="palette-colors-row">
                    ${pal.colors.map(c => `<div class="palette-bar" style="background:${c}"></div>`).join('')}
                </div>
            `;
            card.onclick = () => applyPalette(pal);
            pGrid.appendChild(card);
        });
    }

    // 2. Build Expressions Grid in Studio
    const expGrid = document.getElementById('expression-grid');
    if (expGrid) {
        expGrid.innerHTML = '';
        EXPRESSIONS.forEach(exp => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = `grid-btn-retro ${hero.expression === exp ? 'active' : ''}`;
            card.textContent = exp;
            card.onclick = () => {
                hero.expression = exp;
                updateUIValues();
                playSound('step');
            };
            expGrid.appendChild(card);
        });
    }

    // 3. Build Body Types Grid in Studio
    const btGrid = document.getElementById('bodytype-grid');
    if (btGrid) {
        btGrid.innerHTML = '';
        BODY_TYPES.forEach(bt => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = `grid-btn-retro ${hero.body_type === bt ? 'active' : ''}`;
            card.textContent = bt;
            card.onclick = () => {
                hero.body_type = bt;
                updateUIValues();
                playSound('step');
            };
            btGrid.appendChild(card);
        });
    }

    // 4. Build Poses Grid in Studio
    const poseGrid = document.getElementById('pose-grid');
    if (poseGrid) {
        poseGrid.innerHTML = '';
        POSES.forEach(p => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = `grid-btn-retro ${hero.pose === p.id ? 'active' : ''}`;
            card.innerHTML = `${p.icon} ${p.name}`;
            card.onclick = () => {
                hero.pose = p.id;
                updateUIValues();
                playSound('step');
            };
            poseGrid.appendChild(card);
        });
    }

    // 5. Build AI Wizard Goals
    buildAiGoalsGrid();

    // 6. Update UI Stepper values
    updateUIValues();
}

function buildAiGoalsGrid() {
    const container = document.getElementById('ai-goals-container');
    if (!container) return;
    container.innerHTML = '';
    AI_GOALS.forEach(g => {
        const card = document.createElement('div');
        card.className = 'goal-card';
        card.innerHTML = `<span class="goal-icon">${g.icon}</span><span class="goal-label">${g.label}</span>`;
        card.onclick = () => selectAiGoal(g);
        container.appendChild(card);
    });
}

// =============================================================================
// STEPPER CONTROLS & SELECTION HANDLERS
// =============================================================================

function switchControlView(mode) {
    playSound('tab');
    const steppersTab = document.getElementById('tab-mode-steppers');
    const studioTab = document.getElementById('tab-mode-studio');
    const steppersView = document.getElementById('view-steppers');
    const studioView = document.getElementById('view-studio');

    if (steppersTab && studioTab && steppersView && studioView) {
        steppersTab.classList.toggle('active', mode === 'steppers');
        studioTab.classList.toggle('active', mode === 'studio');
        steppersView.classList.toggle('hidden', mode !== 'steppers');
        studioView.classList.toggle('hidden', mode !== 'studio');
    }
}

function setGender(g) {
    hero.gender = g;
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gender === g);
    });
    playSound('click');
    renderHeroSprite('rpg-avatar-canvas', 1.0);
}

function onNameChange(val) {
    const clean = val.trim();
    hero.name = clean || 'GSJustin';
    const previewName = document.getElementById('preview-hero-name');
    if (previewName) previewName.textContent = hero.name;
    const dashName = document.getElementById('dash-hero-name');
    if (dashName) dashName.textContent = hero.name;
}

function stepLifestyle(delta) {
    let idx = LIFESTYLES.findIndex(l => l.name === hero.lifestyle);
    if (idx === -1) idx = 0;
    idx = (idx + delta + LIFESTYLES.length) % LIFESTYLES.length;
    selectLifestyle(LIFESTYLES[idx]);
}

function selectLifestyle(ls) {
    hero.lifestyle = ls.name;
    if (ls.id === 'creator') {
        hero.style = 'Creative';
        hero.top_type = 'Bomber jacket';
        hero.bottom_type = 'Formal trousers';
        hero.shoes_type = 'Formal shoes';
        hero.hair_style = 'Curtains';
        hero.aura = 'Mysterious';
        hero.accessories.face = 'Sunglasses';
        hero.accessories.body = 'None';
    } else if (ls.id === 'fitness') {
        hero.style = 'Athletic';
        hero.top_type = 'Tank top';
        hero.bottom_type = 'Joggers';
        hero.shoes_type = 'Running shoes';
        hero.top_color = '#ef4444';
        hero.hair_style = 'Textured crop';
        hero.accessories.wrist = 'Fitness band';
        hero.accessories.body = 'None';
        hero.accessories.face = 'None';
        hero.accessories.other = 'Water bottle';
        hero.pose = 'Athletic';
        hero.aura = 'Energetic';
    } else if (ls.id === 'student') {
        hero.style = 'Academic';
        hero.top_type = 'Hoodie';
        hero.bottom_type = 'Jeans';
        hero.shoes_type = 'Sneakers';
        hero.top_color = '#6366f1';
        hero.hair_style = 'Side part';
        hero.accessories.face = 'Glasses';
        hero.accessories.body = 'Backpack';
        hero.pose = 'Thinking';
        hero.aura = 'Disciplined';
    } else if (ls.id === 'professional') {
        hero.style = 'Formal';
        hero.top_type = 'Shirt';
        hero.bottom_type = 'Formal trousers';
        hero.shoes_type = 'Formal shoes';
        hero.top_color = '#f8fafc';
        hero.accessories.wrist = 'Smartwatch';
        hero.pose = 'Confident';
        hero.aura = 'Confident';
    } else if (ls.id === 'entrepreneur') {
        hero.style = 'Smart Casual';
        hero.top_type = 'Blazer';
        hero.bottom_type = 'Formal trousers';
        hero.shoes_type = 'Formal shoes';
        hero.accessories.wrist = 'Smartwatch';
        hero.accessories.other = 'Laptop';
        hero.pose = 'Confident';
        hero.aura = 'Leader';
    } else if (ls.id === 'tech') {
        hero.style = 'Tech';
        hero.top_type = 'Hoodie';
        hero.bottom_type = 'Joggers';
        hero.shoes_type = 'Sneakers';
        hero.top_color = '#0f172a';
        hero.accessories.head = 'Headphones';
        hero.accessories.other = 'Laptop';
        hero.aura = 'Disciplined';
    } else if (ls.id === 'gamer') {
        hero.style = 'Streetwear';
        hero.top_type = 'Hoodie';
        hero.bottom_type = 'Joggers';
        hero.shoes_type = 'Sneakers';
        hero.top_color = '#10b981';
        hero.accessories.head = 'Headphones';
        hero.aura = 'Competitive';
    } else if (ls.id === 'traveler' || ls.id === 'adventurer') {
        hero.style = 'Adventurer';
        hero.top_type = 'Adventurer outfit';
        hero.bottom_type = 'Cargo pants';
        hero.shoes_type = 'Boots';
        hero.top_color = '#78350f';
        hero.accessories.body = 'Backpack';
        hero.pose = 'Adventurer';
        hero.aura = 'Adventurous';
    }

    updateUIValues();
    playSound('magic');
}

const STYLE_PRESETS = {
    'Creative': { top: 'Bomber jacket', bot: 'Formal trousers', shoes: 'Formal shoes', hair: 'Curtains', topCol: '#8b5cf6', botCol: '#1e293b', shoeCol: '#18181b', aura: 'Mysterious', gear: 'Sunglasses' },
    'Casual': { top: 'Hoodie', bot: 'Joggers', shoes: 'Sneakers', hair: 'Textured crop', topCol: '#3b82f6', botCol: '#1e293b', shoeCol: '#ffffff', aura: 'Energetic', gear: 'Backpack' },
    'Minimal': { top: 'T-shirt', bot: 'Long pants', shoes: 'Casual shoes', hair: 'Buzz cut', topCol: '#f8fafc', botCol: '#334155', shoeCol: '#0f172a', aura: 'Disciplined', gear: 'None' },
    'Streetwear': { top: 'Oversized T-shirt', bot: 'Cargo pants', shoes: 'Sneakers', hair: 'Side fade', topCol: '#10b981', botCol: '#0f172a', shoeCol: '#ffffff', aura: 'Competitive', gear: 'Cap' },
    'Formal': { top: 'Formal suit', bot: 'Formal trousers', shoes: 'Formal shoes', hair: 'Side part', topCol: '#0f172a', botCol: '#0f172a', shoeCol: '#000000', aura: 'Confident', gear: 'Smartwatch' },
    'Smart Casual': { top: 'Blazer', bot: 'Jeans', shoes: 'Formal shoes', hair: 'Textured crop', topCol: '#1e3a8a', botCol: '#334155', shoeCol: '#78350f', aura: 'Confident', gear: 'Glasses' },
    'Athletic': { top: 'Tank top', bot: 'Athletic shorts', shoes: 'Running shoes', hair: 'Crew cut', topCol: '#ef4444', botCol: '#0f172a', shoeCol: '#38bdf8', aura: 'Energetic', gear: 'Fitness Band' },
    'Sporty': { top: 'Sports jersey', bot: 'Joggers', shoes: 'Basketball shoes', hair: 'Buzz cut', topCol: '#f59e0b', botCol: '#18181b', shoeCol: '#ffffff', aura: 'Energetic', gear: 'Headphones' },
    'Academic': { top: 'Sweatshirt', bot: 'Formal trousers', shoes: 'Casual shoes', hair: 'Middle part', topCol: '#15803d', botCol: '#334155', shoeCol: '#451a03', aura: 'Disciplined', gear: 'Glasses' },
    'Tech': { top: 'Hoodie', bot: 'Joggers', shoes: 'Sneakers', hair: 'Undercut', topCol: '#0f172a', botCol: '#1e293b', shoeCol: '#06b6d4', aura: 'Disciplined', gear: 'Laptop' },
    'Luxury': { top: 'Blazer', bot: 'Formal trousers', shoes: 'Formal shoes', hair: 'Side part', topCol: '#3b0764', botCol: '#18181b', shoeCol: '#000000', aura: 'Confident', gear: 'Smartwatch' },
    'Outdoor': { top: 'Jacket', bot: 'Cargo pants', shoes: 'Boots', hair: 'Short messy', topCol: '#15803d', botCol: '#451a03', shoeCol: '#292524', aura: 'Calm', gear: 'Water Bottle' },
    'Adventurer': { top: 'Adventurer outfit', bot: 'Cargo pants', shoes: 'Boots', hair: 'Layered', topCol: '#78350f', botCol: '#451a03', shoeCol: '#1c1917', aura: 'Adventurous', gear: 'Backpack' },
    'Traditional': { top: 'Traditional-inspired outfit', bot: 'Formal trousers', shoes: 'Sandals', hair: 'Man bun', topCol: '#b91c1c', botCol: '#0f172a', shoeCol: '#1c1917', aura: 'Calm', gear: 'None' },
    'Modern': { top: 'Denim jacket', bot: 'Joggers', shoes: 'Sneakers', hair: 'Curtains', topCol: '#2563eb', botCol: '#0f172a', shoeCol: '#ffffff', aura: 'Confident', gear: 'Sunglasses' },
    'Retro': { top: 'Bomber jacket', bot: 'Jeans', shoes: 'Sneakers', hair: 'Wavy', topCol: '#ea580c', botCol: '#1e3a8a', shoeCol: '#fef08a', aura: 'Friendly', gear: 'Headphones' },
    'Futuristic': { top: 'Hoodie', bot: 'Track pants', shoes: 'Running shoes', hair: 'Spiky', topCol: '#06b6d4', botCol: '#09090b', shoeCol: '#ec4899', aura: 'Mysterious', gear: 'Headphones' }
};

function stepStyle(delta) {
    let idx = STYLES.findIndex(s => s.name === hero.style);
    if (idx === -1) idx = 0;
    idx = (idx + delta + STYLES.length) % STYLES.length;
    applyStylePreset(STYLES[idx].name);
}

function applyStylePreset(styleName) {
    hero.style = styleName;
    const preset = STYLE_PRESETS[styleName];
    if (preset) {
        hero.top_type = preset.top;
        hero.bottom_type = preset.bot;
        hero.shoes_type = preset.shoes;
        hero.hair_style = preset.hair;
        hero.top_color = preset.topCol;
        hero.bottom_color = preset.botCol;
        hero.shoes_color = preset.shoeCol;
        hero.aura = preset.aura;

        hero.accessories = { head: 'None', face: 'None', wrist: 'None', body: 'None', other: 'None' };
        if (preset.gear && preset.gear !== 'None') {
            const match = MAIN_GEAR.find(g => g.label === preset.gear);
            if (match) {
                hero.accessories[match.slot] = match.val;
            }
        }
    }
    updateUIValues();
    playSound('magic');
}

function stepSkin(delta) {
    let idx = SKIN_TONES.indexOf(hero.skin_color);
    if (idx === -1) idx = 0;
    idx = (idx + delta + SKIN_TONES.length) % SKIN_TONES.length;
    hero.skin_color = SKIN_TONES[idx];
    updateUIValues();
    playSound('step');
}

function stepHairColor(delta) {
    let idx = HAIR_COLORS.findIndex(h => h.hex.toLowerCase() === hero.hair_color.toLowerCase());
    if (idx === -1) idx = 0;
    idx = (idx + delta + HAIR_COLORS.length) % HAIR_COLORS.length;
    hero.hair_color = HAIR_COLORS[idx].hex;
    updateUIValues();
    playSound('step');
}

function stepHairStyle(delta) {
    let idx = HAIR_STYLES.indexOf(hero.hair_style);
    if (idx === -1) idx = 0;
    idx = (idx + delta + HAIR_STYLES.length) % HAIR_STYLES.length;
    hero.hair_style = HAIR_STYLES[idx];
    updateUIValues();
    playSound('step');
}

function stepTop(delta) {
    let idx = TOPS.indexOf(hero.top_type);
    if (idx === -1) idx = 0;
    idx = (idx + delta + TOPS.length) % TOPS.length;
    hero.top_type = TOPS[idx];
    updateUIValues();
    playSound('step');
}

function stepBottom(delta) {
    let idx = BOTTOMS.indexOf(hero.bottom_type);
    if (idx === -1) idx = 0;
    idx = (idx + delta + BOTTOMS.length) % BOTTOMS.length;
    hero.bottom_type = BOTTOMS[idx];
    updateUIValues();
    playSound('step');
}

function stepShoes(delta) {
    let idx = SHOES.indexOf(hero.shoes_type);
    if (idx === -1) idx = 0;
    idx = (idx + delta + SHOES.length) % SHOES.length;
    hero.shoes_type = SHOES[idx];
    updateUIValues();
    playSound('step');
}

function getCurrentGearLabel() {
    for (const g of MAIN_GEAR) {
        if (g.val === 'None') continue;
        if (hero.accessories[g.slot] === g.val) return g.label;
    }
    return 'None';
}

function stepMainAccessory(delta) {
    const curLabel = getCurrentGearLabel();
    let idx = MAIN_GEAR.findIndex(g => g.label === curLabel);
    if (idx === -1) idx = 0;
    idx = (idx + delta + MAIN_GEAR.length) % MAIN_GEAR.length;
    const selected = MAIN_GEAR[idx];

    // Reset accessories
    hero.accessories = { head: 'None', face: 'None', wrist: 'None', body: 'None', other: 'None' };
    if (selected.val !== 'None') {
        hero.accessories[selected.slot] = selected.val;
    }

    updateUIValues();
    playSound('step');
}

function stepAura(delta) {
    let idx = AURAS.findIndex(a => a.id === hero.aura || a.name === hero.aura);
    if (idx === -1) idx = 0;
    idx = (idx + delta + AURAS.length) % AURAS.length;
    hero.aura = AURAS[idx].id;
    updateUIValues();
    playSound('step');
}

function stepCompanion(delta) {
    let idx = COMPANIONS.findIndex(c => c.id === hero.companion || c.name === hero.companion);
    if (idx === -1) idx = 0;
    idx = (idx + delta + COMPANIONS.length) % COMPANIONS.length;
    hero.companion = COMPANIONS[idx].id;
    updateUIValues();
    playSound('step');
}

function applyPalette(pal) {
    hero.palette = pal.id;
    if (pal.colors.length >= 4) {
        hero.jacket_color = pal.colors[0];
        hero.bottom_color = pal.colors[1];
        hero.top_color = pal.colors[2];
        hero.shoes_color = pal.colors[3];
    }
    updateUIValues();
    playSound('magic');
}

// =============================================================================
// UI SYNC & LIVE PREVIEW DATA
// =============================================================================

function updateUIValues() {
    setText('lifestyle-display', hero.lifestyle);
    setText('style-display', hero.style);
    setText('hair-style-val', hero.hair_style);
    setText('top-val', hero.top_type);
    setText('bottom-val', hero.bottom_type);
    setText('shoes-val', hero.shoes_type);
    setText('main-acc-val', getCurrentGearLabel());

    const auraObj = AURAS.find(a => a.id === hero.aura) || AURAS[0];
    setText('aura-val', `${auraObj.icon} ${auraObj.name}`);

    const compObj = COMPANIONS.find(c => c.id === hero.companion) || COMPANIONS[0];
    setText('companion-val', `${compObj.icon} ${compObj.name}`);

    // Color square previews (matching reference image)
    const skinSquare = document.getElementById('skin-preview-square');
    if (skinSquare) skinSquare.style.background = hero.skin_color;

    const hairSquare = document.getElementById('hair-preview-square');
    if (hairSquare) hairSquare.style.background = hero.hair_color;

    // Resource bar, preview banner & dashboard sync
    const goldFormatted = (hero.gold != null ? hero.gold : 1000).toLocaleString();
    setText('top-gold-display', goldFormatted);
    setText('top-energy-display', `${hero.energy || 100}/100`);
    setText('top-health-display', `${hero.health || 100}/100`);

    setText('preview-gold', goldFormatted);
    setText('preview-level', hero.level || 1);
    setText('preview-hero-name', hero.name);
    setText('preview-hero-title', `"${hero.title}"`);

    const nameInput = document.getElementById('char-name-input');
    if (nameInput && document.activeElement !== nameInput) {
        nameInput.value = hero.name;
    }

    setText('dash-hero-name', hero.name);
    setText('dash-hero-title', `Level ${hero.level || 1} ${hero.title}`);
    setText('dash-gold-val', goldFormatted);

    // Gender Active Highlights
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.gender === hero.gender);
    });

    // Studio Grid Active Highlights
    document.querySelectorAll('#expression-grid .grid-btn-retro').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.trim() === hero.expression);
    });
    document.querySelectorAll('#bodytype-grid .grid-btn-retro').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.trim() === hero.body_type);
    });
    document.querySelectorAll('#pose-grid .grid-btn-retro').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.includes(hero.pose));
    });
    document.querySelectorAll('#palette-grid .palette-card').forEach(c => {
        c.classList.toggle('active', c.querySelector('.palette-name')?.textContent === hero.palette);
    });
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// =============================================================================
// RANDOMIZER ENGINE
// =============================================================================

function randomizeCharacter() {
    playSound('random');

    hero.gender = ['M', 'X', 'F'][Math.floor(Math.random() * 3)];
    setGender(hero.gender);

    hero.title = TITLES[Math.floor(Math.random() * TITLES.length)];
    hero.lifestyle = LIFESTYLES[Math.floor(Math.random() * LIFESTYLES.length)].name;
    hero.style = STYLES[Math.floor(Math.random() * STYLES.length)].name;
    hero.skin_color = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
    hero.hair_style = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)];
    hero.hair_color = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex;

    const pal = PALETTES[Math.floor(Math.random() * PALETTES.length)];
    hero.palette = pal.id;
    hero.top_type = TOPS[Math.floor(Math.random() * TOPS.length)];
    hero.bottom_type = BOTTOMS[Math.floor(Math.random() * BOTTOMS.length)];
    hero.shoes_type = SHOES[Math.floor(Math.random() * SHOES.length)];
    hero.top_color = pal.colors[2];
    hero.bottom_color = pal.colors[1];
    hero.shoes_color = pal.colors[3];

    const randomGear = MAIN_GEAR[Math.floor(Math.random() * MAIN_GEAR.length)];
    hero.accessories = { head: 'None', face: 'None', wrist: 'None', body: 'None', other: 'None' };
    if (randomGear.val !== 'None') {
        hero.accessories[randomGear.slot] = randomGear.val;
    }

    hero.aura = AURAS[Math.floor(Math.random() * AURAS.length)].id;
    hero.pose = POSES[Math.floor(Math.random() * POSES.length)].id;
    hero.companion = COMPANIONS[Math.floor(Math.random() * COMPANIONS.length)].id;

    updateUIValues();
}

// =============================================================================
// ✨ "BUILD MY STYLE" AI WIZARD
// =============================================================================

let currentAiRec = null;

function openAiStyleModal() {
    playSound('tab');
    document.getElementById('ai-style-modal')?.classList.remove('hidden');
    document.getElementById('ai-rec-card')?.classList.add('hidden');
}

function closeAiStyleModal() {
    playSound('click');
    document.getElementById('ai-style-modal')?.classList.add('hidden');
}

function selectAiGoal(goal) {
    playSound('magic');
    currentAiRec = goal;
    document.querySelectorAll('.goal-card').forEach(c => {
        c.classList.toggle('active', c.querySelector('.goal-label')?.textContent === goal.label);
    });

    const card = document.getElementById('ai-rec-card');
    const details = document.getElementById('ai-rec-details');
    if (card && details) {
        card.classList.remove('hidden');
        details.innerHTML = `
            <p><strong>Recommended Style:</strong> ${goal.style}</p>
            <p><strong>Attire:</strong> ${goal.top} + ${goal.bottom} + ${goal.shoes}</p>
            <p><strong>Hairstyle:</strong> ${goal.hair} | <strong>Aura:</strong> ${goal.aura}</p>
            <p><strong>Signature Gear:</strong> ${goal.gear || 'None'}</p>
            <p style="margin-top:8px; color:#ffde59; font-style:italic;">"${goal.why}"</p>
        `;
    }
}

function applyAiRecommendation() {
    if (!currentAiRec) return;
    playSound('victory');
    const g = currentAiRec;
    hero.lifestyle = LIFESTYLES.find(l => l.id === g.preset)?.name || hero.lifestyle;
    hero.style = g.style;
    hero.top_type = g.top;
    hero.bottom_type = g.bottom;
    hero.shoes_type = g.shoes;
    hero.hair_style = g.hair;
    hero.aura = g.aura;
    hero.pose = g.pose;

    hero.accessories = { head: 'None', face: 'None', wrist: 'None', body: 'None', other: 'None' };
    if (g.gear && g.gear !== 'None') {
        const match = MAIN_GEAR.find(gear => gear.label === g.gear);
        if (match) {
            hero.accessories[match.slot] = match.val;
        }
    }

    updateUIValues();
    closeAiStyleModal();
}

// =============================================================================
// PROGRESSION ROADMAP MODAL
// =============================================================================

function openProgressionModal() {
    playSound('tab');
    document.getElementById('progression-modal')?.classList.remove('hidden');
}

function closeProgressionModal() {
    playSound('click');
    document.getElementById('progression-modal')?.classList.add('hidden');
}

// =============================================================================
// LAYERED PIXEL ART SPRITE RENDERER (CANVAS ENGINE)
// =============================================================================

let animFrame = 0;

function startCanvasAnimationLoop() {
    function loop() {
        animFrame++;
        renderHeroSprite('rpg-avatar-canvas', 1.0);
        renderAuraParticles();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

function renderAuraParticles() {
    const layer = document.getElementById('aura-particles-layer');
    if (!layer) return;
    if (animFrame % 5 !== 0) return;

    const p = document.createElement('div');
    const auraObj = AURAS.find(a => a.id === hero.aura) || AURAS[0];
    const size = 3 + Math.floor(Math.random() * 5);
    p.style.position = 'absolute';
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    
    // Mysterious void particle vs regular colored aura
    if (hero.aura === 'Mysterious') {
        p.style.backgroundColor = Math.random() > 0.5 ? '#a855f7' : '#3b0764';
        p.style.boxShadow = '0 0 10px #9333ea, 0 0 4px #000';
    } else {
        p.style.backgroundColor = auraObj.color;
        p.style.boxShadow = `0 0 8px ${auraObj.color}`;
    }
    
    p.style.borderRadius = '50%';
    p.style.left = `${70 + Math.random() * 80}px`;
    p.style.bottom = `${35 + Math.random() * 45}px`;
    p.style.opacity = '0.95';
    p.style.transition = 'all 1.3s ease-out';
    p.style.pointerEvents = 'none';

    layer.appendChild(p);

    setTimeout(() => {
        p.style.transform = `translateY(-${70 + Math.random() * 80}px) scale(0.2)`;
        p.style.opacity = '0';
    }, 20);

    setTimeout(() => {
        p.remove();
    }, 1350);
}

/**
 * HIGH-DEFINITION 16-BIT PIXEL ART SPRITE RENDERER
 * Supports detailed rendering for every Hairstyle, Top, Bottom, Shoes, Accessory & Pet.
 */
function renderHeroSprite(canvasId, scaleFactor = 1.0) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const breathing = Math.sin(animFrame * 0.05) * 1.5;
    const isBlinking = (animFrame % 140 > 132);

    const cx = canvas.width / 2;
    const cy = canvas.height * 0.72 + (hero.height === 'Short' ? 8 : hero.height === 'Tall' ? -8 : 0);
    const pixelSize = 4 * scaleFactor;

    function pxRect(x, y, w, h, fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(Math.round(cx + x * pixelSize), Math.round(cy + y * pixelSize), Math.round(w * pixelSize), Math.round(h * pixelSize));
    }

    // ==========================================
    // 1. AURA BACK GLOW
    // ==========================================
    const auraObj = AURAS.find(a => a.id === hero.aura) || AURAS[0];
    const auraPulse = Math.sin(animFrame * 0.08) * 5;
    
    if (hero.aura === 'Mysterious') {
        const grad = ctx.createRadialGradient(cx, cy - 20 * pixelSize, 5, cx, cy - 20 * pixelSize, 60 + auraPulse);
        grad.addColorStop(0, '#581c87cc');
        grad.addColorStop(0.5, '#3b076466');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy - 20 * pixelSize, 60 + auraPulse, 0, Math.PI * 2);
        ctx.fill();
    } else {
        const grad = ctx.createRadialGradient(cx, cy - 20 * pixelSize, 10, cx, cy - 20 * pixelSize, 55 + auraPulse);
        grad.addColorStop(0, auraObj.color + '55');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy - 20 * pixelSize, 55 + auraPulse, 0, Math.PI * 2);
        ctx.fill();
    }

    // ==========================================
    // 2. COMPANION (Familiar Pet)
    // ==========================================
    if (hero.companion && hero.companion !== 'None') {
        const petBob = Math.sin(animFrame * 0.1) * 2;
        const petX = 14;
        const petY = -10 + petBob;
        const comp = hero.companion;

        if (comp === 'Dog') {
            pxRect(petX, petY, 7, 6, '#d97706');
            pxRect(petX - 1, petY + 1, 2, 4, '#92400e'); // floppy ear
            pxRect(petX + 6, petY + 2, 2, 2, '#18181b'); // black snout
            pxRect(petX + 1, petY + 6, 2, 4, '#d97706'); // front paws
            pxRect(petX + 5, petY + 6, 2, 4, '#d97706'); // back paws
            pxRect(petX - 3, petY + 1 + Math.sin(animFrame * 0.25) * 2, 2, 3, '#f59e0b'); // wagging tail
            pxRect(petX + 2, petY + 3, 3, 1, '#dc2626'); // red collar
            pxRect(petX + 3, petY + 4, 1, 1, '#facc15'); // gold collar tag
        } else if (comp === 'Cat') {
            pxRect(petX, petY, 6, 5, '#ea580c');
            pxRect(petX, petY - 2, 2, 2, '#9a3412'); // pointed ears
            pxRect(petX + 4, petY - 2, 2, 2, '#9a3412');
            pxRect(petX + 4, petY + 1, 1, 1, '#22c55e'); // emerald eye
            pxRect(petX - 3, petY - 1, 2, 5, '#ea580c'); // curled tail
        } else if (comp === 'Robot') {
            pxRect(petX, petY - 4, 6, 6, '#94a3b8');
            pxRect(petX + 1, petY - 2, 4, 2, '#38bdf8'); // glowing visor
            pxRect(petX + 2, petY - 6, 2, 2, '#ef4444'); // antenna bulb
            pxRect(petX + 1, petY + 2, 4, 4, '#475569');
            pxRect(petX + 2, petY + 6, 2, 2 + Math.abs(Math.sin(animFrame * 0.3) * 2), '#06b6d4'); // plasma thruster
        } else if (comp === 'Dragon') {
            pxRect(petX, petY - 3, 7, 6, '#15803d');
            pxRect(petX + 5, petY - 5, 2, 2, '#eab308'); // gold horn
            pxRect(petX - 3, petY - 2, 3, 4, '#166534'); // bat wing
            pxRect(petX + 5, petY, 1, 1, '#ef4444'); // fiery eye
            pxRect(petX + 7, petY + 2, 2, 1, '#f97316'); // fire smoke puff
        } else if (comp === 'Fox') {
            pxRect(petX, petY - 2, 7, 5, '#ea580c');
            pxRect(petX, petY - 4, 2, 2, '#18181b'); // black ear tips
            pxRect(petX + 5, petY - 4, 2, 2, '#18181b');
            pxRect(petX + 5, petY, 2, 2, '#ffffff'); // white muzzle
            pxRect(petX - 5, petY - 2, 5, 5, '#ea580c'); // huge bushy tail
            pxRect(petX - 6, petY - 2, 2, 2, '#ffffff'); // white tail tip
        } else if (comp === 'Bird') {
            pxRect(petX, petY - 10, 5, 5, '#38bdf8');
            pxRect(petX + 5, petY - 9, 2, 2, '#f59e0b'); // gold beak
            pxRect(petX - 2, petY - 11, 3, 3, '#0284c7'); // flapping wing
        } else if (comp === 'Fairy') {
            pxRect(petX + 1, petY - 6, 4, 4, '#fbcfe8');
            pxRect(petX - 2, petY - 8, 3, 4, '#c084fc'); // sparkling wing
            pxRect(petX + 5, petY - 8, 3, 4, '#c084fc');
        }
    }

    // ==========================================
    // 3. LEGS & BOTTOMS (Pants, Trousers, Shorts)
    // ==========================================
    let legWidth = 2.5;
    let lLegX = -4.5;
    let rLegX = 1.5;

    if (hero.body_type === 'Slim') {
        legWidth = 2.0;
        lLegX = -3.8;
        rLegX = 1.8;
    } else if (hero.body_type === 'Athletic') {
        legWidth = 2.8;
        lLegX = -4.8;
        rLegX = 2.0;
    } else if (hero.body_type === 'Muscular') {
        legWidth = 3.5;
        lLegX = -5.5;
        rLegX = 2.0;
    } else if (hero.body_type === 'Broad') {
        legWidth = 3.8;
        lLegX = -5.8;
        rLegX = 2.0;
    }

    const botCol = hero.bottom_color;
    const botType = hero.bottom_type;

    if (botType === 'Formal trousers') {
        // Crisp ironed crease line down center, tailored belt waist
        pxRect(lLegX, -10, legWidth, 11, botCol);
        pxRect(rLegX, -10, legWidth, 11, botCol);
        // Center pressed crease highlight
        pxRect(lLegX + 1, -9, 0.8, 10, adjustColor(botCol, 25));
        pxRect(rLegX + 1, -9, 0.8, 10, adjustColor(botCol, 25));
        // Belt line & shiny buckle
        pxRect(-5, -11, 10, 1.5, '#090d15');
        pxRect(-0.5, -11, 1, 1.5, '#facc15');
    } else if (botType === 'Joggers') {
        // Bunched fabric with elastic tapered ankle cuffs
        pxRect(lLegX - 0.5, -10, legWidth + 1, 9, botCol);
        pxRect(rLegX - 0.5, -10, legWidth + 1, 9, botCol);
        // Knee gather wrinkles
        pxRect(lLegX - 0.5, -5, legWidth + 1, 1, adjustColor(botCol, -15));
        pxRect(rLegX - 0.5, -5, legWidth + 1, 1, adjustColor(botCol, -15));
        // Tight ribbed elastic cuffs
        pxRect(lLegX, -1, legWidth, 2, adjustColor(botCol, -25));
        pxRect(rLegX, -1, legWidth, 2, adjustColor(botCol, -25));
    } else if (botType === 'Jeans') {
        // Classic denim wash with thigh fade & orange stitch rivets
        pxRect(lLegX, -10, legWidth, 11, botCol);
        pxRect(rLegX, -10, legWidth, 11, botCol);
        // Thigh fade wash
        pxRect(lLegX + 0.5, -8, legWidth - 1, 4, adjustColor(botCol, 30));
        pxRect(rLegX + 0.5, -8, legWidth - 1, 4, adjustColor(botCol, 30));
        // Rivet dots
        pxRect(lLegX - 0.5, -10, 0.8, 0.8, '#f59e0b');
        pxRect(rLegX + legWidth - 0.3, -10, 0.8, 0.8, '#f59e0b');
    } else if (botType === 'Cargo pants') {
        // Bulky 3D flap pockets on outer thigh sides
        pxRect(lLegX, -10, legWidth, 11, botCol);
        pxRect(rLegX, -10, legWidth, 11, botCol);
        // Outer flap pockets
        pxRect(lLegX - 1.5, -7, 2, 4, adjustColor(botCol, -15));
        pxRect(rLegX + legWidth - 0.5, -7, 2, 4, adjustColor(botCol, -15));
        // Pocket flap buttons
        pxRect(lLegX - 1, -7, 1, 1, '#18181b');
        pxRect(rLegX + legWidth, -7, 1, 1, '#18181b');
    } else if (botType === 'Track pants') {
        pxRect(lLegX, -10, legWidth, 11, botCol);
        pxRect(rLegX, -10, legWidth, 11, botCol);
        // Bold double athletic side stripes
        pxRect(lLegX - 0.5, -10, 0.8, 11, '#ffffff');
        pxRect(rLegX + legWidth - 0.3, -10, 0.8, 11, '#ffffff');
    } else if (botType === 'Athletic shorts' || botType === 'Shorts') {
        pxRect(lLegX, -10, legWidth + 0.5, 4.5, botCol);
        pxRect(rLegX, -10, legWidth + 0.5, 4.5, botCol);
        // Exposed muscular/toned leg skin
        pxRect(lLegX, -5.5, legWidth, 6.5, hero.skin_color);
        pxRect(rLegX, -5.5, legWidth, 6.5, hero.skin_color);
        if (botType === 'Athletic shorts') {
            pxRect(lLegX, -6, legWidth + 0.5, 0.8, '#ffffff'); // athletic hem border
            pxRect(rLegX, -6, legWidth + 0.5, 0.8, '#ffffff');
        }
    } else if (botType === 'Skirt') {
        pxRect(-5, -10, 10, 5, botCol);
        pxRect(-5.5, -5, 11, 1.5, adjustColor(botCol, 15)); // pleated hem
        pxRect(lLegX, -3.5, legWidth, 4.5, hero.skin_color);
        pxRect(rLegX, -3.5, legWidth, 4.5, hero.skin_color);
    } else {
        // Standard long pants / chinos
        pxRect(lLegX, -10, legWidth, 11, botCol);
        pxRect(rLegX, -10, legWidth, 11, botCol);
    }

    // ==========================================
    // 4. SHOES / FOOTWEAR
    // ==========================================
    const shoeCol = hero.shoes_color;
    const shoeType = hero.shoes_type;

    if (shoeType === 'Formal shoes') {
        // Polished dress shoes with shiny toe gloss and low heel
        pxRect(lLegX - 0.5, 1, legWidth + 1.2, 3, shoeCol);
        pxRect(rLegX - 0.5, 1, legWidth + 1.2, 3, shoeCol);
        // Pointed glossy toe cap highlight
        pxRect(lLegX + legWidth - 0.5, 1.2, 1.2, 1, '#ffffff');
        pxRect(rLegX + legWidth - 0.5, 1.2, 1.2, 1, '#ffffff');
        // Black dress sole & heel block
        pxRect(lLegX - 0.5, 3.5, legWidth + 1.2, 1, '#05070a');
        pxRect(rLegX - 0.5, 3.5, legWidth + 1.2, 1, '#05070a');
        pxRect(lLegX - 0.5, 4.2, 1.2, 0.8, '#05070a'); // heel
        pxRect(rLegX - 0.5, 4.2, 1.2, 0.8, '#05070a');
    } else if (shoeType === 'Sneakers') {
        // Retro low-top with white rubber toe cap, laces & side stripe
        pxRect(lLegX - 0.5, 1, legWidth + 1, 3, shoeCol);
        pxRect(rLegX - 0.5, 1, legWidth + 1, 3, shoeCol);
        // White rubber toe bumper
        pxRect(lLegX + legWidth - 0.5, 2, 1.2, 2, '#ffffff');
        pxRect(rLegX + legWidth - 0.5, 2, 1.2, 2, '#ffffff');
        // White laces & sole
        pxRect(lLegX + 0.5, 1.2, 1.5, 0.8, '#ffffff');
        pxRect(rLegX + 0.5, 1.2, 1.5, 0.8, '#ffffff');
        pxRect(lLegX - 0.5, 3.5, legWidth + 1.2, 1, '#ffffff');
        pxRect(rLegX - 0.5, 3.5, legWidth + 1.2, 1, '#ffffff');
    } else if (shoeType === 'Running shoes') {
        // Aerodynamic wedge sole with neon accent
        pxRect(lLegX - 0.5, 1, legWidth + 1, 2.5, shoeCol);
        pxRect(rLegX - 0.5, 1, legWidth + 1, 2.5, shoeCol);
        pxRect(lLegX - 0.5, 3.2, legWidth + 1.2, 1.3, '#38bdf8'); // curved foam sole
        pxRect(rLegX - 0.5, 3.2, legWidth + 1.2, 1.3, '#38bdf8');
    } else if (shoeType === 'Basketball shoes') {
        // High-top wrapping ankles
        pxRect(lLegX - 0.5, -1, legWidth + 1, 5, shoeCol);
        pxRect(rLegX - 0.5, -1, legWidth + 1, 5, shoeCol);
        pxRect(lLegX + 0.5, 0, 1.5, 2, '#facc15'); // tongue accent
        pxRect(rLegX + 0.5, 0, 1.5, 2, '#facc15');
        pxRect(lLegX - 0.5, 3.5, legWidth + 1.2, 1, '#ffffff'); // thick sole
        pxRect(rLegX - 0.5, 3.5, legWidth + 1.2, 1, '#ffffff');
    } else if (shoeType === 'Boots') {
        // Tall rugged combat boots with brass eyelets
        pxRect(lLegX - 0.8, -2, legWidth + 1.5, 6, shoeCol);
        pxRect(rLegX - 0.8, -2, legWidth + 1.5, 6, shoeCol);
        pxRect(lLegX, -1, 1, 3, '#f59e0b'); // eyelets
        pxRect(rLegX, -1, 1, 3, '#f59e0b');
        pxRect(lLegX - 0.8, 3.5, legWidth + 1.5, 1.2, '#0c0a09'); // deep lug tread
        pxRect(rLegX - 0.8, 3.5, legWidth + 1.5, 1.2, '#0c0a09');
    } else if (shoeType === 'Sandals') {
        pxRect(lLegX - 0.5, 2, legWidth + 1, 1.5, hero.skin_color);
        pxRect(rLegX - 0.5, 2, legWidth + 1, 1.5, hero.skin_color);
        pxRect(lLegX - 0.5, 1.5, legWidth + 1, 0.8, '#451a03'); // straps
        pxRect(rLegX - 0.5, 1.5, legWidth + 1, 0.8, '#451a03');
        pxRect(lLegX - 0.5, 3.5, legWidth + 1, 1, '#1c1917');
        pxRect(rLegX - 0.5, 3.5, legWidth + 1, 1, '#1c1917');
    } else {
        // Casual slip-ons
        pxRect(lLegX - 0.5, 1.5, legWidth + 1, 2.5, shoeCol);
        pxRect(rLegX - 0.5, 1.5, legWidth + 1, 2.5, shoeCol);
        pxRect(lLegX - 0.5, 3.5, legWidth + 1, 1, '#e2e8f0');
        pxRect(rLegX - 0.5, 3.5, legWidth + 1, 1, '#e2e8f0');
    }

    // ==========================================
    // 5. TORSO & BODY CHEST (Dynamic Proportions by Gender & Build)
    // ==========================================
    let torsoW = 10;
    let torsoX = -5;
    let armW = 2.5;

    if (hero.gender === 'F') {
        torsoW = 9;
        torsoX = -4.5;
        armW = 2.2;
        if (hero.body_type === 'Slim') {
            torsoW = 7.5;
            torsoX = -3.75;
            armW = 1.8;
        } else if (hero.body_type === 'Athletic') {
            torsoW = 9.5;
            torsoX = -4.75;
            armW = 2.5;
        } else if (hero.body_type === 'Muscular') {
            torsoW = 11.5;
            torsoX = -5.75;
            armW = 3.2;
        } else if (hero.body_type === 'Broad') {
            torsoW = 12.5;
            torsoX = -6.25;
            armW = 3.2;
        }
    } else if (hero.gender === 'X') {
        torsoW = 9.5;
        torsoX = -4.75;
        armW = 2.4;
        if (hero.body_type === 'Slim') {
            torsoW = 7.8;
            torsoX = -3.9;
            armW = 1.9;
        } else if (hero.body_type === 'Athletic') {
            torsoW = 10.5;
            torsoX = -5.25;
            armW = 2.8;
        } else if (hero.body_type === 'Muscular') {
            torsoW = 12.2;
            torsoX = -6.1;
            armW = 3.5;
        } else if (hero.body_type === 'Broad') {
            torsoW = 13.2;
            torsoX = -6.6;
            armW = 3.4;
        }
    } else {
        // Default Male (M)
        if (hero.body_type === 'Slim') {
            torsoW = 8;
            torsoX = -4;
            armW = 2.0;
        } else if (hero.body_type === 'Athletic') {
            torsoW = 11;
            torsoX = -5.5;
            armW = 3.0;
        } else if (hero.body_type === 'Muscular') {
            torsoW = 13;
            torsoX = -6.5;
            armW = 3.8;
        } else if (hero.body_type === 'Broad') {
            torsoW = 14;
            torsoX = -7;
            armW = 3.5;
        }
    }

    const torsoY = -21 + (breathing * 0.4);

    pxRect(torsoX, torsoY, torsoW, 11, hero.skin_color);

    // Muscular / Athletic chest shading
    if (hero.body_type === 'Muscular' || hero.body_type === 'Broad') {
        pxRect(torsoX + 1, torsoY + 4, torsoW - 2, 1, adjustColor(hero.skin_color, -20)); // pec line
        pxRect(-0.5, torsoY + 4, 1, 6, adjustColor(hero.skin_color, -20)); // sternum/ab line
    }

    const topCol = hero.top_color;
    const topType = hero.top_type;

    if (topType === 'Bomber jacket') {
        // Puffed jacket body + dark ribbed collar + shiny silver zip + side flap pockets + inner shirt
        pxRect(torsoX - 1, torsoY, torsoW + 2, 11, topCol);
        // Inner shirt V opening
        pxRect(torsoX + (torsoW/2 - 1.5), torsoY + 1, 3, 5, '#ffffff');
        // Ribbed collar & waist trim
        pxRect(torsoX - 0.5, torsoY, torsoW + 1, 1.5, '#18181b');
        pxRect(torsoX - 1, torsoY + 9.5, torsoW + 2, 1.5, '#18181b');
        // Metal center zipper
        pxRect(torsoX + (torsoW/2 - 0.5), torsoY + 1, 1, 9, '#cbd5e1');
        // Zipper pull tab
        pxRect(torsoX + (torsoW/2 - 0.8), torsoY + 4, 1.6, 1.2, '#facc15');
        // Angled side pocket flaps
        pxRect(torsoX + 0.5, torsoY + 6, 2.5, 1.5, adjustColor(topCol, -30));
        pxRect(torsoX + torsoW - 3, torsoY + 6, 2.5, 1.5, adjustColor(topCol, -30));
    } else if (topType === 'Hoodie') {
        pxRect(torsoX, torsoY + 1, torsoW, 10, topCol);
        // Kangaroo pouch pocket
        pxRect(torsoX + 2, torsoY + 6, torsoW - 4, 4, adjustColor(topCol, -20));
        // Hanging white hood drawstrings
        pxRect(torsoX + 3, torsoY + 2, 0.8, 4, '#ffffff');
        pxRect(torsoX + torsoW - 3.8, torsoY + 2, 0.8, 4, '#ffffff');
        // Hood collar fold
        pxRect(torsoX + 1, torsoY, torsoW - 2, 1.5, adjustColor(topCol, 20));
    } else if (topType === 'T-shirt') {
        pxRect(torsoX, torsoY + 1, torsoW, 10, topCol);
        // Crew neckline
        pxRect(torsoX + (torsoW/2 - 2), torsoY + 1, 4, 1.5, adjustColor(topCol, -25));
    } else if (topType === 'Oversized T-shirt') {
        pxRect(torsoX - 1.5, torsoY + 1, torsoW + 3, 11, topCol);
        pxRect(torsoX + (torsoW/2 - 2.5), torsoY + 1, 5, 1.5, adjustColor(topCol, -20));
    } else if (topType === 'Shirt') {
        pxRect(torsoX, torsoY + 1, torsoW, 10, topCol);
        // Collar points
        pxRect(torsoX + (torsoW/2 - 2.5), torsoY, 2, 2, adjustColor(topCol, 30));
        pxRect(torsoX + (torsoW/2 + 0.5), torsoY, 2, 2, adjustColor(topCol, 30));
        // Button strip & buttons
        pxRect(torsoX + (torsoW/2 - 0.5), torsoY + 1, 1, 10, adjustColor(topCol, -15));
        pxRect(torsoX + (torsoW/2 - 0.5), torsoY + 3, 1, 1, '#ffffff');
        pxRect(torsoX + (torsoW/2 - 0.5), torsoY + 6, 1, 1, '#ffffff');
    } else if (topType === 'Blazer') {
        pxRect(torsoX, torsoY + 1, torsoW, 10, topCol);
        // Deep V inner white dress shirt + dark red tie
        pxRect(torsoX + (torsoW/2 - 1.5), torsoY + 1, 3, 7, '#ffffff');
        pxRect(torsoX + (torsoW/2 - 0.5), torsoY + 2, 1, 6, '#b91c1c'); // red tie
        // Lapels
        pxRect(torsoX + (torsoW/2 - 3), torsoY + 1, 1.5, 6, adjustColor(topCol, -25));
        pxRect(torsoX + (torsoW/2 + 1.5), torsoY + 1, 1.5, 6, adjustColor(topCol, -25));
    } else if (topType === 'Formal suit') {
        pxRect(torsoX, torsoY + 1, torsoW, 10, topCol);
        pxRect(torsoX + (torsoW/2 - 1.5), torsoY + 1, 3, 5, '#ffffff');
        pxRect(torsoX + (torsoW/2 - 0.5), torsoY + 2, 1, 4, '#18181b'); // black bow/tie
        pxRect(torsoX + 2, torsoY + 4, 1, 1, '#facc15'); // gold button
        pxRect(torsoX + torsoW - 3, torsoY + 4, 1, 1, '#facc15');
        pxRect(torsoX + 1.5, torsoY + 2.5, 2, 0.8, '#ffffff'); // pocket square
    } else if (topType === 'Tank top') {
        pxRect(torsoX + 1.5, torsoY + 2, torsoW - 3, 9, topCol);
    } else if (topType === 'Sports jersey') {
        pxRect(torsoX, torsoY + 1, torsoW, 10, topCol);
        pxRect(torsoX, torsoY + 4, torsoW, 2, '#ffffff'); // athletic chest stripe
        pxRect(torsoX + (torsoW/2 - 1), torsoY + 4, 2, 2, '#000000'); // jersey number
    } else if (topType === 'Denim jacket') {
        pxRect(torsoX - 0.5, torsoY + 1, torsoW + 1, 10, topCol);
        pxRect(torsoX + 1.5, torsoY + 4, 2.5, 2.5, adjustColor(topCol, -20)); // twin chest pockets
        pxRect(torsoX + torsoW - 4, torsoY + 4, 2.5, 2.5, adjustColor(topCol, -20));
        pxRect(torsoX + (torsoW/2 - 0.5), torsoY + 1, 1, 10, adjustColor(topCol, 30)); // stitch line
    } else if (topType === 'Adventurer outfit') {
        pxRect(torsoX, torsoY + 1, torsoW, 10, topCol);
        // Leather cross harness belts & brass buckles
        pxRect(torsoX, torsoY + 1, torsoW, 1, '#78350f');
        pxRect(torsoX + 1, torsoY + 1, 2, 9, '#78350f');
        pxRect(torsoX + torsoW - 3, torsoY + 1, 2, 9, '#78350f');
        pxRect(torsoX + (torsoW/2 - 1), torsoY + 5, 2, 2, '#facc15'); // brass buckle
    } else {
        pxRect(torsoX, torsoY + 1, torsoW, 10, topCol);
    }

    // ==========================================
    // 6. ARMS & POSES (8 Distinct Poses)
    // ==========================================
    const lArmX = torsoX - armW;
    const rArmX = torsoX + torsoW;

    if (hero.pose === 'Hands-on-hips') {
        // Both arms bent 45 degrees out with hands firmly on hips
        pxRect(lArmX - 2, torsoY + 2, armW, 5, topCol);
        pxRect(lArmX - 3, torsoY + 6, armW + 1, 3, hero.skin_color);
        pxRect(rArmX + 2, torsoY + 2, armW, 5, topCol);
        pxRect(rArmX + 2, torsoY + 6, armW + 1, 3, hero.skin_color);
    } else if (hero.pose === 'Victory') {
        // Both arms raised high in triumphant V shape
        pxRect(lArmX - 1, torsoY - 6, armW, 8, topCol);
        pxRect(lArmX - 2, torsoY - 9, armW + 1, 3.5, hero.skin_color);
        pxRect(rArmX + 1, torsoY - 6, armW, 8, topCol);
        pxRect(rArmX + 1, torsoY - 9, armW + 1, 3.5, hero.skin_color);
    } else if (hero.pose === 'Thinking') {
        // Left arm folded across waist, right hand touching chin
        pxRect(torsoX - 1, torsoY + 7, torsoW + 2, armW, topCol);
        pxRect(rArmX - 1, torsoY + 2, armW, 5, topCol);
        pxRect(headX + 4.5, headY + 8, 3, 2.5, hero.skin_color);
    } else if (hero.pose === 'Athletic') {
        // Runner / sprint ready stride: left arm pumped forward, right arm back
        pxRect(lArmX - 3, torsoY + 2, armW + 3, 3, topCol);
        pxRect(lArmX - 5, torsoY + 1, 3, 3, hero.skin_color);
        pxRect(rArmX + 1, torsoY + 4, armW + 2, 3, topCol);
        pxRect(rArmX + 3, torsoY + 6, 3, 3, hero.skin_color);
    } else if (hero.pose === 'Relaxed') {
        // Left hand casually behind back, right arm relaxed at side
        pxRect(lArmX - 1, torsoY + 2, armW, 6, topCol);
        pxRect(lArmX + 0.5, torsoY + 7, 2, 2, hero.skin_color);
        pxRect(rArmX, torsoY + 2, armW, 8, topCol);
        pxRect(rArmX, torsoY + 9, armW, 3, hero.skin_color);
    } else if (hero.pose === 'Adventurer') {
        // Left hand gripping utility chest harness strap, right hand forward holding compass/gear
        pxRect(lArmX, torsoY + 2, armW, 6, topCol);
        pxRect(torsoX + 1, torsoY + 5, 2.5, 2.5, hero.skin_color);
        pxRect(rArmX + 1, torsoY + 2, armW, 6, topCol);
        pxRect(rArmX + 2, torsoY + 6, 3, 3, '#f59e0b');
    } else if (hero.pose === 'Standing') {
        // Classic neutral RPG stance straight down
        pxRect(lArmX, torsoY + 2, armW, 8, topCol);
        pxRect(lArmX, torsoY + 9, armW, 2.5, hero.skin_color);
        pxRect(rArmX, torsoY + 2, armW, 8, topCol);
        pxRect(rArmX, torsoY + 9, armW, 2.5, hero.skin_color);
    } else {
        // Confident: left hand resting on hip, right arm relaxed
        pxRect(lArmX - 1, torsoY + 2, armW, 6, topCol);
        pxRect(lArmX - 2, torsoY + 7, armW + 1, 2.5, hero.skin_color);
        pxRect(rArmX, torsoY + 2, armW, 8, topCol);
        pxRect(rArmX, torsoY + 9, armW, 3, hero.skin_color);
    }

    // Wrist accessory
    if (hero.accessories && hero.accessories.wrist && hero.accessories.wrist !== 'None') {
        const w = hero.accessories.wrist;
        if (w === 'Smartwatch') {
            pxRect(lArmX, torsoY + 8, armW, 2, '#0f172a');
            pxRect(lArmX + 0.5, torsoY + 8.5, 1.5, 1, '#06b6d4'); // glowing cyan screen
        } else {
            pxRect(lArmX, torsoY + 8, armW, 1.5, '#f59e0b');
        }
    }

    // Other held items
    if (hero.accessories && hero.accessories.other && hero.accessories.other !== 'None') {
        const o = hero.accessories.other;
        if (o === 'Laptop') {
            pxRect(rArmX + 2, torsoY + 6, 6, 5, '#64748b');
            pxRect(rArmX + 3, torsoY + 7, 4, 3, '#38bdf8');
        } else if (o === 'Water bottle') {
            pxRect(rArmX + 2, torsoY + 7, 2, 5, '#06b6d4');
            pxRect(rArmX + 2.5, torsoY + 5.5, 1, 1.5, '#ffffff');
        } else if (o === 'Camera') {
            pxRect(rArmX + 1, torsoY + 6, 5, 4, '#1e293b');
            pxRect(rArmX + 2.5, torsoY + 7, 2, 2, '#38bdf8');
        } else if (o === 'Skateboard') {
            pxRect(lArmX - 4, torsoY + 2, 3, 14, '#ef4444');
        } else if (o === 'Guitar') {
            pxRect(lArmX - 4, torsoY, 5, 12, '#92400e');
        }
    }

    // Backpack straps
    if (hero.accessories && hero.accessories.body === 'Backpack') {
        pxRect(torsoX - 1.5, torsoY + 2, 2, 8, '#78350f');
        pxRect(torsoX + torsoW - 0.5, torsoY + 2, 2, 8, '#78350f');
        pxRect(torsoX + 2, torsoY + 4, torsoW - 4, 1, '#451a03'); // chest buckle
    }

    // ==========================================
    // 7. HEAD & NECK
    // ==========================================
    const headY = torsoY - 14 + (breathing * 0.6);
    const headW = 10;
    const headH = 11;
    const headX = -headW / 2;

    pxRect(-1.5, headY + headH - 1, 3, 2, adjustColor(hero.skin_color, -10));
    pxRect(headX, headY, headW, headH, hero.skin_color);

    // ==========================================
    // 8. FACIAL FEATURES & EYES (7 Distinct Expressions)
    // ==========================================
    const eyeY = headY + 5;
    const lEyeX = headX + 2;
    const rEyeX = headX + 6;

    if (isBlinking) {
        pxRect(lEyeX, eyeY + 1, 2, 0.8, '#1e293b');
        pxRect(rEyeX, eyeY + 1, 2, 0.8, '#1e293b');
    } else {
        pxRect(lEyeX, eyeY, 2, 2, '#ffffff');
        pxRect(rEyeX, eyeY, 2, 2, '#ffffff');
        pxRect(lEyeX + 0.5, eyeY + 0.5, 1.2, 1.2, hero.eye_color);
        pxRect(rEyeX + 0.5, eyeY + 0.5, 1.2, 1.2, hero.eye_color);

        if (hero.expression === 'Energetic' || hero.expression === 'Happy') {
            pxRect(lEyeX + 1, eyeY, 0.8, 0.8, '#ffffff'); // joyful sparkle
            pxRect(rEyeX + 1, eyeY, 0.8, 0.8, '#ffffff');
        }
    }

    const browY = eyeY - 1.5;
    const browCol = adjustColor(hero.hair_color, -25);

    if (hero.expression === 'Confident') {
        pxRect(lEyeX, browY + 0.5, 2, 0.8, browCol);
        pxRect(rEyeX, browY - 0.5, 2, 0.8, browCol); // cocked brow
    } else if (hero.expression === 'Happy') {
        pxRect(lEyeX, browY - 0.8, 2, 0.8, browCol);
        pxRect(rEyeX, browY - 0.8, 2, 0.8, browCol); // raised happy arch
    } else if (hero.expression === 'Focused') {
        pxRect(lEyeX, browY + 0.8, 2, 1, browCol);
        pxRect(rEyeX, browY + 0.8, 2, 1, browCol); // sharp intense brow
    } else if (hero.expression === 'Serious') {
        pxRect(lEyeX, browY + 0.5, 2.5, 1, browCol);
        pxRect(rEyeX - 0.5, browY + 0.5, 2.5, 1, browCol); // inward furrow
    } else if (hero.expression === 'Energetic') {
        pxRect(lEyeX, browY - 1, 2, 0.8, browCol);
        pxRect(rEyeX, browY - 1, 2, 0.8, browCol);
    } else if (hero.expression === 'Calm') {
        pxRect(lEyeX, browY - 0.4, 2, 0.8, browCol);
        pxRect(rEyeX, browY - 0.4, 2, 0.8, browCol);
    } else {
        pxRect(lEyeX, browY, 2, 0.8, browCol);
        pxRect(rEyeX, browY, 2, 0.8, browCol);
    }

    // Nose
    pxRect(headX + 4.5, eyeY + 2.5, 1, 1.5, adjustColor(hero.skin_color, -20));

    // Gender-specific facial features (eyelashes & soft cheek blush for Female)
    if (hero.gender === 'F') {
        // Soft blush on cheeks
        pxRect(headX + 1.2, eyeY + 2.5, 1.8, 1, 'rgba(244, 114, 182, 0.45)');
        pxRect(headX + 7.0, eyeY + 2.5, 1.8, 1, 'rgba(244, 114, 182, 0.45)');
        if (!isBlinking) {
            // Eyelashes at outer eye edges
            pxRect(lEyeX - 0.6, eyeY - 0.4, 0.8, 0.8, '#0f172a');
            pxRect(rEyeX + 1.8, eyeY - 0.4, 0.8, 0.8, '#0f172a');
        }
    } else if (hero.gender === 'X') {
        // Subtle modern cheek glow
        pxRect(headX + 1.5, eyeY + 2.5, 1.5, 0.8, 'rgba(56, 189, 248, 0.25)');
        pxRect(headX + 7.0, eyeY + 2.5, 1.5, 0.8, 'rgba(56, 189, 248, 0.25)');
    }

    // Mouth
    const mouthY = headY + 8.5;
    if (hero.expression === 'Happy') {
        pxRect(headX + 3, mouthY - 0.5, 4, 2, '#b91c1c'); // wide open teeth smile
        pxRect(headX + 3.5, mouthY - 0.5, 3, 0.8, '#ffffff');
    } else if (hero.expression === 'Energetic') {
        pxRect(headX + 2.5, mouthY - 0.5, 5, 2.2, '#b91c1c');
        pxRect(headX + 3, mouthY - 0.5, 4, 1, '#ffffff');
    } else if (hero.expression === 'Confident' || hero.mouth_style === 'Smirk') {
        pxRect(headX + 4, mouthY - 0.5, 2.5, 1, '#b91c1c'); // smirk
    } else if (hero.expression === 'Serious') {
        pxRect(headX + 3.5, mouthY + 0.5, 3, 1, '#3b0764'); // grim stern mouth
    } else if (hero.expression === 'Focused') {
        pxRect(headX + 3.5, mouthY, 3, 0.8, '#1e293b');
    } else if (hero.expression === 'Calm') {
        pxRect(headX + 3.5, mouthY, 3, 1, '#991b1b');
    } else {
        pxRect(headX + 3.5, mouthY, 3, 0.8, '#451a03');
    }

    // ==========================================
    // 9. EYEWEAR (Sunglasses / Glasses)
    // ==========================================
    if (hero.accessories && hero.accessories.face && hero.accessories.face !== 'None') {
        const af = hero.accessories.face;
        if (af === 'Sunglasses') {
            // Sleek cool dark UV shades with metallic bridge and diagonal glare glint
            pxRect(lEyeX - 1, eyeY - 1, 3.5, 3.5, '#05070a');
            pxRect(rEyeX - 0.5, eyeY - 1, 3.5, 3.5, '#05070a');
            pxRect(headX + 4, eyeY - 0.5, 2, 1, '#475569'); // bridge
            // White diagonal glare glint across lenses
            pxRect(lEyeX, eyeY - 0.5, 1, 1, '#ffffff');
            pxRect(rEyeX + 0.5, eyeY - 0.5, 1, 1, '#ffffff');
            // Outer ear arms
            pxRect(headX - 0.5, eyeY - 0.5, 1.5, 1, '#05070a');
            pxRect(headX + headW - 1, eyeY - 0.5, 1.5, 1, '#05070a');
        } else if (af.includes('Glasses') || af.includes('glasses')) {
            pxRect(lEyeX - 0.5, eyeY - 0.5, 3, 3, 'rgba(0,0,0,0.2)');
            pxRect(rEyeX - 0.5, eyeY - 0.5, 3, 3, 'rgba(0,0,0,0.2)');
            pxRect(lEyeX - 0.5, eyeY - 0.5, 3, 0.8, '#1e293b');
            pxRect(rEyeX - 0.5, eyeY - 0.5, 3, 0.8, '#1e293b');
            pxRect(headX + 4, eyeY + 0.5, 2, 0.8, '#1e293b');
        }
    }

    // ==========================================
    // 10. HAIRSTYLE RENDERING (Distinct Pixel Art for Each Style)
    // ==========================================
    const hairCol = hero.hair_color;
    const highCol = hero.hair_highlight_enabled ? hero.hair_highlight : adjustColor(hairCol, 25);
    const styleName = hero.hair_style || 'Curtains';

    if (styleName === 'Curtains') {
        // Defined center parting with sweeping bangs framing left and right down past eyes
        pxRect(headX - 1, headY - 2.5, headW + 2, 3.5, hairCol);
        pxRect(headX + 4.5, headY - 2.5, 1, 2, adjustColor(hero.skin_color, -10)); // center part gap
        // Left curving fringe
        pxRect(headX - 1.5, headY + 1, 2.5, 6, hairCol);
        pxRect(headX + 1, headY + 1, 2, 4, hairCol);
        pxRect(headX + 0.5, headY - 1.5, 2.5, 1.2, highCol); // left highlight
        // Right curving fringe
        pxRect(headX + headW - 1, headY + 1, 2.5, 6, hairCol);
        pxRect(headX + headW - 3, headY + 1, 2, 4, hairCol);
        pxRect(headX + headW - 3, headY - 1.5, 2.5, 1.2, highCol); // right highlight
    } else if (styleName === 'Side part') {
        // Sharp side part on left with glossy combed-over hair to right
        pxRect(headX - 0.5, headY - 2.5, headW + 1, 3.5, hairCol);
        pxRect(headX + 2, headY - 2.5, 0.8, 2, adjustColor(hero.skin_color, -10)); // side parting line
        pxRect(headX - 1, headY, 2, 4, hairCol);
        pxRect(headX + headW - 1, headY, 2, 5, hairCol);
        pxRect(headX + 3, headY - 1.5, 5, 1.5, highCol); // swept comb shine
    } else if (styleName === 'Middle part') {
        pxRect(headX - 1, headY - 2.5, headW + 2, 3.5, hairCol);
        pxRect(headX + 4.5, headY - 2.5, 1, 3, adjustColor(hero.skin_color, -10));
        pxRect(headX - 1, headY, 2, 5, hairCol);
        pxRect(headX + headW - 1, headY, 2, 5, hairCol);
        pxRect(headX + 1, headY - 1.5, 2.5, 1.2, highCol);
        pxRect(headX + 6, headY - 1.5, 2.5, 1.2, highCol);
    } else if (styleName === 'Textured crop') {
        // Short textured crop with jagged choppy peaks and faded temples
        pxRect(headX - 0.5, headY - 2.5, headW + 1, 3, hairCol);
        pxRect(headX, headY - 4, 2, 2, hairCol); // spiky crop tufts
        pxRect(headX + 3, headY - 4.5, 2, 2.5, hairCol);
        pxRect(headX + 6, headY - 4, 2, 2, hairCol);
        pxRect(headX + 8, headY - 3.5, 2, 1.5, hairCol);
        pxRect(headX + 1, headY + 0.5, headW - 2, 1.2, hairCol); // blunt choppy fringe
        pxRect(headX + 2, headY - 1.5, 4, 1.2, highCol);
    } else if (styleName === 'Buzz cut') {
        // Close-cropped stubble outline
        pxRect(headX - 0.5, headY - 1.5, headW + 1, 2, adjustColor(hairCol, -20));
        pxRect(headX - 0.5, headY, 0.8, 3, adjustColor(hairCol, -20));
        pxRect(headX + headW - 0.3, headY, 0.8, 3, adjustColor(hairCol, -20));
    } else if (styleName === 'Crew cut') {
        pxRect(headX - 0.5, headY - 2.5, headW + 1, 3, hairCol);
        pxRect(headX + 2, headY - 3.5, 5, 1.5, hairCol); // raised front pompadour
        pxRect(headX - 0.5, headY, 0.8, 2, adjustColor(hairCol, -20));
        pxRect(headX + headW - 0.3, headY, 0.8, 2, adjustColor(hairCol, -20));
    } else if (styleName === 'Side fade') {
        pxRect(headX - 0.5, headY - 3, headW + 1, 3.5, hairCol);
        pxRect(headX - 0.5, headY, 0.8, 4, adjustColor(hairCol, 40)); // tight skin fade
        pxRect(headX + headW - 0.8, headY, 1.5, 4, hairCol);
        pxRect(headX + 2, headY - 2, 5, 1.5, highCol);
    } else if (styleName === 'Caesar') {
        pxRect(headX - 0.5, headY - 2.5, headW + 1, 3.5, hairCol);
        pxRect(headX + 1, headY + 1, headW - 2, 1.5, hairCol); // blunt horizontal fringe
        pxRect(headX - 0.5, headY, 1, 3, hairCol);
        pxRect(headX + headW - 0.5, headY, 1, 3, hairCol);
    } else if (styleName === 'Short messy' || styleName === 'Messy') {
        pxRect(headX - 1, headY - 3, headW + 2, 4, hairCol);
        pxRect(headX - 2, headY - 2, 2, 3, hairCol);
        pxRect(headX + 1, headY - 5, 3, 3, hairCol);
        pxRect(headX + 5, headY - 5.5, 3, 3, hairCol);
        pxRect(headX + headW, headY - 2, 2, 4, hairCol);
        pxRect(headX + 2, headY - 2, 4, 1.5, highCol);
    } else if (styleName === 'Wavy') {
        pxRect(headX - 1.5, headY - 3, headW + 3, 4, hairCol);
        pxRect(headX - 2, headY + 1, 2.5, 5, hairCol);
        pxRect(headX + headW - 0.5, headY + 1, 2.5, 5, hairCol);
        pxRect(headX + 1, headY - 2, 3, 1.5, highCol);
        pxRect(headX + 5, headY - 1.5, 3, 1.5, highCol);
    } else if (styleName === 'Layered') {
        pxRect(headX - 1.5, headY - 3, headW + 3, 4, hairCol);
        pxRect(headX - 2, headY + 1, 2.5, 7, hairCol);
        pxRect(headX + headW - 0.5, headY + 1, 2.5, 7, hairCol);
        pxRect(headX + 1, headY + 1, 2, 3, highCol);
    } else if (styleName === 'Long straight') {
        pxRect(headX - 1.5, headY - 3, headW + 3, 4, hairCol);
        pxRect(headX - 2.5, headY + 1, 3, 13, hairCol); // long hair past shoulders
        pxRect(headX + headW - 0.5, headY + 1, 3, 13, hairCol);
        pxRect(headX + 2, headY - 2, 4, 1.5, highCol);
    } else if (styleName === 'Long wavy') {
        pxRect(headX - 1.5, headY - 3.5, headW + 3, 4.5, hairCol);
        pxRect(headX - 3, headY + 1, 3.5, 14, hairCol);
        pxRect(headX + headW - 0.5, headY + 1, 3.5, 14, hairCol);
        pxRect(headX - 3.5, headY + 12, 4, 3, highCol); // wavy ends
        pxRect(headX + headW - 0.5, headY + 12, 4, 3, highCol);
    } else if (styleName === 'Ponytail') {
        pxRect(headX - 1, headY - 3, headW + 2, 4, hairCol);
        pxRect(headX + headW - 1, headY - 4, 3, 3, '#ef4444'); // hair tie band
        pxRect(headX + headW + 1, headY - 3, 3, 10, hairCol); // ponytail tail
        pxRect(headX + headW + 2, headY + 5, 2, 4, highCol);
    } else if (styleName === 'Man bun') {
        pxRect(headX - 1, headY - 2.5, headW + 2, 3.5, hairCol);
        pxRect(headX + 3, headY - 6, 4, 4, hairCol); // top knot bun
        pxRect(headX + 4, headY - 5, 2, 2, highCol);
        pxRect(headX - 1, headY + 1, 1.5, 3, adjustColor(hairCol, -20));
        pxRect(headX + headW - 0.5, headY + 1, 1.5, 3, adjustColor(hairCol, -20));
    } else if (styleName === 'Shoulder length') {
        pxRect(headX - 1.5, headY - 3, headW + 3, 4, hairCol);
        pxRect(headX - 2, headY + 1, 2.5, 9, hairCol);
        pxRect(headX + headW - 0.5, headY + 1, 2.5, 9, hairCol);
        pxRect(headX + 2, headY - 2, 5, 1.5, highCol);
    } else if (styleName === 'Mohawk') {
        pxRect(headX + 2.5, headY - 7, 4.5, 8, hairCol); // tall punk spike crest
        pxRect(headX + 3.5, headY - 6, 2.5, 4, highCol);
        pxRect(headX - 0.5, headY, 1, 4, adjustColor(hairCol, 40));
        pxRect(headX + headW - 0.5, headY, 1, 4, adjustColor(hairCol, 40));
    } else if (styleName === 'Undercut') {
        pxRect(headX - 1, headY - 4, headW + 2, 4.5, hairCol);
        pxRect(headX + 1, headY - 3, 5, 2, highCol);
        pxRect(headX - 1, headY + 0.5, 1, 4, adjustColor(hairCol, 40)); // shaved sides
        pxRect(headX + headW, headY + 0.5, 1, 4, adjustColor(hairCol, 40));
    } else if (styleName === 'Spiky') {
        pxRect(headX - 1, headY - 2.5, headW + 2, 3.5, hairCol);
        pxRect(headX - 2, headY - 6, 3, 4, hairCol);
        pxRect(headX + 2, headY - 7, 3, 5, hairCol);
        pxRect(headX + 6, headY - 7, 3, 5, hairCol);
        pxRect(headX + 9, headY - 5, 3, 4, hairCol);
        pxRect(headX + 3, headY - 5, 2, 2, highCol);
    } else if (styleName === 'Curly') {
        pxRect(headX - 2, headY - 4.5, headW + 4, 5.5, hairCol);
        pxRect(headX - 2.5, headY, 2.5, 5, hairCol);
        pxRect(headX + headW, headY, 2.5, 5, hairCol);
        pxRect(headX, headY - 3.5, 2, 2, highCol);
        pxRect(headX + 4, headY - 4, 2, 2, highCol);
        pxRect(headX + 7, headY - 3.5, 2, 2, highCol);
    } else if (styleName === 'Dread-style') {
        pxRect(headX - 1.5, headY - 3, headW + 3, 4, hairCol);
        pxRect(headX - 3, headY + 1, 2, 10, hairCol); // dread locks
        pxRect(headX - 1, headY + 2, 2, 9, hairCol);
        pxRect(headX + headW - 1, headY + 2, 2, 9, hairCol);
        pxRect(headX + headW + 1, headY + 1, 2, 10, hairCol);
        pxRect(headX - 3, headY + 6, 2, 1, '#facc15'); // metallic bead
        pxRect(headX + headW + 1, headY + 7, 2, 1, '#38bdf8');
    } else if (styleName === 'Fantasy') {
        pxRect(headX - 1.5, headY - 4, headW + 3, 5, hairCol);
        pxRect(headX - 3, headY - 1, 3, 11, hairCol);
        pxRect(headX + headW, headY - 1, 3, 11, hairCol);
        pxRect(headX + 1, headY - 3, 4, 2, highCol);
    } else {
        pxRect(headX - 1, headY - 2.5, headW + 2, 3.5, hairCol);
        pxRect(headX - 1, headY, 1.5, 5, hairCol);
        pxRect(headX + headW - 0.5, headY, 1.5, 5, hairCol);
        pxRect(headX + 1, headY - 1.5, 4, 1.5, highCol);
    }

    // ==========================================
    // 11. HEAD ACCESSORY (Cap, Beanie, Headphones)
    // ==========================================
    if (hero.accessories && hero.accessories.head && hero.accessories.head !== 'None') {
        const ah = hero.accessories.head;
        if (ah === 'Cap') {
            pxRect(headX - 1, headY - 3, headW + 2, 4, '#ef4444');
            pxRect(headX + 2, headY, 7.5, 1.5, '#b91c1c'); // snapback visor
            pxRect(headX + 3, headY - 2, 3, 2, '#ffffff'); // front emblem
        } else if (ah === 'Beanie') {
            pxRect(headX - 1, headY - 5, headW + 2, 7, '#1e293b');
            pxRect(headX - 1.5, headY + 1, headW + 3, 2, '#334155'); // ribbed brim
        } else if (ah === 'Headphones') {
            pxRect(headX - 0.5, headY - 4, headW + 1, 1.5, '#f59e0b'); // headband
            pxRect(headX - 2.5, headY + 2, 3, 5.5, '#1e293b'); // left earcup
            pxRect(headX + headW - 0.5, headY + 2, 3, 5.5, '#1e293b'); // right earcup
            pxRect(headX - 2, headY + 3, 2, 3.5, '#f59e0b'); // colored foam
            pxRect(headX + headW, headY + 3, 2, 3.5, '#f59e0b');
        }
    }
}

function adjustColor(col, amt) {
    if (!col || !col.startsWith('#')) return col;
    let num = parseInt(col.slice(1), 16);
    let r = Math.min(255, Math.max(0, (num >> 16) + amt));
    let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${(g | (b << 8) | (r << 16)).toString(16).padStart(6, '0')}`;
}

// =============================================================================
// "⚔ BEGIN MY JOURNEY" CTA & VICTORY CELEBRATION
// =============================================================================

async function beginMyJourney() {
    playSound('victory');

    if (hero.gold == null) hero.gold = 1000;
    localStorage.setItem('liferpg_hero_profile', JSON.stringify(hero));

    try {
        await fetchWithRefresh(`${baseUrl}/character`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hero)
        });
    } catch (e) {}

    const cName = document.getElementById('celebration-hero-name');
    if (cName) cName.textContent = hero.name;
    const cTitle = document.getElementById('celebration-hero-title');
    if (cTitle) cTitle.textContent = `"${hero.title}"`;

    document.getElementById('journey-celebration-modal')?.classList.remove('hidden');

    setTimeout(() => {
        renderHeroSprite('celebration-avatar-canvas', 0.8);
    }, 50);
}

function finishJourneyTransition() {
    playSound('magic');
    document.getElementById('journey-celebration-modal')?.classList.add('hidden');
    document.getElementById('creator-container')?.classList.add('hidden');
    document.getElementById('rpg-resource-bar')?.classList.add('hidden');

    const advScreen = document.getElementById('adventure-screen');
    if (advScreen) {
        advScreen.classList.remove('hidden');
    }

    updateAdvDashboardUI();
    fetchQuests();
    if (window.worldEngine) {
        window.worldEngine.init('adv-world-canvas', 'adv-minimap-canvas');
        window.worldEngine.setVehicle(hero.transportation);
    }
}

function openCreatorFromApp() {
    playSound('tab');
    document.getElementById('app-container')?.classList.add('hidden');
    document.getElementById('creator-container')?.classList.remove('hidden');
}

function enterAsGuest() {
    playSound('click');
    localStorage.setItem('liferpg_guest_mode', 'true');
    document.getElementById('auth-container')?.classList.add('hidden');
    
    const saved = localStorage.getItem('liferpg_hero_profile');
    if (saved) {
        finishJourneyTransition(true);
        switchAdvTab('world', true);
    } else {
        document.getElementById('creator-container')?.classList.remove('hidden');
        history.pushState({ view: 'customize' }, '', '/customize');
    }
}

function switchTab(mode, updateHistory = true) {
    playSound('tab');
    if (updateHistory && (window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/')) {
        history.replaceState({ view: mode }, '', '/' + mode);
    }
    document.querySelectorAll('.auth-tab-switch .auth-tab-btn').forEach(btn => btn.classList.remove('active'));
    if (mode === 'login') {
        document.getElementById('tab-btn-login')?.classList.add('active');
        document.getElementById('login-form')?.classList.remove('hidden');
        document.getElementById('register-form')?.classList.add('hidden');
    } else {
        document.getElementById('tab-btn-register')?.classList.add('active');
        document.getElementById('login-form')?.classList.add('hidden');
        document.getElementById('register-form')?.classList.remove('hidden');
    }

    const loginErr = document.getElementById('login-error');
    if (loginErr) {
        loginErr.textContent = '';
        loginErr.classList.add('hidden');
    }
    const regErr = document.getElementById('reg-error');
    if (regErr) {
        regErr.textContent = '';
        regErr.classList.add('hidden');
    }
}

function togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        if (btnEl) btnEl.textContent = '🙈';
    } else {
        input.type = 'password';
        if (btnEl) btnEl.textContent = '👁️';
    }
}

let usernameCheckTimeout = null;
function onUsernameInput(val) {
    const chip = document.getElementById('reg-username-indicator');
    if (!chip) return;
    const clean = val.trim();
    if (usernameCheckTimeout) clearTimeout(usernameCheckTimeout);
    if (!clean) {
        chip.textContent = '';
        chip.className = 'auth-status-chip';
        return;
    }
    if (clean.length < 3) {
        chip.textContent = 'Min 3 chars';
        chip.className = 'auth-status-chip error';
        return;
    }
    chip.textContent = 'Checking...';
    chip.className = 'auth-status-chip checking';
    usernameCheckTimeout = setTimeout(async () => {
        try {
            const res = await fetch(`${baseUrl}/check-username?username=${encodeURIComponent(clean)}`);
            const data = await res.json();
            if (data.available) {
                chip.textContent = '✓ Available';
                chip.className = 'auth-status-chip success';
            } else {
                chip.textContent = '✗ Taken';
                chip.className = 'auth-status-chip error';
            }
        } catch (e) {
            chip.textContent = '';
            chip.className = 'auth-status-chip';
        }
    }, 400);
}

function checkPasswordMatch() {
    const p1 = document.getElementById('reg-password')?.value || '';
    const p2 = document.getElementById('reg-confirm-password')?.value || '';
    const chip = document.getElementById('reg-pass-indicator');
    if (!chip) return;
    if (!p2) {
        chip.textContent = '';
        chip.className = 'auth-status-chip';
        return;
    }
    if (p1 === p2) {
        chip.textContent = '✓ Match';
        chip.className = 'auth-status-chip success';
    } else {
        chip.textContent = '✗ Mismatch';
        chip.className = 'auth-status-chip error';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }

    try {
        const formData = new URLSearchParams();
        formData.append('username', identifier);
        formData.append('password', password);

        const res = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Login failed');

        playSound('victory');
        checkAuth();
    } catch (err) {
        if (errorEl) {
            errorEl.textContent = err.message;
            errorEl.classList.remove('hidden');
        }
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const errorEl = document.getElementById('reg-error');

    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.add('hidden');
    }

    if (password !== confirmPassword) {
        if (errorEl) {
            errorEl.textContent = 'Passwords do not match!';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    try {
        const res = await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                email,
                username,
                password,
                confirm_password: confirmPassword
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Registration failed');

        alert('Account forged successfully! Please login.');
        switchTab('login');
        document.getElementById('login-identifier').value = username;
    } catch (err) {
        if (errorEl) {
            errorEl.textContent = err.message;
            errorEl.classList.remove('hidden');
        }
    }
}

async function tryRefresh() {
    try {
        const res = await fetch(`${baseUrl}/refresh`, { method: 'POST' });
        return res.ok;
    } catch (e) {
        return false;
    }
}

async function fetchWithRefresh(url, options = {}) {
    let res = await fetch(url, options);
    if (res.status === 401) {
        const refreshed = await tryRefresh();
        if (refreshed) {
            res = await fetch(url, options);
        }
    }
    return res;
}

async function checkAuth() {
    try {
        let res = await fetch(`${baseUrl}/me`);
        if (res.status === 401) {
            const refreshed = await tryRefresh();
            if (refreshed) res = await fetch(`${baseUrl}/me`);
        }
        if (res.ok) {
            currentUser = await res.json();
            const logoutBtn = document.getElementById('btn-logout-top');
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            const settingsBtn = document.getElementById('btn-settings-top');
            if (settingsBtn) settingsBtn.style.display = 'inline-block';
            document.getElementById('auth-container')?.classList.add('hidden');
            
            await loadUserCharacter();

            const journeyKey = 'liferpg_journey_started_' + currentUser.id;
            const hasStarted = localStorage.getItem(journeyKey);
            if (hasStarted || (hero && (hero.level > 1 || (hero.name && hero.name !== 'Alex') || hero.gold !== 1000))) {
                localStorage.setItem(journeyKey, 'true');
                finishJourneyTransition(true);
                handleRouteNavigation(true);
            } else {
                document.getElementById('creator-container')?.classList.remove('hidden');
                if (window.location.pathname === '/' || window.location.pathname === '/login') {
                    history.replaceState({ view: 'customize' }, '', '/customize');
                }
            }
        } else {
            currentUser = null;
            const rawPath = getRoutePath();
            if (rawPath === 'register') {
                document.getElementById('auth-container')?.classList.remove('hidden');
                switchTab('register', false);
            } else if (rawPath === 'login') {
                document.getElementById('auth-container')?.classList.remove('hidden');
                switchTab('login', false);
            } else {
                const guestMode = localStorage.getItem('liferpg_guest_mode');
                const saved = localStorage.getItem('liferpg_hero_profile');
                if (guestMode || saved) {
                    document.getElementById('auth-container')?.classList.add('hidden');
                    finishJourneyTransition(true);
                    handleRouteNavigation(true);
                } else {
                    document.getElementById('auth-container')?.classList.remove('hidden');
                    document.getElementById('creator-container')?.classList.add('hidden');
                    document.getElementById('adventure-screen')?.classList.add('hidden');
                    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                        history.replaceState({ view: 'login' }, '', '/login');
                    }
                }
            }
            const logoutBtn = document.getElementById('btn-logout-top');
            if (logoutBtn) logoutBtn.style.display = 'none';
            const settingsBtn = document.getElementById('btn-settings-top');
            if (settingsBtn) settingsBtn.style.display = 'none';
        }
    } catch (err) {
        currentUser = null;
        document.getElementById('auth-container')?.classList.remove('hidden');
        document.getElementById('creator-container')?.classList.add('hidden');
        document.getElementById('adventure-screen')?.classList.add('hidden');
    }
}

async function loadUserCharacter() {
    try {
        const res = await fetchWithRefresh(`${baseUrl}/character`);
        if (res.ok) {
            const data = await res.json();
            if (data.character) {
                hero = { ...hero, ...data.character };
                if (typeof hero.accessories === 'string') {
                    try { hero.accessories = JSON.parse(hero.accessories); } catch (e) {}
                }
                updateUIValues();
            }
        }
    } catch (e) {}
}

async function logout() {
    try {
        await fetch(`${baseUrl}/logout`, { method: 'POST' });
    } catch (err) {}
    currentUser = null;
    localStorage.removeItem('liferpg_guest_mode');
    document.getElementById('auth-container')?.classList.remove('hidden');
    document.getElementById('creator-container')?.classList.add('hidden');
    document.getElementById('adventure-screen')?.classList.add('hidden');
    const logoutBtn = document.getElementById('btn-logout-top');
    if (logoutBtn) logoutBtn.style.display = 'none';
    const settingsBtn = document.getElementById('btn-settings-top');
    if (settingsBtn) settingsBtn.style.display = 'none';
    history.pushState({ view: 'login' }, '', '/login');
}

async function confirmDeleteAccount() {
    const confirmation = prompt('Are you sure you want to permanently delete your LifeRPG account and all progression?\n\nType "DELETE" to confirm:');
    if (confirmation !== 'DELETE') {
        if (confirmation !== null) {
            alert('Account deletion canceled. Confirmation text did not match.');
        }
        return;
    }

    try {
        const res = await fetchWithRefresh(`${baseUrl}/user/account`, {
            method: 'DELETE'
        });

        if (res.ok) {
            alert('Your account and all associated character data have been permanently deleted.');
            currentUser = null;
            localStorage.removeItem('liferpg_hero_profile');
            localStorage.removeItem('liferpg_guest_quests');
            localStorage.removeItem('liferpg_home_data');
            window.location.reload();
        } else {
            const err = await res.json().catch(() => ({}));
            alert(err.detail || 'Failed to delete account. Please try again.');
        }
    } catch (e) {
        alert('Network error while attempting to delete account.');
    }
}


// =============================================================================
// 🚀 LIFERPG ADVENTURE WORLD & DASHBOARD ENGINE
// =============================================================================

let worldAnimFrame = 0;
let worldScrollX = 0;
let worldSpeedMultiplier = 1.0;
let isCelebrating = false;
let celebrationTimer = 0;
let worldLoopId = null;
let currentAdvTab = 'world';
let currentUnlockedVehicle = null;

const VEHICLES_CATALOG = [
    { name: 'Walk', level: 1, icon: '🚶', speed: 1.0, desc: 'Your natural two-foot stride.' },
    { name: 'Bicycle', level: 5, icon: '🚲', speed: 2.2, desc: 'Classic 10-speed city cruiser.' },
    { name: 'Skateboard', level: 10, icon: '🛹', speed: 3.0, desc: 'Street deck with high-speed bearings.' },
    { name: 'Scooter', level: 20, icon: '🛵', speed: 4.2, desc: 'Vintage motor scooter with headlight.' },
    { name: 'Motorcycle', level: 30, icon: '🏍️', speed: 5.8, desc: 'Twin-cylinder roaring road beast.' },
    { name: 'Cyber Cruiser Car', level: 40, icon: '🚗', speed: 7.5, desc: 'Neon-trimmed retro sports car.' },
    { name: 'Futuristic Jet', level: 50, icon: '🚀', speed: 10.0, desc: 'Plasma thruster anti-grav flight.' }
];

async function beginMyJourney() {
    playSound('victory');
    if (currentUser) {
        localStorage.setItem('liferpg_journey_started_' + currentUser.id, 'true');
        try {
            await fetchWithRefresh(`${baseUrl}/character`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hero)
            });
        } catch (e) {}
    } else {
        localStorage.setItem('liferpg_hero_profile', JSON.stringify(hero));
    }

    const celebModal = document.getElementById('journey-celebration-modal');
    if (celebModal) {
        celebModal.classList.remove('hidden');
        document.getElementById('celebration-hero-name').textContent = hero.name;
        document.getElementById('celebration-hero-title').textContent = `"${hero.title}"`;
        renderHeroSprite('celebration-avatar-canvas', 0.8);
    } else {
        finishJourneyTransition();
    }
}

function finishJourneyTransition(silent = false) {
    if (!silent) playSound('magic');
    if (currentUser) {
        localStorage.setItem('liferpg_journey_started_' + currentUser.id, 'true');
    }
    document.getElementById('journey-celebration-modal')?.classList.add('hidden');
    document.getElementById('creator-container')?.classList.add('hidden');
    document.getElementById('rpg-resource-bar')?.classList.add('hidden');
    
    const advScreen = document.getElementById('adventure-screen');
    if (advScreen) {
        advScreen.classList.remove('hidden');
    }

    updateAdvDashboardUI();
    fetchQuests();
    if (window.worldEngine) {
        window.worldEngine.init('adv-world-canvas', 'adv-minimap-canvas');
        window.worldEngine.setVehicle(hero.transportation);
    }

    if (window.location.pathname === '/' || window.location.pathname === '/customize') {
        history.replaceState({ tab: 'world' }, '', '/world');
    }
}

function returnToCreator() {
    playSound('tab');
    document.getElementById('adventure-screen')?.classList.add('hidden');
    document.getElementById('creator-container')?.classList.remove('hidden');
    document.getElementById('rpg-resource-bar')?.classList.remove('hidden');
    history.pushState({ view: 'customize' }, '', '/customize');
    updateUIValues();
}

let currentQuestBoardFilter = 'today';
let userCustomRewards = [];
let adventureLogs = [];

function loadAdventureData() {
    try {
        const savedRewards = localStorage.getItem('liferpg_custom_rewards');
        if (savedRewards) userCustomRewards = JSON.parse(savedRewards);
    } catch (e) {}

    try {
        const savedLogs = localStorage.getItem('liferpg_adventure_logs');
        if (savedLogs) adventureLogs = JSON.parse(savedLogs);
    } catch (e) {}

    if (!adventureLogs || adventureLogs.length === 0) {
        adventureLogs = [
            { id: 1, time: 'TODAY • 09:00 AM', title: '✨ Embarked on Life RPG Realm', desc: 'Hero profile initialized. The road to mastery begins!', type: 'milestone', badge: 'STARTED' },
            { id: 2, time: 'TODAY • 09:05 AM', title: '🪙 Treasury Allocated', desc: 'Received 1,000 starting Gold coins for equipment & rewards.', type: 'gold', badge: '+1,000 G' },
            { id: 3, time: 'TODAY • 09:10 AM', title: '⚔️ Daily Quest Board Generated', desc: '4 active quests assigned to boost INT, STR, VIT & WIL.', type: 'quest', badge: 'ACTIVE' }
        ];
        localStorage.setItem('liferpg_adventure_logs', JSON.stringify(adventureLogs));
    }
}

function updateAdvDashboardUI() {
    const xpReq = 100;
    const currentXp = hero.xp || 0;
    const xpPercent = Math.min(100, Math.round((currentXp / xpReq) * 100));

    setText('adv-xp-text', `${currentXp} / ${xpReq}`);
    const xpBar = document.getElementById('adv-xp-bar');
    if (xpBar) xpBar.style.width = `${xpPercent}%`;

    const goldFormatted = (hero.gold || 1000).toLocaleString();
    setText('adv-gold-text', goldFormatted);
    setText('shop-gold-amount', `${goldFormatted} G`);
    setText('stats-tab-gold', `${goldFormatted} G`);
    setText('hero-sheet-gold', `🪙 ${goldFormatted} G`);

    const streakVal = `${hero.streak_days || 1} DAYS`;
    setText('adv-streak-text', streakVal);
    setText('stats-tab-streak', streakVal);
    setText('hero-sheet-streak', `🔥 ${streakVal}`);

    const heroName = hero.name || 'GSJustin';
    const heroTitle = hero.title || 'PATHFINDER';
    const lvlStr = `LV ${String(hero.level || 1).padStart(2, '0')}`;

    setText('adv-player-name', heroName);
    setText('adv-player-lvl', `${lvlStr} • ${heroTitle}`);
    setText('hero-sheet-name', heroName);
    setText('hero-sheet-title', `"${heroTitle}"`);
    setText('hero-sheet-lvl', `LVL ${String(hero.level || 1).padStart(2, '0')}`);
    setText('stats-tab-level-badge', lvlStr);
    setText('stats-tab-xp', `${currentXp} / ${xpReq} XP`);

    // Update Zone and Journey KM
    const km = hero.journey_km || 2;
    setText('journey-km-label', `${km}.0 km / 25.0 km`);
    setText('stats-tab-km', `${km}.0 KM`);
    const journeyPercent = Math.min(100, Math.max(5, (km / 25) * 100));
    const jFill = document.getElementById('journey-fill-bar');
    const jPin = document.getElementById('journey-pin');
    if (jFill) jFill.style.width = `${journeyPercent}%`;
    if (jPin) jPin.style.left = `${journeyPercent}%`;

    // 4-Card Sleek RPG Stat Cards Updates
    setText('card-val-strength', hero.fitness || 10);
    setText('card-val-knowledge', hero.knowledge || 15);
    setText('card-val-vitality', hero.vitality || 20);
    setText('card-val-willpower', hero.discipline || 12);

    // Stats Tab Detailed Scores
    setText('d-stat-int', `${hero.knowledge || 15} PTS`);
    setText('d-stat-str', `${hero.fitness || 10} PTS`);
    setText('d-stat-vit', `${hero.vitality || 20} PTS`);
    setText('d-stat-wil', `${hero.discipline || 12} PTS`);
    setText('d-stat-fin', `${hero.finance || 5} PTS`);

    setBarWidth('d-bar-int', Math.min(100, (hero.knowledge || 15) * 2));
    setBarWidth('d-bar-str', Math.min(100, (hero.fitness || 10) * 2.5));
    setBarWidth('d-bar-vit', Math.min(100, (hero.vitality || 20) * 1.5));
    setBarWidth('d-bar-wil', Math.min(100, (hero.discipline || 12) * 2.5));
    setBarWidth('d-bar-fin', Math.min(100, (hero.finance || 5) * 4));

    // Home Quick Stats Panel Updates
    setText('stats-lvl-badge', lvlStr);
    setText('stat-val-knowledge', hero.knowledge || 15);
    setText('stat-val-fitness', hero.fitness || 10);
    setText('stat-val-discipline', hero.discipline || 12);
    setText('stat-val-vitality', hero.vitality || 20);
    setText('stat-val-finance', hero.finance || 5);

    setBarWidth('stat-bar-knowledge', Math.min(100, (hero.knowledge || 15) * 2));
    setBarWidth('stat-bar-fitness', Math.min(100, (hero.fitness || 10) * 2.5));
    setBarWidth('stat-bar-discipline', Math.min(100, (hero.discipline || 12) * 2.5));
    setBarWidth('stat-bar-vitality', Math.min(100, (hero.vitality || 20) * 1.5));
    setBarWidth('stat-bar-finance', Math.min(100, (hero.finance || 5) * 4));

    // Active Loadout & Hero Sheet Mount Updates
    const rideObj = VEHICLES_CATALOG.find(v => v.name.toLowerCase() === (hero.transportation || 'walk').toLowerCase()) || VEHICLES_CATALOG[0];
    setText('loadout-ride-val', `${rideObj.icon} ${rideObj.name}`);
    setText('loadout-aura-val', hero.aura || 'Mysterious');
    setText('loadout-pet-val', hero.companion || 'Dog');
    setText('loadout-gear-val', hero.accessories?.face || hero.accessories?.head || 'None');

    setText('hero-mount-icon', rideObj.icon);
    setText('hero-mount-name', rideObj.name);
    setText('hero-mount-speed', `${rideObj.speed}x Travel Speed`);
    setText('hero-trait-pet', `${hero.companion || 'Dog'} (Loyal Companion)`);
    setText('hero-trait-aura', `${hero.aura || 'Mysterious'} (Focus Glow)`);
    setText('hero-trait-lifestyle', hero.lifestyle || 'Balanced Lifestyle');

    // Movement Status Pill
    const movPill = document.getElementById('adv-movement-pill');
    if (movPill) {
        if (hero.transportation === 'Bicycle') movPill.textContent = '🚲 PEDALING';
        else if (hero.transportation === 'Skateboard') movPill.textContent = '🛹 SKATING';
        else if (hero.transportation === 'Scooter' || hero.transportation === 'Motorcycle') movPill.textContent = '🏍️ RIDING';
        else if (hero.transportation === 'Cyber Cruiser Car') movPill.textContent = '🚗 CRUISING';
        else if (hero.transportation === 'Futuristic Jet') movPill.textContent = '🚀 FLYING';
        else movPill.textContent = '🟢 TRAVELLING';
    }

    renderMiniAvatar('adv-mini-avatar');

    if (currentAdvTab === 'hero') {
        renderHeroSprite('hero-sheet-avatar-canvas', 0.75);
    } else if (currentAdvTab === 'quests') {
        renderBoardQuests();
    } else if (currentAdvTab === 'rewards') {
        renderRewardsShop();
    } else if (currentAdvTab === 'log') {
        renderAdventureLogs();
    }
}

function setBarWidth(id, val) {
    const el = document.getElementById(id);
    if (el) el.style.width = `${val}%`;
}

function toggleWorldSpeed() {
    playSound('click');
    worldSpeedMultiplier = worldSpeedMultiplier === 1.0 ? 2.0 : worldSpeedMultiplier === 2.0 ? 3.0 : 1.0;
    const btn = document.getElementById('speed-toggle-btn');
    if (btn) btn.textContent = `⚡ ${worldSpeedMultiplier}x`;
}

function getRoutePath() {
    let p = window.location.pathname.replace(/^\/+/, '').toLowerCase();
    if (!p) return 'world';
    return p;
}

function handleRouteNavigation(isInitial = false) {
    const rawPath = getRoutePath();
    const tabMap = {
        'world': 'world',
        'quests': 'quests',
        'quest': 'quests',
        'campaigns': 'campaigns',
        'goals': 'campaigns',
        'home': 'home',
        'base': 'home',
        'leaderboard': 'leaderboard',
        'rank': 'leaderboard',
        'analytics': 'analytics',
        'stats': 'analytics',
        'hero': 'hero',
        'settings': 'settings',
        'shop': 'shop',
        'achievements': 'achievements',
        'coach': 'coach'
    };

    if (rawPath === 'login' || rawPath === 'register') {
        if (currentUser) {
            switchAdvTab('world', true);
        } else {
            document.getElementById('auth-container')?.classList.remove('hidden');
            document.getElementById('creator-container')?.classList.add('hidden');
            document.getElementById('adventure-screen')?.classList.add('hidden');
            switchTab(rawPath, false);
        }
        return;
    }

    if (rawPath === 'customize' || rawPath === 'creator') {
        document.getElementById('auth-container')?.classList.add('hidden');
        document.getElementById('creator-container')?.classList.remove('hidden');
        document.getElementById('adventure-screen')?.classList.add('hidden');
        document.getElementById('rpg-resource-bar')?.classList.remove('hidden');
        updateUIValues();
        return;
    }

    const targetTab = tabMap[rawPath] || 'world';
    if (!currentUser) {
        const guestMode = localStorage.getItem('liferpg_guest_mode');
        const savedProfile = localStorage.getItem('liferpg_hero_profile');
        if (!guestMode && !savedProfile) {
            document.getElementById('auth-container')?.classList.remove('hidden');
            document.getElementById('creator-container')?.classList.add('hidden');
            document.getElementById('adventure-screen')?.classList.add('hidden');
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                history.replaceState({ view: 'login' }, '', '/login');
            }
            return;
        }
    }

    if (isInitial && window.location.pathname === '/') {
        history.replaceState({ tab: targetTab }, '', '/' + targetTab);
    }

    switchAdvTab(targetTab, false);
}

window.addEventListener('popstate', () => {
    handleRouteNavigation(false);
});

function switchAdvTab(tab, updateHistory = true) {
    playSound('tab');
    currentAdvTab = tab;
    window.currentAdvTab = tab;

    if (updateHistory) {
        history.pushState({ tab }, '', '/' + tab);
    }

    if (tab !== 'world') {
        const promptEl = document.getElementById('adv-context-prompt');
        if (promptEl) promptEl.classList.add('hidden');
        if (window.worldEngine) window.worldEngine.currentPromptEntityId = null;
    }

    document.getElementById('creator-container')?.classList.add('hidden');
    document.getElementById('adventure-screen')?.classList.remove('hidden');

    let targetViewId = `adv-tab-${tab}`;
    if (tab === 'hero' && !document.getElementById('adv-tab-hero')) {
        targetViewId = 'adv-tab-stats';
    }

    document.querySelectorAll('.adv-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`nav-btn-${tab}`)?.classList.add('active');

    document.querySelectorAll('.adv-tab-view').forEach(view => view.classList.add('hidden'));
    document.getElementById(targetViewId)?.classList.remove('hidden');

    if (tab === 'world') {
        if (window.worldEngine) {
            window.worldEngine.resize();
        }
    } else if (tab === 'home') {
        if (window.homeEngine) {
            window.homeEngine.init();
            renderBuildQuickPalette();
        }
    } else if (tab === 'hero' || tab === 'stats') {
        setTimeout(() => renderHeroSprite('hero-sheet-avatar-canvas', 0.75), 30);
    } else if (tab === 'quests') {
        renderBoardQuests();
        loadQuestMissionStats();
        loadQuestHistory();
    } else if (tab === 'campaigns') {
        loadCampaigns();
    } else if (tab === 'shop') {
        loadShopCatalog();
        loadInventory();
    } else if (tab === 'achievements') {
        loadAchievements();
    } else if (tab === 'leaderboard') {
        loadLeaderboard();
        initLeaderboardSSE();
    } else if (tab === 'coach') {
        loadRecoveryQuests();
    } else if (tab === 'analytics') {
        loadAnalytics();
        loadLedger();
    } else if (tab === 'settings') {
        loadSettingsUI();
    } else if (tab === 'rewards') {
        renderRewardsShop();
    } else if (tab === 'log') {
        renderAdventureLogs();
    }
}
window.switchAdvTab = switchAdvTab;

function toggleMobileMoreMenu() {
    const drawer = document.getElementById('mobile-more-drawer');
    if (drawer) {
        drawer.classList.toggle('hidden');
    }
}

// Mini Avatar in Top Bar
function renderMiniAvatar(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Mini head + hair avatar
    const skin = hero.skin_color || '#f5c29a';
    const hair = hero.hair_color || '#3b2219';

    // Head base
    ctx.fillStyle = skin;
    ctx.fillRect(7, 9, 20, 20);

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(11, 17, 4, 4);
    ctx.fillRect(19, 17, 4, 4);
    ctx.fillStyle = hero.eye_color || '#4a2e18';
    ctx.fillRect(13, 18, 2, 2);
    ctx.fillRect(21, 18, 2, 2);

    // Hair Top
    ctx.fillStyle = hair;
    ctx.fillRect(5, 5, 24, 7);
    ctx.fillRect(5, 12, 4, 10);
    ctx.fillRect(25, 12, 4, 10);
}

// =============================================================================
// 🏞️ SIDE-SCROLLING PARALLAX WORLD CANVAS ENGINE
// =============================================================================

function startAdventureWorldLoop() {
    if (worldLoopId) cancelAnimationFrame(worldLoopId);

    function loop() {
        worldAnimFrame++;
        
        // Advance world scroll speed based on transportation tier
        const activeRide = VEHICLES_CATALOG.find(v => v.name.toLowerCase() === (hero.transportation || 'walk').toLowerCase()) || VEHICLES_CATALOG[0];
        const rideSpeed = activeRide.speed * worldSpeedMultiplier;

        if (!isCelebrating) {
            worldScrollX += 1.8 * rideSpeed;
        } else {
            celebrationTimer--;
            if (celebrationTimer <= 0) {
                isCelebrating = false;
            }
        }

        renderAdventureWorld();
        worldLoopId = requestAnimationFrame(loop);
    }
    worldLoopId = requestAnimationFrame(loop);
}

function renderAdventureWorld() {
    const canvas = document.getElementById('adv-world-canvas');
    if (!canvas) return;

    // Auto-fit canvas buffer to client dimensions for full-screen crispness
    const clientW = canvas.clientWidth || 1000;
    const clientH = canvas.clientHeight || 300;
    if (canvas.width !== clientW || canvas.height !== clientH) {
        canvas.width = clientW;
        canvas.height = clientH;
    }

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const px = (v) => Math.round(v);

    // Dynamic Horizon / Road Placement
    const roadY = Math.round(H * 0.62);
    const roadH = H - roadY;

    // 1. SKY GRADIENT
    const skyGrad = ctx.createLinearGradient(0, 0, 0, roadY);
    skyGrad.addColorStop(0, '#0c1b33');
    skyGrad.addColorStop(0.5, '#1e3a5f');
    skyGrad.addColorStop(0.85, '#38bdf8');
    skyGrad.addColorStop(1, '#fed7aa');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Sun / Moon with soft glowing halo
    const sunX = W - 90;
    const sunY = 40;
    ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(sunX - 12, sunY - 12, 24, 24);

    // 2. DRIFTING CLOUDS (Speed 0.35x)
    const cloudOffset = (worldScrollX * 0.2) % (W + 200);
    drawCloud(ctx, W - cloudOffset + 50, 25, 45);
    drawCloud(ctx, (W - cloudOffset + 350) % (W + 200) - 100, 45, 35);
    drawCloud(ctx, (W - cloudOffset + 650) % (W + 200) - 100, 20, 55);

    // 3. DISTANT MOUNTAINS (Parallax 0.25x)
    const mountainOffset = (worldScrollX * 0.25) % 240;
    const mBaseY = roadY - 5;
    const mHeight = 85;
    ctx.fillStyle = '#1e293b';
    for (let x = -mountainOffset - 240; x < W + 240; x += 120) {
        ctx.beginPath();
        ctx.moveTo(x, mBaseY);
        ctx.lineTo(x + 60, mBaseY - mHeight);
        ctx.lineTo(x + 120, mBaseY);
        ctx.fill();

        // Mountain Snowcap
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(x + 60, mBaseY - mHeight);
        ctx.lineTo(x + 45, mBaseY - mHeight + 20);
        ctx.lineTo(x + 75, mBaseY - mHeight + 20);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
    }

    // 4. MIDGROUND TREE LINE & TOWN SILHOUETTES (Parallax 0.65x)
    const midOffset = (worldScrollX * 0.65) % 300;
    for (let x = -midOffset - 300; x < W + 300; x += 60) {
        // Pine tree
        ctx.fillStyle = '#0f3a21';
        ctx.fillRect(x + 12, roadY - 25, 6, 25); // trunk
        // Layered needles
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(x + 15, roadY - 65);
        ctx.lineTo(x - 5, roadY - 20);
        ctx.lineTo(x + 35, roadY - 20);
        ctx.fill();

        // Lamppost every 180px
        if (Math.abs(x % 180) < 30) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(x + 45, roadY - 45, 3, 45);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(x + 43, roadY - 48, 7, 5);
        }
    }

    // 5. FOREGROUND ROAD & PATHWAY (Parallax 1.8x)
    // Green grass verge
    ctx.fillStyle = '#166534';
    ctx.fillRect(0, roadY, W, 10);
    // Grass blade highlights
    ctx.fillStyle = '#4ade80';
    const grassOffset = (worldScrollX * 1.5) % 20;
    for (let x = -grassOffset; x < W; x += 12) {
        ctx.fillRect(x, roadY - 2, 2, 4);
    }

    // Road Cobblestone Base
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, roadY + 10, W, roadH - 10);

    // Checkered Curb
    const curbOffset = (worldScrollX * 2.0) % 32;
    for (let x = -curbOffset; x < W + 32; x += 16) {
        const isLight = Math.floor((x + worldScrollX * 2.0) / 16) % 2 === 0;
        ctx.fillStyle = isLight ? '#d97706' : '#111827';
        ctx.fillRect(x, roadY + 8, 16, 4);
    }

    // Road Center Dashes
    const dashOffset = (worldScrollX * 2.0) % 40;
    ctx.fillStyle = '#ffffff';
    for (let x = -dashOffset; x < W + 40; x += 40) {
        ctx.fillRect(x, roadY + 45, 20, 4);
    }

    // Road Milestone Signs & Floating Chests (Spawned periodically)
    const signOffset = (worldScrollX * 1.8) % 600;
    const signX = W - signOffset + 100;
    if (signX > -80 && signX < W + 80) {
        // Wooden milestone post
        ctx.fillStyle = '#78350f';
        ctx.fillRect(signX, roadY - 20, 5, 30);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(signX - 20, roadY - 35, 45, 16);
        ctx.fillStyle = '#000000';
        ctx.font = '7px "Press Start 2P"';
        ctx.fillText('LV 05', signX - 14, roadY - 24);

        // Floating Gold Chest [?]
        const chestBob = Math.sin(worldAnimFrame * 0.1) * 4;
        ctx.fillStyle = '#facc15';
        ctx.fillRect(signX + 70, roadY - 45 + chestBob, 16, 14);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(signX + 70, roadY - 38 + chestBob, 16, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('?', signX + 76, roadY - 34 + chestBob);
    }

    // 6. ANIMATED PLAYER & TRANSPORTATION
    renderAdvPlayerSprite(ctx, W, H, roadY);
}

function drawCloud(ctx, x, y, size) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillRect(x, y + 4, size, size * 0.4);
    ctx.fillRect(x + size * 0.2, y, size * 0.6, size * 0.6);
    ctx.fillRect(x + size * 0.1, y + size * 0.2, size * 0.8, size * 0.4);
}

/**
 * ADVANCED PIXEL-ART WORLD PLAYER ANIMATION
 * Handles Walking, Bicycle Pedaling, Skateboard Ollie/Kick, Scooter, Motorcycle, Cyber Cruiser, Jet!
 */
function renderAdvPlayerSprite(ctx, W, H, roadY) {
    const playerX = 140;
    let playerY = roadY + 28;
    const scale = 2.4;

    const ride = (hero.transportation || 'Walk').toLowerCase();
    const isWalking = (ride === 'walk');
    const isBicycle = (ride === 'bicycle');
    const isSkate = (ride === 'skateboard');
    const isScooter = (ride === 'scooter');
    const isMotorcycle = (ride === 'motorcycle');
    const isCar = (ride === 'cyber cruiser car' || ride === 'car');
    const isJet = (ride === 'futuristic jet');

    // Celebration Jump
    if (isCelebrating) {
        const jumpProgress = Math.sin((celebrationTimer / 60) * Math.PI);
        playerY -= jumpProgress * 26;

        // Sparkle bursts
        ctx.fillStyle = '#facc15';
        for (let i = 0; i < 5; i++) {
            const spX = playerX - 20 + Math.random() * 50;
            const spY = playerY - 30 + Math.random() * 40;
            ctx.fillRect(spX, spY, 3, 3);
        }
    }

    function px(x, y, w, h, fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(Math.round(playerX + x * scale), Math.round(playerY + y * scale), Math.round(w * scale), Math.round(h * scale));
    }

    // 1. GROUND SHADOW
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(playerX + 5, roadY + 38, isCar ? 35 : 18, isCar ? 8 : 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const skin = hero.skin_color || '#f5c29a';
    const topCol = hero.top_color || '#2563eb';
    const botCol = hero.bottom_color || '#1e293b';
    const hairCol = hero.hair_color || '#3b2219';

    // 2. TRANSPORTATION VEHICLE UNDERLAY & SPRITES
    if (isBicycle) {
        // Bicycle Geometry
        const wheelRot = worldAnimFrame * 0.25;
        const rearWheelX = -12;
        const frontWheelX = 14;
        const wheelY = 8;
        const r = 7;

        // Rotating Spoke Wheels
        drawPixelWheel(ctx, playerX + rearWheelX * scale, playerY + wheelY * scale, r * scale, wheelRot);
        drawPixelWheel(ctx, playerX + frontWheelX * scale, playerY + wheelY * scale, r * scale, wheelRot);

        // Bike Frame Tubes (Cyan/Blue metallic)
        px(-12, 8, 12, 1.5, '#06b6d4'); // chainstay
        px(0, 8, 14, 1.5, '#06b6d4');  // downtube
        px(-6, 0, 16, 1.5, '#0891b2'); // top tube
        px(frontWheelX - 2, 0, 2, 8, '#0891b2'); // fork
        px(-6, 0, 2, 8, '#0891b2'); // seatpost tube

        // Black seat & chrome handlebars
        px(-8, -2, 5, 2, '#18181b');
        px(12, -4, 4, 2, '#e2e8f0');

        // Pedaling crank animation
        const crankAngle = worldAnimFrame * 0.25;
        const pedalY = Math.sin(crankAngle) * 3;
        px(-1, 7 + pedalY, 2, 2, '#facc15');
    } else if (isSkate) {
        // Skateboard Deck & Wheels
        px(-14, 11, 28, 2.5, '#ec4899');
        px(-10, 13.5, 3, 3, '#38bdf8');
        px(8, 13.5, 3, 3, '#38bdf8');
        // LED Neon Underglow
        ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
        ctx.fillRect(playerX - 10 * scale, playerY + 14 * scale, 20 * scale, 3 * scale);
    } else if (isScooter) {
        // Retro Scooter Chassis
        px(-16, 6, 32, 7, '#0284c7');
        px(12, -2, 4, 12, '#38bdf8'); // front steering shield
        px(15, -4, 3, 3, '#fef08a'); // headlight
        px(-12, 11, 6, 6, '#18181b'); // rear wheel
        px(11, 11, 6, 6, '#18181b');  // front wheel
        // Exhaust Smoke Puffs
        if (worldAnimFrame % 6 === 0) {
            ctx.fillStyle = 'rgba(203, 213, 225, 0.6)';
            ctx.fillRect(playerX - 22 * scale, playerY + 8 * scale, 4 * scale, 4 * scale);
        }
    } else if (isMotorcycle) {
        // Heavy Road Bike
        px(-18, 4, 36, 9, '#b91c1c');
        px(-4, 0, 14, 5, '#18181b'); // fuel tank & engine block
        px(-14, 9, 8, 8, '#18181b'); // rear fat tire
        px(14, 9, 8, 8, '#18181b');  // front tire
        px(-18, 9, 8, 2.5, '#cbd5e1'); // chrome exhaust pipe
        // Speed blur lines
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(playerX - 30 * scale, playerY + 2 * scale, 12 * scale, 1.5 * scale);
    } else if (isCar) {
        // Cyber Cruiser Car Body
        px(-25, -2, 50, 14, '#0f172a');
        px(-25, 4, 50, 6, '#06b6d4'); // cyan body stripe
        px(-10, -6, 22, 6, '#38bdf8'); // tinted windshield glass
        px(-18, 10, 8, 8, '#18181b');  // rear wheel
        px(16, 10, 8, 8, '#18181b');   // front wheel
        px(-25, 4, 3, 3, '#ef4444');   // red glowing tail lamp
    } else if (isJet) {
        // Anti-Grav Plasma Flight Platform
        playerY -= 12 + Math.sin(worldAnimFrame * 0.1) * 3;
        px(-16, 8, 32, 4, '#475569');
        px(-10, 10, 6, 3 + Math.abs(Math.sin(worldAnimFrame * 0.3) * 4), '#06b6d4'); // left thruster plasma
        px(4, 10, 6, 3 + Math.abs(Math.sin(worldAnimFrame * 0.3) * 4), '#06b6d4');  // right thruster plasma
    }

    // 3. CHARACTER ANIMATION (Legs, Body, Head, Arms)
    const walkBob = isWalking ? Math.sin(worldAnimFrame * 0.25) * 2 : 0;
    const stride = isWalking ? Math.sin(worldAnimFrame * 0.25) * 4 : 0;

    // Legs
    if (isWalking) {
        px(-3 + stride, 0, 3, 11, botCol);
        px(1 - stride, 0, 3, 11, botCol);
        // Shoes
        px(-3 + stride, 10, 3.5, 2, hero.shoes_color || '#18181b');
        px(1 - stride, 10, 3.5, 2, hero.shoes_color || '#18181b');
    } else if (isBicycle) {
        // Pedaling bent legs
        const legAngle = worldAnimFrame * 0.25;
        px(-3, -2, 3, 6, botCol);
        px(-1 + Math.sin(legAngle) * 3, 4 + Math.cos(legAngle) * 3, 3, 5, botCol);
    } else {
        // Riding stance legs
        px(-3, 0, 3, 10, botCol);
        px(1, 0, 3, 10, botCol);
    }

    // Torso & Shirt
    const torsoY = -11 + walkBob;
    px(-4, torsoY, 8, 11, topCol);

    // Head
    const headY = torsoY - 10;
    px(-4, headY, 8, 9, skin);

    // Face & Eyes
    if (!isCelebrating) {
        px(1, headY + 3, 2, 2, '#ffffff');
        px(2, headY + 3.5, 1, 1, hero.eye_color || '#4a2e18');
        px(1, headY + 6, 2, 1, '#b91c1c'); // mouth
    } else {
        // Joyful smiling eyes ^ ^
        px(0, headY + 3, 2, 1, '#1e293b');
        px(2, headY + 3, 2, 1, '#1e293b');
        px(1, headY + 5.5, 3, 2, '#b91c1c'); // wide open smile
    }

    // Eyelashes & Blush for Female
    if (hero.gender === 'F') {
        px(0, headY + 5, 1.5, 1, 'rgba(244, 114, 182, 0.5)');
    }

    // Hairstyle
    px(-4.5, headY - 1.5, 9, 4, hairCol);
    px(-4.5, headY + 1, 2.5, 5, hairCol);

    // Eyewear Sunglasses / Glasses
    if (hero.accessories?.face === 'Sunglasses') {
        px(0, headY + 2.5, 3.5, 2.5, '#05070a');
        px(1, headY + 3, 1, 1, '#ffffff');
    }

    // Arms & Pose
    if (isCelebrating) {
        // Triumphant raised arms V
        px(-6, torsoY - 4, 2.5, 7, topCol);
        px(4, torsoY - 4, 2.5, 7, topCol);
    } else if (isWalking) {
        px(-5 - stride * 0.7, torsoY + 1, 2.5, 7, topCol);
        px(3 + stride * 0.7, torsoY + 1, 2.5, 7, topCol);
    } else if (isBicycle || isScooter || isMotorcycle) {
        // Forward gripping handlebars
        px(1, torsoY + 2, 7, 2.5, topCol);
        px(7, torsoY + 2, 2, 2, skin);
    } else {
        px(-5, torsoY + 1, 2.5, 7, topCol);
        px(3, torsoY + 1, 2.5, 7, topCol);
    }

    // 4. COMPANION PET RUNNING ALONGSIDE
    if (hero.companion && hero.companion !== 'None') {
        const petX = -20;
        const petY = 4 + (isWalking ? Math.sin(worldAnimFrame * 0.3) * 2 : 0);
        if (hero.companion === 'Dog') {
            px(petX, petY, 6, 5, '#d97706');
            px(petX + 5, petY + 1, 2, 2, '#18181b'); // snout
            px(petX - 2, petY + Math.sin(worldAnimFrame * 0.4) * 2, 2, 2, '#f59e0b'); // wagging tail
        } else if (hero.companion === 'Cat') {
            px(petX, petY, 5, 4, '#ea580c');
            px(petX + 1, petY - 2, 1.5, 2, '#9a3412'); // ears
            px(petX + 3, petY - 2, 1.5, 2, '#9a3412');
        } else if (hero.companion === 'Dragon') {
            px(petX, petY - 8 + Math.sin(worldAnimFrame * 0.15) * 3, 6, 5, '#15803d');
            px(petX - 2, petY - 10, 3, 3, '#166534'); // wing
        }
    }
}

function drawPixelWheel(ctx, cx, cy, r, rot) {
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.fill();

    // Spokes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
    ctx.lineTo(cx - Math.cos(rot) * r, cy - Math.sin(rot) * r);
    ctx.moveTo(cx + Math.cos(rot + Math.PI/2) * r, cy + Math.sin(rot + Math.PI/2) * r);
    ctx.lineTo(cx - Math.cos(rot + Math.PI/2) * r, cy - Math.sin(rot + Math.PI/2) * r);
    ctx.stroke();

    // Center hub
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3);
}

// =============================================================================
// ⚔️ QUEST MANAGEMENT & FLOATING REWARD LOOP
// =============================================================================

async function fetchQuests() {
    let quests = [];
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/quests`);
            if (res.ok) quests = await res.json();
        } catch (e) {}
    } else {
        const saved = localStorage.getItem('liferpg_guest_quests');
        if (saved) {
            try { guestQuests = JSON.parse(saved); } catch (e) {}
        } else {
            guestQuests = JSON.parse(JSON.stringify(DEFAULT_STARTER_QUESTS_JS));
            localStorage.setItem('liferpg_guest_quests', JSON.stringify(guestQuests));
        }
        quests = guestQuests;
    }
    renderQuests(quests);
}

function getCategoryIcon(cat) {
    if (cat === 'School') return '🏫';
    if (cat === 'Exercise' || cat === 'Fitness') return '🏋️';
    if (cat === 'Health Care' || cat === 'Health') return '💧';
    if (cat === 'Focus') return '🧠';
    if (cat === 'Finance') return '💎';
    if (cat === 'Tech') return '💻';
    return '📚';
}

function getCategoryBadgeClass(cat) {
    if (cat === 'School') return 'badge-school';
    if (cat === 'Exercise' || cat === 'Fitness') return 'badge-exercise';
    if (cat === 'Health Care' || cat === 'Health') return 'badge-health';
    return 'q-cat-tag';
}

function getDifficultyBadge(diff) {
    const d = (diff || 'EASY').toUpperCase();
    if (d === 'HARD') return '<span class="badge-hard">🔴 HARD</span>';
    if (d === 'MED' || d === 'MEDIUM') return '<span class="badge-med">🟡 MED</span>';
    return '<span class="badge-easy">🟢 EASY</span>';
}

function renderQuests(quests) {
    const list = document.getElementById('adv-quests-list');
    if (!list) return;
    list.innerHTML = '';

    const activeQuests = quests.filter(q => !q.completed);
    setText('active-quests-count', `${activeQuests.length} ACTIVE`);

    // Top HUD current target quest
    if (activeQuests.length > 0) {
        setText('cq-title-text', activeQuests[0].title);
    } else {
        setText('cq-title-text', 'All daily quests conquered! Forge more.');
    }

    if (!quests || quests.length === 0) {
        list.innerHTML = '<div style="color:#94a3b8; font-family:var(--font-pixel); font-size:0.55rem; text-align:center; padding:12px;">No active quests. Forge a new quest above!</div>';
        return;
    }

    quests.forEach(q => {
        const card = document.createElement('div');
        card.className = `quest-item-card ${q.completed ? 'completed' : ''}`;
        
        const catIcon = getCategoryIcon(q.category);
        const catClass = getCategoryBadgeClass(q.category);
        const diffBadge = getDifficultyBadge(q.difficulty);

        card.innerHTML = `
            <div class="q-info-col">
                <span class="q-title-text">${catIcon} ${q.title}</span>
                <div class="q-rewards-row">
                    <span class="${catClass}">${q.category || 'Life'}</span>
                    ${diffBadge}
                    <span class="q-reward-tag">🪙 +${q.gold_reward || 20} G</span>
                    <span class="q-stat-tag">⭐ +${q.xp_reward || 20} XP</span>
                </div>
            </div>
            <div class="q-action-col">
                ${q.completed 
                    ? '<button class="q-complete-btn done" disabled>CLAIMED</button>'
                    : `<button class="q-complete-btn" onclick="completeAdvQuest(${q.id})">✓ COMPLETE</button>`}
            </div>
        `;
        list.appendChild(card);
    });
}

function openAddQuestModal() {
    playSound('click');
    document.getElementById('add-quest-modal')?.classList.remove('hidden');
}

function closeAddQuestModal() {
    playSound('click');
    document.getElementById('add-quest-modal')?.classList.add('hidden');
}

function onDifficultyChange(val) {
    // Difficulty selector feedback
    playSound('step');
}

async function handleAdvCreateQuest(e) {
    e.preventDefault();
    const title = document.getElementById('new-q-title')?.value.trim();
    const desc = document.getElementById('new-q-desc')?.value.trim();
    const category = document.getElementById('new-q-category')?.value || 'School';
    const difficulty = document.getElementById('new-q-difficulty')?.value || 'EASY';

    let xp_reward = 20;
    let gold_reward = 20;
    let stat_val = 5;

    if (difficulty === 'HARD') {
        xp_reward = 60;
        gold_reward = 60;
        stat_val = 15;
    } else if (difficulty === 'MED') {
        xp_reward = 40;
        gold_reward = 40;
        stat_val = 10;
    }

    let stat_type = 'knowledge';
    if (category === 'Exercise' || category === 'Fitness') stat_type = 'fitness';
    else if (category === 'Health Care' || category === 'Health') stat_type = 'vitality';
    else if (category === 'Focus') stat_type = 'discipline';
    else if (category === 'Finance') stat_type = 'finance';
    else if (category === 'Tech') stat_type = 'wisdom';

    if (!title) return;

    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/quests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title, description: desc, category, difficulty, stat_type, stat_val, xp_reward, gold_reward
                })
            });
            if (res.ok) {
                playSound('victory');
                closeAddQuestModal();
                fetchQuests();
                renderBoardQuests();
            }
        } catch (err) {}
    } else {
        const newQuest = {
            id: Date.now(),
            title, description: desc, category, difficulty, stat_type, stat_val,
            xp_reward, gold_reward, completed: false
        };
        guestQuests.unshift(newQuest);
        localStorage.setItem('liferpg_guest_quests', JSON.stringify(guestQuests));
        playSound('victory');
        closeAddQuestModal();
        renderQuests(guestQuests);
        renderBoardQuests();
    }
}

async function completeAdvQuest(questId) {
    playSound('victory');
    isCelebrating = true;
    celebrationTimer = 75; // frames of celebratory victory jump

    let xpGained = 25;
    let goldGained = 50;
    let statTypeGained = 'knowledge';
    let statValGained = 5;

    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/quests/${questId}/complete`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                hero.gold = data.new_gold;
                hero.level = data.new_level;
                hero.xp = data.new_xp;
                hero.journey_km = data.journey_km;
                hero.transportation = data.transportation;
                if (data.stats) {
                    hero = { ...hero, ...data.stats };
                }
                xpGained = data.xp_reward;
                goldGained = data.gold_reward;
                statTypeGained = data.stat_type;
                statValGained = data.stat_val;

                if (data.construction_xp !== undefined && window.homeEngine) {
                    window.homeEngine.constructionXp = data.construction_xp;
                    window.homeEngine.updateHomeHUD();
                }
                if (data.cxp_reward) {
                    setTimeout(() => spawnFloatingReward(`+${data.cxp_reward} BUILD XP`, 'stat', 160, 50), 600);
                }

                if (data.level_up) {
                    showLevelUpModal(data.new_level, data.new_transport);
                }

                if (data.achievementsUnlocked && data.achievementsUnlocked.length > 0) {
                    data.achievementsUnlocked.forEach((ach, idx) => {
                        setTimeout(() => showAchievementToast(ach), idx * 600);
                    });
                }

                updateAdvDashboardUI();
                loadQuestMissionStats();
                renderBoardQuests();
                loadQuestHistory();
            }
        } catch (e) {}
    } else {
        const q = guestQuests.find(item => item.id === questId);
        if (q && !q.completed) {
            q.completed = true;
            xpGained = q.xp_reward || 20;
            goldGained = q.gold_reward || 20;
            statTypeGained = q.stat_type || 'knowledge';
            statValGained = q.stat_val || 5;

            const diff = (q.difficulty || 'EASY').toUpperCase();
            const cxpGained = diff === 'HARD' ? 50 : diff === 'MED' ? 25 : 10;
            if (window.homeEngine) {
                window.homeEngine.constructionXp += cxpGained;
                window.homeEngine.saveHomeData();
                window.homeEngine.updateHomeHUD();
            }
            setTimeout(() => spawnFloatingReward(`+${cxpGained} BUILD XP`, 'stat', 160, 50), 600);

            hero.gold = (hero.gold || 1000) + goldGained;
            hero.xp = (hero.xp || 0) + xpGained;
            hero.journey_km = (hero.journey_km || 2) + 2;

            if (statTypeGained === 'knowledge') hero.knowledge = (hero.knowledge || 15) + statValGained;
            else if (statTypeGained === 'fitness') hero.fitness = (hero.fitness || 10) + statValGained;
            else if (statTypeGained === 'vitality') hero.vitality = (hero.vitality || 20) + statValGained;
            else if (statTypeGained === 'discipline') hero.discipline = (hero.discipline || 12) + statValGained;
            else if (statTypeGained === 'finance') hero.finance = (hero.finance || 5) + statValGained;

            const oldLvl = hero.level || 1;
            while (hero.xp >= 100) {
                hero.xp -= 100;
                hero.level = (hero.level || 1) + 1;
            }

            let unlockedVehicle = null;
            VEHICLES_CATALOG.forEach(v => {
                if (oldLvl < v.level && hero.level >= v.level) {
                    unlockedVehicle = v.name;
                    if (v.level === 5) hero.transportation = 'Bicycle';
                }
            });

            if (hero.level > oldLvl) {
                showLevelUpModal(hero.level, unlockedVehicle);
            }

            localStorage.setItem('liferpg_guest_quests', JSON.stringify(guestQuests));
            localStorage.setItem('liferpg_hero_profile', JSON.stringify(hero));
            updateAdvDashboardUI();
            renderQuests(guestQuests);
        }
    }

    // In-World Particle Explosion & HUD flying text
    if (window.worldEngine) {
        window.worldEngine.celebrateReward(xpGained, goldGained, (statTypeGained || 'INT').toUpperCase());
    }

    // Spawn Floating Reward Tags
    spawnFloatingReward(`+${xpGained} XP`, 'xp', 140, 110);
    setTimeout(() => spawnFloatingReward(`+${goldGained} GOLD`, 'gold', 170, 90), 200);
    setTimeout(() => spawnFloatingReward(`+${statValGained} ${statTypeGained.toUpperCase()}`, 'stat', 150, 70), 400);
}

function spawnFloatingReward(text, type, x, y) {
    const layer = document.getElementById('floating-text-layer');
    if (!layer) return;

    const el = document.createElement('div');
    el.className = `floating-reward-tag ${type}`;
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;

    layer.appendChild(el);
    setTimeout(() => el.remove(), 1600);
}

// =============================================================================
// 🚲 VEHICLE GARAGE & LEVEL-UP MODALS
// =============================================================================

function openGarageModal() {
    playSound('tab');
    const container = document.getElementById('vehicles-grid-container');
    if (!container) return;
    container.innerHTML = '';

    const currentLvl = hero.level || 1;
    const currentRide = (hero.transportation || 'Walk').toLowerCase();

    VEHICLES_CATALOG.forEach(v => {
        const isUnlocked = currentLvl >= v.level;
        const isActive = currentRide === v.name.toLowerCase();

        const card = document.createElement('div');
        card.className = `vehicle-card ${isUnlocked ? 'unlocked' : 'locked'} ${isActive ? 'active-ride' : ''}`;
        card.innerHTML = `
            <div class="v-icon">${v.icon}</div>
            <div class="v-name">${v.name}</div>
            <div class="v-desc">${v.desc}</div>
            <div class="v-speed-badge">⚡ ${v.speed}x Speed</div>
            ${isUnlocked 
                ? (isActive 
                    ? '<span class="status-pill">EQUIPPED</span>' 
                    : `<button class="pixel-btn btn-sm btn-green" onclick="equipVehicle('${v.name}')">EQUIP</button>`)
                : `<span class="v-req">🔒 Unlocks at Level ${v.level}</span>`}
        `;
        container.appendChild(card);
    });

    document.getElementById('garage-modal')?.classList.remove('hidden');
}

function closeGarageModal() {
    playSound('click');
    document.getElementById('garage-modal')?.classList.add('hidden');
}

async function equipVehicle(tierName) {
    playSound('magic');
    hero.transportation = tierName;
    if (currentUser) {
        try {
            await fetchWithRefresh(`${baseUrl}/character/transport`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transport: tierName })
            });
        } catch (e) {}
    } else {
        localStorage.setItem('liferpg_hero_profile', JSON.stringify(hero));
    }
    updateAdvDashboardUI();
    openGarageModal(); // refresh
}

function showLevelUpModal(lvl, unlockedVehicle) {
    playSound('victory');
    currentUnlockedVehicle = unlockedVehicle;

    setText('lvlup-badge-val', `LVL ${String(lvl).padStart(2, '0')}`);
    setText('lvlup-hero-name', `${hero.name} reaches Level ${lvl}!`);

    const card = document.getElementById('lvlup-unlock-card');
    if (unlockedVehicle && card) {
        card.classList.remove('hidden');
        const vObj = VEHICLES_CATALOG.find(v => v.name.toLowerCase() === unlockedVehicle.toLowerCase());
        if (vObj) {
            setText('unlock-vehicle-icon', vObj.icon);
            setText('unlock-vehicle-name', vObj.name.toUpperCase());
            setText('unlock-vehicle-desc', `"${vObj.desc}"`);
        }
    } else if (card) {
        card.classList.add('hidden');
    }

    document.getElementById('levelup-unlock-modal')?.classList.remove('hidden');
}

function closeLevelUpModal() {
    playSound('click');
    document.getElementById('levelup-unlock-modal')?.classList.add('hidden');
}

function equipUnlockedTransport() {
    if (currentUnlockedVehicle) {
        equipVehicle(currentUnlockedVehicle);
    }
    closeLevelUpModal();
}

// =============================================================================
// ⚔️ TAB 3: FULL QUEST BOARD FILTERING & RENDERING
// =============================================================================

function filterQuestsTab(filter, btn) {
    playSound('click');
    currentQuestBoardFilter = filter;
    document.querySelectorAll('.q-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderBoardQuests();
}

function renderBoardQuests() {
    const container = document.getElementById('board-quests-list');
    if (!container) return;
    container.innerHTML = '';

    let allList = [];
    if (currentUser) {
        allList = guestQuests || [];
    } else {
        const saved = localStorage.getItem('liferpg_guest_quests');
        if (saved) {
            try { allList = JSON.parse(saved); } catch (e) {}
        } else {
            allList = guestQuests || [];
        }
    }

    const todayCount = allList.filter(q => !q.completed).length;
    const doneCount = allList.filter(q => q.completed).length;
    const schoolCount = allList.filter(q => q.category === 'School').length;
    const exerciseCount = allList.filter(q => q.category === 'Exercise' || q.category === 'Fitness').length;
    const healthCount = allList.filter(q => q.category === 'Health Care' || q.category === 'Health').length;

    setText('q-count-today', todayCount);
    setText('q-count-done', doneCount);
    setText('q-count-all', allList.length);
    setText('q-count-school', schoolCount);
    setText('q-count-exercise', exerciseCount);
    setText('q-count-health', healthCount);

    let filtered = allList;
    if (currentQuestBoardFilter === 'today') {
        filtered = allList.filter(q => !q.completed);
    } else if (currentQuestBoardFilter === 'completed') {
        filtered = allList.filter(q => q.completed);
    } else if (currentQuestBoardFilter === 'School') {
        filtered = allList.filter(q => q.category === 'School');
    } else if (currentQuestBoardFilter === 'Exercise') {
        filtered = allList.filter(q => q.category === 'Exercise' || q.category === 'Fitness');
    } else if (currentQuestBoardFilter === 'Health Care') {
        filtered = allList.filter(q => q.category === 'Health Care' || q.category === 'Health');
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div style="color:#94a3b8; font-family:var(--font-pixel); font-size:0.58rem; text-align:center; padding:24px; background:#0f172a; border-radius:6px;">No quests in this category. Forge a new quest above!</div>`;
        return;
    }

    filtered.forEach(q => {
        const card = document.createElement('div');
        const catClass = (q.category === 'Exercise' || q.category === 'Fitness') ? 'cat-fitness' : 
                         (q.category === 'Health Care' || q.category === 'Health') ? 'cat-health' : 
                         q.category === 'Focus' ? 'cat-focus' : 
                         q.category === 'Finance' ? 'cat-finance' : 'cat-knowledge';
        card.className = `board-quest-card ${catClass} ${q.completed ? 'completed' : ''}`;

        const catIcon = getCategoryIcon(q.category);
        const catBadgeClass = getCategoryBadgeClass(q.category);
        const diffBadge = getDifficultyBadge(q.difficulty);

        card.innerHTML = `
            <div class="bq-info">
                <span class="bq-title">${catIcon} ${q.title}</span>
                <span class="bq-desc">${q.description || 'Consistency builds real-life attributes.'}</span>
                <div class="bq-tags">
                    <span class="${catBadgeClass}">${q.category || 'School'}</span>
                    ${diffBadge}
                    <span class="q-reward-tag">🪙 +${q.gold_reward || 20} Gold</span>
                    <span class="q-stat-tag">⭐ +${q.xp_reward || 20} XP</span>
                </div>
            </div>
            <div class="bq-action">
                ${q.completed 
                    ? '<button class="q-complete-btn done" disabled>CLAIMED ✓</button>'
                    : `<button class="pixel-btn btn-sm btn-green" onclick="completeAdvQuest(${q.id})">✓ COMPLETE</button>`}
            </div>
        `;
        container.appendChild(card);
    });
}

// =============================================================================
// 🎁 TAB 4: REWARDS SHOP & CUSTOM REWARDS
// =============================================================================

function redeemShopReward(cost, title, icon = '🎁') {
    const currentGold = hero.gold || 1000;
    if (currentGold < cost) {
        playSound('error');
        alert(`🔒 Not enough Gold! You need 🪙 ${cost} Gold. Complete real-world quests to earn more.`);
        return;
    }

    playSound('victory');
    hero.gold = currentGold - cost;

    // Add to Adventure Log
    const now = new Date();
    const timeStr = `TODAY • ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    addAdventureLog(`🎁 Redeemed Reward: ${title}`, `Spent 🪙 ${cost} Gold on a guilt-free real-life treat! Enjoy!`, 'gold', `-${cost} G`);

    if (currentUser) {
        try {
            fetchWithRefresh(`${baseUrl}/character`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hero)
            });
        } catch (e) {}
    } else {
        localStorage.setItem('liferpg_hero_profile', JSON.stringify(hero));
    }

    spawnFloatingReward(`-${cost} GOLD`, 'gold', 170, 90);
    updateAdvDashboardUI();
}

function openAddRewardModal() {
    playSound('click');
    document.getElementById('add-reward-modal')?.classList.remove('hidden');
}

function closeAddRewardModal() {
    playSound('click');
    document.getElementById('add-reward-modal')?.classList.add('hidden');
}

function handleCreateCustomReward(e) {
    e.preventDefault();
    const title = document.getElementById('new-reward-title')?.value.trim();
    const desc = document.getElementById('new-reward-desc')?.value.trim();
    const icon = document.getElementById('new-reward-icon')?.value || '🎁';
    const cost = parseInt(document.getElementById('new-reward-cost')?.value || '200', 10);

    if (!title) return;

    const newReward = { id: Date.now(), title, desc: desc || 'Custom personal reward', icon, cost };
    userCustomRewards.push(newReward);
    localStorage.setItem('liferpg_custom_rewards', JSON.stringify(userCustomRewards));

    playSound('victory');
    closeAddRewardModal();
    renderRewardsShop();
}

function renderRewardsShop() {
    const grid = document.getElementById('rewards-shop-grid');
    if (!grid) return;

    // Base 6 standard cards
    const standardCards = [
        { icon: '🎬', category: 'ENTERTAINMENT', title: 'Movie Night', desc: 'Enjoy your favorite film or series guilt-free with snacks.', cost: 150 },
        { icon: '📚', category: 'KNOWLEDGE', title: 'New Book', desc: 'Order a new fiction, self-help, or technical book on wishlist.', cost: 300 },
        { icon: '🎮', category: 'GAMING', title: 'Gaming Session', desc: '2 hours of uninterrupted, guilt-free video game time.', cost: 200 },
        { icon: '🍕', category: 'TREAT', title: 'Pizza Night', desc: 'Delicious cheat meal pizza or favorite takeout dinner.', cost: 250 },
        { icon: '🎧', category: 'AUDIO', title: 'Music / Album', desc: 'Buy a new vinyl, digital track, album or audio gear treat.', cost: 180 },
        { icon: '🏖️', category: 'RELAX', title: 'Free Evening', desc: 'Zero tasks, zero pressure. Complete relaxation evening.', cost: 400 }
    ];

    grid.innerHTML = '';

    const allCards = [...standardCards, ...userCustomRewards.map(r => ({
        icon: r.icon,
        category: 'CUSTOM',
        title: r.title,
        desc: r.desc,
        cost: r.cost
    }))];

    allCards.forEach(c => {
        const card = document.createElement('div');
        card.className = 'reward-shop-card';
        card.innerHTML = `
            <div class="rc-badge-top">${c.category}</div>
            <div class="rc-icon">${c.icon}</div>
            <h4 class="rc-title">${c.title}</h4>
            <p class="rc-desc">${c.desc}</p>
            <div class="rc-price">🪙 ${c.cost} Gold</div>
            <button type="button" class="pixel-btn btn-sm btn-gold rc-btn" onclick="redeemShopReward(${c.cost}, '${c.title}', '${c.icon}')">REDEEM</button>
        `;
        grid.appendChild(card);
    });
}

// =============================================================================
// 📜 TAB 5: LOG & ADVENTURE HISTORY
// =============================================================================

function addAdventureLog(title, desc, type = 'quest', badge = 'DONE') {
    const now = new Date();
    const timeStr = `TODAY • ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newLog = {
        id: Date.now(),
        time: timeStr,
        title,
        desc,
        type,
        badge
    };
    adventureLogs.unshift(newLog);
    localStorage.setItem('liferpg_adventure_logs', JSON.stringify(adventureLogs));
    if (currentAdvTab === 'log') renderAdventureLogs();
}

function renderAdventureLogs() {
    const container = document.getElementById('timeline-events-list');
    if (!container) return;
    container.innerHTML = '';

    if (!adventureLogs || adventureLogs.length === 0) {
        container.innerHTML = '<div style="color:#94a3b8; font-family:var(--font-pixel); font-size:0.55rem; padding:16px;">No adventure logs recorded yet.</div>';
        return;
    }

    adventureLogs.forEach(l => {
        const item = document.createElement('div');
        item.className = 'timeline-event-item';
        item.innerHTML = `
            <div class="te-info">
                <span class="te-time">${l.time}</span>
                <span class="te-title">${l.title}</span>
                <span class="te-desc">${l.desc}</span>
            </div>
            <span class="te-badge ${l.type === 'gold' ? 'gold' : ''}">${l.badge}</span>
        `;
        container.appendChild(item);
    });
}

function clearAdventureLogs() {
    playSound('click');
    if (confirm('Clear all journey logs?')) {
        adventureLogs = [];
        localStorage.setItem('liferpg_adventure_logs', JSON.stringify([]));
        renderAdventureLogs();
    }
}

// =============================================================================
// 💾 PROFILE BACKUP & DATA RESTORATION / RESET
// =============================================================================

function openBackupModal() {
    playSound('click');
    document.getElementById('backup-modal')?.classList.remove('hidden');
}

function closeBackupModal() {
    playSound('click');
    document.getElementById('backup-modal')?.classList.add('hidden');
}

function exportUserData() {
    playSound('victory');
    const backupData = {
        version: "2.1",
        export_date: new Date().toISOString(),
        hero: hero,
        quests: guestQuests,
        customRewards: userCustomRewards,
        adventureLogs: adventureLogs,
        homeData: localStorage.getItem('liferpg_home_data')
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `liferpg_save_${hero.name || 'hero'}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function handleImportFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.hero) {
                hero = { ...hero, ...data.hero };
                localStorage.setItem('liferpg_hero_profile', JSON.stringify(hero));
            }
            if (data.quests && Array.isArray(data.quests)) {
                guestQuests = data.quests;
                localStorage.setItem('liferpg_guest_quests', JSON.stringify(guestQuests));
            }
            if (data.customRewards && Array.isArray(data.customRewards)) {
                userCustomRewards = data.customRewards;
                localStorage.setItem('liferpg_custom_rewards', JSON.stringify(userCustomRewards));
            }
            if (data.adventureLogs && Array.isArray(data.adventureLogs)) {
                adventureLogs = data.adventureLogs;
                localStorage.setItem('liferpg_adventure_logs', JSON.stringify(adventureLogs));
            }
            if (data.homeData) {
                localStorage.setItem('liferpg_home_data', data.homeData);
                if (window.homeEngine) window.homeEngine.loadHomeData();
            }
            playSound('victory');
            alert('🎉 Hero and Base save data successfully restored!');
            closeBackupModal();
            updateAdvDashboardUI();
            updateUIValues();
            renderBoardQuests();
            renderQuests(guestQuests);
            if (window.homeEngine) window.homeEngine.updateHomeHUD();
        } catch (err) {
            playSound('error');
            alert('❌ Failed to parse save file. Please select a valid JSON backup.');
        }
    };
    reader.readAsText(file);
}

function resetUserData() {
    if (confirm("⚠️ Are you sure you want to reset all local progress to default?")) {
        localStorage.removeItem('liferpg_hero_profile');
        localStorage.removeItem('liferpg_guest_quests');
        localStorage.removeItem('liferpg_custom_rewards');
        localStorage.removeItem('liferpg_adventure_logs');
        localStorage.removeItem('liferpg_home_data');
        guestQuests = JSON.parse(JSON.stringify(DEFAULT_STARTER_QUESTS_JS));
        localStorage.setItem('liferpg_guest_quests', JSON.stringify(guestQuests));
        if (window.homeEngine) window.homeEngine.initStarterHome();
        playSound('magic');
        alert("✨ Data reset to factory starter defaults!");
        closeBackupModal();
        location.reload();
    }
}

// =============================================================================
// 🛏️ ROOM BLUEPRINTS & QUICK BUILD PALETTE
// =============================================================================

// Quick Build Palette rendering is handled in home_engine.js


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

    const unlocked = window.homeEngine?.unlockedRooms || ['bedroom'];
    const curHomeLvl = window.homeEngine?.homeLevel || 1;

    ROOM_BLUEPRINTS.forEach(room => {
        const isUnlocked = unlocked.includes(room.id);
        const canUnlock = curHomeLvl >= room.reqLevel;
        const card = document.createElement('div');
        card.className = `blueprint-card ${isUnlocked ? 'unlocked' : ''}`;

        card.innerHTML = `
            <div class="bp-header">
                <div class="bp-title-wrap">
                    <span style="font-size:1.4rem;">${room.icon}</span>
                    <div>
                        <h4 class="bp-name">${room.name}</h4>
                        <span style="font-family:var(--font-pixel); font-size:0.42rem; color:${canUnlock ? '#4ade80' : '#f87171'};">
                            ${canUnlock ? `✓ Level ${room.reqLevel} Ready` : `🔒 Req Home Level ${room.reqLevel}`}
                        </span>
                    </div>
                </div>
                ${isUnlocked 
                    ? '<span class="te-badge gold">CONSTRUCTED ✓</span>' 
                    : `<button type="button" class="pixel-btn btn-sm ${canUnlock ? 'btn-green' : 'btn-slate'}" ${canUnlock ? '' : 'disabled'} onclick="constructRoomBlueprint('${room.id}')">CONSTRUCT</button>`}
            </div>
            <p class="bp-perk">${room.perk}</p>
            ${isUnlocked ? '' : `
            <div class="bp-costs">
                <span style="color:#facc15;">🪙 ${room.coins} Coins</span>
                <span style="color:#38bdf8;">⭐ ${room.cxp} Build XP</span>
            </div>`}
        `;
        grid.appendChild(card);
    });

    // Update Room Pills in banner
    const pillBox = document.getElementById('home-unlocked-rooms-tags');
    if (pillBox) {
        pillBox.innerHTML = '';
        ROOM_BLUEPRINTS.forEach(r => {
            const isU = unlocked.includes(r.id);
            const pill = document.createElement('span');
            pill.className = `room-pill ${isU ? 'active' : ''}`;
            pill.textContent = `${r.icon} ${r.name.split(' ')[0]}`;
            pillBox.appendChild(pill);
        });
    }
}

async function constructRoomBlueprint(roomId) {
    const room = ROOM_BLUEPRINTS.find(r => r.id === roomId);
    if (!room) return;

    const currentGold = hero.gold || 1000;
    const currentCxp = window.homeEngine?.constructionXp || 100;

    if (currentGold < room.coins) {
        playSound('error');
        alert(`🔒 Insufficient Coins! You need 🪙 ${room.coins} Coins.`);
        return;
    }
    if (currentCxp < room.cxp) {
        playSound('error');
        alert(`🔒 Insufficient Construction XP! You need ⭐ ${room.cxp} Build XP.`);
        return;
    }

    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/home/unlock-room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: room.id,
                    room_name: room.name,
                    required_level: room.reqLevel,
                    coin_cost: room.coins,
                    construction_xp_cost: room.cxp
                })
            });
            if (res.ok) {
                const data = await res.json();
                hero.gold = data.new_gold;
                if (window.homeEngine) {
                    window.homeEngine.constructionXp = data.new_construction_xp;
                    if (!window.homeEngine.unlockedRooms.includes(roomId)) {
                        window.homeEngine.unlockedRooms.push(roomId);
                    }
                    window.homeEngine.saveHomeData();
                }
            }
        } catch (e) {}
    } else {
        hero.gold = currentGold - room.coins;
        if (window.homeEngine) {
            window.homeEngine.constructionXp = currentCxp - room.cxp;
            if (!window.homeEngine.unlockedRooms.includes(roomId)) {
                window.homeEngine.unlockedRooms.push(roomId);
            }
            window.homeEngine.addHomeXP(40);
            window.homeEngine.saveHomeData();
        }
    }

    playSound('victory');
    alert(`🎉 Congratulations! You constructed the ${room.name}!\n${room.perk}`);
    addAdventureLog(`🏠 Base Wing Constructed: ${room.name}`, `Expanded personal Life RPG home property with a new ${room.name}!`, 'gold', '+ROOM');
    renderRoomBlueprints();
    if (window.homeEngine) window.homeEngine.updateHomeHUD();
    updateAdvDashboardUI();
}

// =============================================================================
// ⏱️ MASTER HUD SYSTEM 1: INTERACTIVE FOCUS TIMER ENGINE
// =============================================================================

let focusTimerRunning = false;
let focusTimerSecondsLeft = 25 * 60;
let focusTimerDurationMinutes = 25;
let focusTimerInterval = null;
let activeFocusQuestId = null;
let activeFocusQuestTitle = "General Deep Work Sprint";

function openFocusTimerModal(questId = null, questTitle = null, durationMinutes = 25) {
    playSound('click');
    activeFocusQuestId = questId;
    activeFocusQuestTitle = questTitle || "General Deep Work Sprint";
    focusTimerDurationMinutes = durationMinutes || 25;
    focusTimerSecondsLeft = focusTimerDurationMinutes * 60;
    
    setText('modal-focus-quest-name', `⚔️ Target: ${activeFocusQuestTitle}`);
    updateFocusTimerDisplay();
    document.getElementById('focus-timer-modal')?.classList.remove('hidden');
}

function closeFocusTimerModal() {
    playSound('click');
    document.getElementById('focus-timer-modal')?.classList.add('hidden');
}

function setFocusDuration(minutes) {
    playSound('step');
    focusTimerDurationMinutes = parseInt(minutes, 10) || 25;
    focusTimerSecondsLeft = focusTimerDurationMinutes * 60;
    
    const sel = document.getElementById('focus-duration-select');
    if (sel) sel.value = String(focusTimerDurationMinutes);
    
    updateFocusTimerDisplay();
}

function toggleFocusTimer() {
    if (focusTimerRunning) {
        pauseFocusTimer();
    } else {
        startFocusTimer();
    }
}

function startFocusTimer() {
    playSound('click');
    focusTimerRunning = true;
    
    const bannerBtn = document.getElementById('btn-timer-start');
    if (bannerBtn) {
        bannerBtn.textContent = '⏸ PAUSE';
        bannerBtn.classList.replace('btn-green', 'btn-gold');
    }
    const modalBtn = document.getElementById('btn-modal-timer-toggle');
    if (modalBtn) {
        modalBtn.textContent = '⏸ PAUSE TIMER';
        modalBtn.classList.replace('btn-green', 'btn-gold');
    }
    setText('ftb-status-text', `🔥 Deep Work in progress: ${activeFocusQuestTitle}`);

    if (focusTimerInterval) clearInterval(focusTimerInterval);
    focusTimerInterval = setInterval(() => {
        focusTimerSecondsLeft--;
        updateFocusTimerDisplay();
        if (focusTimerSecondsLeft <= 0) {
            clearInterval(focusTimerInterval);
            focusTimerRunning = false;
            onFocusTimerComplete();
        }
    }, 1000);
}

function pauseFocusTimer() {
    playSound('click');
    focusTimerRunning = false;
    if (focusTimerInterval) clearInterval(focusTimerInterval);
    
    const bannerBtn = document.getElementById('btn-timer-start');
    if (bannerBtn) {
        bannerBtn.textContent = '▶ RESUME';
        bannerBtn.classList.replace('btn-gold', 'btn-green');
    }
    const modalBtn = document.getElementById('btn-modal-timer-toggle');
    if (modalBtn) {
        modalBtn.textContent = '▶ RESUME TIMER';
        modalBtn.classList.replace('btn-gold', 'btn-green');
    }
    setText('ftb-status-text', '⏸ Timer paused. Click resume to continue focus.');
}

function resetFocusTimer() {
    playSound('click');
    focusTimerRunning = false;
    if (focusTimerInterval) clearInterval(focusTimerInterval);
    focusTimerSecondsLeft = focusTimerDurationMinutes * 60;
    
    const bannerBtn = document.getElementById('btn-timer-start');
    if (bannerBtn) {
        bannerBtn.textContent = '▶ START';
        bannerBtn.classList.remove('btn-gold');
        bannerBtn.classList.add('btn-green');
    }
    const modalBtn = document.getElementById('btn-modal-timer-toggle');
    if (modalBtn) {
        modalBtn.textContent = '▶ START TIMER';
        modalBtn.classList.remove('btn-gold');
        modalBtn.classList.add('btn-green');
    }
    setText('ftb-status-text', 'Select duration and start deep work sprint');
    updateFocusTimerDisplay();
}

function updateFocusTimerDisplay() {
    const mins = Math.floor(Math.max(0, focusTimerSecondsLeft) / 60);
    const secs = Math.max(0, focusTimerSecondsLeft) % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    setText('ftb-timer-display', timeStr);
    setText('modal-focus-timer-digits', timeStr);
}

async function onFocusTimerComplete() {
    playSound('victory');
    resetFocusTimer();
    
    let xpGained = Math.round(focusTimerDurationMinutes * 2);
    let goldGained = Math.round(focusTimerDurationMinutes * 1.5);
    
    if (activeFocusQuestId && currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/quests/${activeFocusQuestId}/timer-complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration_minutes: focusTimerDurationMinutes })
            });
            if (res.ok) {
                const data = await res.json();
                hero.gold = data.new_gold;
                hero.xp = data.new_xp;
                hero.level = data.new_level;
                xpGained = data.xp_reward;
                goldGained = data.gold_reward;
                if (data.level_up) showLevelUpModal(data.new_level, data.new_transport);
                updateAdvDashboardUI();
                fetchQuests();
                renderBoardQuests();
            }
        } catch (e) {}
    } else {
        hero.xp = (hero.xp || 0) + xpGained;
        hero.gold = (hero.gold || 1000) + goldGained;
        hero.discipline = (hero.discipline || 12) + 5;
        
        while (hero.xp >= 100) {
            hero.xp -= 100;
            hero.level = (hero.level || 1) + 1;
            showLevelUpModal(hero.level, null);
        }
        localStorage.setItem('liferpg_hero_profile', JSON.stringify(hero));
        updateAdvDashboardUI();
    }
    
    spawnFloatingReward(`+${xpGained} FOCUS XP`, 'xp', 150, 90);
    setTimeout(() => spawnFloatingReward(`+${goldGained} GOLD`, 'gold', 170, 70), 200);
    setTimeout(() => spawnFloatingReward(`+5 DISCIPLINE`, 'stat', 150, 50), 400);
    
    addAdventureLog('⏱️ Focus Sprint Finished', `Completed ${focusTimerDurationMinutes} mins of deep work for ${activeFocusQuestTitle}!`, 'quest', 'FOCUS ✓');
    alert(`🎉 FOCUS SPRINT COMPLETE!\n\nSplendid discipline! You completed ${focusTimerDurationMinutes} minutes of intense deep work.\n\nRewards:\n⭐ +${xpGained} XP\n🪙 +${goldGained} Gold\n🛡️ +5 Discipline`);
}

// =============================================================================
// 🎯 MASTER HUD SYSTEM 2: RPG CAMPAIGN ADVENTURE MAP & ROADMAP ENGINE
// =============================================================================

let userCampaigns = [];
let activeCampaignId = null;
let aiGeneratedCampaignDraft = null;

// Visual Theme Archetypes for Campaign Artwork
const CAMPAIGN_THEMES = {
    intelligence: {
        icon: '📚',
        name: 'Grand Arcane Library',
        badge: 'KNOWLEDGE & MASTERY',
        color: '#38bdf8',
        accentBg: 'rgba(56, 189, 248, 0.15)',
        border: '#0284c7',
        trophy: "Scholar's Grand Crest",
        trophyPerk: "+15% XP bonus on deep study quests & Grand Library wallpaper in Base Builder"
    },
    strength: {
        icon: '🏟️',
        name: 'Coliseum of the Iron Titan',
        badge: 'FITNESS & POWER',
        color: '#f87171',
        accentBg: 'rgba(248, 113, 113, 0.15)',
        border: '#dc2626',
        trophy: "Titan's Golden Belt",
        trophyPerk: "+15% Gold bonus on workout quests & Gym Equipment in Base Builder"
    },
    vitality: {
        icon: '🌿',
        name: 'Sanctuary of Life & Vitality',
        badge: 'HEALTH & ENERGY',
        color: '#4ade80',
        accentBg: 'rgba(74, 222, 128, 0.15)',
        border: '#16a34a',
        trophy: "Elixir of Eternal Vitality",
        trophyPerk: "+20 Max Energy & Fountain of Health in Base Builder"
    },
    discipline: {
        icon: '⚔️',
        name: 'Monastery of Diamond Will',
        badge: 'FOCUS & HABITS',
        color: '#facc15',
        accentBg: 'rgba(250, 204, 21, 0.15)',
        border: '#ca8a04',
        trophy: "Diamond Monolith of Focus",
        trophyPerk: "+20% Focus sprint timer XP & Meditation Cushion in Base Builder"
    },
    creativity: {
        icon: '🎨',
        name: 'Celestial Prism Atelier',
        badge: 'CREATIVITY & DESIGN',
        color: '#c084fc',
        accentBg: 'rgba(192, 132, 252, 0.15)',
        border: '#9333ea',
        trophy: "Prismatic Creator Crown",
        trophyPerk: "+10 Creativity attribute & Artist Easel in Base Builder"
    },
    social: {
        icon: '🤝',
        name: 'Hall of the Sovereign Guild',
        badge: 'LEADERSHIP & SOCIAL',
        color: '#22d3ee',
        accentBg: 'rgba(34, 211, 238, 0.15)',
        border: '#0891b2',
        trophy: "Guildmaster's Sovereign Sigil",
        trophyPerk: "Top Leaderboard Aura badge & Meeting Table in Base Builder"
    }
};

function getCampaignTheme(attr) {
    const key = (attr || 'intelligence').toLowerCase();
    return CAMPAIGN_THEMES[key] || CAMPAIGN_THEMES.intelligence;
}

function openCreateCampaignModal() {
    playSound('click');
    document.getElementById('create-campaign-modal')?.classList.remove('hidden');
    updateCampaignFormPreview();
}

function closeCreateCampaignModal() {
    playSound('click');
    document.getElementById('create-campaign-modal')?.classList.add('hidden');
}

function openAiCampaignModal() {
    playSound('click');
    document.getElementById('ai-campaign-modal')?.classList.remove('hidden');
    document.getElementById('ai-generated-preview-card')?.classList.add('hidden');
    document.getElementById('ai-campaign-input-form')?.classList.remove('hidden');
}

function closeAiCampaignModal() {
    playSound('click');
    document.getElementById('ai-campaign-modal')?.classList.add('hidden');
}

function updateCampaignFormPreview() {
    const title = document.getElementById('new-campaign-title')?.value.trim() || 'Master Full-Stack Engineering';
    const desc = document.getElementById('new-campaign-desc')?.value.trim() || 'Transform your real-life abilities through disciplined weekly progression.';
    const attr = document.getElementById('new-campaign-attr')?.value || 'intelligence';
    const duration = document.getElementById('new-campaign-duration')?.value || '4';
    const diff = document.getElementById('new-campaign-difficulty')?.value || 'BALANCED';

    const theme = getCampaignTheme(attr);
    setText('cbp-attr-badge', `${theme.icon} ${attr.toUpperCase()} • ${diff} • ${duration} WEEKS`);
    setText('cbp-preview-title', title);
    setText('cbp-preview-desc', `${duration}-Week Structured Progression • 4 Milestones • 2 Linked Daily Quests`);
}

async function loadCampaigns() {
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/campaigns`);
            if (res.ok) {
                userCampaigns = await res.json();
            }
        } catch (e) {
            userCampaigns = getFallbackCampaigns();
        }
    } else {
        const saved = localStorage.getItem('liferpg_guest_campaigns');
        if (saved) {
            try { userCampaigns = JSON.parse(saved); } catch (e) { userCampaigns = getFallbackCampaigns(); }
        } else {
            userCampaigns = getFallbackCampaigns();
            localStorage.setItem('liferpg_guest_campaigns', JSON.stringify(userCampaigns));
        }
    }

    if (!userCampaigns || userCampaigns.length === 0) {
        userCampaigns = getFallbackCampaigns();
    }

    if (!activeCampaignId && userCampaigns.length > 0) {
        activeCampaignId = userCampaigns[0].id;
    }

    renderCampaignAdventureMap();
}

function getFallbackCampaigns() {
    return [
        {
            id: 1,
            title: "Semester High Honors & Academic Mastery",
            description: "Build flawless study habits, master revision blocks, and conquer exams.",
            category: "Academic / Learning",
            target_attribute: "intelligence",
            duration_weeks: 4,
            completed: false,
            milestones: [
                { id: 101, title: "Foundation: Core Concepts & Comprehensive Flashcards", description: "Review syllabus, organize study materials, and construct 100 active recall cards.", xp_reward: 100, gold_reward: 150, completed: true, requirements: ["Review complete chapter notes", "Build 100 active recall cards", "Complete 2 deep focus blocks"] },
                { id: 102, title: "Active Application: 10 Timed Past Exam Papers", description: "Solve past exam papers under strict timed sprint conditions with zero distractions.", xp_reward: 200, gold_reward: 250, completed: true, requirements: ["Complete 5 timed paper blocks", "Analyze incorrect answers with notes", "Score above 85% benchmark"] },
                { id: 103, title: "Deep Synthesis: Group Review & Mock Defense", description: "Teach core concepts to peers and pass exhaustive randomized mock quizzes.", xp_reward: 300, gold_reward: 350, completed: false, requirements: ["Host 1 study group review", "Master top 20 tricky problems", "Pass randomized mock exam"] },
                { id: 104, title: "Final Boss: Exam Day Execution with 90%+ Target", description: "Walk into examination hall with peak confidence and conquer final semester exams.", xp_reward: 500, gold_reward: 500, completed: false, requirements: ["Final formula & concept sheet review", "Full 8 hours recovery sleep", "Execute exam with 90%+ target"] }
            ]
        },
        {
            id: 2,
            title: "10K Running & Peak Cardiovascular Fitness",
            description: "Systematic endurance progression from 2km jogs to a full 10k finish line.",
            category: "Fitness / Health",
            target_attribute: "vitality",
            duration_weeks: 4,
            completed: false,
            milestones: [
                { id: 201, title: "Base Aerobic: 3km Continuous Run Without Breaks", description: "Establish comfortable breathing rhythm and finish 3km continuous running.", xp_reward: 100, gold_reward: 100, completed: true, requirements: ["3x 2km training runs", "Dynamic warm-up and cool down", "Log 3km non-stop run"] },
                { id: 202, title: "Endurance Build: Reach 5km Distance at Steady Pace", description: "Build cardiovascular engine and muscle stamina over a steady 5km course.", xp_reward: 200, gold_reward: 200, completed: false, requirements: ["2x 4km progression runs", "Electrolyte & hydration routine", "Complete 5km under 30 mins"] },
                { id: 203, title: "Speed Endurance: Sprint Interval Training (8x 400m)", description: "High-intensity interval sprints to boost VO2 max and anaerobic threshold.", xp_reward: 300, gold_reward: 300, completed: false, requirements: ["Track interval session (8x 400m)", "Leg mobility and foam rolling", "7km tempo long run"] },
                { id: 204, title: "Final Boss: Official 10K Finish Line Victory", description: "Cross the 10km finish line with strength, endurance, and unstoppable stamina.", xp_reward: 500, gold_reward: 500, completed: false, requirements: ["Carb load and hydration prep", "Pacing strategy plan", "Official 10km run finish"] }
            ]
        }
    ];
}

function selectCampaignTab(campaignId) {
    playSound('tab');
    activeCampaignId = campaignId;
    renderCampaignAdventureMap();
}

function renderCampaignAdventureMap() {
    const pillsContainer = document.getElementById('campaign-nav-pills');
    const viewportContainer = document.getElementById('campaign-map-viewport');
    const intelPanel = document.getElementById('campaign-intel-panel');
    if (!viewportContainer || !intelPanel) return;

    // 1. Render Top Campaign Tabs Pills
    if (pillsContainer) {
        pillsContainer.innerHTML = '';
        userCampaigns.forEach((camp, idx) => {
            const milestones = camp.milestones || [];
            const doneCount = milestones.filter(m => m.is_completed || m.completed).length;
            const pct = Math.round((doneCount / Math.max(1, milestones.length)) * 100);
            const theme = getCampaignTheme(camp.target_attribute);
            const isActive = camp.id === activeCampaignId;

            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = `campaign-nav-pill ${isActive ? 'active' : ''} ${pct === 100 ? 'mastered' : ''}`;
            pill.onclick = () => selectCampaignTab(camp.id);
            pill.innerHTML = `
                <span class="cnp-icon">${theme.icon}</span>
                <span class="cnp-title">${camp.title.replace(/^🎓\s*|^🏃\s*|^💻\s*/, '')}</span>
                <span class="cnp-pct">${pct}%</span>
                ${pct === 100 ? '<span class="cnp-crown">👑</span>' : ''}
            `;
            pillsContainer.appendChild(pill);
        });

        // Add "+ New Goal" Quick Pill
        const addPill = document.createElement('button');
        addPill.type = 'button';
        addPill.className = 'campaign-nav-pill add-pill';
        addPill.onclick = openCreateCampaignModal;
        addPill.innerHTML = `<span>+ NEW GOAL</span>`;
        pillsContainer.appendChild(addPill);
    }

    // 2. Locate Active Campaign
    const activeCamp = userCampaigns.find(c => c.id === activeCampaignId) || userCampaigns[0];
    if (!activeCamp) {
        viewportContainer.innerHTML = `
            <div class="campaign-empty-hero">
                <span class="ceh-icon">🚀</span>
                <h3>No Active RPG Goal Campaigns</h3>
                <p>Break down your real-world ambitions into structured 4-week milestones with XP and Gold rewards!</p>
                <div class="ceh-actions">
                    <button type="button" class="pixel-btn btn-gold btn-large" onclick="openCreateCampaignModal()">⚔️ START NEW CAMPAIGN</button>
                    <button type="button" class="pixel-btn btn-cyan" onclick="openAiCampaignModal()">✨ AI GOAL DECONSTRUCTOR</button>
                </div>
            </div>
        `;
        intelPanel.innerHTML = '';
        return;
    }

    const milestones = activeCamp.milestones || [];
    const doneCount = milestones.filter(m => m.is_completed || m.completed).length;
    const totalCount = milestones.length || 4;
    const progressPct = Math.round((doneCount / totalCount) * 100);
    const theme = getCampaignTheme(activeCamp.target_attribute);
    const isMastered = progressPct === 100;

    let earnedXP = 0;
    let totalXP = 0;
    let earnedGold = 0;
    let totalGold = 0;
    milestones.forEach(m => {
        const xp = m.xp_reward || 100;
        const gold = m.gold_reward || 100;
        totalXP += xp;
        totalGold += gold;
        if (m.is_completed || m.completed) {
            earnedXP += xp;
            earnedGold += gold;
        }
    });

    // 3. Render LEFT COLUMN: Visual Campaign Adventure Map
    let roadmapNodesHtml = '';
    milestones.forEach((m, idx) => {
        const isDone = m.is_completed || m.completed;
        const prevDone = idx === 0 || (milestones[idx - 1].is_completed || milestones[idx - 1].completed);
        const isCurrent = !isDone && prevDone;
        const isLocked = !isDone && !prevDone;
        const isFinalBoss = idx === milestones.length - 1;

        let nodeClass = 'milestone-node-card';
        let statusBadge = '';
        let actionBtn = '';

        if (isDone) {
            nodeClass += ' node-completed';
            statusBadge = '<span class="mnc-status-tag done">✓ COMPLETED</span>';
            actionBtn = `<button type="button" class="mnc-action-btn done" onclick="openMilestoneDetailModal(${activeCamp.id}, ${m.id})">VIEW INTEL ✓</button>`;
        } else if (isCurrent) {
            nodeClass += ' node-current';
            statusBadge = '<span class="mnc-status-tag current">⚔️ CURRENT OBJECTIVE</span>';
            actionBtn = `<button type="button" class="pixel-btn btn-sm btn-green pulse-btn" onclick="completeCampaignMilestone(${activeCamp.id}, ${m.id})">✓ COMPLETE PHASE</button>`;
        } else {
            nodeClass += ' node-locked';
            statusBadge = `<span class="mnc-status-tag locked">🔒 LOCKED (REQ M${idx})</span>`;
            actionBtn = `<button type="button" class="mnc-action-btn locked" onclick="openMilestoneDetailModal(${activeCamp.id}, ${m.id})">PREVIEW 🔒</button>`;
        }

        if (isFinalBoss) nodeClass += ' node-boss';

        roadmapNodesHtml += `
            <div class="${nodeClass}" id="milestone-node-${m.id}">
                <div class="mnc-marker-col">
                    <div class="mnc-node-icon-box ${isDone ? 'done' : isCurrent ? 'current' : 'locked'}">
                        ${isFinalBoss ? '👑' : isDone ? '✓' : isCurrent ? '⚔️' : '🔒'}
                    </div>
                    <span class="mnc-step-num">${isFinalBoss ? 'BOSS' : `M${idx + 1}`}</span>
                </div>

                <div class="mnc-content-col" onclick="openMilestoneDetailModal(${activeCamp.id}, ${m.id})">
                    <div class="mnc-header-row">
                        <span class="mnc-phase-title">PHASE ${idx + 1}: ${isFinalBoss ? 'FINAL PINNACLE' : 'WEEKLY OBJECTIVE'}</span>
                        ${statusBadge}
                    </div>
                    <h4 class="mnc-title">${m.title}</h4>
                    <p class="mnc-desc">${m.description || 'Dedicated real-world execution building permanent RPG mastery.'}</p>
                    
                    <div class="mnc-rewards-row">
                        <span class="mnc-reward-chip xp">⭐ +${m.xp_reward || 100} XP</span>
                        <span class="mnc-reward-chip gold">🪙 +${m.gold_reward || 100} Gold</span>
                        <span class="mnc-reward-chip stat">${theme.icon} +${(idx + 1) * 2} ${(activeCamp.target_attribute || 'INT').toUpperCase().slice(0, 3)}</span>
                    </div>
                </div>

                <div class="mnc-action-col">
                    ${actionBtn}
                </div>
            </div>
        `;

        // Add animated connecting line between milestones
        if (idx < milestones.length - 1) {
            const nextDone = milestones[idx + 1].is_completed || milestones[idx + 1].completed;
            roadmapNodesHtml += `
                <div class="roadmap-connector-line ${isDone ? (nextDone ? 'active-completed' : 'active-flowing') : 'inactive'}">
                    <span class="connector-pulse"></span>
                </div>
            `;
        }
    });

    viewportContainer.innerHTML = `
        <!-- Campaign Visual Hero Card -->
        <div class="campaign-adventure-hero" style="border-left-color: ${theme.color};">
            <div class="cah-artwork-box" style="background: ${theme.accentBg}; border-color: ${theme.border};">
                <span class="cah-art-icon">${theme.icon}</span>
                <span class="cah-art-name">${theme.name}</span>
            </div>
            
            <div class="cah-details">
                <div class="cah-tags-row">
                    <span class="cah-attr-badge" style="background:${theme.accentBg}; color:${theme.color}; border-color:${theme.border};">
                        ${theme.icon} ${(activeCamp.target_attribute || 'INTELLIGENCE').toUpperCase()} • ${activeCamp.category || 'MASTERY'}
                    </span>
                    <span class="cah-duration-badge">⏳ 4 WEEKS ROADMAP</span>
                    ${isMastered ? '<span class="cah-mastered-badge">🏆 CAMPAIGN MASTERED</span>' : ''}
                </div>

                <h2 class="cah-title">${activeCamp.title}</h2>
                <p class="cah-quote">"${activeCamp.description || 'Conquer your real-world ambitions through structured RPG progression.'}"</p>
            </div>
        </div>

        <!-- The Connected Interactive RPG Adventure Roadmap -->
        <div class="roadmap-tree-container">
            <div class="roadmap-start-flag">
                <span class="flag-icon">🚩</span>
                <span class="flag-text">CAMPAIGN EXPEDITION START</span>
            </div>
            
            ${roadmapNodesHtml}

            <div class="roadmap-finish-flag ${isMastered ? 'unlocked' : ''}">
                <span class="flag-icon">${isMastered ? '🏆' : '🔒'}</span>
                <span class="flag-text">${isMastered ? 'EXPEDITION CONQUERED • TROPHY CLAIMED' : 'FINAL SUMMIT • 100% MASTERY'}</span>
            </div>
        </div>
    `;

    // 4. Render RIGHT COLUMN: Fixed Campaign Intelligence & Rewards Deck
    const attrGained = doneCount * 3;
    const questsLinked = (guestQuests || []).filter(q => q.campaign_id === activeCamp.id || q.category === activeCamp.category);

    let linkedQuestsHtml = '';
    if (questsLinked.length > 0) {
        questsLinked.forEach(q => {
            linkedQuestsHtml += `
                <div class="c-linked-quest-item ${q.completed ? 'completed' : ''}">
                    <div class="clq-info">
                        <span class="clq-title">⚔️ ${q.title}</span>
                        <span class="clq-sub">⭐ +${q.xp_reward || 20} XP • 🪙 +${q.gold_reward || 20} G</span>
                    </div>
                    ${q.completed 
                        ? '<span class="clq-done">CLAIMED ✓</span>'
                        : `<button type="button" class="pixel-btn btn-sm btn-green" onclick="completeAdvQuest(${q.id})">✓</button>`}
                </div>
            `;
        });
    } else {
        linkedQuestsHtml = `
            <div class="c-no-quests-box">
                <span>⚔️ Forge daily quests linked to this campaign on your Quest Board.</span>
            </div>
        `;
    }

    intelPanel.innerHTML = `
        <!-- Campaign Progress Overview Box -->
        <div class="intel-block progress-intel">
            <div class="intel-block-header">
                <span class="ibh-icon">📊</span>
                <span class="ibh-title">CAMPAIGN PROGRESS</span>
                <span class="ibh-pct" style="color:${theme.color};">${progressPct}%</span>
            </div>

            <div class="intel-big-track">
                <div class="intel-big-fill" style="width: ${progressPct}%; background: linear-gradient(90deg, #38bdf8, ${theme.color}, #facc15);"></div>
            </div>

            <div class="intel-milestones-count">
                <span style="color:#ffffff; font-weight:700;">${doneCount} / ${totalCount}</span> MILESTONES COMPLETED
            </div>
        </div>

        <!-- Resources Earned vs Potential Box -->
        <div class="intel-block resources-intel">
            <div class="intel-resource-row">
                <div class="irr-item">
                    <span class="irr-label">⭐ XP EARNED</span>
                    <span class="irr-val" style="color:#38bdf8;">+${earnedXP.toLocaleString()} <small>/ ${totalXP.toLocaleString()}</small></span>
                </div>
                <div class="irr-divider"></div>
                <div class="irr-item">
                    <span class="irr-label">🪙 GOLD EARNED</span>
                    <span class="irr-val" style="color:#facc15;">+${earnedGold.toLocaleString()} <small>/ ${totalGold.toLocaleString()}</small></span>
                </div>
            </div>
        </div>

        <!-- Target Attribute Progression Gauge -->
        <div class="intel-block attr-intel">
            <div class="intel-block-header">
                <span class="ibh-icon">${theme.icon}</span>
                <span class="ibh-title">${(activeCamp.target_attribute || 'INTELLIGENCE').toUpperCase()} GROWTH</span>
                <span class="ibh-stat-score" style="color:${theme.color};">+${attrGained} PTS</span>
            </div>
            <p class="intel-subtext">Real-world consistency directly increases your core RPG attribute radar.</p>
            <div class="intel-stat-track">
                <div class="intel-stat-fill" style="width: ${Math.min(100, (attrGained / 15) * 100)}%; background: ${theme.color};"></div>
            </div>
        </div>

        <!-- Campaign Ultimate Reward Trophy Card -->
        <div class="intel-block trophy-intel ${isMastered ? 'unlocked' : 'locked'}">
            <div class="trophy-header-row">
                <span class="th-tag">${isMastered ? '🏆 REWARD UNLOCKED' : '🔒 CAMPAIGN TROPHY'}</span>
                <span class="th-icon">${theme.icon}</span>
            </div>
            <h4 class="th-name">${theme.trophy}</h4>
            <p class="th-perk">"${theme.trophyPerk}"</p>
            ${isMastered 
                ? `<button type="button" class="pixel-btn btn-gold btn-large pulse-btn" onclick="showCampaignMasteredModal(userCampaigns.find(c => c.id === ${activeCamp.id}))">🏆 VIEW TROPHY HALL</button>`
                : `<button type="button" class="pixel-btn btn-sm btn-slate" onclick="alert('🔒 Complete all 4 milestones in this campaign to unlock: ${theme.trophy}!')">PREVIEW REWARD 🔒</button>`}
        </div>

        <!-- Linked Daily Quests Section -->
        <div class="intel-block linked-quests-intel">
            <div class="intel-block-header">
                <span class="ibh-icon">⚔️</span>
                <span class="ibh-title">LINKED DAILY QUESTS</span>
            </div>
            <div class="linked-quests-list">
                ${linkedQuestsHtml}
            </div>
        </div>
    `;
}

// Milestone Detail Drawer / Inspector
function openMilestoneDetailModal(campaignId, milestoneId) {
    playSound('click');
    const camp = userCampaigns.find(c => c.id === campaignId);
    if (!camp) return;
    const msIndex = (camp.milestones || []).findIndex(m => m.id === milestoneId);
    if (msIndex === -1) return;
    const ms = camp.milestones[msIndex];
    const theme = getCampaignTheme(camp.target_attribute);

    const isDone = ms.is_completed || ms.completed;
    const prevDone = msIndex === 0 || (camp.milestones[msIndex - 1].is_completed || camp.milestones[msIndex - 1].completed);
    const isCurrent = !isDone && prevDone;
    const isBoss = msIndex === camp.milestones.length - 1;

    setText('mdm-header-title', isBoss ? '👑 FINAL BOSS MILESTONE' : `📜 PHASE ${msIndex + 1} INTEL`);
    setText('mdm-phase-tag', `PHASE ${msIndex + 1} OF ${camp.milestones.length}`);
    
    const pill = document.getElementById('mdm-status-pill');
    if (pill) {
        pill.className = `mdm-status-pill ${isDone ? 'done' : isCurrent ? 'current' : 'locked'}`;
        pill.textContent = isDone ? '✓ COMPLETED & CLAIMED' : isCurrent ? '⚔️ CURRENT ACTIVE OBJECTIVE' : '🔒 LOCKED MILESTONE';
    }

    setText('mdm-title', ms.title);
    setText('mdm-desc', ms.description || 'Execute disciplined real-world daily actions to claim this milestone.');

    // Requirements Checklist
    const reqList = document.getElementById('mdm-req-list');
    if (reqList) {
        reqList.innerHTML = '';
        const requirements = ms.requirements || [
            `Complete ${msIndex + 1 * 2} dedicated focus sprints`,
            "Maintain daily habit streak",
            "Pass milestone progress validation"
        ];
        requirements.forEach((req, idx) => {
            const li = document.createElement('li');
            li.className = isDone ? 'req-checked' : (isCurrent && idx === 0) ? 'req-in-progress' : 'req-pending';
            li.innerHTML = `<span>${isDone ? '✓' : (isCurrent && idx === 0) ? '⏳' : '□'}</span> <span>${req}</span>`;
            reqList.appendChild(li);
        });
    }

    setText('mdm-rew-xp', `+${ms.xp_reward || 100} XP`);
    setText('mdm-rew-gold', `+${ms.gold_reward || 100} Gold`);
    setText('mdm-rew-stat', `+${(msIndex + 1) * 2} ${(camp.target_attribute || 'INT').toUpperCase()}`);

    const actContainer = document.getElementById('mdm-actions-container');
    if (actContainer) {
        if (isDone) {
            actContainer.innerHTML = `<span class="mdm-claimed-banner">✓ REWARD ALREADY CLAIMED & ADDED TO HERO LEDGER</span>`;
        } else if (isCurrent) {
            actContainer.innerHTML = `
                <button type="button" class="pixel-btn btn-green btn-large pulse-btn" onclick="completeCampaignMilestone(${camp.id}, ${ms.id}); closeMilestoneDetailModal();">
                    ✓ COMPLETE & CLAIM MILESTONE REWARDS
                </button>
            `;
        } else {
            actContainer.innerHTML = `
                <button type="button" class="pixel-btn btn-slate btn-large" disabled>
                    🔒 LOCKED — Complete Phase ${msIndex} First
                </button>
            `;
        }
    }

    document.getElementById('milestone-detail-modal')?.classList.remove('hidden');
}

function closeMilestoneDetailModal() {
    playSound('click');
    document.getElementById('milestone-detail-modal')?.classList.add('hidden');
}

// Milestone Completion Engine & Celebrations
async function completeCampaignMilestone(campaignId, milestoneId) {
    playSound('victory');
    const camp = userCampaigns.find(c => c.id === campaignId);
    if (!camp) return;

    const ms = (camp.milestones || []).find(m => m.id === milestoneId);
    const xpReward = ms ? (ms.xp_reward || 150) : 150;
    const goldReward = ms ? (ms.gold_reward || 150) : 150;
    const theme = getCampaignTheme(camp.target_attribute);

    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/campaigns/${campaignId}/milestone/${milestoneId}/complete`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                hero.gold = data.new_gold;
                hero.xp = data.new_xp;
                hero.level = data.new_level;
                if (data.level_up) showLevelUpModal(data.new_level, data.new_transport);
                updateAdvDashboardUI();
                await loadCampaigns();
            }
        } catch (e) {}
    } else {
        if (ms && !ms.completed && !ms.is_completed) {
            ms.completed = true;
            ms.is_completed = true;
            hero.xp = (hero.xp || 0) + xpReward;
            hero.gold = (hero.gold || 1000) + goldReward;

            const attrKey = (camp.target_attribute || 'intelligence').toLowerCase();
            if (hero[attrKey] !== undefined) hero[attrKey] += 3;

            while (hero.xp >= 100) {
                hero.xp -= 100;
                hero.level = (hero.level || 1) + 1;
            }

            const allDone = camp.milestones.every(m => m.completed || m.is_completed);
            if (allDone) camp.completed = true;

            localStorage.setItem('liferpg_guest_campaigns', JSON.stringify(userCampaigns));
            localStorage.setItem('liferpg_hero_profile', JSON.stringify(hero));
            updateAdvDashboardUI();
            renderCampaignAdventureMap();
        }
    }

    spawnFloatingReward(`+${xpReward} MILESTONE XP`, 'xp', 140, 100);
    setTimeout(() => spawnFloatingReward(`+${goldReward} GOLD`, 'gold', 160, 80), 200);
    setTimeout(() => spawnFloatingReward(`+3 ${(camp.target_attribute || 'INT').toUpperCase()}`, 'stat', 150, 60), 400);

    addAdventureLog('🎯 Campaign Milestone Conquered', `Mastered Phase in '${camp.title}'!`, 'gold', 'PHASE ✓');

    // Check if entire campaign reached 100% completion!
    const allDoneNow = (camp.milestones || []).every(m => m.is_completed || m.completed);
    if (allDoneNow) {
        setTimeout(() => showCampaignMasteredModal(camp), 700);
    }
}

function showCampaignMasteredModal(camp) {
    if (!camp) return;
    playSound('victory');
    const theme = getCampaignTheme(camp.target_attribute);

    setText('cmm-campaign-title', camp.title.replace(/^🎓\s*|^🏃\s*|^💻\s*/, ''));
    setText('cmm-trophy-icon', theme.icon);
    setText('cmm-trophy-name', theme.trophy.toUpperCase());
    setText('cmm-trophy-perk', `"${theme.trophyPerk}"`);

    document.getElementById('campaign-mastered-modal')?.classList.remove('hidden');
}

function closeCampaignMasteredModal() {
    playSound('magic');
    document.getElementById('campaign-mastered-modal')?.classList.add('hidden');
}

// Multi-Step Manual Campaign Creator
async function handleCreateCampaign(e) {
    e.preventDefault();
    const title = document.getElementById('new-campaign-title')?.value.trim();
    const desc = document.getElementById('new-campaign-desc')?.value.trim();
    const attr = document.getElementById('new-campaign-attr')?.value || 'intelligence';
    const duration = parseInt(document.getElementById('new-campaign-duration')?.value || '4', 10);
    const diff = document.getElementById('new-campaign-difficulty')?.value || 'BALANCED';

    if (!title) return;

    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/campaigns/create?title=${encodeURIComponent(title)}&description=${encodeURIComponent(desc)}&category=${encodeURIComponent(attr)}&target_date=`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                activeCampaignId = data.campaign_id;
                playSound('victory');
                closeCreateCampaignModal();
                await loadCampaigns();
            }
        } catch (err) {}
    } else {
        const newCampId = Date.now();
        const newCamp = {
            id: newCampId,
            title: title,
            description: desc || `Structured ${duration}-week progression to master ${title}`,
            category: `${attr.charAt(0).toUpperCase() + attr.slice(1)} Mastery`,
            target_attribute: attr,
            duration_weeks: duration,
            difficulty: diff,
            completed: false,
            milestones: [
                { id: newCampId + 1, title: `Phase 1: Foundation & Baseline (${title.slice(0, 22)})`, description: "Establish core materials, daily baseline rituals, and eliminate friction.", xp_reward: 100, gold_reward: 100, completed: false, requirements: ["Setup core workspace & schedule", "Complete 3 starter deep work blocks", "Build habit anchor trigger"] },
                { id: newCampId + 2, title: `Phase 2: Active Consistency & Practice Sprints`, description: "Execute daily problem sets and deliberate practice routines.", xp_reward: 200, gold_reward: 200, completed: false, requirements: ["Maintain 5-day quest streak", "Complete 5 active application drills", "Review performance metrics"] },
                { id: newCampId + 3, title: `Phase 3: Deep Mastery & Bottleneck Removal`, description: "Tackle the most difficult bottlenecks and execute mock simulations.", xp_reward: 300, gold_reward: 300, completed: false, requirements: ["Complete 3 monk mode sprints", "Overcome primary obstacle", "Simulate realistic challenge test"] },
                { id: newCampId + 4, title: `Final Boss: Peak Goal Execution & Victory`, description: "Cross the final finish line and achieve permanent self-actualization.", xp_reward: 500, gold_reward: 500, completed: false, requirements: ["Final review & peak preparation", "Execute master challenge", "Achieve 100% milestone victory"] }
            ]
        };
        userCampaigns.unshift(newCamp);
        activeCampaignId = newCampId;
        localStorage.setItem('liferpg_guest_campaigns', JSON.stringify(userCampaigns));
        playSound('victory');
        closeCreateCampaignModal();
        renderCampaignAdventureMap();
    }
}

// =============================================================================
// 🎒 MASTER HUD SYSTEM 3: VOXEL SHOP & INVENTORY
// =============================================================================

let shopCatalogItems = [];
let userInventoryItems = [];
let currentShopTab = 'catalog';
let currentShopCategory = 'all';

function switchShopTab(tab) {
    playSound('tab');
    currentShopTab = tab;
    
    document.querySelectorAll('.shop-nav-tab').forEach(b => b.classList.remove('active'));
    document.getElementById(`s-tab-${tab}`)?.classList.add('active');
    
    if (tab === 'catalog') {
        document.getElementById('shop-panel-catalog')?.classList.remove('hidden');
        document.getElementById('shop-panel-inventory')?.classList.add('hidden');
        loadShopCatalog();
    } else {
        document.getElementById('shop-panel-catalog')?.classList.add('hidden');
        document.getElementById('shop-panel-inventory')?.classList.remove('hidden');
        loadInventory();
    }
}

function filterShopCategory(category, btn) {
    playSound('click');
    currentShopCategory = category;
    document.querySelectorAll('.s-cat-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderShopCatalog(shopCatalogItems);
}

async function loadShopCatalog() {
    setText('shop-tab-gold-amount', `${(hero.gold || 1000).toLocaleString()} G`);
    
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/shop`);
            if (res.ok) shopCatalogItems = await res.json();
        } catch (e) {
            shopCatalogItems = getFallbackShopCatalog();
        }
    } else {
        shopCatalogItems = getFallbackShopCatalog();
    }
    renderShopCatalog(shopCatalogItems);
}

function getFallbackShopCatalog() {
    return [
        { id: 1, name: "Scholar's Enchanted Robe", category: "clothing", rarity: "rare", gold_cost: 300, level_required: 1, icon: "🥋", stat_bonus: '{"intelligence": 8}', description: "Woven with threads of deep concentration. Boosts INT." },
        { id: 2, name: "Warrior's Iron Pauldrons", category: "armor", rarity: "uncommon", gold_cost: 250, level_required: 2, icon: "🛡️", stat_bonus: '{"strength": 6}', description: "Forged in iron discipline. Boosts STR." },
        { id: 3, name: "Golden Aura of Mastery", category: "effects", rarity: "legendary", gold_cost: 1500, level_required: 10, icon: "✨", stat_bonus: '{"discipline": 15}', description: "Luminous radiant aura for dedicated achievers." },
        { id: 4, name: "Pixel Cyber Hound", category: "pets", rarity: "rare", gold_cost: 500, level_required: 3, icon: "🐕", stat_bonus: '{"vitality": 5}', description: "Faithful robotic dog that walks with you in parallax world." },
        { id: 5, name: "Grand Library Oak Desk", category: "furniture", rarity: "epic", gold_cost: 400, level_required: 2, icon: "🛋️", stat_bonus: '{"intelligence": 5}', description: "Fine mahogany study desk for your LifeRPG home base." },
        { id: 6, name: "Monk's Meditation Cape", category: "clothing", rarity: "uncommon", gold_cost: 200, level_required: 1, icon: "🥻", stat_bonus: '{"discipline": 6}', description: "Calming fabric providing focus against digital distractions." }
    ];
}

function renderShopCatalog(items) {
    const grid = document.getElementById('shop-catalog-grid');
    if (!grid) return;
    grid.innerHTML = '';

    let filtered = items;
    if (currentShopCategory !== 'all') {
        filtered = items.filter(i => i.category === currentShopCategory);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="color:#94a3b8; font-family:var(--font-pixel); font-size:0.58rem; text-align:center; padding:32px; grid-column:1/-1;">No items found in this category.</div>`;
        return;
    }

    filtered.forEach(item => {
        const card = document.createElement('div');
        const rarity = (item.rarity || 'common').toLowerCase();
        card.className = `shop-item-card rarity-${rarity}`;

        let statText = '';
        try {
            const stats = typeof item.stat_bonus === 'string' ? JSON.parse(item.stat_bonus) : item.stat_bonus;
            if (stats) {
                statText = Object.entries(stats).map(([k, v]) => `+${v} ${k.toUpperCase().slice(0, 3)}`).join(' • ');
            }
        } catch (e) {}

        const canBuy = (hero.gold || 1000) >= item.gold_cost && (hero.level || 1) >= (item.level_required || 1);

        card.innerHTML = `
            <div class="sic-top-badge ${rarity}">${rarity.toUpperCase()}</div>
            <div class="sic-icon">${item.icon || '📦'}</div>
            <h4 class="sic-name">${item.name}</h4>
            <p class="sic-desc">${item.description || ''}</p>
            ${statText ? `<div class="sic-stat-badge">⚡ ${statText}</div>` : ''}
            <div class="sic-footer">
                <div class="sic-cost">🪙 ${item.gold_cost} G</div>
                ${canBuy 
                    ? `<button type="button" class="pixel-btn btn-sm btn-gold" onclick="buyShopItem(${item.id})">BUY</button>`
                    : `<button type="button" class="pixel-btn btn-sm btn-slate" disabled>${(hero.level || 1) < (item.level_required || 1) ? `REQ LVL ${item.level_required}` : 'LOCKED'}</button>`}
            </div>
        `;
        grid.appendChild(card);
    });
}

async function buyShopItem(itemId) {
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/shop/buy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: itemId })
            });
            if (res.ok) {
                const data = await res.json();
                hero.gold = data.new_gold;
                playSound('victory');
                alert(`🎉 Purchase Successful!\nEquip your new gear in MY INVENTORY.`);
                updateAdvDashboardUI();
                loadShopCatalog();
            } else {
                const err = await res.json();
                playSound('error');
                alert(`❌ ${err.detail || 'Could not purchase item.'}`);
            }
        } catch (e) {}
    } else {
        const item = shopCatalogItems.find(i => i.id === itemId);
        if (item && (hero.gold || 1000) >= item.gold_cost) {
            hero.gold -= item.gold_cost;
            userInventoryItems.push({
                id: Date.now(),
                item_id: item.id,
                name: item.name,
                category: item.category,
                rarity: item.rarity,
                icon: item.icon,
                equipped: false,
                slot: item.category === 'armor' ? 'head' : item.category === 'clothing' ? 'body' : item.category === 'pets' ? 'pet' : 'accessory'
            });
            localStorage.setItem('liferpg_guest_inventory', JSON.stringify(userInventoryItems));
            localStorage.setItem('liferpg_hero_profile', JSON.stringify(hero));
            playSound('victory');
            alert(`🎉 Purchase Successful!\nEquipped to your hero.`);
            updateAdvDashboardUI();
            loadShopCatalog();
        }
    }
}

async function loadInventory() {
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/inventory`);
            if (res.ok) userInventoryItems = await res.json();
        } catch (e) {
            userInventoryItems = [];
        }
    } else {
        const saved = localStorage.getItem('liferpg_guest_inventory');
        if (saved) {
            try { userInventoryItems = JSON.parse(saved); } catch (e) { userInventoryItems = []; }
        }
    }
    renderInventory(userInventoryItems);
}

function renderInventory(items) {
    const slotsGrid = document.getElementById('inventory-loadout-slots');
    const backpackGrid = document.getElementById('inventory-items-grid');
    if (!slotsGrid || !backpackGrid) return;

    slotsGrid.innerHTML = '';
    backpackGrid.innerHTML = '';

    const slots = ['head', 'body', 'legs', 'pet', 'aura', 'accessory'];
    slots.forEach(slot => {
        const eq = items.find(i => i.equipped && (i.slot === slot || i.item_category === slot));
        const slotCard = document.createElement('div');
        slotCard.className = `inv-slot-card ${eq ? 'equipped' : 'empty'}`;
        slotCard.innerHTML = `
            <span class="isc-tag">${slot.toUpperCase()}</span>
            <div class="isc-icon">${eq ? (eq.item_icon || eq.icon || '📦') : '◻️'}</div>
            <span class="isc-name">${eq ? (eq.item_name || eq.name) : 'Empty Slot'}</span>
        `;
        slotsGrid.appendChild(slotCard);
    });

    if (!items || items.length === 0) {
        backpackGrid.innerHTML = `<div style="color:#94a3b8; font-family:var(--font-pixel); font-size:0.58rem; text-align:center; padding:24px; grid-column:1/-1;">Backpack is empty. Visit the Voxel Shop to get gear!</div>`;
        return;
    }

    items.forEach(inv => {
        const card = document.createElement('div');
        const rarity = (inv.item_rarity || inv.rarity || 'common').toLowerCase();
        card.className = `inv-item-card rarity-${rarity} ${inv.equipped ? 'active-gear' : ''}`;
        card.innerHTML = `
            <div class="iic-icon">${inv.item_icon || inv.icon || '📦'}</div>
            <div class="iic-info">
                <h4 class="iic-name">${inv.item_name || inv.name}</h4>
                <span class="iic-cat">${(inv.item_category || inv.category || 'Gear').toUpperCase()}</span>
            </div>
            ${inv.equipped 
                ? '<span class="status-pill">EQUIPPED</span>'
                : `<button type="button" class="pixel-btn btn-sm btn-green" onclick="equipInventoryItem(${inv.id}, '${inv.slot || 'body'}')">EQUIP</button>`}
        `;
        backpackGrid.appendChild(card);
    });
}

async function equipInventoryItem(itemId, slot) {
    playSound('magic');
    if (currentUser) {
        try {
            await fetchWithRefresh(`${baseUrl}/inventory/equip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: itemId, slot })
            });
            loadInventory();
        } catch (e) {}
    } else {
        userInventoryItems.forEach(i => {
            if (i.id === itemId) i.equipped = true;
            else if (i.slot === slot) i.equipped = false;
        });
        localStorage.setItem('liferpg_guest_inventory', JSON.stringify(userInventoryItems));
        loadInventory();
    }
}

// =============================================================================
// 🏆 MASTER HUD SYSTEM 4: ACHIEVEMENTS TROPHY HALL
// =============================================================================

let userAchievements = [];

async function loadAchievements() {
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/achievements`);
            if (res.ok) userAchievements = await res.json();
        } catch (e) {
            userAchievements = getFallbackAchievements();
        }
    } else {
        userAchievements = getFallbackAchievements();
    }
    renderAchievements(userAchievements);
}

function getFallbackAchievements() {
    return [
        { key: "first_step", title: "First Step Forward", description: "Complete your very first real-life quest.", icon: "🌱", xp_reward: 50, gold_reward: 50, unlocked: true, progress: 1, target: 1 },
        { key: "quest_novice", title: "Quest Novice", description: "Complete 5 real-life daily quests.", icon: "⚔️", xp_reward: 100, gold_reward: 100, unlocked: false, progress: 2, target: 5 },
        { key: "streak_starter", title: "Streak Master I", description: "Maintain a 3-day daily streak.", icon: "🔥", xp_reward: 150, gold_reward: 150, unlocked: false, progress: 1, target: 3 },
        { key: "scholar_mind", title: "Scholar's Ascent", description: "Reach Level 5 in LifeRPG.", icon: "📚", xp_reward: 250, gold_reward: 200, unlocked: false, progress: 1, target: 5 },
        { key: "home_builder", title: "Master Architect", description: "Construct 3 rooms in your personal base.", icon: "🏰", xp_reward: 300, gold_reward: 300, unlocked: false, progress: 1, target: 3 },
        { key: "monk_mode", title: "Deep Monk Mode", description: "Complete 100 minutes of Focus Sprint timers.", icon: "🧘", xp_reward: 200, gold_reward: 200, unlocked: false, progress: 25, target: 100 }
    ];
}

function renderAchievements(achievements) {
    const grid = document.getElementById('achievements-cards-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    setText('achieve-unlocked-ratio', `${unlockedCount} / ${achievements.length} UNLOCKED`);

    achievements.forEach(ach => {
        const card = document.createElement('div');
        card.className = `achievement-trophy-card ${ach.unlocked ? 'unlocked' : 'locked'}`;

        const pct = Math.min(100, Math.round(((ach.progress || 0) / (ach.target || 1)) * 100));

        card.innerHTML = `
            <div class="atc-icon-box">${ach.icon || '🏆'}</div>
            <div class="atc-details">
                <div class="atc-header-row">
                    <h4 class="atc-title">${ach.title}</h4>
                    <span class="atc-reward-pill">⭐ +${ach.xp_reward} XP • 🪙 +${ach.gold_reward} G</span>
                </div>
                <p class="atc-desc">${ach.description}</p>
                <div class="atc-track">
                    <div class="atc-fill" style="width: ${pct}%;"></div>
                </div>
                <div class="atc-progress-row">
                    <span>${ach.progress || 0} / ${ach.target || 1}</span>
                    <span style="color:${ach.unlocked ? '#4ade80' : '#94a3b8'};">${ach.unlocked ? 'UNLOCKED ✓' : `${pct}%`}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// =============================================================================
// 🥇 MASTER HUD SYSTEM 5: LIVE REAL-TIME SSE LEADERBOARD
// =============================================================================

let leaderboardSSE = null;

async function loadLeaderboard() {
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/leaderboard`);
            if (res.ok) {
                const rankings = await res.json();
                renderLeaderboard(rankings);
            }
        } catch (e) {
            renderLeaderboard(getFallbackLeaderboard());
        }
    } else {
        renderLeaderboard(getFallbackLeaderboard());
    }
}

function getFallbackLeaderboard() {
    return [
        { rank: 1, name: "Aria_TheSage", archetype: "SCHOLAR", level: 12, lifetime_xp: 4850, today_xp: 320, streak: 14 },
        { rank: 2, name: "Kaelen_Ironclad", archetype: "WARRIOR", level: 11, lifetime_xp: 4200, today_xp: 280, streak: 9 },
        { rank: 3, name: "GSJustin (You)", archetype: hero.archetype || "WARRIOR", level: hero.level || 1, lifetime_xp: (hero.level || 1) * 100 + (hero.xp || 0), today_xp: 120, streak: 1 },
        { rank: 4, name: "ZenithBuilder", archetype: "BUILDER", level: 9, lifetime_xp: 3400, today_xp: 150, streak: 6 },
        { rank: 5, name: "CyberMonk", archetype: "MONK", level: 8, lifetime_xp: 2950, today_xp: 90, streak: 12 }
    ];
}

function renderLeaderboard(rankings) {
    const tbody = document.getElementById('leaderboard-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    rankings.forEach(player => {
        const tr = document.createElement('tr');
        const isCurrentHero = player.name.includes("You") || (currentUser && player.name === currentUser.username);
        if (isCurrentHero) tr.className = 'current-hero-row';

        const rankBadge = player.rank === 1 ? '🥇 1st' : player.rank === 2 ? '🥈 2nd' : player.rank === 3 ? '🥉 3rd' : `#${player.rank}`;

        tr.innerHTML = `
            <td style="font-weight:700; color:#facc15;">${rankBadge}</td>
            <td style="font-weight:600; color:#f8fafc;">${player.name}</td>
            <td><span class="archetype-badge arch-${(player.archetype || 'WARRIOR').toLowerCase()}">${player.archetype || 'HERO'}</span></td>
            <td style="color:#38bdf8;">LV ${player.level}</td>
            <td>⭐ ${player.lifetime_xp?.toLocaleString() || 0} XP</td>
            <td style="color:#4ade80;">+${player.today_xp || 0} XP</td>
            <td style="color:#fb923c;">🔥 ${player.streak || 1}d</td>
        `;
        tbody.appendChild(tr);
    });
}

function initLeaderboardSSE() {
    if (leaderboardSSE) return;
    try {
        leaderboardSSE = new EventSource(`${baseUrl}/leaderboard/stream`);
        leaderboardSSE.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                if (data.rankings) renderLeaderboard(data.rankings);
            } catch (err) {}
        };
        leaderboardSSE.onerror = function() {
            if (leaderboardSSE) leaderboardSSE.close();
            leaderboardSSE = null;
        };
    } catch (e) {}
}

// =============================================================================
// 🤖 MASTER HUD SYSTEM 6: AI LIFE COACH & 5-MIN RECOVERY DECK
// =============================================================================

async function loadRecoveryQuests() {
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/quests/recovery-mode`);
            if (res.ok) {
                const quests = await res.json();
                renderRecoveryQuests(quests);
            }
        } catch (e) {
            renderRecoveryQuests(getFallbackRecoveryQuests());
        }
    } else {
        renderRecoveryQuests(getFallbackRecoveryQuests());
    }
}

function getFallbackRecoveryQuests() {
    return [
        { id: 901, title: "Drink 1 Full Glass of Water", category: "Health Care", difficulty: "EASY", xp_reward: 20, gold_reward: 20, duration_minutes: 2 },
        { id: 902, title: "5-Minute Desk Clean & Declutter", category: "Focus", difficulty: "EASY", xp_reward: 25, gold_reward: 25, duration_minutes: 5 },
        { id: 903, title: "10 Mindful Deep Breaths", category: "Health Care", difficulty: "EASY", xp_reward: 20, gold_reward: 20, duration_minutes: 3 },
        { id: 904, title: "Write Down Top 1 Priority for Today", category: "Focus", difficulty: "EASY", xp_reward: 30, gold_reward: 30, duration_minutes: 5 }
    ];
}

function renderRecoveryQuests(quests) {
    const list = document.getElementById('recovery-quests-list');
    if (!list) return;
    list.innerHTML = '';

    quests.forEach(q => {
        const card = document.createElement('div');
        card.className = 'recovery-quest-card';
        card.innerHTML = `
            <div class="rq-info">
                <span class="rq-title">⚡ ${q.title}</span>
                <span class="rq-sub">⏱️ ~${q.duration_minutes || 5} Min • ⭐ +${q.xp_reward || 20} XP • 🪙 +${q.gold_reward || 20} G</span>
            </div>
            <button type="button" class="pixel-btn btn-sm btn-green" onclick="completeRecoveryQuest(${q.id})">✓ CLAIM</button>
        `;
        list.appendChild(card);
    });
}

async function completeRecoveryQuest(questId) {
    playSound('victory');
    hero.xp = (hero.xp || 0) + 25;
    hero.gold = (hero.gold || 1000) + 25;
    hero.vitality = (hero.vitality || 20) + 3;
    
    if (currentUser) {
        try {
            await fetchWithRefresh(`${baseUrl}/quests/${questId}/complete`, { method: 'POST' });
        } catch (e) {}
    } else {
        localStorage.setItem('liferpg_hero_profile', JSON.stringify(hero));
    }
    
    updateAdvDashboardUI();
    loadRecoveryQuests();
    spawnFloatingReward('+25 RECOVERY XP', 'xp', 140, 90);
    alert('🛡️ Momentum Restored!\nEvery small step counts. You restarted your momentum with zero shame.');
}

// =============================================================================
// 📊 MASTER HUD SYSTEM 7: PROGRESS ANALYTICS & AUDIT LEDGERS
// =============================================================================

async function loadAnalytics() {
    setText('analytics-gold', `${(hero.gold || 1000).toLocaleString()} G`);
    setText('analytics-km', `${(hero.journey_km || 2).toFixed(1)} KM`);
    
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/analytics/overview`);
            if (res.ok) {
                const data = await res.json();
                renderAnalyticsCharts(data);
            }
        } catch (e) {
            renderAnalyticsCharts(getFallbackAnalytics());
        }
    } else {
        renderAnalyticsCharts(getFallbackAnalytics());
    }
}

function getFallbackAnalytics() {
    return {
        total_quests_completed: guestQuests?.filter(q => q.completed).length || 4,
        best_streak: 3,
        current_streak: 1,
        weekly_xp_history: [
            { day: "Mon", xp: 120 },
            { day: "Tue", xp: 180 },
            { day: "Wed", xp: 90 },
            { day: "Thu", xp: 220 },
            { day: "Fri", xp: 160 },
            { day: "Sat", xp: 240 },
            { day: "Sun", xp: 140 }
        ]
    };
}

function renderAnalyticsCharts(overview) {
    setText('analytics-total-quests', overview.total_quests_completed || 0);
    setText('analytics-best-streak', `${overview.best_streak || 1} DAYS`);

    const chart = document.getElementById('analytics-xp-bars');
    if (!chart) return;
    chart.innerHTML = '';

    const history = overview.weekly_xp_history || [];
    const maxXP = Math.max(100, ...history.map(h => h.xp));

    history.forEach(item => {
        const col = document.createElement('div');
        col.className = 'xp-bar-col';
        const heightPct = Math.round((item.xp / maxXP) * 100);

        col.innerHTML = `
            <div class="xp-bar-val">${item.xp}</div>
            <div class="xp-bar-track">
                <div class="xp-bar-fill" style="height: ${heightPct}%;"></div>
            </div>
            <span class="xp-bar-day">${item.day}</span>
        `;
        chart.appendChild(col);
    });
}

async function loadLedger() {
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/analytics/ledger`);
            if (res.ok) {
                const ledger = await res.json();
                renderLedgers(ledger);
            }
        } catch (e) {
            renderLedgers(getFallbackLedger());
        }
    } else {
        renderLedgers(getFallbackLedger());
    }
}

function getFallbackLedger() {
    return [
        { created_at: "Today 14:30", delta: 50, reason: "Quest: Read 25 pages", balance_after: 250 },
        { created_at: "Today 12:00", delta: 40, reason: "Quest: 30-min Gym Workout", balance_after: 200 },
        { created_at: "Yesterday 18:20", delta: 30, reason: "Quest: Drink 2L Water", balance_after: 160 },
        { created_at: "Yesterday 09:00", delta: 60, reason: "Focus Sprint 25m", balance_after: 130 }
    ];
}

function renderLedgers(ledgerData) {
    const container = document.getElementById('analytics-ledger-container');
    if (!container) return;
    container.innerHTML = '';

    if (!ledgerData || ledgerData.length === 0) {
        container.innerHTML = `<div style="color:#94a3b8; font-family:var(--font-pixel); font-size:0.55rem; padding:16px;">No transactions recorded.</div>`;
        return;
    }

    ledgerData.forEach(tx => {
        const row = document.createElement('div');
        row.className = 'ledger-tx-row';
        row.innerHTML = `
            <div class="ltr-left">
                <span class="ltr-reason">${tx.reason || 'Quest Reward'}</span>
                <span class="ltr-time">${tx.created_at || 'Recently'}</span>
            </div>
            <div class="ltr-right">
                <span class="ltr-delta ${tx.delta >= 0 ? 'pos' : 'neg'}">${tx.delta >= 0 ? `+${tx.delta}` : tx.delta} XP</span>
                <span class="ltr-bal">Bal: ${tx.balance_after || 0}</span>
            </div>
        `;
        container.appendChild(row);
    });
}

// =============================================================================
// ⚙️ MASTER HUD SYSTEM 8: SETTINGS & ACCESSIBILITY
// =============================================================================

// =============================================================================
// ⚔️ USP 1: DEDICATED QUEST BOARD & 25-MIN POMODORO FOCUS SPRINT ENGINE
// =============================================================================

let currentQuestFilter = 'all';
// focusTimerInterval already declared above (line ~3841)
let focusTimerDurationSeconds = 25 * 60;
let focusTimerRemainingSeconds = 25 * 60;
let isFocusTimerRunning = false;
let activeSprintQuest = null;

async function renderBoardQuests() {
    const list = document.getElementById('board-quests-list');
    if (!list) return;

    let quests = [];
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/quests`);
            if (res.ok) quests = await res.json();
        } catch (e) {
            quests = guestQuests || [];
        }
    } else {
        quests = guestQuests || [];
    }

    list.innerHTML = '';

    let filtered = quests;
    if (currentQuestFilter === 'daily') {
        filtered = quests.filter(q => q.quest_type === 'daily' || !q.quest_type);
    } else if (currentQuestFilter === 'habit') {
        filtered = quests.filter(q => q.category === 'Habit' || q.quest_type === 'habit');
    } else if (currentQuestFilter === 'numeric') {
        filtered = quests.filter(q => (q.target_value && q.target_value > 1) || q.quest_type === 'numeric');
    } else if (currentQuestFilter === 'timer') {
        filtered = quests.filter(q => q.quest_type === 'timer' || q.duration_minutes);
    } else if (currentQuestFilter === 'completed') {
        filtered = quests.filter(q => q.completed);
    } else if (currentQuestFilter === 'Study' || currentQuestFilter === 'Fitness') {
        filtered = quests.filter(q => (q.category || '').toLowerCase() === currentQuestFilter.toLowerCase());
    }

    if (currentQuestFilter !== 'completed') {
        filtered = filtered.filter(q => !q.completed);
    }

    if (filtered.length === 0) {
        list.innerHTML = `
            <div style="background:#090e17; border:1px solid #1e293b; border-radius:8px; padding:32px; text-align:center; grid-column:1/-1;">
                <div style="font-size:2rem; margin-bottom:8px;">⚔️</div>
                <div style="font-family:var(--font-pixel); font-size:0.6rem; color:#cbd5e1; margin-bottom:4px;">NO ACTIVE QUESTS IN THIS CATEGORY</div>
                <p style="font-size:0.75rem; color:#64748b; margin-bottom:14px;">Forge a new quest to begin earning XP, Gold, and Building your LifeRPG realm.</p>
                <button type="button" class="pixel-btn btn-sm btn-cyan" onclick="openAddQuestModal()">+ FORGE QUEST</button>
            </div>
        `;
        return;
    }

    filtered.forEach(q => {
        const card = document.createElement('div');
        const catLower = (q.category || '').toLowerCase();
        let catClass = 'cat-knowledge';
        if (catLower.includes('fitness') || catLower.includes('exercise')) catClass = 'cat-fitness';
        else if (catLower.includes('health')) catClass = 'cat-health';
        else if (catLower.includes('focus') || catLower.includes('discipline')) catClass = 'cat-focus';
        else if (catLower.includes('finance')) catClass = 'cat-finance';
        else if (catLower.includes('school') || catLower.includes('study') || catLower.includes('knowledge') || catLower.includes('academic')) catClass = 'cat-study';
        else if (catLower.includes('tech') || catLower.includes('cod')) catClass = 'cat-tech';
        card.className = `quest-board-card ${catClass} ${q.completed ? 'completed' : ''}`;
        const catIcon = getCategoryIcon(q.category);
        const diffStr = (q.difficulty || 'EASY').toUpperCase();
        const diffClass = { 'EASY': 'easy', 'NORMAL': 'normal', 'MED': 'normal', 'HARD': 'hard', 'EPIC': 'epic', 'LEGENDARY': 'legendary' }[diffStr] || 'easy';
        const isNumeric = (q.target_value || 1) > 1;
        const isTimer = q.quest_type === 'timer' || q.duration_minutes > 0;
        const curVal = q.current_value || 0;
        const targetVal = q.target_value || 1;
        const numPct = Math.min(100, Math.round((curVal / targetVal) * 100));
        const statLabel = (q.stat_type || 'DIS').toUpperCase().slice(0, 3);
        const cxpPreview = ['HARD','EPIC','LEGENDARY'].includes(diffStr) ? 50 : diffStr === 'NORMAL' || diffStr === 'MED' ? 25 : 10;
        card.innerHTML = `
            <div class="qbc-header">
                <span class="qbc-cat-tag">${catIcon} ${(q.category || 'Life').toUpperCase()}</span>
                <span class="qbc-diff-badge ${diffClass}">${diffStr}</span>
            </div>
            <h4 class="qbc-title">${q.title}</h4>
            ${q.description ? `<p class="qbc-desc">${q.description}</p>` : ''}
            ${isNumeric ? `
                <div class="qbc-numeric-track-wrap">
                    <div class="qbc-num-label"><span>PROGRESS</span><span>${curVal} / ${targetVal} (${numPct}%)</span></div>
                    <div class="qbc-num-bar"><div class="qbc-num-fill" style="width:${numPct}%;"></div></div>
                </div>` : ''}
            <div class="qbc-rewards-row">
                <span class="qbc-chip xp">⭐ +${q.xp_reward || 20} XP</span>
                <span class="qbc-chip gold">🪙 +${q.gold_reward || 10}G</span>
                <span class="qbc-chip stat">⚡ +${q.stat_val || 2} ${statLabel}</span>
                <span class="qbc-chip cxp">🧱 +${cxpPreview} BUILD</span>
            </div>
            <div class="qbc-actions-row">
                ${q.completed
                    ? `<span class="qbc-claimed-pill">✓ COMPLETED</span>`
                    : isNumeric
                        ? `<button type="button" class="pixel-btn btn-sm btn-slate" onclick="incrementQuestProgress(${q.id}, 1)">+1 STEP</button>
                           <button type="button" class="pixel-btn btn-sm btn-green" onclick="completeAdvQuest(${q.id})">✓ COMPLETE</button>`
                        : isTimer
                            ? `<button type="button" class="pixel-btn btn-sm btn-gold" onclick="startSprintForQuest(${q.id}, '${q.title.replace(/'/g,"\\'").replace(/"/g,'&quot;')}', ${q.duration_minutes || 25})">⏱️ START SPRINT</button>
                               <button type="button" class="pixel-btn btn-sm btn-green" onclick="completeAdvQuest(${q.id})">✓ DONE</button>`
                            : `<button type="button" class="pixel-btn btn-sm btn-green" style="width:100%;" onclick="completeAdvQuest(${q.id})">⚔️ COMPLETE QUEST</button>`
                }
            </div>
        `;
        list.appendChild(card);
    });
}

function filterQuestsTab(category, btn) {
    playSound('click');
    currentQuestFilter = category;
    document.querySelectorAll('.q-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderBoardQuests();
}

async function incrementQuestProgress(questId, inc = 1) {
    playSound('step');
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/quests/${questId}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ increment: inc })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.questCompleted || data.completed) {
                    playSound('victory');
                    showCompactRewardSequence(data.xpEarned || 25, data.goldEarned || 25, data.cxpEarned || 10, data.levelUp, data.newLevel, data.newTransport);
                }
                updateAdvDashboardUI();
                renderBoardQuests();
            }
        } catch (e) {}
    } else {
        const q = (guestQuests || []).find(item => item.id === questId);
        if (q) {
            q.current_value = (q.current_value || 0) + inc;
            if (q.current_value >= (q.target_value || 1)) {
                completeAdvQuest(questId);
            } else {
                localStorage.setItem('liferpg_guest_quests', JSON.stringify(guestQuests));
                renderBoardQuests();
            }
        }
    }
}

// ⏱️ Focus Sprint Timer Controller
function setFocusDuration(minutes) {
    const mins = parseInt(minutes, 10) || 25;
    focusTimerDurationSeconds = mins * 60;
    focusTimerRemainingSeconds = mins * 60;
    updateFocusTimerDisplay();
}

function toggleFocusTimer() {
    playSound('click');
    if (isFocusTimerRunning) {
        pauseFocusTimer();
    } else {
        startFocusTimer();
    }
}

function startFocusTimer() {
    isFocusTimerRunning = true;
    const btn = document.getElementById('btn-timer-start');
    if (btn) {
        btn.textContent = '⏸ PAUSE';
        btn.className = 'pixel-btn btn-sm btn-gold';
    }
    setText('ftb-status-text', '⚡ DEEP WORK SPRINT IN PROGRESS • STAY FOCUSED');

    // Notify backend of sprint start
    if (currentUser) {
        fetchWithRefresh(`${baseUrl}/quests/focus-sprint/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ duration_minutes: Math.round(focusTimerDurationSeconds / 60), title: activeSprintQuest ? activeSprintQuest.title : 'Deep Work Focus Sprint' })
        }).catch(() => {});
    }

    // Show dynamic contextual dock
    const dock = document.getElementById('adv-active-quest-dock');
    if (dock) {
        dock.classList.remove('hidden');
        setText('acd-quest-title', activeSprintQuest ? activeSprintQuest.title : 'Deep Work Focus Sprint');
    }

    if (focusTimerInterval) clearInterval(focusTimerInterval);
    focusTimerInterval = setInterval(() => {
        if (focusTimerRemainingSeconds > 0) {
            focusTimerRemainingSeconds--;
            updateFocusTimerDisplay();
        } else {
            finishFocusSprint();
        }
    }, 1000);
}

function pauseFocusTimer() {
    isFocusTimerRunning = false;
    if (focusTimerInterval) clearInterval(focusTimerInterval);
    const btn = document.getElementById('btn-timer-start');
    if (btn) {
        btn.textContent = '▶ RESUME';
        btn.className = 'pixel-btn btn-sm btn-green';
    }
    setText('ftb-status-text', '⏸ SPRINT PAUSED • CLICK RESUME TO CONTINUE');
}

function resetFocusTimer() {
    playSound('click');
    pauseFocusTimer();
    focusTimerRemainingSeconds = focusTimerDurationSeconds;
    updateFocusTimerDisplay();
    setText('ftb-status-text', 'Select duration and start deep work sprint');
    const dock = document.getElementById('adv-active-quest-dock');
    if (dock) dock.classList.add('hidden');
    activeSprintQuest = null;
}

function updateFocusTimerDisplay() {
    const mins = Math.floor(focusTimerRemainingSeconds / 60);
    const secs = focusTimerRemainingSeconds % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    setText('ftb-timer-display', timeStr);
    setText('acd-quest-timer', timeStr);

    const progressPct = Math.round(((focusTimerDurationSeconds - focusTimerRemainingSeconds) / focusTimerDurationSeconds) * 100);
    const dockBar = document.getElementById('acd-quest-progress-bar');
    if (dockBar) dockBar.style.width = `${progressPct}%`;
}

function startSprintForQuest(questId, title, durationMinutes) {
    activeSprintQuest = { id: questId, title: title, duration: durationMinutes };
    setFocusDuration(durationMinutes);
    startFocusTimer();
    const banner = document.getElementById('focus-timer-banner');
    if (banner) banner.scrollIntoView({ behavior: 'smooth' });
}

async function finishFocusSprint() {
    pauseFocusTimer();
    playSound('victory');
    const minsCompleted = Math.round(focusTimerDurationSeconds / 60);

    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/quests/focus-sprint/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    duration_minutes: minsCompleted,
                    title: activeSprintQuest ? activeSprintQuest.title : 'Deep Work Focus Sprint',
                    quest_id: activeSprintQuest ? activeSprintQuest.id : null,
                    idempotency_key: `sprint_${Date.now()}`
                })
            });
            if (res.ok) {
                const data = await res.json();
                hero.gold = data.totalGold;
                hero.level = data.newLevel;
                hero.xp = data.currentXp;
                if (data.constructionXp !== undefined && window.homeEngine) {
                    window.homeEngine.constructionXp = data.constructionXp;
                    window.homeEngine.updateHomeHUD();
                }
                showCompactRewardSequence(data.xpEarned, data.goldEarned, data.cxpEarned, data.levelUp, data.newLevel, data.newTransport);
                updateAdvDashboardUI();
            }
        } catch (e) {}
    } else {
        const xpEarned = minsCompleted >= 45 ? 90 : 50;
        const goldEarned = minsCompleted >= 45 ? 45 : 25;
        const cxpEarned = 15;
        hero.xp = (hero.xp || 0) + xpEarned;
        hero.gold = (hero.gold || 1000) + goldEarned;
        if (window.homeEngine) {
            window.homeEngine.constructionXp += cxpEarned;
            window.homeEngine.updateHomeHUD();
        }
        showCompactRewardSequence(xpEarned, goldEarned, cxpEarned, false, hero.level, null);
        updateAdvDashboardUI();
    }

    if (activeSprintQuest && activeSprintQuest.id) {
        completeAdvQuest(activeSprintQuest.id);
    }
    resetFocusTimer();
}

function completeActiveSprintQuest() {
    finishFocusSprint();
}

function cancelActiveSprintQuest() {
    resetFocusTimer();
}

// 🎁 Compact Animated RPG Reward Sequence Popup
function showCompactRewardSequence(xp, gold, cxp = 10, levelUp = false, newLevel = 1, newTransport = null) {
    let popup = document.getElementById('rpg-reward-sequence-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'rpg-reward-sequence-popup';
        popup.className = 'rpg-reward-popup-overlay';
        document.body.appendChild(popup);
    }

    popup.innerHTML = `
        <div class="rpg-reward-modal-card">
            <div class="rrm-header">
                <span class="bolt bolt-l"></span>
                <span class="rrm-title">⚔️ QUEST REWARD CLAIMED</span>
                <span class="bolt bolt-r"></span>
            </div>
            <div class="rrm-body">
                <div class="rrm-rewards-grid">
                    <div class="rrm-chip xp">
                        <span class="rrm-icon">⭐</span>
                        <div class="rrm-data">
                            <span class="rrm-val">+${xp} XP</span>
                            <span class="rrm-lbl">EXPERIENCE</span>
                        </div>
                    </div>
                    <div class="rrm-chip gold">
                        <span class="rrm-icon">🪙</span>
                        <div class="rrm-data">
                            <span class="rrm-val">+${gold} GOLD</span>
                            <span class="rrm-lbl">TREASURY</span>
                        </div>
                    </div>
                    <div class="rrm-chip cxp">
                        <span class="rrm-icon">🧱</span>
                        <div class="rrm-data">
                            <span class="rrm-val">+${cxp} BUILD XP</span>
                            <span class="rrm-lbl">BASE PROGRESS</span>
                        </div>
                    </div>
                </div>

                ${levelUp ? `
                    <div class="rrm-lvl-banner">
                        <span class="rrm-lvl-title">🎉 LEVEL UP! REACHED LEVEL ${newLevel}</span>
                        ${newTransport ? `<span class="rrm-lvl-sub">🚲 UNLOCKED VEHICLE: ${newTransport.name.toUpperCase()}</span>` : ''}
                    </div>
                ` : ''}
            </div>
            <button type="button" class="pixel-btn btn-green btn-large" onclick="dismissRewardPopup()">[ CONTINUE ADVENTURE ]</button>
        </div>
    `;

    popup.classList.remove('hidden');
    popup.style.display = 'flex';
}

function dismissRewardPopup() {
    playSound('click');
    const popup = document.getElementById('rpg-reward-sequence-popup');
    if (popup) {
        popup.classList.add('hidden');
        popup.style.display = 'none';
    }
}

// =============================================================================
// 🏰 USP 5: BASE EXPANSION & BLUEPRINTS MODAL
// =============================================================================

async function expandBaseTier() {
    playSound('click');
    if (currentUser) {
        try {
            const res = await fetchWithRefresh(`${baseUrl}/base/expand`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            if (res.ok) {
                const data = await res.json();
                playSound('victory');
                alert(`🏰 ${data.message}`);
                hero.gold = data.new_gold;
                if (window.homeEngine) {
                    window.homeEngine.constructionXp = data.new_construction_xp;
                    window.homeEngine.homeLevel = data.home_level;
                    window.homeEngine.updateHomeHUD();
                }
                updateAdvDashboardUI();
            } else {
                const err = await res.json();
                playSound('error');
                alert(`❌ ${err.detail || 'Could not upgrade base.'}`);
            }
        } catch (e) {}
    } else {
        if (window.homeEngine) {
            window.homeEngine.homeLevel = (window.homeEngine.homeLevel || 1) + 1;
            window.homeEngine.updateHomeHUD();
            playSound('victory');
            alert(`🏰 Upgraded Home Base to Level ${window.homeEngine.homeLevel}!`);
        }
    }
}

function openRoomBlueprintsModal() {
    playSound('click');
    document.getElementById('room-blueprints-modal')?.classList.remove('hidden');
    if (typeof renderRoomBlueprints === 'function') renderRoomBlueprints();
}

function closeRoomBlueprintsModal() {
    playSound('click');
    document.getElementById('room-blueprints-modal')?.classList.add('hidden');
}

// =============================================================================
// ⚔️ USP 1: QUEST BOARD MISSION STATUS, HISTORY & ACHIEVEMENT TOASTS
// =============================================================================

async function loadQuestMissionStats() {
    if (!currentUser) {
        const quests = guestQuests || [];
        const doneCnt = quests.filter(q => q.completed).length;
        updateMissionStatusBar({
            quests_completed_today: doneCnt,
            xp_earned_today: doneCnt * 20,
            gold_earned_today: doneCnt * 10,
            focus_sprints_today: 0,
            streak_days: hero.streak_days || 1,
            daily_xp_target: 100
        });
        return;
    }
    try {
        const res = await fetchWithRefresh(`${baseUrl}/quests/today-stats`);
        if (res.ok) updateMissionStatusBar(await res.json());
    } catch (e) {}
}

function updateMissionStatusBar(data) {
    const xpToday = data.xp_earned_today || 0;
    const target = data.daily_xp_target || 100;
    const pct = Math.min(100, Math.round((xpToday / target) * 100));
    const bar = document.getElementById('qms-xp-bar');
    if (bar) bar.style.width = `${pct}%`;
    const xpLabel = document.getElementById('qms-xp-label');
    if (xpLabel) xpLabel.textContent = `${xpToday} XP TODAY (${pct}%)`;
    const xpTarget = document.getElementById('qms-xp-target');
    if (xpTarget) xpTarget.textContent = `TARGET: ${target} XP`;
    setText('qms-quests-done', data.quests_completed_today || 0);
    setText('qms-sprints-done', data.focus_sprints_today || 0);
    setText('qms-streak', data.streak_days || 1);
    setText('qms-gold-today', data.gold_earned_today || 0);
    const dateEl = document.getElementById('qms-date-display');
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
    }
    updateSprintRewardPreview();
}

function updateSprintRewardPreview() {
    const sel = document.getElementById('focus-duration-select');
    const mins = parseInt((sel && sel.value) || '25', 10);
    let xp = 50, gold = 25, cxp = 10;
    if (mins >= 60) { xp = 130; gold = 65; cxp = 30; }
    else if (mins >= 45) { xp = 90; gold = 45; cxp = 20; }
    const chips = document.querySelectorAll('.ftb-reward-chip');
    if (chips.length >= 3) {
        chips[0].textContent = `+${xp} XP`;
        chips[1].textContent = `+${gold}G`;
        chips[2].textContent = `+${cxp} BUILD`;
    }
}

async function loadQuestHistory() {
    const histList = document.getElementById('qb-history-list');
    if (!histList) return;
    if (!currentUser) {
        histList.innerHTML = '<div class="qbh-loading">Log in to see your quest history.</div>';
        return;
    }
    try {
        const res = await fetchWithRefresh(`${baseUrl}/quests/history`);
        if (res.ok) renderQuestHistory((await res.json()).slice(0, 6));
        else histList.innerHTML = '<div class="qbh-loading">Could not load history.</div>';
    } catch (e) {
        histList.innerHTML = '<div class="qbh-loading">Could not load history.</div>';
    }
}

function renderQuestHistory(entries) {
    const histList = document.getElementById('qb-history-list');
    if (!histList) return;
    if (!entries || entries.length === 0) {
        histList.innerHTML = '<div class="qbh-loading">No completed quests yet. Complete your first quest to start your legend!</div>';
        return;
    }
    histList.innerHTML = '';
    entries.forEach(entry => {
        const completedAt = entry.completed_at ? new Date(entry.completed_at + 'Z') : new Date();
        const timeStr = completedAt.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const el = document.createElement('div');
        el.className = 'qbh-entry';
        el.innerHTML = `
            <span class="qbh-check">✓</span>
            <div class="qbh-info">
                <div class="qbh-q-title">${entry.quest_title || 'Quest Completed'}</div>
                <div class="qbh-q-time">${timeStr.toUpperCase()}</div>
            </div>
            <div class="qbh-rewards">
                <span class="qbh-xp-badge">+${entry.xp_awarded || 0} XP</span>
                <span class="qbh-gold-badge">+${entry.gold_awarded || 0}G</span>
            </div>
        `;
        histList.appendChild(el);
    });
}

function showAchievementToast(achievement) {
    const toast = document.createElement('div');
    toast.className = 'achievement-unlock-toast';
    toast.innerHTML = `
        <span class="ach-toast-icon">${achievement.icon || '🏆'}</span>
        <div class="ach-toast-text">
            <div class="ach-toast-label">🏆 ACHIEVEMENT UNLOCKED</div>
            <div class="ach-toast-title">${achievement.title || 'Achievement'}</div>
        </div>
    `;
    document.body.appendChild(toast);
    playSound('magic');
    setTimeout(() => {
        toast.style.animation = 'slideInRightToast 0.3s ease reverse';
        setTimeout(() => toast.remove(), 320);
    }, 3500);
}

// Initialize on page load
loadAdventureData();

let appCurrentBuildId = null;

async function checkAppVersion() {
    try {
        const res = await fetch('/version?t=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();
        const incomingId = data.build_id || data.commit;
        if (!incomingId) return;

        if (!appCurrentBuildId) {
            appCurrentBuildId = incomingId;
            return;
        }

        if (incomingId !== appCurrentBuildId) {
            appCurrentBuildId = incomingId;
            showUpdateNotification();
        }
    } catch (e) {}
}

function showUpdateNotification() {
    if (document.getElementById('rpg-update-notification')) return;
    playSound('victory');
    const banner = document.createElement('div');
    banner.id = 'rpg-update-notification';
    banner.className = 'rpg-update-banner';
    banner.innerHTML = `
        <span style="font-size: 1.3rem;">🚀</span>
        <div>
            <div><strong>NEW UPDATE DEPLOYED!</strong></div>
            <div style="font-size: 0.72rem; opacity: 0.9;">Fresh version live on GitHub. Refreshing in <span id="update-countdown">3</span>s...</div>
        </div>
        <button type="button" class="pixel-btn btn-sm btn-gold" onclick="window.location.reload()" style="margin-left: 8px;">UPDATE NOW</button>
    `;
    document.body.appendChild(banner);

    let countdown = 3;
    const timer = setInterval(() => {
        countdown--;
        const el = document.getElementById('update-countdown');
        if (el) el.textContent = countdown;
        if (countdown <= 0) {
            clearInterval(timer);
            window.location.reload();
        }
    }, 1000);
}

setInterval(checkAppVersion, 30000);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkAppVersion();
    }
});
checkAppVersion();



