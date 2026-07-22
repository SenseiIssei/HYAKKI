import { blank, blit, outline, sprite, vary, type Palette, type Sprite } from './engine'

/**
 * The yōkai, in pixels. Each is authored individually — this is where the
 * detail was asked for, so none of them share a body.
 *
 * Every one keeps its ONE WRONGNESS (docs/hyakki/04-HORROR.md § rule 2), and
 * in pixels those read far better than they did as paths:
 *   Kozō  — a third arm, and one lamp of an eye
 *   Oni   — head turned away; it never once looks at you
 *   Yūrei — no feet; the shroud dissolves into nothing
 *   King  — perfectly still, seated, reading
 *   Mu    — a hole; the background shows through
 */

import { SPECIES_PAL_EXTRA, speciesFor } from './species'

export const YOKAI_PAL: Palette = {
  ...SPECIES_PAL_EXTRA,
  K: '#0b0908',
  // kozō — grey-green, damp
  G: '#4e5a4a',
  g: '#374134',
  n: '#232a22',
  Y: '#d8a53c', // its eye
  // oni — red skin, iron, tiger hide
  O: '#9c4436',
  o: '#71301f',
  N: '#4a1d13',
  I: '#5a5f63', // iron
  i: '#3c4044',
  T: '#c9a227', // tiger cloth
  t: '#8a6f18',
  V: '#e8ddc8', // tusk / bone
  // yūrei — cold light
  U: '#9fc6c9',
  u: '#6d9598',
  p: '#43676a',
  W: '#e6e9e4', // shroud
  w: '#b9c0bb',
  H: '#131313', // hair
  // king — lacquer, gold, paper
  L: '#5c2b25',
  l: '#3c1a16',
  D: '#b8912f',
  P: '#e4dccb',
  S: '#c9a882', // face
  s: '#9c7f5c',
  // mu
  M: '#46707a',
}

// ── KOZŌ ───────────────────────────────────────────────────────────────
// small, hunched, four limbs too many, one lamp eye

const KOZO_BODY = sprite([
  '...GGGGGG...',
  '..GGggggGG..',
  '.GGgggggggG.',
  'GGgggnnggggG',
  'GgggnnnnggggG'.slice(0, 12),
  'GgggnnnnggggG'.slice(0, 12),
  '.Ggggggggg G'.replace(' ', 'g').slice(0, 12),
  '..GgggggggG.'.slice(0, 12),
  '...GGggGG...',
])

const KOZO_HEAD = sprite([
  '..GGGGGG..',
  '.GGggggGG.',
  'GGgggggggG',
  'GggYYYYggG',
  'GggYKKYggG',
  'GGggYYggGG',
  '.GgggggggG'.slice(0, 10),
  '..nnnnnn..',
])

const KOZO_ARM = sprite(['gg', 'gg', 'nn', 'nn', 'gn'])
const KOZO_LEG = sprite(['gg', 'gn', 'nn', 'KK'])

// ── ONI ────────────────────────────────────────────────────────────────
// big, horned, iron club, tiger hide. It is looking away.

const ONI_TORSO = sprite([
  '..OOOOOOOO..',
  '.OOOooooOOO.',
  'OOOooooooOOO',
  'OOooooooooOO',
  'OOoooNNoooOO',
  'OOooNNNNooOO',
  'OOoooNNoooOO',
  'OOooooooooOO',
  'TTTTTTTTTTTT',
  'TttTTttTTttT',
  'TTttTTttTTtT',
  '.OOoooooOOO.',
])

const ONI_HEAD = sprite([
  'V........V',
  'VV......VV',
  '.OOOOOOOO.',
  'OOOooooOOO',
  'OOoooooooO',
  'OoKKoooKKo',
  'OoooooooooO'.slice(0, 10),
  'OoVVVVVVoO',
  '.OoooooooO'.slice(0, 10),
  '..NNNNNN..',
])

const ONI_ARM = sprite(['OOO', 'OoO', 'OoO', 'ooO', 'ooo'])
const ONI_LEG = sprite(['OOOO', 'OooO', 'OooO', 'oooO', 'NNNN'])

const KANABO = sprite([
  '.iIi.',
  'iIIIi',
  '.iIi.',
  'iIIIi',
  '.iIi.',
  'iIIIi',
  '.III.',
  '.iIi.',
  '.iIi.',
  '.iIi.',
])

// ── YŪREI ──────────────────────────────────────────────────────────────
// hair over the face, hands out, and no feet at all

const YUREI_HEAD = sprite([
  '..HHHHHH..',
  '.HHHHHHHH.',
  'HHHHHHHHHH',
  'HHWWWWWWHH',
  'HHWWWWWWHH',
  'HHWUUUUWHH',
  'HHWWWWWWHH',
  'HHHWWWWHHH',
  'HHHHWWHHHH',
  'HHHHHHHHHH',
])

const YUREI_BODY = sprite([
  '..WWWWWWWW..',
  '.WWwwwwwwWW.',
  'WWwwwwwwwwWW',
  'WwwwwwwwwwwW',
  'WwwwUUUUwwwW',
  'wwwuUUUUuwww',
  'wwwwuuuuwwww',
  '.wwwwuuwwww.',
  '.uuwwuuwwuu.',
  '..uu.uu.uu..',
  '...u..u..u..',
  '....u....u..',
])

const YUREI_ARM = sprite(['WWW', 'Www', 'www', 'wwu', 'wUu', 'Uu.'])

// ── A KING ─────────────────────────────────────────────────────────────
// seated, robed, tall eboshi, a tablet. Nothing about it moves.

const KING_BODY = sprite([
  '.....LLLL.....',
  '....LLllLL....',
  '...LLllllLL...',
  '..LLllDDllLL..',
  '.LLlllDDlllLL.',
  'LLlllllDllllLL',
  'LLllllDDllllLL',
  'LLlllDDDDlllLL',
  'LLllDDDDDDllLL',
  'LLlllllllllllL',
  'LLllllllllllLL',
  'lLLllllllllLLl',
  'llLLLLLLLLLLll',
])

const KING_HEAD = sprite([
  '...KKKK...',
  '..KKKKKK..',
  '..KKKKKK..',
  '.SSSSSSSS.',
  'SSSSSSSSSS',
  'SSKKSSKKSS',
  'SSSSSSSSSS',
  'SSSKKKKSSS',
  '.SSSSSSSS.',
  '..ssssss..',
])

// ── the Ten Kings (Jūō) ────────────────────────────────────────────────
// One seated, staring body; ten identities laid over it. Each king differs in
// headdress, in what he holds, and in the colour of his lacquer — enough that
// you know which court you are standing in without a label.

// headdresses, one per court
const CROWN_MITRE = sprite([
  '.DDDDDDDD.',
  'DDDDDDDDDD',
  'DDDDDDDDDD',
  '.DDDDDDDD.',
  '..D.DD.D..',
])
const CROWN_FLAT = sprite([
  'llllllllll',
  'lDDDDDDDDl',
  'llllllllll',
])
const CROWN_BEADS = sprite([
  '..KKKKKK..',
  '.KDDDDDDK.',
  'KDDDDDDDDK',
  'K.D.DD.D.K',
  '.D..DD..D.',
])
const CROWN_HOOD = sprite([
  '.KKKKKKKK.',
  'KKKKKKKKKK',
  'KKKKKKKKKK',
  'KKKKKKKKKK',
  'KKK.KK.KKK',
])

// attributes held in the left hand — how each court judges
const ATTR_TABLET = sprite(['PPPP', 'PllP', 'PllP', 'PllP', 'PPPP'])
const ATTR_BRUSH = sprite(['..H.', '..H.', '..H.', '.HH.', 'PPPP'])
const ATTR_MIRROR = sprite(['.UU.', 'UWWU', 'UWWU', '.UU.', '..l.'])
const ATTR_SCROLL = sprite(['PP..', 'PPPP', 'PPPP', 'llll'])
const ATTR_SCALES = sprite(['.D..D.', 'DDDDDD', '.D..D.', 'W....W', 'W....W'])

type KingLook = {
  crown: ReturnType<typeof sprite>
  attr: ReturnType<typeof sprite> | null
  // remap the robe: L/l lacquer to a court colour
  robe: Record<string, string>
}

// L=#5c2b25 lacquer, l=#3c1a16. Courts recolour through remap to A/a (blue),
// M (dead green), o/N (rust), D/t (gold), U/u (cold), p (teal).
const KINGS: KingLook[] = [
  { crown: CROWN_MITRE, attr: ATTR_TABLET, robe: {} }, // Shinkō — vermilion
  { crown: CROWN_FLAT, attr: ATTR_MIRROR, robe: { L: 'I', l: 'i' } }, // Shokō — iron, the mirror
  { crown: CROWN_BEADS, attr: ATTR_BRUSH, robe: { L: 'A', l: 'a' } }, // Sōtei — blue
  { crown: CROWN_HOOD, attr: ATTR_SCALES, robe: { L: 'N', l: 'l' } }, // Gokan — the scales
  { crown: CROWN_MITRE, attr: ATTR_SCROLL, robe: { L: 'o', l: 'N' } }, // Enma — rust, the register
  { crown: CROWN_BEADS, attr: ATTR_TABLET, robe: { L: 'p', l: 'a' } }, // Henjō — teal
  { crown: CROWN_FLAT, attr: ATTR_BRUSH, robe: { L: 'M', l: 'p' } }, // Taizan — dead green
  { crown: CROWN_HOOD, attr: ATTR_MIRROR, robe: { L: 'u', l: 'p' } }, // Byōdō — cold
  { crown: CROWN_MITRE, attr: ATTR_SCROLL, robe: { L: 'D', l: 't' } }, // Toshi — gold
  { crown: CROWN_BEADS, attr: ATTR_SCALES, robe: { L: 't', l: 'N' } }, // Godō — the last court
]

// ── composition ────────────────────────────────────────────────────────

export const YOKAI_W = 44
export const YOKAI_H = 48

export type YokaiKind = 'chaff' | 'organs' | 'returned' | 'warden' | 'nothing'

export function yokaiFrame(
  kind: YokaiKind,
  seed: number,
  phase: number,
  rank = 1,
): Sprite {
  // Species first: a Kozō and a Karakasa are both chaff, and they should not
  // look remotely alike. The returned and the nothing have their own tables
  // now too; only the wardens (the Ten Kings) are authored separately below.
  if (kind !== 'warden') {
    const sp = speciesFor(kind, rank, seed)
    if (sp) return sp.build(seed, phase)
  }

  const s = blank(YOKAI_W, YOKAI_H)
  const t = phase * Math.PI * 2
  const cx = 16

  switch (kind) {
    case 'chaff': {
      const hop = Math.round(Math.abs(Math.sin(t)) * -2)
      const legA = Math.round(Math.sin(t) * 1.5)
      const legB = Math.round(-Math.sin(t) * 1.5)
      const y = 20 + hop
      blit(s, KOZO_LEG, cx + 2 + legA, y + 9)
      blit(s, KOZO_LEG, cx + 7 + legB, y + 9)
      blit(s, KOZO_ARM, cx - 3, y + 1, { shear: Math.round(Math.sin(t) * 2) })
      blit(s, KOZO_ARM, cx + 12, y + 1, { flip: true, shear: Math.round(-Math.sin(t) * 2) })
      // the third arm, which nobody mentions
      blit(s, KOZO_ARM, cx + 11, y - 3, { flip: true, shear: Math.round(Math.cos(t) * 3) })
      blit(s, KOZO_BODY, cx - 1, y)
      blit(s, KOZO_HEAD, cx, y - 8 + (vary(seed, 2) ? 0 : 1))
      break
    }

    case 'organs': {
      const heave = Math.round(Math.abs(Math.sin(t * 0.5)) * -2)
      const y = 12 + heave
      // the club swings on its own slow count
      const swing = Math.sin(t * 0.5 + 1.2)
      blit(s, ONI_LEG, cx + 1, y + 26)
      blit(s, ONI_LEG, cx + 8, y + 26)
      blit(s, ONI_ARM, cx - 3, y + 12, { shear: Math.round(swing * 2) })
      blit(s, KANABO, cx + 15, y + 10 + Math.round(swing * 3), {
        shear: Math.round(swing * 4),
      })
      blit(s, ONI_ARM, cx + 13, y + 12, { flip: true })
      blit(s, ONI_TORSO, cx - 1, y + 8)
      // head sits off-centre and turned away
      blit(s, ONI_HEAD, cx - 2, y - 1)
      break
    }

    case 'returned': {
      const drift = Math.round(Math.sin(t * 0.5) * -3)
      const y = 14 + drift
      blit(s, YUREI_ARM, cx - 4, y + 12, { shear: Math.round(Math.sin(t * 0.5) * 2) })
      blit(s, YUREI_ARM, cx + 13, y + 12, {
        flip: true,
        shear: Math.round(-Math.sin(t * 0.5) * 2),
      })
      blit(s, YUREI_BODY, cx - 1, y + 8)
      blit(s, YUREI_HEAD, cx, y)
      // dissolve the last rows so it does not touch the ground
      for (let yy = YOKAI_H - 8; yy < YOKAI_H; yy++) {
        for (let xx = 0; xx < YOKAI_W; xx++) {
          if ((xx + yy) % (yy - (YOKAI_H - 10)) === 0) continue
          s.px[yy * YOKAI_W + xx] = ''
        }
      }
      break
    }

    case 'warden': {
      // The Ten Kings. Which court is fixed by the seed. He does not pace — but
      // he breathes, his robe stirs, and what he holds catches a slow light, so
      // even a king that only waits is never a frozen picture.
      const king = KINGS[vary(seed, KINGS.length)]
      const breathe = Math.round(Math.sin(t) * 0.5 - 0.5) // 0 or -1, a slow swell
      const hem = Math.round(Math.sin(t * 0.5) * 1) // the robe sways at the floor
      blit(s, KING_BODY, cx - 3, 18, { remap: king.robe, shear: hem })
      if (king.attr) {
        // what he holds flickers — a lantern, a mirror, a brush catching light
        const lit = Math.sin(t * 1.5) > 0.4
        blit(s, king.attr, cx + 12, 26 + breathe, lit ? { tint: 'F' } : {})
      }
      blit(s, king.crown, cx + 1, 2 + breathe)
      blit(s, KING_HEAD, cx + 1, 7 + breathe)
      break
    }

    case 'nothing': {
      // A hole. The caller punches it out of the background.
      const w = 18 + vary(seed, 5)
      for (let yy = 10; yy < 44; yy++) {
        const half = Math.round((w / 2) * Math.sin(((yy - 10) / 34) * Math.PI) + 2)
        for (let xx = -half; xx <= half; xx++) {
          const px = cx + 5 + xx
          if (px >= 0 && px < YOKAI_W) s.px[yy * YOKAI_W + px] = 'M'
        }
      }
      return s // no outline — an outline would give it an edge, and it has none
    }
  }

  return outline(s, 'K')
}

export const YOKAI_FRAMES = 8
