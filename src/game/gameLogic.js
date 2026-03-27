import { CELL_SIZE, MONEY_TOWER_INTERVAL, MONEY_TOWER_AMOUNT } from './constants.js';

function applyArmor(damage, armor, armorPierce) {
  const effectiveArmor = Math.max(0, (armor || 0) - (armorPierce || 0));
  return Math.max(1, damage - effectiveArmor);
}

export function updateEnemies(enemies, dt) {
  const reached = [];
  const alive = [];
  const dotKills = [];
  const now = performance.now();

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;

    // Poison damage over time
    if (enemy.poisonUntil && enemy.poisonUntil > now && enemy.poisonDps) {
      enemy.hp -= applyArmor(enemy.poisonDps * dt, (enemy.armor || 0) * dt);
      if (enemy.hp <= 0) { dotKills.push(enemy); continue; }
    }

    // Burn damage over time (separate from poison)
    if (enemy.burnUntil && enemy.burnUntil > now && enemy.burnDps) {
      enemy.hp -= applyArmor(enemy.burnDps * dt, (enemy.armor || 0) * dt);
      if (enemy.hp <= 0) { dotKills.push(enemy); continue; }
    }

    let speed = enemy.baseSpeed;

    // Stun (speed = 0)
    if (enemy.stunUntil && enemy.stunUntil > now) {
      speed = 0;
    } else if (enemy.slowUntil > now) {
      speed *= enemy.currentSlowFactor || 0.4;
    }

    // (burn slow removed — burn no longer slows)

    enemy.speed = speed;

    const target = enemy.path[enemy.pathIndex + 1];
    if (!target) {
      reached.push(enemy);
      continue;
    }

    const tx = target.col + 0.5;
    const ty = target.row + 0.5;
    const dx = tx - enemy.x;
    const dy = ty - enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const move = speed * dt;

    if (move >= dist) {
      enemy.x = tx;
      enemy.y = ty;
      enemy.pathIndex++;
      if (enemy.pathIndex >= enemy.path.length - 1) {
        reached.push(enemy);
        continue;
      }
    } else {
      enemy.x += (dx / dist) * move;
      enemy.y += (dy / dist) * move;
    }

    alive.push(enemy);
  }

  return { alive, reached, dotKills };
}

// Compute aura buffs for a tower from nearby support towers
function getAuraBuffs(tower, allTowers) {
  let cooldownMult = 1;
  let damageMult = 1;

  for (const other of allTowers) {
    if (other.id === tower.id) continue;
    if (!other.auraRange || !other.auraCooldownBonus) continue;

    const dx = tower.col - other.col;
    const dy = tower.row - other.row;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= other.auraRange) {
      cooldownMult = Math.min(cooldownMult, other.auraCooldownBonus || 1);
      damageMult = Math.max(damageMult, other.auraDamageBonus || 1);
    }
  }

  return { cooldownMult, damageMult };
}

export function updateTowers(towers, enemies, projectiles, now, waveActive) {
  let goldEarned = 0;

  // DPS auras (zapper bottom path)
  for (const tower of towers) {
    if (tower.auraDps && tower.auraRange) {
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const dx = enemy.x - (tower.col + 0.5);
        const dy = enemy.y - (tower.row + 0.5);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= tower.auraRange) {
          enemy.hp -= tower.auraDps * (1 / 60); // approx per frame at 60fps
        }
      }
    }
  }

  for (const tower of towers) {
    // Money tower — only generates gold during active waves
    if (tower.typeId === 'money') {
      const interval = tower.moneyInterval || MONEY_TOWER_INTERVAL;
      const amount = tower.moneyAmount || MONEY_TOWER_AMOUNT;
      if (waveActive && now - tower.lastGold >= interval) {
        tower.lastGold = now;
        goldEarned += amount;
      }
      continue;
    }

    // Combat tower
    const aura = getAuraBuffs(tower, towers);
    const effectiveCooldown = tower.cooldown * aura.cooldownMult;

    if (now - tower.lastFired < effectiveCooldown) continue;

    const tcx = tower.col + 0.5;
    const tcy = tower.row + 0.5;

    // Find targets
    const targetsNeeded = tower.multiTarget || 1;
    const targets = [];

    if (tower.targetStrongest) {
      // Target strongest (highest HP) enemies
      const inRange = enemies
        .filter(e => {
          if (e.hp <= 0) return false;
          const dx = e.x - tcx;
          const dy = e.y - tcy;
          return Math.sqrt(dx * dx + dy * dy) <= tower.range;
        })
        .sort((a, b) => b.hp - a.hp);
      for (let i = 0; i < Math.min(targetsNeeded, inRange.length); i++) {
        targets.push(inRange[i]);
      }
    } else {
      // Target closest enemies
      const inRange = [];
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        const dx = enemy.x - tcx;
        const dy = enemy.y - tcy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d <= tower.range) {
          inRange.push({ enemy, dist: d });
        }
      }
      inRange.sort((a, b) => a.dist - b.dist);
      for (let i = 0; i < Math.min(targetsNeeded, inRange.length); i++) {
        targets.push(inRange[i].enemy);
      }
    }

    if (targets.length > 0) {
      tower.lastFired = now;
      for (const target of targets) {
        projectiles.push({
          x: tcx * CELL_SIZE,
          y: tcy * CELL_SIZE,
          targetId: target.id,
          tower,
          speed: tower.projectileSpeed || 6,
          color: tower.projectileColor || '#fff',
          auraDamageMult: aura.damageMult,
        });
      }
    }
  }

  return goldEarned;
}

export function updateProjectiles(projectiles, enemies, dt) {
  const alive = [];
  const kills = [];

  for (const proj of projectiles) {
    const target = enemies.find(e => e.id === proj.targetId && e.hp > 0);
    if (!target) continue;

    const tx = target.x * CELL_SIZE;
    const ty = target.y * CELL_SIZE;
    const dx = tx - proj.x;
    const dy = ty - proj.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const move = proj.speed * CELL_SIZE * dt;

    if (move >= dist) {
      // Evasion check (firefly)
      if (target.evasionChance && Math.random() < target.evasionChance) {
        // Dodged — projectile consumed, no damage
        continue;
      }

      // Hit!
      let damage = proj.tower.damage;

      // Aura damage bonus
      damage = Math.round(damage * (proj.auraDamageMult || 1));

      // Vulnerability mark bonus (sniper bottom path) — all towers deal more to marked targets
      if (target.markDamageBonus && target.markUntil > performance.now()) {
        damage = Math.round(damage * target.markDamageBonus);
      }

      // Shock bonus (zapper bottom path) — consume stored shock for extra damage
      if (target.shockBonus && target.shockBonus > 0) {
        damage += target.shockBonus;
        target.shockBonus = 0;
      }

      // Crit chance
      if (proj.tower.critChance && Math.random() < proj.tower.critChance) {
        damage = Math.round(damage * (proj.tower.critMultiplier || 2));
      }

      // Execute bonus (extra dmg to low HP enemies)
      if (proj.tower.executeDamageBonus && target.hp / target.maxHp < 0.3) {
        damage = Math.round(damage * proj.tower.executeDamageBonus);
      }

      // Ramp damage (laser focus)
      if (proj.tower.rampDamage) {
        if (proj.tower.lastTargetId === target.id) {
          proj.tower.rampCount = Math.min(
            (proj.tower.rampCount || 0) + proj.tower.rampDamage,
            proj.tower.rampMax || 100
          );
        } else {
          proj.tower.rampCount = 0;
          proj.tower.lastTargetId = target.id;
        }
        damage += proj.tower.rampCount;
      }

      // One-shot threshold (sniper T4)
      if (proj.tower.oneShotThreshold && target.hp <= proj.tower.oneShotThreshold) {
        target.hp = 0;
      } else {
        target.hp -= applyArmor(damage, target.armor, proj.tower.armorPierce);
      }

      // Slow effect
      if (proj.tower.slowFactor) {
        target.slowUntil = performance.now() + (proj.tower.slowDuration || 2000);
        target.currentSlowFactor = proj.tower.slowFactor;
      }

      // Stun effect (on primary target)
      if (proj.tower.stunChance && Math.random() < proj.tower.stunChance) {
        target.stunUntil = performance.now() + (proj.tower.stunDuration || 1000);
      }

      // Vulnerability mark (sniper bottom path)
      if (proj.tower.markDamageBonus) {
        target.markDamageBonus = proj.tower.markDamageBonus;
        target.markUntil = performance.now() + (proj.tower.markDuration || 3000);
      }

      // Knockback (fortress middle path)
      if (proj.tower.knockback && target.path) {
        const kb = proj.tower.knockback;
        target.pathIndex = Math.max(0, target.pathIndex - Math.round(kb));
        const dest = target.path[target.pathIndex];
        if (dest) {
          target.x = dest.col + 0.5;
          target.y = dest.row + 0.5;
        }
      }

      // Poison effect
      if (proj.tower.poisonDps) {
        target.poisonUntil = performance.now() + (proj.tower.poisonDuration || 3000);
        target.poisonDps = proj.tower.poisonDps;
      }

      // Burn effect
      if (proj.tower.burnDps) {
        target.burnUntil = performance.now() + (proj.tower.burnDuration || 2000);
        target.burnDps = proj.tower.burnDps;
        target.burnSpread = proj.tower.burnSpread || false;
      }

      // Brittle mark
      if (proj.tower.brittleBonus) {
        target.brittleBonus = proj.tower.brittleBonus;
        target.brittleUntil = performance.now() + (proj.tower.slowDuration || 3000);
      }

      // Splash damage
      if (proj.tower.splashRadius) {
        const splashRatio = proj.tower.splashDamageRatio ?? 0.6;
        for (const enemy of enemies) {
          if (enemy.id === target.id || enemy.hp <= 0) continue;
          const sdx = enemy.x - target.x;
          const sdy = enemy.y - target.y;
          const sd = Math.sqrt(sdx * sdx + sdy * sdy);
          if (sd <= proj.tower.splashRadius) {
            let splashDmg = Math.round(damage * splashRatio);
            // Brittle bonus on splash targets
            if (enemy.brittleBonus && enemy.brittleUntil > performance.now()) {
              splashDmg += enemy.brittleBonus;
            }
            // Shock bonus on splash targets
            if (enemy.shockBonus && enemy.shockBonus > 0) {
              splashDmg += enemy.shockBonus;
              enemy.shockBonus = 0;
            }
            enemy.hp -= applyArmor(splashDmg, enemy.armor, proj.tower.armorPierce);
            // Propagate slow to splashed enemies
            if (proj.tower.slowFactor) {
              enemy.slowUntil = performance.now() + (proj.tower.slowDuration || 2000);
              enemy.currentSlowFactor = proj.tower.slowFactor;
            }
            // Propagate poison to splashed enemies
            if (proj.tower.poisonDps) {
              enemy.poisonUntil = performance.now() + (proj.tower.poisonDuration || 3000);
              enemy.poisonDps = proj.tower.poisonDps;
            }
            // Propagate burn to splashed enemies
            if (proj.tower.burnDps) {
              enemy.burnUntil = performance.now() + (proj.tower.burnDuration || 2000);
              enemy.burnDps = proj.tower.burnDps;
              target.burnSpread = proj.tower.burnSpread || false;
            }
            // Knockback on splash targets
            if (proj.tower.knockback && enemy.path) {
              const kb = proj.tower.knockback * 0.5; // half knockback on splash
              enemy.pathIndex = Math.max(0, enemy.pathIndex - Math.round(kb));
              const dest = enemy.path[enemy.pathIndex];
              if (dest) {
                enemy.x = dest.col + 0.5;
                enemy.y = dest.row + 0.5;
              }
            }
            // Stun on splash
            if (proj.tower.stunChance && Math.random() < proj.tower.stunChance) {
              enemy.stunUntil = performance.now() + (proj.tower.stunDuration || 1000);
            }
            if (enemy.hp <= 0) kills.push(enemy);
          }
        }
      }

      // Chain lightning
      if (proj.tower.chainCount) {
        let chainSource = target;
        let chainDamage = damage;
        const hitSet = new Set([target.id]);

        for (let i = 0; i < proj.tower.chainCount; i++) {
          chainDamage *= (proj.tower.chainDecay || 0.7);
          let nextTarget = null;
          let nextDist = Infinity;
          const chainRange = proj.tower.chainRange || 2;

          for (const enemy of enemies) {
            if (enemy.hp <= 0 || hitSet.has(enemy.id)) continue;
            const cdx = enemy.x - chainSource.x;
            const cdy = enemy.y - chainSource.y;
            const cd = Math.sqrt(cdx * cdx + cdy * cdy);
            if (cd <= chainRange && cd < nextDist) {
              nextTarget = enemy;
              nextDist = cd;
            }
          }

          if (!nextTarget) break;
          let finalChainDmg = Math.round(chainDamage);
          // Brittle bonus on chain targets
          if (nextTarget.brittleBonus && nextTarget.brittleUntil > performance.now()) {
            finalChainDmg += nextTarget.brittleBonus;
          }
          // Shock bonus on chain targets
          if (nextTarget.shockBonus && nextTarget.shockBonus > 0) {
            finalChainDmg += nextTarget.shockBonus;
            nextTarget.shockBonus = 0;
          }
          nextTarget.hp -= applyArmor(finalChainDmg, nextTarget.armor, proj.tower.armorPierce);
          hitSet.add(nextTarget.id);

          // Chain shock (zapper bottom path) — apply shock to chained enemies
          if (proj.tower.chainShockBonus) {
            nextTarget.shockBonus = proj.tower.chainShockBonus;
          }

          // Chain armor shred (tesla bottom path) — permanently reduce armor
          if (proj.tower.chainArmorShred) {
            nextTarget.armor = Math.max(0, nextTarget.armor - proj.tower.chainArmorShred);
          }

          // Chain stun
          if (proj.tower.stunChance && Math.random() < proj.tower.stunChance) {
            nextTarget.stunUntil = performance.now() + (proj.tower.stunDuration || 1000);
          }

          // Add a visual chain arc
          projectiles.push({
            x: chainSource.x * CELL_SIZE,
            y: chainSource.y * CELL_SIZE,
            targetId: nextTarget.id,
            tower: { ...proj.tower, chainCount: 0, damage: 0 },
            speed: 20,
            color: proj.tower.accent || '#cc88ff',
            isChainArc: true,
          });

          if (nextTarget.hp <= 0) kills.push(nextTarget);
          chainSource = nextTarget;
        }
      }

      // Apply brittle bonus to primary target damage (after initial hit calc)
      if (target.brittleBonus && target.brittleUntil > performance.now() && !proj.tower.brittleBonus) {
        target.hp -= target.brittleBonus;
      }

      if (target.hp <= 0) {
        kills.push(target);
      }
    } else {
      proj.x += (dx / dist) * move;
      proj.y += (dy / dist) * move;
      alive.push(proj);
    }
  }

  return { alive, kills };
}

const ENEMY_COLORS = {
  ant: '#884422',
  beetle: '#336633',
  spider: '#444444',
  firefly: '#ccaa00',
  brood_spider: '#553344',
  spiderling: '#999988',
  centipede: '#995522',
};

export function spawnDeathParticles(particles, x, y, typeId) {
  const color = ENEMY_COLORS[typeId] || '#884422';
  const count = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 30 + Math.random() * 60;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.3,
      maxLife: 0.7,
      color,
      size: 1.5 + Math.random() * 2,
    });
  }
  // Cap particles to prevent performance issues
  if (particles.length > 150) {
    particles.splice(0, particles.length - 150);
  }
}

export function updateParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 80 * dt; // gravity
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
