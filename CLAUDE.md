# Way of the Fist — Claude Code Project Notes

## Project Overview

Single-file HTML5 canvas 2D fighting game in `street-fighter.html`.
4 playable characters, 1P vs AI and 2P local versus, 4 stages, special moves and projectiles.

## File Index

| File | Purpose |
|------|---------|
| `street-fighter.html` | Entire game — HTML + CSS + JS, single file |
| `tictactoe.html` | Separate mini-project, unrelated |
| `fighting_memory.md` | Reference doc: canvas specs, character stats, key mappings, limb geometry |

---

## Canvas / Resolution

- Canvas element: `4000×2500` px (physical)
- CSS size: `800×500` px
- Render scale: `ctx.scale(5,5)` → 5× pixel density
- Clear: `ctx.clearRect(0,0,W*5,H*5)` where `W=800`, `H=500`
- `FLOOR` constant = bottom of play area (logical units)
- All character/stage coordinates are in pre-scale logical units

---

## Characters

| Character | HP | Speed | Style | Stage |
|-----------|-----|-------|-------|-------|
| Bryan | 1000 | 3.8 | Karate / Hadouken | dojo |
| Charlotte | 1000 | 4.1 | Wing Chun / Kikoken | temple |
| Arnold | 1100 | 2.9 | Wrestler / Grabs | factory |
| Dark Lord | 1150 | 3.5 | Villain / Psycho Crusher | fortress |

### Move Damage Values
- **Bryan**: LP:36, HP:90, LK:40, HK:104, Hadouken:80, Shoryuken:135
- **Charlotte**: LP:34, HP:86, LK:38, HK:100, Kikoken:72, Spinbird:112
- **Arnold**: LP:40, HP:100, LK:44, HK:108, SPD:155, BearGrab:128
- **Dark Lord**: LP:46, HP:110, LK:50, HK:118, PsychoCrusher:160, ScissorKick:128

---

## Game State Machine

```
TITLE → CSEL → VS → FIGHT → REND → END (2P) or CONT (1P)
```

### 2P End Screen (END state)
- **Enter / P2-U** → Rematch (same characters, reset scores, go to VS)
- **Backspace / Escape / O / P2-O** → Return to Character Select

---

## 2P Key Mapping

```
P2 Physical  →  Virtual (P1-equivalent)
I → ArrowUp       K → ArrowDown
J → ArrowLeft     L → ArrowRight
U → KeyA          O → KeyS
H → KeyZ          N → KeyX
Y → KeyD          B → KeyC
```

`Input.p2jp.has('KeyA')` = P2 pressed U (confirm/LP)
`Input.p2jp.has('KeyS')` = P2 pressed O (HP/return)

---

## Character Drawing Architecture

### Limb System (two-segment, all characters)

**Legs** — pivot at hip, draw downward:
```
translate(±hipX, -hipY)  → rotate(thighAngle)
  fillRect thigh
  translate(0, thighLen)  → arc knee cap → rotate(calfAngle)
    fillRect calf
    translate(0, calfLen) → fillRect boot/sole
```

**Arms** — pivot at shoulder, draw downward:
```
translate(±shoulderX, -shoulderY+bob)  → rotate(armAngle)
  fillRect upper arm sleeve
  translate(0, elbowY) → arc elbow joint → [rotate(-PI/2) for punches]
    fillRect forearm
    fillRect fist
```

### Punch Geometry
`ctx.rotate(-Math.PI/2)` at elbow makes forearm extend in world +x (toward opponent).
Works for both P1 and P2 because `ctx.scale(f.face, 1)` is applied first.

### Kick Geometry (hip-pivot snap)
```
rotate(-1.4 * kr)        // thigh swings up  (kr = 0..1)
translate(0, thighLen)
rotate(1.4 * (1-kr))    // calf snaps forward
```
At `kr=1`: foot points directly at opponent.

---

## HP / HK Back-Limb Implementation

Heavy attacks use the **back** limb (lower reach by design — starts farther from opponent).

### Variables pattern (each character):
```javascript
const isHP = isAc && f.md && f.md === f.def.moves.hp;
const isHK = isAc && f.md && f.md === f.def.moves.hk;
const punchExt   = isAc && f.md && f.md === f.def.moves.lp ? Math.min(mf*N, maxLP) : 0;
const hpunchExt  = isHP ? Math.min(mf*N, maxHP) : 0;   // maxHP < maxLP (less reach)
const kickRaise  = isAc && f.md && f.md === f.def.moves.lk ? Math.min(mf*R, maxLK) : 0;
const hkickRaise = isHK ? Math.min(mf*R, maxHK) : 0;   // maxHK slightly less than maxLK
```

### Front limb guard during HP/HK
Front arm: `if(inAtk && !isHP)` — stays in idle guard while back arm crosses.

### Per-character reach limits

| Character | LP ext | HP ext | LK raise | HK raise |
|-----------|--------|--------|----------|----------|
| Bryan | 38 | 44 | 0.85 | 0.80 |
| Charlotte | 38 | 44 | 1.0 | 0.82 |
| Arnold | 46 | 36 | 0.85 | 0.80 |
| Dark Lord | 36 | 28 | 0.85 | 0.80 |

---

## Character Visual Details Added (5× session)

### Bryan
- Gi wrinkle lines on torso
- Red belt knot detail
- Stubble dots and facial crease lines on head
- Back leg HK kick (x=-12 hip)
- Back arm HP cross punch (x=-22 shoulder)

### Charlotte
- Gold geometric pattern on dress
- Collar piping detail
- 6-lash eyelash detail + cheek blush on face
- Fingernail detail on HP extended fist
- Back leg HK kick (x=-12 hip)
- Back arm HP cross punch (x=-22 shoulder)

### Arnold
- Chest hair curls above singlet neckline
- Blue tribal flame tattoo on left shoulder/chest
- Calf muscle line on back leg
- Back leg HK kick (x=-14 hip)
- Back arm HP cross punch (x=-28 shoulder), impact shadow on knuckles

### Dark Lord
- Gold epaulette shoulder pads with rivet lines
- Chest armor engraving (skull motif)
- Gold trim lines along coat edges
- Psycho energy glow on HP fist when fully extended
- Back leg HK kick (x=-11 hip)
- Back arm HP cross punch (x=-22 shoulder)

---

## Stage Fine Detail (5× resolution enhancements)

| Stage | Fine details added |
|-------|-------------------|
| Dojo | Wood knots on floor planks, wall grain streaks, floor reflection highlights |
| Temple | Column hairline cracks, koi pond expanding ripple rings, stone path crack lines |
| Factory | Weld seams on girders, electrical cable runs, floor drain slots, rust streaks |
| Fortress | Mortar cracks in walls, blood drip trails on chains, carved wall sigils, tile chipping |

---

## Round / Match Logic

```javascript
endRound(res){
  const draw = res==='time' && this.p.hp===this.o.hp;
  const won  = draw ? null : res==='ko' ? (this.o.hp<=0) : (this.p.hp>this.o.hp);
  // draw → no win point, displays "DRAW!" in #88CCFF
}
```

Best of 3 rounds. `pw` = P1 wins, `ow` = P2/AI wins. First to 2 wins the match.

---

## Known Working Features

- [x] 1P vs AI mode
- [x] 2P local versus (split keyboard)
- [x] 2P end screen: Rematch vs Character Select choice
- [x] Character select with dual cursors (2P)
- [x] 3-round match with win tracking + draw detection
- [x] Projectiles: Hadouken (Bryan), Kikoken (Charlotte)
- [x] Special moves: Shoryuken, Spinbird, SPD, BearGrab, Psycho Crusher, Scissor Kick
- [x] LP/LK = front limb attack; HP/HK = back limb attack (lower reach)
- [x] Two-segment articulated legs + arms (all 4 characters)
- [x] Walking arm counter-swing animation
- [x] Gradients and joint circles on all limbs
- [x] 5× canvas resolution (4000×2500, CSS 800×500)
- [x] Character detail enhancements (all 4 characters)
- [x] Stage fine-detail passes (all 4 stages)
- [x] Sound effects (punch, kick, KO, etc.)

---

## Git / GitHub

Commit every meaningful change. Push after each commit or batch.
Commit message format: `<type>: <short description>`
Types: `feat`, `fix`, `art`, `refactor`, `docs`
