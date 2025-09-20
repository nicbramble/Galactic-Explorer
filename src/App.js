import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  ShoppingCart,
  Star,
  Globe2,
  Zap,
  Settings,
  BarChart3,
  Gift,
  Target,
  Clock,
  Sparkles,
  Crown,
  Rocket,
  Plus,
  Minus,
  RefreshCw,
  Award,
  TrendingUp,
  Calendar,
  Archive
} from "lucide-react";

// -------------------- THEME --------------------
const THEME = {
  currencyName: "Energy",
  currencyEmoji: "🔋",
  primary: "from-indigo-900 via-purple-700 to-blue-600",
  glass: "backdrop-blur-xl bg-white/10 border border-white/10",
  glow: "shadow-[0_0_30px_rgba(99,102,241,0.5)]",
  ring: "ring-2 ring-indigo-400/60",
};

// -------------------- HELPERS --------------------
const fmt = (n) => {
  if (!isFinite(n)) return "∞";
  if (n < 1_000) return n.toFixed(n < 10 ? 2 : 0);
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td"];
  let i = -1;
  while (n >= 1000 && ++i < units.length) n /= 1000;
  return `${n.toFixed(2)}${units[i] ?? ""}`;
};

const saveKey = "galactic-explorer-v1";
const nextCost = (base, owned, multiplier = 1.15) => base * Math.pow(multiplier, owned);
const getTimestamp = () => Date.now();
const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

// -------------------- CONTENT DATA --------------------
const BASE_GENERATORS = [
  { id: "solar", name: "Solar Panel", icon: "☀️", baseCost: 15, cps: 0.1, description: "Harnesses solar energy" },
  { id: "satellite", name: "Satellite", icon: "🛰️", baseCost: 100, cps: 1, description: "Orbital energy collector" },
  { id: "miner", name: "Asteroid Miner", icon: "⛏️", baseCost: 550, cps: 5, description: "Extracts energy from asteroids" },
  { id: "moonbase", name: "Moon Base", icon: "🌙", baseCost: 3000, cps: 25, description: "Lunar energy facility" },
  { id: "forge", name: "Star Forge", icon: "🔥", baseCost: 15000, cps: 120, description: "Stellar energy manipulation" },
  { id: "wormhole", name: "Wormhole Generator", icon: "🌀", baseCost: 95000, cps: 800, description: "Interdimensional energy tap" },
  { id: "dyson", name: "Dyson Sphere", icon: "🌌", baseCost: 1000000, cps: 5000, description: "Ultimate stellar energy collector" },
  { id: "quasar", name: "Quasar Engine", icon: "💫", baseCost: 10000000, cps: 50000, description: "Galactic core energy harvester" },
  { id: "universe", name: "Universe Generator", icon: "🌠", baseCost: 100000000, cps: 500000, description: "Reality-bending energy source" },
];

const BASE_UPGRADES = [
  { id: "click_2x", name: "Enhanced Clickers", icon: "👆", cost: 500, effect: "2x click power", type: "click_multiplier", value: 2 },
  { id: "solar_2x", name: "Solar Efficiency", icon: "☀️", cost: 1000, effect: "2x Solar Panel production", type: "generator_multiplier", generator: "solar", value: 2 },
  { id: "click_5x", name: "Quantum Fingers", icon: "✨", cost: 5000, effect: "5x click power", type: "click_multiplier", value: 5 },
  { id: "global_15", name: "Energy Crystals", icon: "💎", cost: 25000, effect: "+15% all production", type: "global_multiplier", value: 1.15 },
  { id: "satellite_3x", name: "Advanced Satellites", icon: "🛰️", cost: 50000, effect: "3x Satellite production", type: "generator_multiplier", generator: "satellite", value: 3 },
  { id: "click_10x", name: "Reality Manipulation", icon: "🌀", cost: 100000, effect: "10x click power", type: "click_multiplier", value: 10 },
  { id: "global_25", name: "Dark Matter Infusion", icon: "🕳️", cost: 500000, effect: "+25% all production", type: "global_multiplier", value: 1.25 },
  { id: "auto_clicker", name: "Auto Clicker", icon: "🤖", cost: 1000000, effect: "Clicks automatically", type: "auto_click", value: 1 },
];

const BASE_ACHIEVEMENTS = [
  { id: "a_first_click", name: "First Spark", icon: "✨", desc: "Click for the first time", check: (s) => s.stats.totalClicks >= 1, reward: 10 },
  { id: "a_100_clicks", name: "Clicking Novice", icon: "👆", desc: "Click 100 times", check: (s) => s.stats.totalClicks >= 100, reward: 100 },
  { id: "a_1k_clicks", name: "Click Master", icon: "🖱️", desc: "Click 1,000 times", check: (s) => s.stats.totalClicks >= 1000, reward: 1000 },
  { id: "a_1k", name: "Fuel for Launch", icon: "🚀", desc: "Accumulate 1,000 energy", check: (s) => s.currency >= 1000, reward: 100 },
  { id: "a_100k", name: "Energy Tycoon", icon: "💰", desc: "Accumulate 100,000 energy", check: (s) => s.currency >= 100000, reward: 10000 },
  { id: "a_1m", name: "Millionaire Explorer", icon: "💎", desc: "Accumulate 1,000,000 energy", check: (s) => s.currency >= 1000000, reward: 100000 },
  { id: "a_cps_50", name: "Engines Online", icon: "⚙️", desc: "Reach 50 CPS", check: (s) => s.cps >= 50, reward: 500 },
  { id: "a_cps_1k", name: "Power Grid", icon: "🔌", desc: "Reach 1,000 CPS", check: (s) => s.cps >= 1000, reward: 5000 },
  { id: "a_cps_100k", name: "Stellar Network", icon: "🌟", desc: "Reach 100,000 CPS", check: (s) => s.cps >= 100000, reward: 500000 },
  { id: "a_gen10", name: "Fleet Commander", icon: "👩‍🚀", desc: "Own 10 of any generator", check: (s) => s.generators.some((g) => g.qty >= 10), reward: 1000 },
  { id: "a_gen100", name: "Industrial Scale", icon: "🏭", desc: "Own 100 of any generator", check: (s) => s.generators.some((g) => g.qty >= 100), reward: 50000 },
  { id: "a_total_1m", name: "Lifetime Achiever", icon: "🏆", desc: "Earn 1M energy total", check: (s) => s.stats.totalEarned >= 1000000, reward: 100000 },
  { id: "a_playtime_1h", name: "Dedicated Explorer", icon: "⏰", desc: "Play for 1 hour", check: (s) => (Date.now() - s.stats.startTime) >= 3600000, reward: 10000 },
  { id: "a_all_planets", name: "Galactic Cartographer", icon: "🗺️", desc: "Explore all planets", check: (s) => s.explored.length >= 5, reward: 1000000 },
];

const PLANETS = [
  { id: "moon", name: "Moon", icon: "🌙", cost: 5000, bonus: 0.1, description: "Lunar mining operations" },
  { id: "mars", name: "Mars", icon: "🔴", cost: 50000, bonus: 0.25, description: "Red planet colonies" },
  { id: "jupiter", name: "Jupiter", icon: "🪐", cost: 250000, bonus: 0.5, description: "Gas giant research stations" },
  { id: "saturn", name: "Saturn", icon: "💫", cost: 1000000, bonus: 1.0, description: "Ring system energy harvesting" },
  { id: "alpha", name: "Alpha Centauri", icon: "✨", cost: 10000000, bonus: 2.0, description: "Interstellar expansion" },
];

const PRESTIGE_THRESHOLDS = [1000000, 10000000, 100000000, 1000000000];

const DAILY_CHALLENGES = [
  { id: "click_challenge", name: "Click Master", desc: "Click 500 times", target: 500, type: "clicks", reward: 50000 },
  { id: "earn_challenge", name: "Energy Harvester", desc: "Earn 100K energy", target: 100000, type: "earn", reward: 100000 },
  { id: "buy_challenge", name: "Shopping Spree", desc: "Buy 20 generators", target: 20, type: "purchases", reward: 75000 },
];

export default function App() {
  // Core game state
  const [currency, setCurrency] = useState(0);
  const [generators, setGenerators] = useState(BASE_GENERATORS.map((g) => ({ ...g, qty: 0 })));
  const [upgrades, setUpgrades] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [explored, setExplored] = useState([]);
  const [prestigeLevel, setPrestigeLevel] = useState(0);
  const [prestigePoints, setPrestigePoints] = useState(0);
  
  // UI state
  const [tab, setTab] = useState("shop");
  const [showSettings, setShowSettings] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [offlineProgress, setOfflineProgress] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [challengeProgress, setChallengeProgress] = useState({});
  
  // Stats
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalEarned: 0,
    totalSpent: 0,
    startTime: Date.now(),
    lastSave: Date.now(),
    sessionStart: Date.now(),
    totalPurchases: 0,
    sessionEarned: 0,
    sessionClicks: 0
  });

  // Custom confetti effect
  const createConfetti = useCallback(() => {
    const colors = ['#fbbf24', '#f59e0b', '#d97706', '#92400e', '#451a03'];
    const container = document.body;
    
    for (let i = 0; i < 30; i++) {
      const confettiPiece = document.createElement('div');
      confettiPiece.style.position = 'fixed';
      confettiPiece.style.left = Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000) + 'px';
      confettiPiece.style.top = '-10px';
      confettiPiece.style.width = '4px';
      confettiPiece.style.height = '4px';
      confettiPiece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confettiPiece.style.pointerEvents = 'none';
      confettiPiece.style.borderRadius = '50%';
      confettiPiece.style.zIndex = '1000';
      
      container.appendChild(confettiPiece);
      
      const fallDistance = typeof window !== 'undefined' ? window.innerHeight + 100 : 800;
      
      const animation = confettiPiece.animate([
        { 
          transform: `translateY(0px) rotate(0deg)`,
          opacity: 1
        },
        { 
          transform: `translateY(${fallDistance}px) rotate(${Math.random() * 360}deg)`,
          opacity: 0
        }
      ], {
        duration: Math.random() * 2000 + 1500,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      });
      
      animation.onfinish = () => {
        try {
          if (confettiPiece && confettiPiece.parentNode) {
            confettiPiece.parentNode.removeChild(confettiPiece);
          }
        } catch (e) {
          // Silently handle cleanup errors
        }
      };
    }
  }, []);

  // Auto-save interval
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveGame();
    }, 30000);
    
    return () => clearInterval(saveInterval);
  }, []);

  const saveGame = useCallback(() => {
    const payload = {
      currency,
      generators,
      upgrades,
      achievements,
      explored,
      prestigeLevel,
      prestigePoints,
      tab,
      buyQuantity,
      stats: { ...stats, lastSave: Date.now() },
      dailyChallenge,
      challengeProgress,
      version: "1.0"
    };
    localStorage.setItem(saveKey, JSON.stringify(payload));
  }, [currency, generators, upgrades, achievements, explored, prestigeLevel, prestigePoints, tab, buyQuantity, stats, dailyChallenge, challengeProgress]);

  const calculateCPS = useCallback((gens, ups, expl, prestige) => {
    let totalCPS = 0;
    
    // Base generator CPS
    for (const gen of gens) {
      let genCPS = gen.qty * gen.cps;
      
      // Apply generator-specific multipliers
      for (const upgrade of ups) {
        if (upgrade.type === "generator_multiplier" && upgrade.generator === gen.id) {
          genCPS *= upgrade.value;
        }
      }
      
      totalCPS += genCPS;
    }
    
    // Apply global multipliers
    let globalMultiplier = 1;
    for (const upgrade of ups) {
      if (upgrade.type === "global_multiplier") {
        globalMultiplier *= upgrade.value;
      }
    }
    
    // Apply planet bonuses
    for (const planetId of expl) {
      const planet = PLANETS.find(p => p.id === planetId);
      if (planet) {
        globalMultiplier += planet.bonus;
      }
    }
    
    // Apply prestige bonus
    if (prestige > 0) {
      globalMultiplier *= (1 + prestige * 0.1);
    }
    
    return totalCPS * globalMultiplier;
  }, []);

  // Load game
  useEffect(() => {
    const raw = localStorage.getItem(saveKey);
    if (!raw) {
      const challenge = DAILY_CHALLENGES[Math.floor(Math.random() * DAILY_CHALLENGES.length)];
      setDailyChallenge({ ...challenge, startDate: new Date().toDateString() });
      return;
    }
    
    try {
      const s = JSON.parse(raw);
      setCurrency(s.currency ?? 0);
      setGenerators(s.generators ?? BASE_GENERATORS.map((g) => ({ ...g, qty: 0 })));
      setUpgrades(s.upgrades ?? []);
      setAchievements(s.achievements ?? []);
      setExplored(s.explored ?? []);
      setPrestigeLevel(s.prestigeLevel ?? 0);
      setPrestigePoints(s.prestigePoints ?? 0);
      setTab(s.tab ?? "shop");
      setBuyQuantity(s.buyQuantity ?? 1);
      setDailyChallenge(s.dailyChallenge);
      setChallengeProgress(s.challengeProgress ?? {});
      
      const loadedStats = { 
        totalClicks: 0,
        totalEarned: 0,
        totalSpent: 0,
        startTime: Date.now(),
        lastSave: Date.now(),
        sessionStart: Date.now(),
        totalPurchases: 0,
        sessionEarned: 0,
        sessionClicks: 0,
        ...s.stats, 
        sessionStart: Date.now() 
      };
      setStats(loadedStats);
      
      // Calculate offline progress
      if (s.stats && s.stats.lastSave) {
        const offlineTime = Date.now() - s.stats.lastSave;
        if (offlineTime > 60000) {
          const cps = calculateCPS(s.generators ?? [], s.upgrades ?? [], s.explored ?? [], s.prestigeLevel ?? 0);
          const offlineEarnings = Math.min(cps * (offlineTime / 1000), cps * 3600 * 2);
          
          if (offlineEarnings > 0) {
            setOfflineProgress({
              time: offlineTime,
              earnings: offlineEarnings
            });
          }
        }
      }
      
      const today = new Date().toDateString();
      if (!s.dailyChallenge || s.dailyChallenge.startDate !== today) {
        const challenge = DAILY_CHALLENGES[Math.floor(Math.random() * DAILY_CHALLENGES.length)];
        setDailyChallenge({ ...challenge, startDate: today });
        setChallengeProgress({});
      }
      
    } catch (error) {
      console.error("Failed to load save:", error);
    }
  }, [calculateCPS]);

  const cpsTotal = useMemo(() => calculateCPS(generators, upgrades, explored, prestigeLevel), [generators, upgrades, explored, prestigeLevel, calculateCPS]);

  const clickPower = useMemo(() => {
    let power = 1;
    for (const upgrade of upgrades) {
      if (upgrade.type === "click_multiplier") {
        power *= upgrade.value;
      }
    }
    return power * (1 + prestigeLevel * 0.05);
  }, [upgrades, prestigeLevel]);

  // Game loop
  useEffect(() => {
    const interval = setInterval(() => {
      const gained = cpsTotal / 10;
      if (gained > 0) {
        setCurrency(c => c + gained);
        setStats(s => ({ 
          ...s, 
          totalEarned: s.totalEarned + gained,
          sessionEarned: s.sessionEarned + gained
        }));
        
        setChallengeProgress(prev => ({
          ...prev,
          earn: (prev.earn || 0) + gained
        }));
      }
      
      if (upgrades.some(u => u.type === "auto_click")) {
        const autoClicks = upgrades.filter(u => u.type === "auto_click").length;
        const autoGained = clickPower * autoClicks;
        setCurrency(c => c + autoGained);
        setStats(s => ({ 
          ...s, 
          totalClicks: s.totalClicks + autoClicks,
          totalEarned: s.totalEarned + autoGained,
          sessionClicks: s.sessionClicks + autoClicks,
          sessionEarned: s.sessionEarned + autoGained
        }));
        
        setChallengeProgress(prev => ({
          ...prev,
          clicks: (prev.clicks || 0) + autoClicks,
          earn: (prev.earn || 0) + autoGained
        }));
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [cpsTotal, upgrades, clickPower]);

  // Check achievements
  useEffect(() => {
    const gameState = { currency, generators, achievements, stats, cps: cpsTotal, explored };
    
    for (const achievement of BASE_ACHIEVEMENTS) {
      if (!achievements.includes(achievement.id) && achievement.check(gameState)) {
        setAchievements(prev => [...prev, achievement.id]);
        setCurrency(c => c + achievement.reward);
        addNotification(`🏆 Achievement Unlocked: ${achievement.name}!`, `+${fmt(achievement.reward)} Energy`);
        createConfetti();
      }
    }
  }, [currency, generators, achievements, stats, cpsTotal, explored, createConfetti]);

  // Check daily challenge completion
  useEffect(() => {
    if (!dailyChallenge || challengeProgress.completed) return;
    
    const progress = challengeProgress[dailyChallenge.type] || 0;
    if (progress >= dailyChallenge.target) {
      setChallengeProgress(prev => ({ ...prev, completed: true }));
      setCurrency(c => c + dailyChallenge.reward);
      addNotification(`🎯 Daily Challenge Complete!`, `+${fmt(dailyChallenge.reward)} Energy`);
      createConfetti();
    }
  }, [challengeProgress, dailyChallenge, createConfetti]);

  const addNotification = (title, subtitle) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, subtitle }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleClick = () => {
    const gained = clickPower;
    setCurrency(c => c + gained);
    setStats(s => ({ 
      ...s, 
      totalClicks: s.totalClicks + 1, 
      totalEarned: s.totalEarned + gained,
      sessionClicks: s.sessionClicks + 1,
      sessionEarned: s.sessionEarned + gained
    }));
    
    setChallengeProgress(prev => ({
      ...prev,
      clicks: (prev.clicks || 0) + 1,
      earn: (prev.earn || 0) + gained
    }));
  };

  const buyGenerator = (generator) => {
    const quantity = buyQuantity;
    let totalCost = 0;
    
    for (let i = 0; i < quantity; i++) {
      totalCost += nextCost(generator.baseCost, generator.qty + i);
    }
    
    if (currency >= totalCost) {
      setCurrency(c => c - totalCost);
      setGenerators(list => 
        list.map(g => g.id === generator.id ? { ...g, qty: g.qty + quantity } : g)
      );
      setStats(s => ({ 
        ...s, 
        totalSpent: s.totalSpent + totalCost,
        totalPurchases: s.totalPurchases + quantity
      }));
      
      setChallengeProgress(prev => ({
        ...prev,
        purchases: (prev.purchases || 0) + quantity
      }));
    }
  };

  const buyUpgrade = (upgrade) => {
    if (currency >= upgrade.cost && !upgrades.some(u => u.id === upgrade.id)) {
      setCurrency(c => c - upgrade.cost);
      setUpgrades(list => [...list, upgrade]);
      setStats(s => ({ ...s, totalSpent: s.totalSpent + upgrade.cost }));
      addNotification(`⚡ Upgrade Purchased!`, upgrade.name);
    }
  };

  const explorePlanet = (planet) => {
    if (currency >= planet.cost && !explored.includes(planet.id)) {
      setCurrency(c => c - planet.cost);
      setExplored(arr => [...arr, planet.id]);
      setStats(s => ({ ...s, totalSpent: s.totalSpent + planet.cost }));
      addNotification(`🌍 Planet Explored!`, `${planet.name} discovered`);
      createConfetti();
    }
  };

  const canPrestige = () => {
    return stats.totalEarned >= PRESTIGE_THRESHOLDS[Math.min(prestigeLevel, PRESTIGE_THRESHOLDS.length - 1)];
  };

  const doPrestige = () => {
    if (!canPrestige()) return;
    
    const newPrestigePoints = Math.floor(Math.pow(stats.totalEarned / 1000000, 0.5));
    
    setCurrency(0);
    setGenerators(BASE_GENERATORS.map(g => ({ ...g, qty: 0 })));
    setUpgrades([]);
    setExplored([]);
    
    setPrestigeLevel(prev => prev + 1);
    setPrestigePoints(prev => prev + newPrestigePoints);
    
    setStats(prev => ({
      ...prev,
      totalEarned: 0,
      totalSpent: 0,
      totalPurchases: 0,
      sessionStart: Date.now(),
      sessionEarned: 0,
      sessionClicks: 0
    }));
    
    addNotification(`👑 Prestige Complete!`, `+${newPrestigePoints} Prestige Points`);
    createConfetti();
  };

  const claimOfflineProgress = () => {
    if (!offlineProgress) return;
    
    setCurrency(c => c + offlineProgress.earnings);
    setStats(s => ({ ...s, totalEarned: s.totalEarned + offlineProgress.earnings }));
    setOfflineProgress(null);
    addNotification(`💤 Welcome Back!`, `+${fmt(offlineProgress.earnings)} Energy`);
  };

  const resetGame = () => {
    if (window.confirm("Are you sure you want to reset all progress? This cannot be undone!")) {
      localStorage.removeItem(saveKey);
      window.location.reload();
    }
  };

  const exportSave = () => {
    const saveData = localStorage.getItem(saveKey);
    if (saveData) {
      const blob = new Blob([saveData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'galactic-explorer-save.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const importSave = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target.result);
          localStorage.setItem(saveKey, JSON.stringify(saveData));
          window.location.reload();
        } catch {
          alert("Invalid save file!");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen w-full text-white bg-gradient-to-br from-black via-indigo-900 to-purple-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        {typeof window !== 'undefined' && [...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              x: Math.random() * (window.innerWidth || 1000),
              y: Math.random() * (window.innerHeight || 800)
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-3 rounded-lg ${THEME.glass} max-w-xs`}
            >
              <div className="font-semibold text-sm">{notification.title}</div>
              <div className="text-xs opacity-80">{notification.subtitle}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Offline Progress Modal */}
      <AnimatePresence>
        {offlineProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={`p-6 rounded-2xl ${THEME.glass} max-w-sm mx-4 text-center`}
            >
              <div className="text-4xl mb-4">💤</div>
              <h3 className="text-xl font-bold mb-2">Welcome Back!</h3>
              <p className="text-sm opacity-80 mb-4">
                You were away for {formatTime(offlineProgress.time)}
              </p>
              <div className="text-2xl font-bold text-yellow-400 mb-4">
                +{fmt(offlineProgress.earnings)} {THEME.currencyEmoji}
              </div>
              <button
                onClick={claimOfflineProgress}
                className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
              >
                Claim Rewards
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={`p-6 rounded-2xl ${THEME.glass} max-w-md mx-4`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-2xl hover:text-red-400"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Buy Quantity</label>
                  <div className="flex gap-2">
                    {[1, 10, 25, 100].map(qty => (
                      <button
                        key={qty}
                        onClick={() => setBuyQuantity(qty)}
                        className={`px-3 py-1 rounded ${buyQuantity === qty ? 'bg-indigo-600' : 'bg-white/20'}`}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Save Management</label>
                  <div className="flex gap-2">
                    <button
                      onClick={exportSave}
                      className="flex-1 px-3 py-2 bg-green-600 rounded hover:bg-green-700"
                    >
                      Export Save
                    </button>
                    <label className="flex-1 px-3 py-2 bg-blue-600 rounded hover:bg-blue-700 cursor-pointer text-center">
                      Import Save
                      <input
                        type="file"
                        accept=".json"
                        onChange={importSave}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                
                <button
                  onClick={resetGame}
                  className="w-full px-3 py-2 bg-red-600 rounded hover:bg-red-700"
                >
                  Reset Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-white/20 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Galactic Explorer v1.0</h1>
          </div>
          {prestigeLevel > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-600/30 rounded-full text-sm">
              <Crown className="h-4 w-4" />
              Prestige {prestigeLevel}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm opacity-90">CPS: {fmt(cpsTotal)}</div>
            <div className="text-xs opacity-70">Session: {formatTime(Date.now() - stats.sessionStart)}</div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="grid lg:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto relative z-10">
        {/* Click Area */}
        <section className={`lg:col-span-2 p-6 rounded-2xl ${THEME.glass} text-center`}>
          <div className="mb-4">
            <div className="text-4xl font-black mb-2">{THEME.currencyEmoji} {fmt(currency)}</div>
            {prestigePoints > 0 && (
              <div className="text-lg text-yellow-400">👑 {fmt(prestigePoints)} Prestige Points</div>
            )}
          </div>
          
          <motion.button
            onClick={handleClick}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className={`h-48 w-48 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 grid place-content-center text-6xl shadow-2xl ${THEME.glow} relative overflow-hidden`}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              {THEME.currencyEmoji}
            </motion.div>
            
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-white/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.button>
          
          <div className="mt-4">
            <div className="text-lg font-semibold">+{fmt(clickPower)} {THEME.currencyName} / click</div>
            {upgrades.some(u => u.type === "auto_click") && (
              <div className="text-sm text-green-400">🤖 Auto-clicking enabled</div>
            )}
          </div>

          {/* Daily Challenge */}
          {dailyChallenge && !challengeProgress.completed && (
            <div className={`mt-6 p-4 rounded-lg ${THEME.glass} text-left max-w-md mx-auto`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">Daily Challenge</span>
              </div>
              <div className="text-sm mb-2">{dailyChallenge.desc}</div>
              <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((challengeProgress[dailyChallenge.type] || 0) / dailyChallenge.target) * 100)}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span>{fmt(challengeProgress[dailyChallenge.type] || 0)} / {fmt(dailyChallenge.target)}</span>
                <span className="text-yellow-400">+{fmt(dailyChallenge.reward)} {THEME.currencyEmoji}</span>
              </div>
            </div>
          )}

          {/* Prestige */}
          {canPrestige() && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-lg bg-gradient-to-r from-yellow-600/30 to-orange-600/30 border border-yellow-400/50`}
            >
              <div className="flex items-center gap-2 justify-center mb-2">
                <Crown className="h-5 w-5 text-yellow-400" />
                <span className="font-bold text-yellow-400">Prestige Available!</span>
              </div>
              <p className="text-sm mb-3">Reset progress for permanent bonuses</p>
              <button
                onClick={doPrestige}
                className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 transition"
              >
                Prestige (+{Math.floor(Math.pow(stats.totalEarned / 1000000, 0.5))} points)
              </button>
            </motion.div>
          )}
        </section>

        {/* Sidebar */}
        <aside className={`p-4 rounded-2xl ${THEME.glass}`}>
          <nav className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => setTab("shop")}
              className={`p-3 rounded-lg flex flex-col items-center gap-1 transition ${
                tab === "shop" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs">Shop</span>
            </button>
            <button
              onClick={() => setTab("upgrades")}
              className={`p-3 rounded-lg flex flex-col items-center gap-1 transition ${
                tab === "upgrades" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
              }`}
            >
              <Zap className="h-5 w-5" />
              <span className="text-xs">Upgrades</span>
            </button>
            <button
              onClick={() => setTab("planets")}
              className={`p-3 rounded-lg flex flex-col items-center gap-1 transition ${
                tab === "planets" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
              }`}
            >
              <Globe2 className="h-5 w-5" />
              <span className="text-xs">Explore</span>
            </button>
            <button
              onClick={() => setTab("achievements")}
              className={`p-3 rounded-lg flex flex-col items-center gap-1 transition ${
                tab === "achievements" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
              }`}
            >
              <Trophy className="h-5 w-5" />
              <span className="text-xs">Awards</span>
              {BASE_ACHIEVEMENTS.filter(a => achievements.includes(a.id)).length > 0 && (
                <span className="text-xs bg-yellow-500 text-black px-1 rounded">
                  {BASE_ACHIEVEMENTS.filter(a => achievements.includes(a.id)).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("stats")}
              className={`p-3 rounded-lg flex flex-col items-center gap-1 transition ${
                tab === "stats" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs">Stats</span>
            </button>
            <button
              onClick={() => setTab("prestige")}
              className={`p-3 rounded-lg flex flex-col items-center gap-1 transition ${
                tab === "prestige" ? "bg-white/20" : "bg-white/10 hover:bg-white/15"
              }`}
            >
              <Crown className="h-5 w-5" />
              <span className="text-xs">Prestige</span>
              {prestigeLevel > 0 && (
                <span className="text-xs bg-yellow-500 text-black px-1 rounded">
                  {prestigeLevel}
                </span>
              )}
            </button>
          </nav>

          <div className="h-96 overflow-y-auto">
            {tab === "shop" && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Energy Generators</h3>
                  <div className="text-xs opacity-70">Buy: {buyQuantity}x</div>
                </div>
                <div className="space-y-2">
                  {generators.map((generator) => {
                    const quantity = buyQuantity;
                    let totalCost = 0;
                    for (let i = 0; i < quantity; i++) {
                      totalCost += nextCost(generator.baseCost, generator.qty + i);
                    }
                    const canAfford = currency >= totalCost;
                    
                    return (
                      <motion.button
                        key={generator.id}
                        onClick={() => buyGenerator(generator)}
                        disabled={!canAfford}
                        className={`w-full p-3 rounded-lg text-left transition ${
                          canAfford 
                            ? 'bg-white/10 hover:bg-white/20' 
                            : 'bg-white/5 opacity-50'
                        }`}
                        whileHover={canAfford ? { scale: 1.02 } : {}}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{generator.icon}</span>
                            <div>
                              <div className="font-semibold text-sm">{generator.name}</div>
                              <div className="text-xs opacity-70">Owned: {generator.qty}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {fmt(totalCost)} {THEME.currencyEmoji}
                            </div>
                            <div className="text-xs opacity-70">
                              {fmt(generator.cps * quantity)}/s each
                            </div>
                          </div>
                        </div>
                        <div className="text-xs opacity-60">{generator.description}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "upgrades" && (
              <div>
                <h3 className="font-semibold mb-3">Power Upgrades</h3>
                <div className="space-y-2">
                  {BASE_UPGRADES.filter(upgrade => !upgrades.some(u => u.id === upgrade.id)).map(upgrade => {
                    const canAfford = currency >= upgrade.cost;
                    
                    return (
                      <motion.button
                        key={upgrade.id}
                        onClick={() => buyUpgrade(upgrade)}
                        disabled={!canAfford}
                        className={`w-full p-3 rounded-lg text-left transition ${
                          canAfford 
                            ? 'bg-white/10 hover:bg-white/20' 
                            : 'bg-white/5 opacity-50'
                        }`}
                        whileHover={canAfford ? { scale: 1.02 } : {}}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{upgrade.icon}</span>
                            <div>
                              <div className="font-semibold text-sm">{upgrade.name}</div>
                              <div className="text-xs opacity-70">{upgrade.effect}</div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold">
                            {fmt(upgrade.cost)} {THEME.currencyEmoji}
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                  
                  {BASE_UPGRADES.every(upgrade => upgrades.some(u => u.id === upgrade.id)) && (
                    <div className="text-center py-8 opacity-60">
                      <Sparkles className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm">All upgrades purchased!</div>
                    </div>
                  )}
                </div>
                
                {upgrades.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <h4 className="font-semibold mb-2 text-sm">Owned Upgrades</h4>
                    <div className="grid grid-cols-3 gap-1">
                      {upgrades.map(upgrade => (
                        <div
                          key={upgrade.id}
                          className="text-center p-1 bg-white/10 rounded text-xs"
                          title={upgrade.name}
                        >
                          {upgrade.icon}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Continue with all other tabs */}

            {tab === "planets" && (
              <div>
                <h3 className="font-semibold mb-3">Planetary Exploration</h3>
                <div className="space-y-2">
                  {PLANETS.map(planet => {
                    const isExplored = explored.includes(planet.id);
                    const canAfford = currency >= planet.cost;
                    
                    return (
                      <motion.button
                        key={planet.id}
                        onClick={() => explorePlanet(planet)}
                        disabled={isExplored || !canAfford}
                        className={`w-full p-3 rounded-lg text-left transition ${
                          isExplored 
                            ? 'bg-green-600/20 border border-green-400/30' 
                            : canAfford 
                              ? 'bg-white/10 hover:bg-white/20' 
                              : 'bg-white/5 opacity-50'
                        }`}
                        whileHover={!isExplored && canAfford ? { scale: 1.02 } : {}}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{planet.icon}</span>
                            <div>
                              <div className="font-semibold text-sm">{planet.name}</div>
                              <div className="text-xs opacity-70">
                                +{(planet.bonus * 100).toFixed(0)}% production bonus
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            {isExplored ? (
                              <div className="text-green-400 text-sm">✓ Explored</div>
                            ) : (
                              <div className="text-sm font-semibold">
                                {fmt(planet.cost)} {THEME.currencyEmoji}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs opacity-60">{planet.description}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "achievements" && (
              <div>
                <h3 className="font-semibold mb-3">
                  Achievements ({achievements.length}/{BASE_ACHIEVEMENTS.length})
                </h3>
                <div className="space-y-2">
                  {BASE_ACHIEVEMENTS.map(achievement => {
                    const isUnlocked = achievements.includes(achievement.id);
                    
                    return (
                      <div
                        key={achievement.id}
                        className={`p-3 rounded-lg ${
                          isUnlocked 
                            ? 'bg-yellow-600/20 border border-yellow-400/30' 
                            : 'bg-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{achievement.icon}</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div className="font-semibold text-sm">{achievement.name}</div>
                              {isUnlocked && <div className="text-yellow-400 text-xs">✓</div>}
                            </div>
                            <div className="text-xs opacity-70 mb-1">{achievement.desc}</div>
                            <div className="text-xs text-green-400">
                              Reward: +{fmt(achievement.reward)} {THEME.currencyEmoji}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === "stats" && (
              <div>
                <h3 className="font-semibold mb-3">Game Statistics</h3>
                <div className="space-y-3 text-sm">
                  <div className={`p-3 rounded-lg ${THEME.glass}`}>
                    <h4 className="font-semibold mb-2">Session Stats</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Playtime:</span>
                        <span>{formatTime(Date.now() - stats.sessionStart)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Energy Earned:</span>
                        <span>{fmt(stats.sessionEarned)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Clicks:</span>
                        <span>{fmt(stats.sessionClicks)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${THEME.glass}`}>
                    <h4 className="font-semibold mb-2">All-Time Stats</h4>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Total Playtime:</span>
                        <span>{formatTime(Date.now() - stats.startTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Clicks:</span>
                        <span>{fmt(stats.totalClicks)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Earned:</span>
                        <span>{fmt(stats.totalEarned)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Spent:</span>
                        <span>{fmt(stats.totalSpent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Purchases Made:</span>
                        <span>{fmt(stats.totalPurchases)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current CPS:</span>
                        <span>{fmt(cpsTotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Click Power:</span>
                        <span>{fmt(clickPower)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {(achievements.length > 0 || explored.length > 0 || prestigeLevel > 0) && (
                    <div className={`p-3 rounded-lg ${THEME.glass}`}>
                      <h4 className="font-semibold mb-2">Progress</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Achievements:</span>
                          <span>{achievements.length}/{BASE_ACHIEVEMENTS.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Planets Explored:</span>
                          <span>{explored.length}/{PLANETS.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Upgrades Owned:</span>
                          <span>{upgrades.length}/{BASE_UPGRADES.length}</span>
                        </div>
                        {prestigeLevel > 0 && (
                          <div className="flex justify-between">
                            <span>Prestige Level:</span>
                            <span className="text-yellow-400">{prestigeLevel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "prestige" && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Prestige System
                </h3>
                
                <div className="space-y-4">
                  <div className={`p-3 rounded-lg ${THEME.glass}`}>
                    <h4 className="font-semibold mb-2">Current Status</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Prestige Level:</span>
                        <span className="text-yellow-400">{prestigeLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prestige Points:</span>
                        <span className="text-yellow-400">{fmt(prestigePoints)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Production Bonus:</span>
                        <span className="text-green-400">+{(prestigeLevel * 10)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Click Bonus:</span>
                        <span className="text-green-400">+{(prestigeLevel * 5)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${THEME.glass}`}>
                    <h4 className="font-semibold mb-2">Next Prestige</h4>
                    <div className="text-sm space-y-2">
                      {canPrestige() ? (
                        <>
                          <div className="text-green-400">✓ Ready to prestige!</div>
                          <div>Points to gain: {Math.floor(Math.pow(stats.totalEarned / 1000000, 0.5))}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-orange-400">
                            Need: {fmt(PRESTIGE_THRESHOLDS[Math.min(prestigeLevel, PRESTIGE_THRESHOLDS.length - 1)])} total earned
                          </div>
                          <div className="text-gray-400">
                            Current: {fmt(stats.totalEarned)}
                          </div>
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min(100, (stats.totalEarned / PRESTIGE_THRESHOLDS[Math.min(prestigeLevel, PRESTIGE_THRESHOLDS.length - 1)]) * 100)}%`
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-600/30`}>
                    <h4 className="font-semibold mb-2 text-yellow-400">About Prestige</h4>
                    <div className="text-xs opacity-80 space-y-1">
                      <p>• Resets most progress but grants permanent bonuses</p>
                      <p>• Keeps achievements and unlocks new content</p>
                      <p>• Each level gives +10% production, +5% click power</p>
                      <p>• Prestige points unlock powerful upgrades</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>
      
      {/* Footer */}
      <footer className="text-center py-4 text-xs opacity-60 border-t border-white/10">
        <div>Galactic Explorer v1.0 - Your journey among the stars awaits!</div>
        <div className="mt-1">
          Auto-save enabled • Save system active
        </div>
      </footer>
    </div>
  );
}
