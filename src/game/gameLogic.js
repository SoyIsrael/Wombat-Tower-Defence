import { CELL_SIZE, MONEY_TOWER_INTERVAL, MONEY_TOWER_AMOUNT } from './constants.js';

function applyArmor(damage, armor) {
  return Math.max(1, damage - (armor || 0));
}

export function updateEnemies(enemies, dt) {
  const reached = [];
  const alive = [];
  const now = performance.now();

  for (const enemy of enemies) {
    if (enemy.hp <= 0) continue;

    // Poison damage over time
    if (enemy.poisonUntil && enemy.poisonUntil > now && enemy.poisonDps) {
      enemy.hp -= applyArmor(enemy.poisonDps * dt, (enemy.armor || 0) * dt);
      if (enemy.hp <= 0) {
        // Don't add to alive, will be cleaned up as a kill
        continue;
      }
    }

    let speed = enemy.baseSpeed;
    if (enemy.slowUntil > now) {
      speed *= 0.4;
    }
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

  return { alive, reached };
}

export function updateTowers(towers, enemies, projectiles, now) {
  let goldEarned = 0;

  for (const tower of towers) {
    // Money tower
    if (tower.typeId === 'money') {
      if (now - tower.lastGold >= MONEY_TOWER_INTERVAL) {
        tower.lastGold = now;
        goldEarned += MONEY_TOWER_AMOUNT;
      }
      continue;
    }

    // Combat tower
    if (now - tower.lastFired < tower.cooldown) continue;

    const tcx = tower.col + 0.5;
    const tcy = tower.row + 0.5;

    let closest = null;
    let closestDist = Infinity;

    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      const dx = enemy.x - tcx;
      const dy = enemy.y - tcy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= tower.range && d < closestDist) {
        closest = enemy;
        closestDist = d;
      }
    }

    if (closest) {
      tower.lastFired = now;
      projectiles.push({
        x: tcx * CELL_SIZE,
        y: tcy * CELL_SIZE,
        targetId: closest.id,
        tower,
        speed: tower.projectileSpeed || 6,
        color: tower.projectileColor || '#fff',
      });
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
      // Hit!
      target.hp -= applyArmor(proj.tower.damage, target.armor);

      // Slow effect
      if (proj.tower.slowFactor) {
        target.slowUntil = performance.now() + (proj.tower.slowDuration || 2000);
      }

      // Poison effect
      if (proj.tower.poisonDps) {
        target.poisonUntil = performance.now() + (proj.tower.poisonDuration || 3000);
        target.poisonDps = proj.tower.poisonDps;
      }

      // Splash damage
      if (proj.tower.splashRadius) {
        for (const enemy of enemies) {
          if (enemy.id === target.id || enemy.hp <= 0) continue;
          const sdx = enemy.x - target.x;
          const sdy = enemy.y - target.y;
          const sd = Math.sqrt(sdx * sdx + sdy * sdy);
          if (sd <= proj.tower.splashRadius) {
            enemy.hp -= applyArmor(Math.round(proj.tower.damage * 0.6), enemy.armor);
          }
        }
      }

      // Chain lightning
      if (proj.tower.chainCount) {
        let chainSource = target;
        let chainDamage = proj.tower.damage;
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
          nextTarget.hp -= applyArmor(Math.round(chainDamage), nextTarget.armor);
          hitSet.add(nextTarget.id);

          // Add a visual chain arc
          projectiles.push({
            x: chainSource.x * CELL_SIZE,
            y: chainSource.y * CELL_SIZE,
            targetId: nextTarget.id,
            tower: { ...proj.tower, chainCount: 0, damage: 0 }, // visual only, no re-chain
            speed: 20,
            color: proj.tower.accent || '#cc88ff',
            isChainArc: true,
          });

          if (nextTarget.hp <= 0) kills.push(nextTarget);
          chainSource = nextTarget;
        }
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
