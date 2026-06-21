# Way of the Fist — Project Memory

## Overview

Single-file HTML5 canvas fighting game (`street-fighter.html`) in `C:\Users\bryan\OneDrive\Desktop\Claude Code\`.
2D side-scrolling fighter with 4 playable characters, 1P vs AI and 2P local versus modes, 4 stages, and special moves with projectiles.

---

## Canvas / Resolution

- Canvas: `1600×1000` px, CSS `800×500` px → effective `ctx.scale(2,2)` (2× pixel density)
- Clear rect: `ctx.clearRect(0,0,800,500)` (pre-scale logical units)
- All character coordinates are in logical (pre-scale) units

---

## Characters & Stats

| Character  | HP   | SPD | Jump Force | Weight | Notes                         |
|-----------|------|-----|-----------|--------|-------------------------------|
| Bryan     | 1000 | 3.8 | −15.2     | 1.00   | Karate, Hadouken projectile   |
| Charlotte | 1000 | 4.1 | −15.8     | 0.88   | Wing Chun, Kikoken projectile |
| Arnold    | 1100 | 2.9 | −13.2     | 1.45   | Wrestler, grabs/SPD           |
| Dark Lord | 1150 | 3.5 | −14.5     | 1.05   | Villain, Psycho Crusher       |

### Bryan Move Damage
- LP: 36, HP: 90, LK: 40, HK: 104, CLP: 34, CHK: 90, JP: 66, JK: 72
- Hadouken: dmg 80, su:14, **ac:1** (was ac:0 — bug fixed)
- Shoryuken: dmg 135

### Charlotte Move Damage
- LP: 34, HP: 86, LK: 38, HK: 100, CLP: 32, CHK: 86, JP: 62, JK: 68
- Kikoken: dmg 72, su:17, **ac:1** (was ac:0 — bug fixed)
- Spinbird: dmg 112

### Arnold Move Damage
- LP: 40, HP: 100, LK: 44, HK: 108, CLP: 38, CHK: 98, JP: 72, JK: 78
- SPD: dmg 155 (reduced from 205), BearGrab: dmg 128 (reduced from 170)

### Dark Lord Move Damage
- LP: 46, HP: 110, LK: 50, HK: 118, CLP: 42, CHK: 104, JP: 78
- Psycho Crusher: dmg 160, Scissor Kick: dmg 128

---

## 2-Player Mode

### Key Mapping (P2 physical → virtual P1-equivalent)
```
I → ArrowUp    K → ArrowDown   J → ArrowLeft  L → ArrowRight
U → KeyA       O → KeyS        H → KeyZ        N → KeyX
Y → KeyD       B → KeyC
```

P2 physical keys are pre-translated to P1-equivalent virtual codes stored in `Input.p2keys` / `Input.p2jp`. Fighter.input() is identical for both players — no separate P2 logic needed.

### Character Select (2P)
- P1 uses arrow keys + A/S to pick and confirm
- P2 uses I/J/K/L + U/O to pick and confirm
- `p1locked` / `p2locked` flags; both must lock before VS screen appears
- `p1cur` / `p2cur` cursor indices; cannot select same character as opponent

### Fight Update (FIGHT state)
```javascript
if(this.mode==='1P'){
  this.ai.update();
  this.p.input(Input.keys, Input.jp, this.o);
  this.o.input(this.ai.keys(), this.ai.jp2(), this.p);
} else {
  this.p.input(Input.keys, Input.jp, this.o);
  this.o.input(Input.p2keys, Input.p2jp, this.p);
}
```

---

## Round / Match Logic

### Draw Detection (timeout with equal HP)
```javascript
endRound(res){
  const draw = res==='time' && this.p.hp===this.o.hp;
  const won  = draw ? null : res==='ko' ? (this.o.hp<=0) : (this.p.hp>this.o.hp);
  const perf = !draw && ((won&&this.p.hp===this.p.maxhp)||(!won&&this.o.hp===this.o.maxhp));
  if(!draw){ if(won) this.pw++; else this.ow++; }
  this.res = draw ? 'draw' : (perf&&won) ? 'perfect' : res;
  this.retimer=110; this.set('REND'); Snd.ko();
}
```
- Equal HP at timeout → `res='draw'`, no win point awarded, displays "DRAW!" in `#88CCFF`

---

## Projectile Bug Fix

Both Hadouken and Kikoken had `ac:0` in their move definitions. The active-phase block `else if(this.mf <= su+ac)` is never entered when `ac=0`, so `spawnProj()` never fired. Fix: change `ac:0` → `ac:1` for both moves.

---

## Horizontal Punch Geometry

The punch extends **horizontally toward the opponent** for both players using:
```javascript
ctx.rotate(-Math.PI/2);  // at the elbow point
```
Local +y maps to world +x (toward opponent). Works identically for P1 and P2 because `ctx.scale(f.face, 1)` is applied first — flipping the x-axis for P2 means the rotation direction is automatically correct.

---

## Hip-Pivot Kick Geometry

```javascript
ctx.save();ctx.translate(kickHipX, -hipY);
ctx.rotate(-1.4*kr);          // thigh swings up
  // thigh rect (0 to thighLen)
  ctx.save();ctx.translate(0, thighLen);
  ctx.rotate(1.4*(1-kr));     // calf/boot snaps forward
    // calf rect + boot
  ctx.restore();
ctx.restore();
```
At `kr=1`: thigh is fully raised (−1.4 rad) and calf has counter-rotated to horizontal → foot points directly at opponent.

---

## Two-Segment Limb System (added in latest session)

### Leg Architecture (pivot from hip, draw downward)
All four characters now use hip-pivot two-segment legs:

```
translate(±hipX, -hipY)   ← hip joint
  rotate(thighAngle)
  fillRect thigh           ← thigh segment with gradient
  translate(0, thighLen)   ← knee joint
    fillArc knee circle    ← visible knee cap
    rotate(calfAngle)
    fillRect calf           ← calf segment with gradient
    translate(0, calfLen)  ← ankle
      fillRect boot         ← boot/foot
```

### Walking Animation Angles
- `legSwing = walking ? Math.sin(fr*1.5) : 0`
- Back leg:  thigh `−legSwing*0.30`, calf `+legSwing*0.22`
- Front leg: thigh `+legSwing*0.30`, calf `−legSwing*0.22`
- Idle fighting stance: back thigh `−0.06`, back calf `+0.12`; front thigh `+0.06`, front calf `+0.08`

### Arm Architecture (pivot from shoulder, draw downward)
- `armSwing = walking ? Math.sin(fr*1.5) : 0`
- Back arm rotates `+armSwing*0.18` (swings forward when front leg is back)
- Front arm rotates `−armSwing*0.18` (counter-swings)
- Elbow joint is a filled circle with a highlight dot, matching knee style

### Per-Character Leg Measurements

| Character  | Hip Y | Hip X (back/front) | Thigh | Calf | Boot | Total |
|-----------|-------|-------------------|-------|------|------|-------|
| Bryan     | −78   | −12 / +12          | 36px  | 24px | 18px | 78px  |
| Charlotte | −75   | −12 / +12          | 34px  | 22px | 19px | 75px  |
| Arnold    | −80   | −14 / +14          | 38px  | 26px | 16px | 80px  |
| Dark Lord | −80   | −11 / +6           | 40px  | 28px | 12px | 80px  |

### Per-Character Leg Colors

**Bryan:** thigh `#D0D0D0→#E4E4E4` (white gi pants), calf `#C8C8C8→#DADADA`, boot `#1C1C1C→#2E2E2E`, sole `#333`

**Charlotte:** thigh `#1A55AA→#2266BB` (blue pants), calf `#E0E0E0→#F0F0F0` (white with `#FFCC00` gold stripes), boot `#DDDDDD`

**Arnold:** thigh `#AA1800→#CC2200` (red shorts) with `#880000` waistband, calf `#A06030→#C07850` (bare skin), boot `#1A1A1A→#333`

**Dark Lord:** thigh `#440000→#660000` with `#990000` top band, knee cap `#330000`, calf `#3A0000→#550000`, sole `#220000`

---

## Stage Backgrounds

Four stages with parallax/gradient backgrounds:
1. **Dojo** — Bryan's stage, wooden floor, shoji screens
2. **Harbor** — Charlotte's stage, ocean/dock setting
3. **Gym** — Arnold's stage, boxing gym interior
4. **Castle** — Dark Lord's stage, dark stone castle

---

## Game Title

`Way of the Fist` — displayed on the title/menu screen.

---

## Known Working Features

- [x] 1P vs AI mode
- [x] 2P local versus (split keyboard)
- [x] Character select with dual cursors (2P)
- [x] 3-round match with win tracking
- [x] Draw detection on timeout equal HP
- [x] Projectiles: Hadouken (Bryan), Kikoken (Charlotte)
- [x] Special moves: Shoryuken, Spinbird, SPD, BearGrab, Psycho Crusher, Scissor Kick
- [x] Horizontal punch geometry (both players)
- [x] Hip-pivot snap kick (both players)
- [x] Two-segment articulated legs (thigh + calf + boot, all 4 characters)
- [x] Two-segment articulated arms (upper arm + forearm, all 4 characters)
- [x] Walking arm counter-swing animation
- [x] Gradients and joint circles on all limbs
- [x] 2× canvas resolution (1600×1000, CSS 800×500)
- [x] Sound effects (punch, kick, KO, etc.)
