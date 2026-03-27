import { TOWER_TYPES } from "./towers.js";

// Each tower has 3 paths (top/middle/bottom), each with 4 tiers.
// Each tier's `effects` are absolute stat overrides applied on top of the base tower definition.
// Only the highest purchased tier per path is applied.

export const TOWER_UPGRADES = {
  // ─── SHOOTER ───
  shooter: {
    top: [
      {
        name: "Sharp Rounds",
        desc: "+20 dmg",
        cost: 75,
        effects: { damage: 35 },
      },
      {
        name: "Piercing Tips",
        desc: "+25 dmg, pierces armor",
        cost: 180,
        effects: { damage: 45, armorPierce: 5 },
      },
      {
        name: "Depleted Uranium",
        desc: "Huge dmg, shreds armor",
        cost: 500,
        effects: { damage: 95, armorPierce: 12 },
      },
      {
        name: "Railgun Wombat",
        desc: "Devastating shots",
        cost: 1400,
        effects: { damage: 180, armorPierce: 25, projectileSpeed: 20 },
      },
    ],
    middle: [
      {
        name: "Quick Paws",
        desc: "Faster attacks",
        cost: 60,
        effects: { cooldown: 650 },
      },
      {
        name: "Double Tap",
        desc: "Much faster",
        cost: 150,
        effects: { cooldown: 500 },
      },
      {
        name: "Lead Storm",
        desc: "Rapid fire",
        cost: 450,
        effects: { cooldown: 300 },
      },
      {
        name: "Bullet Hose",
        desc: "Extreme fire rate",
        cost: 1200,
        effects: { cooldown: 150 },
      },
    ],
    bottom: [
      {
        name: "Eagle Eyes",
        desc: "+0.5 range",
        cost: 50,
        effects: { range: 3.5 },
      },
      {
        name: "Steady Aim",
        desc: "15% crit chance",
        cost: 120,
        effects: { range: 4, critChance: 0.15, critMultiplier: 2.0 },
      },
      {
        name: "Marksman",
        desc: "25% crit, 2.5x dmg",
        cost: 400,
        effects: { range: 5, critChance: 0.25, critMultiplier: 2.5 },
      },
      {
        name: "Deadshot",
        desc: "35% crit, 3.5x dmg",
        cost: 1100,
        effects: { range: 6.5, critChance: 0.35, critMultiplier: 3.5 },
      },
    ],
  },

  // ─── FREEZER ───
  slow: {
    top: [
      {
        name: "Colder Winds",
        desc: "Stronger slow",
        cost: 80,
        effects: { slowFactor: 0.3 },
      },
      {
        name: "Permafrost",
        desc: "Much stronger slow",
        cost: 200,
        effects: { slowFactor: 0.2, slowDuration: 3000 },
      },
      {
        name: "Flash Freeze",
        desc: "20% chance to stun",
        cost: 550,
        effects: {
          slowFactor: 0.1,
          slowDuration: 3500,
          stunChance: 0.2,
          stunDuration: 1000,
        },
      },
      {
        name: "Absolute Zero",
        desc: "40% stun chance",
        cost: 1500,
        effects: {
          slowFactor: 0.05,
          slowDuration: 4000,
          stunChance: 0.4,
          stunDuration: 2000,
        },
      },
    ],
    middle: [
      {
        name: "Cold Snap",
        desc: "More dmg, faster",
        cost: 70,
        effects: { damage: 10, cooldown: 1000 },
      },
      {
        name: "Frost Nova",
        desc: "AOE frost burst",
        cost: 175,
        effects: { damage: 18, splashRadius: 1.5, cooldown: 1000 },
      },
      {
        name: "Blizzard",
        desc: "Large AOE blizzard",
        cost: 500,
        effects: { damage: 30, splashRadius: 2.0, cooldown: 800 },
      },
      {
        name: "Ice Age",
        desc: "Massive frost storm",
        cost: 1400,
        effects: {
          damage: 50,
          splashRadius: 3.0,
          cooldown: 600,
          slowDuration: 4000,
        },
      },
    ],
    bottom: [
      { name: "Icy Touch", desc: "More dmg", cost: 60, effects: { damage: 8 } },
      {
        name: "Frostbite",
        desc: "Enemies take +8 from all",
        cost: 150,
        effects: { damage: 12, brittleBonus: 8 },
      },
      {
        name: "Shatter Mark",
        desc: "+15 bonus dmg to marked",
        cost: 450,
        effects: { damage: 18, brittleBonus: 15, slowDuration: 3000 },
      },
      {
        name: "Cryo Catalyst",
        desc: "+25 bonus dmg, +range",
        cost: 1300,
        effects: { damage: 25, brittleBonus: 25, range: 3.5 },
      },
    ],
  },

  // ─── SPLASH ───
  splash: {
    top: [
      {
        name: "Bigger Shells",
        desc: "More dmg & radius",
        cost: 100,
        effects: { damage: 40, splashRadius: 1.8 },
      },
      {
        name: "Heavy Ordnance",
        desc: "Even bigger booms",
        cost: 250,
        effects: { damage: 55, splashRadius: 2.2 },
      },
      {
        name: "Cluster Bombs",
        desc: "Huge AOE, 80% splash",
        cost: 700,
        effects: { damage: 80, splashRadius: 2.8, splashDamageRatio: 0.8 },
      },
      {
        name: "Carpet Bomber",
        desc: "Full splash dmg",
        cost: 2000,
        effects: {
          damage: 120,
          splashRadius: 3.5,
          splashDamageRatio: 1.0,
          cooldown: 1200,
        },
      },
    ],
    middle: [
      {
        name: "Quick Fuse",
        desc: "Faster reload",
        cost: 90,
        effects: { cooldown: 1200 },
      },
      {
        name: "Auto Loader",
        desc: "Much faster",
        cost: 220,
        effects: { cooldown: 900 },
      },
      {
        name: "Mortar Battery",
        desc: "Rapid fire, +range",
        cost: 650,
        effects: { cooldown: 600, range: 3.0 },
      },
      {
        name: "Artillery Storm",
        desc: "Extreme fire rate",
        cost: 1800,
        effects: { cooldown: 350, range: 3.5 },
      },
    ],
    bottom: [
      {
        name: "Heated Shells",
        desc: "Burn: 5 dps/2s",
        cost: 80,
        effects: { burnDps: 5, burnDuration: 2000 },
      },
      {
        name: "Napalm Rounds",
        desc: "Burn: 10 dps/3s",
        cost: 200,
        effects: { burnDps: 10, burnDuration: 3000 },
      },
      {
        name: "Scorched Earth",
        desc: "Burn: 18 dps/4s, AOE",
        cost: 600,
        effects: { burnDps: 18, burnDuration: 4000 },
      },
      {
        name: "Hellfire",
        desc: "Burn: 30 dps/5s, spreads",
        cost: 1700,
        effects: { burnDps: 30, burnDuration: 5000, burnSpread: true },
      },
    ],
  },

  // ─── SNIPER ───
  sniper: {
    top: [
      {
        name: "Full Metal Jacket",
        desc: "+30 dmg, pierces",
        cost: 120,
        effects: { damage: 110, armorPierce: 8 },
      },
      {
        name: "Hollow Point",
        desc: "Massive dmg",
        cost: 300,
        effects: { damage: 160, armorPierce: 15 },
      },
      {
        name: "Elephant Gun",
        desc: "Huge dmg, shreds",
        cost: 850,
        effects: { damage: 280, armorPierce: 30 },
      },
      {
        name: "BFG Wombat",
        desc: "Oneshot <800hp",
        cost: 2500,
        effects: { damage: 500, armorPierce: 999, oneShotThreshold: 800 },
      },
    ],
    middle: [
      {
        name: "Fast Hands",
        desc: "Faster reload",
        cost: 100,
        effects: { cooldown: 2000 },
      },
      {
        name: "Semi Auto",
        desc: "Much faster",
        cost: 250,
        effects: { cooldown: 1500 },
      },
      {
        name: "Marksman Rifle",
        desc: "Rapid + range",
        cost: 700,
        effects: { cooldown: 1000, range: 7 },
      },
      {
        name: "Elite Sniper",
        desc: "Targets strongest",
        cost: 2200,
        effects: { cooldown: 600, range: 8, targetStrongest: true },
      },
    ],
    bottom: [
      {
        name: "Spotter Rounds",
        desc: "Marks: +10% dmg taken",
        cost: 90,
        effects: { markDamageBonus: 1.1, markDuration: 3000 },
      },
      {
        name: "Expose Weakness",
        desc: "Mark: +20% dmg taken",
        cost: 200,
        effects: { markDamageBonus: 1.2, markDuration: 4000 },
      },
      {
        name: "Hunter's Mark",
        desc: "Mark: +30% dmg taken",
        cost: 600,
        effects: { markDamageBonus: 1.3, markDuration: 5000 },
      },
      {
        name: "Executioner",
        desc: "+30% mark, 3x <30% hp",
        cost: 1800,
        effects: {
          markDamageBonus: 1.3,
          markDuration: 5000,
          executeDamageBonus: 3.0,
        },
      },
    ],
  },

  // ─── ZAPPER ───
  chain: {
    top: [
      {
        name: "Extra Arc",
        desc: "+1 chain, less decay",
        cost: 100,
        effects: { chainCount: 4, chainDecay: 0.7 },
      },
      {
        name: "Conductor",
        desc: "5 chains",
        cost: 250,
        effects: { chainCount: 5, chainDecay: 0.75 },
      },
      {
        name: "Lightning Rod",
        desc: "7 chains, far reach",
        cost: 700,
        effects: { chainCount: 7, chainDecay: 0.8, chainRange: 3.0 },
      },
      {
        name: "Storm Lord",
        desc: "10 chains, huge dmg",
        cost: 2000,
        effects: {
          chainCount: 10,
          chainDecay: 0.85,
          chainRange: 4.0,
          damage: 50,
        },
      },
    ],
    middle: [
      {
        name: "High Voltage",
        desc: "+10 dmg",
        cost: 90,
        effects: { damage: 40 },
      },
      {
        name: "Surge",
        desc: "More dmg, faster",
        cost: 225,
        effects: { damage: 55, cooldown: 750 },
      },
      {
        name: "Megavolt",
        desc: "Heavy hits, fast",
        cost: 650,
        effects: { damage: 90, cooldown: 600 },
      },
      {
        name: "Gigawatt",
        desc: "Extreme voltage",
        cost: 1900,
        effects: { damage: 140, cooldown: 400, range: 3.5 },
      },
    ],
    bottom: [
      {
        name: "Static Charge",
        desc: "Chains shock: +8 next hit",
        cost: 80,
        effects: { chainShockBonus: 8 },
      },
      {
        name: "EMP Pulse",
        desc: "Shock: +15 next hit",
        cost: 200,
        effects: { chainShockBonus: 15 },
      },
      {
        name: "Disruption Field",
        desc: "Shock +20, dmg aura",
        cost: 600,
        effects: { chainShockBonus: 20, auraDps: 5, auraRange: 2.0 },
      },
      {
        name: "Tesla Dome",
        desc: "Shock +30, massive aura",
        cost: 1800,
        effects: { chainShockBonus: 30, auraDps: 15, auraRange: 3.0 },
      },
    ],
  },

  // ─── TOXIC ───
  poison: {
    top: [
      {
        name: "Potent Venom",
        desc: "Stronger poison",
        cost: 80,
        effects: { poisonDps: 15, poisonDuration: 3500 },
      },
      {
        name: "Corrosive Acid",
        desc: "25 dps/4s",
        cost: 200,
        effects: { poisonDps: 25, poisonDuration: 4000 },
      },
      {
        name: "Necrosis",
        desc: "50 dps, strips armor",
        cost: 550,
        effects: { poisonDps: 50, poisonDuration: 5000, armorPierce: 5 },
      },
      {
        name: "Plague Bearer",
        desc: "80 dps, spreads",
        cost: 1600,
        effects: { poisonDps: 80, poisonDuration: 6000, armorPierce: 15 },
      },
    ],
    middle: [
      {
        name: "Quick Spit",
        desc: "Faster, more dmg",
        cost: 70,
        effects: { cooldown: 700, damage: 12 },
      },
      {
        name: "Toxic Barrage",
        desc: "Rapid fire",
        cost: 175,
        effects: { cooldown: 500, damage: 18 },
      },
      {
        name: "Venom Spray",
        desc: "Very fast, +range",
        cost: 500,
        effects: { cooldown: 350, damage: 25, range: 3.0 },
      },
      {
        name: "Hydra Spit",
        desc: "Hits 3 targets",
        cost: 1500,
        effects: { cooldown: 200, damage: 15, multiTarget: 3 },
      },
    ],
    bottom: [
      {
        name: "Gas Leak",
        desc: "Small poison splash",
        cost: 75,
        effects: { splashRadius: 1.0 },
      },
      {
        name: "Toxic Mist",
        desc: "Bigger splash",
        cost: 185,
        effects: { splashRadius: 1.5, poisonDps: 12 },
      },
      {
        name: "Miasma",
        desc: "Large toxic cloud",
        cost: 525,
        effects: { splashRadius: 2.0, poisonDps: 15, poisonDuration: 4000 },
      },
      {
        name: "Death Cloud",
        desc: "Massive poison zone",
        cost: 1500,
        effects: { splashRadius: 3.0, poisonDps: 20, poisonDuration: 5000 },
      },
    ],
  },

  // ─── MINER ───
  money: {
    top: [
      {
        name: "Better Pickaxe",
        desc: "+4g per tick",
        cost: 75,
        effects: { moneyAmount: 12 },
      },
      {
        name: "Gold Vein",
        desc: "+10g per tick",
        cost: 200,
        effects: { moneyAmount: 18 },
      },
      {
        name: "Motherlode",
        desc: "+22g per tick",
        cost: 750,
        effects: { moneyAmount: 30 },
      },
      {
        name: "El Dorado",
        desc: "+42g per tick",
        cost: 2200,
        effects: { moneyAmount: 50 },
      },
    ],
    middle: [
      {
        name: "Faster Digging",
        desc: "Every 3s",
        cost: 60,
        effects: { moneyInterval: 3000 },
      },
      {
        name: "Power Tools",
        desc: "Every 2.5s",
        cost: 175,
        effects: { moneyInterval: 2500 },
      },
      {
        name: "Drilling Rig",
        desc: "Every 2s",
        cost: 650,
        effects: { moneyInterval: 2000 },
      },
      {
        name: "Strip Mine",
        desc: "Every 1.2s",
        cost: 1800,
        effects: { moneyInterval: 1200 },
      },
    ],
    bottom: [
      {
        name: "Shared Lunch",
        desc: "10% speed to nearby",
        cost: 90,
        effects: { auraRange: 2.0, auraCooldownBonus: 0.9 },
      },
      {
        name: "Wombat Morale",
        desc: "15% speed, +5% dmg",
        cost: 250,
        effects: {
          auraRange: 2.5,
          auraCooldownBonus: 0.85,
          auraDamageBonus: 1.05,
        },
      },
      {
        name: "War Drums",
        desc: "25% speed, +15% dmg",
        cost: 700,
        effects: {
          auraRange: 3.0,
          auraCooldownBonus: 0.75,
          auraDamageBonus: 1.15,
        },
      },
      {
        name: "Command Post",
        desc: "35% speed, +25% dmg",
        cost: 2000,
        effects: {
          auraRange: 4.0,
          auraCooldownBonus: 0.65,
          auraDamageBonus: 1.25,
        },
      },
    ],
  },

  // ─── AQUA ───
  water: {
    top: [
      {
        name: "High Tide",
        desc: "More dmg & splash",
        cost: 85,
        effects: { damage: 25, splashRadius: 1.8 },
      },
      {
        name: "Riptide",
        desc: "Big waves",
        cost: 210,
        effects: { damage: 38, splashRadius: 2.2 },
      },
      {
        name: "Tsunami",
        desc: "Huge tidal wave",
        cost: 600,
        effects: { damage: 60, splashRadius: 2.8, cooldown: 1000 },
      },
      {
        name: "Maelstrom",
        desc: "Devastating waves",
        cost: 1700,
        effects: { damage: 90, splashRadius: 3.5, cooldown: 800 },
      },
    ],
    middle: [
      {
        name: "Undercurrent",
        desc: "Stronger slow",
        cost: 75,
        effects: { slowFactor: 0.3, slowDuration: 3000 },
      },
      {
        name: "Whirlpool",
        desc: "Heavy slow",
        cost: 190,
        effects: { slowFactor: 0.2, slowDuration: 3500 },
      },
      {
        name: "Vortex",
        desc: "Near-freeze slow",
        cost: 550,
        effects: { slowFactor: 0.15, slowDuration: 4000 },
      },
      {
        name: "Charybdis",
        desc: "Almost stops enemies",
        cost: 1600,
        effects: { slowFactor: 0.1, slowDuration: 5000, range: 4.5 },
      },
    ],
    bottom: [
      {
        name: "Extended Reef",
        desc: "+range",
        cost: 65,
        effects: { range: 4.0 },
      },
      {
        name: "Coral Barrier",
        desc: "More range, faster",
        cost: 170,
        effects: { range: 4.5, cooldown: 1100 },
      },
      {
        name: "Living Reef",
        desc: "Long range attacks",
        cost: 500,
        effects: { range: 5.0, cooldown: 900 },
      },
      {
        name: "Ocean Guardian",
        desc: "Extreme range sniper",
        cost: 1500,
        effects: { range: 6.0, cooldown: 700, damage: 30 },
      },
    ],
  },

  // ─── LASER ───
  laser: {
    top: [
      {
        name: "Focused Lens",
        desc: "More dmg",
        cost: 200,
        effects: { damage: 65 },
      },
      {
        name: "Concentrated Beam",
        desc: "Ramps on target",
        cost: 450,
        effects: { damage: 85, rampDamage: 5, rampMax: 65 },
      },
      {
        name: "Plasma Cutter",
        desc: "Heavy ramp dmg",
        cost: 1200,
        effects: { damage: 110, rampDamage: 10, rampMax: 130 },
      },
      {
        name: "Death Ray",
        desc: "Melts everything",
        cost: 3500,
        effects: { damage: 150, rampDamage: 20, rampMax: 300, armorPierce: 20 },
      },
    ],
    middle: [
      {
        name: "Wide Beam",
        desc: "Small splash",
        cost: 175,
        effects: { splashRadius: 0.8 },
      },
      {
        name: "Diffusion",
        desc: "Wider splash",
        cost: 400,
        effects: { splashRadius: 1.2 },
      },
      {
        name: "Prismatic",
        desc: "Multi-target laser",
        cost: 1100,
        effects: { splashRadius: 1.8, multiTarget: 2 },
      },
      {
        name: "Supernova",
        desc: "Hits everything",
        cost: 3200,
        effects: { splashRadius: 2.5, multiTarget: 3, cooldown: 350 },
      },
    ],
    bottom: [
      {
        name: "Quick Pulse",
        desc: "Faster fire",
        cost: 150,
        effects: { cooldown: 320 },
      },
      {
        name: "Rapid Laser",
        desc: "Even faster, +range",
        cost: 375,
        effects: { cooldown: 250, range: 4.5 },
      },
      {
        name: "Gatling Laser",
        desc: "Extreme speed",
        cost: 1000,
        effects: { cooldown: 180, range: 5.0 },
      },
      {
        name: "Hyperbeam",
        desc: "Insane fire rate",
        cost: 3000,
        effects: { cooldown: 100, range: 5.5 },
      },
    ],
  },

  // ─── FORTRESS ───
  fortress: {
    top: [
      {
        name: "Reinforced Shells",
        desc: "More dmg & radius",
        cost: 275,
        effects: { damage: 80, splashRadius: 2.3 },
      },
      {
        name: "Siege Rounds",
        desc: "Heavy bombardment",
        cost: 600,
        effects: { damage: 110, splashRadius: 2.8 },
      },
      {
        name: "Bombard",
        desc: "Massive AOE, 85% splash",
        cost: 1500,
        effects: { damage: 160, splashRadius: 3.5, splashDamageRatio: 0.85 },
      },
      {
        name: "War Machine",
        desc: "Full splash dmg",
        cost: 4000,
        effects: {
          damage: 250,
          splashRadius: 4.0,
          splashDamageRatio: 1.0,
          cooldown: 900,
        },
      },
    ],
    middle: [
      {
        name: "Heavy Impact",
        desc: "Knockback 0.3 cells",
        cost: 250,
        effects: { knockback: 0.2 },
      },
      {
        name: "Concussive Blast",
        desc: "KB 0.5, 15% stun",
        cost: 550,
        effects: { knockback: 0.4, stunChance: 0.12, stunDuration: 600 },
      },
      {
        name: "Earthquake",
        desc: "KB 0.8, 25% stun",
        cost: 1400,
        effects: { knockback: 0.5, stunChance: 0.2, stunDuration: 800 },
      },
      {
        name: "Titan's Fist",
        desc: "KB 1.2, 40% stun",
        cost: 3800,
        effects: {
          knockback: 0.8,
          stunChance: 0.3,
          stunDuration: 1500,
          range: 3.2,
        },
      },
    ],
    bottom: [
      {
        name: "Watchtower",
        desc: "+range",
        cost: 225,
        effects: { range: 3.5 },
      },
      {
        name: "Garrison",
        desc: "More range, faster",
        cost: 500,
        effects: { range: 4.0, cooldown: 1000 },
      },
      {
        name: "Citadel",
        desc: "Long range fortress",
        cost: 1300,
        effects: { range: 4.5, cooldown: 800 },
      },
      {
        name: "Unbreakable",
        desc: "Extreme range & speed",
        cost: 3500,
        effects: { range: 5.0, cooldown: 600 },
      },
    ],
  },

  // ─── TESLA ───
  tesla: {
    top: [
      {
        name: "Overload",
        desc: "More dmg & chains",
        cost: 325,
        effects: { damage: 50, chainCount: 6 },
      },
      {
        name: "Arc Amplifier",
        desc: "8 chains, less decay",
        cost: 700,
        effects: { damage: 70, chainCount: 8, chainDecay: 0.85 },
      },
      {
        name: "Ball Lightning",
        desc: "10 chains, far reach",
        cost: 1800,
        effects: {
          damage: 100,
          chainCount: 10,
          chainDecay: 0.9,
          chainRange: 3.5,
        },
      },
      {
        name: "Thor's Hammer",
        desc: "15 chains!",
        cost: 5000,
        effects: {
          damage: 150,
          chainCount: 15,
          chainDecay: 0.92,
          chainRange: 4.5,
        },
      },
    ],
    middle: [
      {
        name: "Capacitor",
        desc: "Faster discharge",
        cost: 300,
        effects: { cooldown: 480 },
      },
      {
        name: "Fast Discharge",
        desc: "Rapid fire",
        cost: 650,
        effects: { cooldown: 350 },
      },
      {
        name: "Superconductor",
        desc: "Very fast, +range",
        cost: 1600,
        effects: { cooldown: 250, range: 4.0 },
      },
      {
        name: "Infinite Energy",
        desc: "Extreme speed",
        cost: 4500,
        effects: { cooldown: 150, range: 4.5 },
      },
    ],
    bottom: [
      {
        name: "Magnetic Pulse",
        desc: "Chains shred -3 armor",
        cost: 275,
        effects: { chainArmorShred: 3 },
      },
      {
        name: "EMP Blast",
        desc: "Shred -5, pierce 8",
        cost: 625,
        effects: { chainArmorShred: 5, armorPierce: 8 },
      },
      {
        name: "Ion Storm",
        desc: "Shred -8, 15% stun",
        cost: 1500,
        effects: {
          chainArmorShred: 8,
          armorPierce: 15,
          stunChance: 0.15,
          stunDuration: 1000,
        },
      },
      {
        name: "Singularity",
        desc: "Shred -12, 30% stun",
        cost: 4200,
        effects: {
          chainArmorShred: 12,
          armorPierce: 25,
          stunChance: 0.3,
          stunDuration: 1500,
        },
      },
    ],
  },
};

const PATH_KEYS = ["top", "middle", "bottom"];

export function canUpgradePath(tower, pathIndex) {
  const levels = tower.upgrades;
  const targetLevel = levels[pathIndex] + 1;

  if (targetLevel > 4) return false;

  // Count how many paths have any upgrades
  const upgradedPaths = levels.filter((l) => l > 0).length;

  // If this path is at 0, we'd be adding a new (third) path
  if (levels[pathIndex] === 0 && upgradedPaths >= 2) return false;

  // Only 1 path can go past level 2
  if (targetLevel > 2) {
    const hasOtherAbove2 = levels.some((l, i) => i !== pathIndex && l > 2);
    if (hasOtherAbove2) return false;
  }

  return true;
}

export function getUpgradeCost(tower, pathIndex) {
  const upgradeDef = TOWER_UPGRADES[tower.typeId];
  if (!upgradeDef) return Infinity;
  const level = tower.upgrades[pathIndex];
  if (level >= 4) return Infinity;
  const path = upgradeDef[PATH_KEYS[pathIndex]];
  return path[level].cost;
}

export function getUpgradeTier(tower, pathIndex) {
  const upgradeDef = TOWER_UPGRADES[tower.typeId];
  if (!upgradeDef) return null;
  const level = tower.upgrades[pathIndex];
  if (level >= 4) return null;
  const path = upgradeDef[PATH_KEYS[pathIndex]];
  return path[level];
}

export function applyUpgrades(tower) {
  const base = TOWER_TYPES[tower.typeId];
  const upgradeDef = TOWER_UPGRADES[tower.typeId];
  if (!upgradeDef) return;

  // Save instance-specific fields
  const saved = {
    id: tower.id,
    col: tower.col,
    row: tower.row,
    lastFired: tower.lastFired,
    lastGold: tower.lastGold,
    upgrades: tower.upgrades,
    totalSpent: tower.totalSpent,
    typeId: tower.typeId,
    lastTargetId: tower.lastTargetId,
    rampCount: tower.rampCount,
  };

  // Reset to base stats
  // Remove old upgrade-only keys first
  for (const key of Object.keys(tower)) {
    if (!(key in base) && !(key in saved)) {
      delete tower[key];
    }
  }
  Object.assign(tower, base);
  Object.assign(tower, saved);

  // Apply each path's highest tier effects
  for (let p = 0; p < 3; p++) {
    const level = tower.upgrades[p];
    if (level === 0) continue;
    const pathDef = upgradeDef[PATH_KEYS[p]];
    Object.assign(tower, pathDef[level - 1].effects);
  }
}
