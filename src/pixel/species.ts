import { blank, blit, outline, sprite, vary, type Sprite } from './engine'

/**
 * SPECIES.
 *
 * The engine has five FAMILIES (mechanics). This adds species *within* them —
 * each with its own sprite, name and one line of lore — so the road stops being
 * five creatures repeated and starts being a parade.
 *
 * Every species here is a real yōkai. Nothing invented.
 */

export type Species = {
  id: string
  name: string
  kanji: string
  family: 'chaff' | 'organs' | 'returned' | 'nothing'
  /** the one line the Register has on it */
  lore: string
  /** lowest Ri it appears at */
  from: number
  /** relative weight in the spawn table */
  weight: number
  build: (seed: number, phase: number) => Sprite
  /** animation rate */
  fps: number
}

const W = 44
const H = 48

// ═══ tsukumogami — objects old enough to have opinions ═══════════════

/** KARAKASA — a one-eyed umbrella that hops on its single leg. */
function karakasa(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const hop = Math.round(Math.abs(Math.sin(t)) * -5)
  const y = 14 + hop
  const cx = 12

  const canopy = sprite([
    '......GG......',
    '....GGggGG....',
    '..GGggggggGG..',
    '.GggggggggggG.',
    'GggggggggggggG',
    'GgnGgnGgnGgnGg',
    'nGGnGGnGGnGGnG',
    '..n..n..n..n..',
  ])
  const ribs = sprite(['n.n.n.n.n.n.n', '.n.n.n.n.n.n.'])
  // the eye, and the tongue
  const face = sprite([
    '..YYYY..',
    '.YYKKYY.',
    'YYKKKKYY',
    '.YYKKYY.',
    '..YYYY..',
    '...RR...',
    '..RRRR..',
    '...RR...',
  ])
  const leg = sprite(['.nn.', '.nn.', 'nnnn', 'KKKK'])

  blit(s, canopy, cx, y)
  blit(s, ribs, cx + 1, y + 8)
  blit(s, face, cx + 3, y + 10)
  blit(s, leg, cx + 5, y + 20, { shear: Math.round(Math.sin(t) * 2) })
  return outline(s, 'K')
}

/** CHŌCHIN-OBAKE — a paper lantern split down the middle into a face. */
function chochin(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const sway = Math.round(Math.sin(t) * 2)
  const y = 12 + Math.round(Math.abs(Math.cos(t)) * -2)
  const cx = 14

  const body = sprite([
    '..PPPPPP..',
    '.PPppppPP.',
    'PPpppppppP',
    'PnnnnnnnnP',
    'PppppppppP',
    'PnnnnnnnnP',
    'PppppppppP',
    'PnnnnnnnnP',
    'PppppppppP',
    '.PPppppPP.',
    '..PPPPPP..',
  ])
  // the split, and what is behind it
  const face = sprite([
    'K......K',
    'KK....KK',
    '.KYYYYK.',
    '.YKKKKY.',
    '..KKKK..',
    '.RRRRRR.',
    '..RRRR..',
  ])
  const cord = sprite(['n', 'n', 'n', 'n'])

  blit(s, cord, cx + 5 + sway, y - 4)
  blit(s, body, cx + sway, y)
  blit(s, face, cx + 1 + sway, y + 3)
  return outline(s, 'K')
}

/** BAKEZŌRI — a straw sandal with one eye, running on tiny feet. */
function bakezori(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const y = 30 + Math.round(Math.abs(Math.sin(t * 2)) * -2)
  const cx = 12

  const sole = sprite([
    '.BBBBBBBBBB.',
    'BBbBbBbBbBBB',
    'BbBbBbBbBbBb',
    'BBbBbBbBbBBB',
    '.BBBBBBBBBB.',
  ])
  const eye = sprite(['.YY.', 'YKKY', '.YY.'])
  const foot = sprite(['nn', 'KK'])

  blit(s, sole, cx, y)
  blit(s, eye, cx + 4, y + 1)
  blit(s, foot, cx + 2, y + 5, { shear: Math.round(Math.sin(t * 2) * 2) })
  blit(s, foot, cx + 8, y + 5, { shear: Math.round(-Math.sin(t * 2) * 2) })
  return outline(s, 'K')
}

/** KOZŌ — the small hunched one, with a third arm. */
function kozo(seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const hop = Math.round(Math.abs(Math.sin(t)) * -2)
  const y = 20 + hop
  const cx = 16

  const body = sprite([
    '...GGGGGG...',
    '..GGggggGG..',
    '.GGgggggggG.',
    'GGgggnnggggG',
    'GgggnnnnggggG'.slice(0, 12),
    'GgggnnnnggggG'.slice(0, 12),
    '.Gggggggggg.',
    '..GgggggggG.',
    '...GGggGG...',
  ])
  const head = sprite([
    '..GGGGGG..',
    '.GGggggGG.',
    'GGgggggggG',
    'GggYYYYggG',
    'GggYKKYggG',
    'GGggYYggGG',
    '.Gggggggg.',
    '..nnnnnn..',
  ])
  const arm = sprite(['gg', 'gg', 'nn', 'nn', 'gn'])
  const leg = sprite(['gg', 'gn', 'nn', 'KK'])

  blit(s, leg, cx + 2 + Math.round(Math.sin(t) * 1.5), y + 9)
  blit(s, leg, cx + 7 - Math.round(Math.sin(t) * 1.5), y + 9)
  blit(s, arm, cx - 3, y + 1, { shear: Math.round(Math.sin(t) * 2) })
  blit(s, arm, cx + 12, y + 1, { flip: true, shear: Math.round(-Math.sin(t) * 2) })
  blit(s, arm, cx + 11, y - 3, { flip: true, shear: Math.round(Math.cos(t) * 3) })
  blit(s, body, cx - 1, y)
  blit(s, head, cx, y - 8 + (vary(seed, 2) ? 0 : 1))
  return outline(s, 'K')
}

// ═══ the heavy ones ══════════════════════════════════════════════════

function oniBase(_seed: number, phase: number, blue: boolean): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const heave = Math.round(Math.abs(Math.sin(t * 0.5)) * -2)
  const swing = Math.sin(t * 0.5 + 1.2)
  const y = 12 + heave
  const cx = 16
  const A = blue ? 'A' : 'O'
  const a = blue ? 'a' : 'o'

  const torso = sprite(
    [
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
    ].map((r) => r.replace(/O/g, A).replace(/o/g, a)),
  )
  const head = sprite(
    [
      'V........V',
      'VV......VV',
      '.OOOOOOOO.',
      'OOOooooOOO',
      'OOoooooooO',
      'OoKKoooKKo',
      'Ooooooooo.',
      'OoVVVVVVoO',
      '.Ooooooooo',
      '..NNNNNN..',
    ].map((r) => r.replace(/O/g, A).replace(/o/g, a)),
  )
  const arm = sprite(['OOO', 'OoO', 'OoO', 'ooO', 'ooo'].map((r) => r.replace(/O/g, A).replace(/o/g, a)))
  const leg = sprite(['OOOO', 'OooO', 'OooO', 'oooO', 'NNNN'].map((r) => r.replace(/O/g, A).replace(/o/g, a)))
  const kanabo = sprite([
    '.iIi.', 'iIIIi', '.iIi.', 'iIIIi', '.iIi.', 'iIIIi', '.III.', '.iIi.', '.iIi.', '.iIi.',
  ])

  blit(s, leg, cx + 1, y + 26)
  blit(s, leg, cx + 8, y + 26)
  blit(s, arm, cx - 3, y + 12, { shear: Math.round(swing * 2) })
  blit(s, kanabo, cx + 15, y + 10 + Math.round(swing * 3), { shear: Math.round(swing * 4) })
  blit(s, arm, cx + 13, y + 12, { flip: true })
  blit(s, torso, cx - 1, y + 8)
  blit(s, head, cx - 2, y - 1)
  return outline(s, 'K')
}

/** KAPPA — river imp. The dish on its head must stay wet. */
function kappa(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const y = 20 + Math.round(Math.sin(t) * -2)
  const cx = 15

  const shell = sprite([
    '..CCCCCCC..',
    '.CCcccccCC.',
    'CCcCCCCCcCC',
    'CcCCcccCCcC',
    'CCcCCCCCcCC',
    '.CCcccccCC.',
    '..CCCCCCC..',
  ])
  const head = sprite([
    '..UUUUUU..',
    '.UUUUUUUU.',
    'UUYKUUKYUU',
    'UUUUUUUUUU',
    'UUUKKKKUUU',
    '.UUUUUUUU.',
    '..gggggg..',
  ])
  const beak = sprite(['.YYYY.', 'YYKKYY', '.YYYY.'])
  const limb = sprite(['UU', 'Uu', 'uu', 'KK'])

  blit(s, limb, cx - 2, y + 10, { shear: Math.round(Math.sin(t) * 2) })
  blit(s, limb, cx + 11, y + 10, { flip: true })
  blit(s, shell, cx, y + 4)
  blit(s, head, cx, y - 6)
  blit(s, beak, cx + 2, y - 1)
  blit(s, limb, cx + 2, y + 16)
  blit(s, limb, cx + 7, y + 16)
  return outline(s, 'K')
}

/** GASHADOKURO — a starved giant, made of everyone who died unburied. */
function gashadokuro(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const y = 4 + Math.round(Math.sin(t * 0.4) * -2)
  const cx = 12

  const skull = sprite([
    '..VVVVVVVV..',
    '.VVVVVVVVVV.',
    'VVVKKVVKKVVV',
    'VVKKKVVKKKVV',
    'VVVKKVVKKVVV',
    'VVVVVKVVVVVV',
    '.VVVKKKVVVV.',
    '.VKVKVKVKVV.',
    '..VVVVVVVV..',
  ])
  const ribs = sprite([
    'V.V.V.V.V.V',
    'VVVVVVVVVVV',
    'V.V.V.V.V.V',
    'VVVVVVVVVVV',
    'V.V.V.V.V.V',
    'VVVVVVVVVVV',
    '.V.V.V.V.V.',
  ])
  const spine = sprite(['V', 'v', 'V', 'v', 'V', 'v', 'V'])
  const armBone = sprite(['VV', 'vV', 'VV', 'vV', 'VV', 'vV', 'VV'])

  blit(s, armBone, cx - 4, y + 14, { shear: Math.round(Math.sin(t * 0.4) * 3) })
  blit(s, armBone, cx + 14, y + 14, { flip: true, shear: Math.round(-Math.sin(t * 0.4) * 3) })
  blit(s, spine, cx + 6, y + 10)
  blit(s, ribs, cx + 1, y + 11)
  blit(s, skull, cx, y)
  return outline(s, 'K')
}

// ═══ the table ═══════════════════════════════════════════════════════

// ═══ yūrei — the returned, by the manner of their death ═════════════

/** A body that fades out below the waist and never touches the ground. */
function dissolveLegs(s: Sprite, fromY: number) {
  for (let yy = fromY; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      // keep fewer pixels the further down you go — the classic yūrei fade
      if ((xx * 3 + yy * 5) % (yy - fromY + 2) !== 0) s.px[yy * W + xx] = ''
    }
  }
}

/** ONRYŌ 怨霊 — died wronged, and came back for it. Hair like spilled ink. */
function onryo(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const drift = Math.round(Math.sin(t * 0.5) * 2)
  const cx = 15 + drift
  const y = 8

  const hair = sprite([
    'HH.HHHH.HH',
    'HHHHHHHHHH',
    'HHHHHHHHHH',
    'HHHWWWWHHH',
    'HHWWWWWWHH',
    'HHWWWWWWHH',
    'HHHWWWWHHH',
    'HH.HHHH.HH',
    '.H.HHHH.H.',
    '.H.H..H.H.',
  ])
  const eyes = sprite(['R..R', 'R..R'])
  const body = sprite([
    '.WWWWWW.',
    'WWwwwwWW',
    'WWwwwwWW',
    'WWwwwwWW',
    '.WwwwwW.',
    '.WwwwwW.',
  ])
  blit(s, hair, cx, y)
  blit(s, eyes, cx + 3, y + 4)
  blit(s, body, cx + 1, y + 10)
  // trailing hair down the sides
  blit(s, sprite(['H', 'H', 'H', 'H', 'H', 'H']), cx, y + 10)
  blit(s, sprite(['H', 'H', 'H', 'H', 'H', 'H']), cx + 9, y + 10)
  dissolveLegs(s, y + 16)
  return outline(s, 'K')
}

/** UBUME 産女 — died in childbirth. Holds the bundle it cannot put down. */
function ubume(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const drift = Math.round(Math.sin(t * 0.4) * 2)
  const cx = 15 + drift
  const y = 8

  const head = sprite([
    '.HHHH.',
    'HHHHHH',
    'HWWWWH',
    'HWppWH',
    'HWWWWH',
    '.WWWW.',
  ])
  const body = sprite([
    '.WWWWWW.',
    'WWwwwwWW',
    'WWwwwwWW',
    'WWwwwwWW',
    'WWwwwwWW',
  ])
  // the bundle, cradled, a small warm shape it will not release
  const bundle = sprite(['.PP.', 'PPPP', 'PPPP', '.PP.'])
  blit(s, head, cx + 1, y)
  blit(s, body, cx, y + 6)
  blit(s, bundle, cx + 2, y + 9)
  dissolveLegs(s, y + 12)
  return outline(s, 'K')
}

/** FUNAYŪREI 船幽霊 — drowned. Reaches for the ladle to sink you with it. */
function funayurei(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const reach = Math.round(Math.sin(t) * 2)
  const cx = 15
  const y = 8

  const head = sprite([
    '.uuuu.',
    'uUUUUu',
    'uUKKUu',
    'uUUUUu',
    '.uUUu.',
  ])
  const body = sprite([
    '.UUUUUU.',
    'UUuuuuUU',
    'UUuuuuUU',
    'UUuuuuUU',
  ])
  // both arms out, dripping, one reaching further this frame
  blit(s, sprite(['Uu', 'Uu', 'Uu', 'up']), cx - 3 - reach, y + 8)
  blit(s, sprite(['uU', 'uU', 'uU', 'pu']), cx + 9 + reach, y + 8)
  blit(s, head, cx + 1, y)
  blit(s, body, cx, y + 5)
  // drips
  blit(s, sprite(['p', '', 'p']), cx + 2, y + 14)
  blit(s, sprite(['p', '', '', 'p']), cx + 7, y + 13)
  dissolveLegs(s, y + 11)
  return outline(s, 'K')
}

/** HIDARUGAMI ひだる神 — starved to death on a road, and makes you feel it. */
function hidarugami(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const sway = Math.round(Math.sin(t * 0.6) * 2)
  const cx = 16 + sway
  const y = 8

  const head = sprite([
    '.wwww.',
    'wWWWWw',
    'wKWWKw',
    'wWWWWw',
    'wKKKKw',
    '.wWWw.',
  ])
  // a starved frame: ribs, a hollow middle
  const body = sprite([
    'w.ww.w',
    'wWWWWw',
    'w.ww.w',
    'wWWWWw',
    'w.ww.w',
    '.wWWw.',
    '.w..w.',
  ])
  blit(s, sprite(['w', 'w', 'w', 'w']), cx - 1, y + 7, { shear: sway })
  blit(s, sprite(['w', 'w', 'w', 'w']), cx + 7, y + 7, { shear: -sway })
  blit(s, head, cx + 1, y)
  blit(s, body, cx + 1, y + 6)
  dissolveLegs(s, y + 14)
  return outline(s, 'K')
}

// ═══ mu — the nothing, which is not a creature but an absence ════════

/** MU 無 — a person-shaped hole in the world, with the faintest cold rim. */
function mu(seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const breathe = Math.sin(t * 0.3)
  const cx = 22
  const wBase = 9 + vary(seed, 4)
  for (let yy = 8; yy < 44; yy++) {
    const prog = (yy - 8) / 36
    const half = Math.round((wBase + breathe) * Math.sin(prog * Math.PI) + 1)
    for (let xx = -half; xx <= half; xx++) {
      const px = cx + xx
      if (px < 0 || px >= W) continue
      // a faint rim on the very edge, void within
      s.px[yy * W + px] = xx <= -half + 1 || xx >= half - 1 ? 'e' : 'Z'
    }
  }
  return s // never outlined — an outline would give it an edge, and it has none
}

/** UTSURO 虚 — a deeper hollow: rings of nothing, a mouth that goes down. */
function utsuro(seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 22
  const cy = 26
  const pulse = 1 + Math.sin(t * 0.4) * 0.06
  for (let yy = 6; yy < 46; yy++) {
    for (let xx = 0; xx < W; xx++) {
      const dx = (xx - cx) / (13 * pulse)
      const dy = (yy - cy) / (19 * pulse)
      const r = Math.sqrt(dx * dx + dy * dy)
      if (r > 1) continue
      // concentric: rim, void, a fainter inner rim, then bottomless
      s.px[yy * W + xx] = r > 0.9 ? 'e' : r > 0.55 ? 'Z' : r > 0.42 ? 'e' : 'Z'
    }
  }
  void seed
  return s
}

// ═══ three more, to widen the road ══════════════════════════════════

/** NOPPERABŌ のっぺらぼう — a plain figure whose face keeps wiping blank. */
function nopperabo(seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const hop = Math.round(Math.abs(Math.sin(t)) * -2)
  const y = 18 + hop
  const cx = 16
  // whether the face is "on" this frame — it flickers to nothing and back
  const faced = vary(seed ^ Math.round(phase * 8), 3) !== 0
  const head = sprite([
    '.WWWWWW.',
    'WWWWWWWW',
    faced ? 'WWKKWKKW' : 'WWWWWWWW',
    'WWWWWWWW',
    faced ? 'WWWKKWWW' : 'WWWWWWWW',
    '.WWWWWW.',
  ])
  const body = sprite([
    '.WWWWWWWW.',
    'WWwwwwwwWW',
    'WWwwwwwwWW',
    'WWwwwwwwWW',
    '.WwwwwwW.',
    '.WwwwwwW.',
  ])
  blit(s, sprite(['Ww', 'Ww', 'Ww', 'ww']), cx - 3, y + 8, { shear: Math.round(Math.sin(t) * 2) })
  blit(s, sprite(['wW', 'wW', 'wW', 'ww']), cx + 10, y + 8, { flip: true })
  blit(s, body, cx - 1, y + 6)
  blit(s, head, cx + 1, y)
  return outline(s, 'K')
}

/** USHI-ONI 牛鬼 — an ox-headed brute, low and heavy and horned. */
function ushioni(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const heave = Math.round(Math.abs(Math.sin(t * 0.5)) * -2)
  const y = 14 + heave
  const cx = 13
  const head = sprite([
    'V..NNNN..V',
    'VVNNNNNNVV',
    'NNNooooNNN',
    'NoooooooON',
    'NoRRooRRoN',
    'NooooooooN',
    'NNoooooo NN'.replace(' ', 'o'),
    '.NVVVVVVN.',
  ])
  const body = sprite([
    '.NNNNNNNN.',
    'NNooooooNN',
    'NooooooooN',
    'NooooooooN',
    'NNooooooNN',
    '.NoooooN.',
  ])
  blit(s, sprite(['No', 'No', 'oo', 'NN']), cx - 2, y + 16)
  blit(s, sprite(['oN', 'oN', 'oo', 'NN']), cx + 9, y + 16)
  blit(s, body, cx, y + 8)
  blit(s, head, cx, y - 2)
  return outline(s, 'K')
}

/** YUKI-ONNA 雪女 — the snow woman, white and cold, barely touching down. */
function yukionna(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const drift = Math.round(Math.sin(t * 0.4) * 3)
  const cx = 15 + drift
  const y = 6
  const hair = sprite([
    'HHHHHHHH',
    'HHHHHHHH',
    'HWWWWWWH',
    'HWUUUUWH',
    'HWUKKUWH',
    'HWUUUUWH',
    '.WWWWWW.',
  ])
  const body = sprite([
    '.WWWWWWWW.',
    'WWWwwwwWWW',
    'WWWwwwwWWW',
    'WWWwwwwWWW',
    'WWWwwwwWWW',
    '.WWwwwwWW.',
  ])
  // a breath of cold coming off her
  blit(s, sprite(['U.U', '.U.', 'U.U']), cx + 3, y + 2)
  blit(s, sprite(['W', 'W', 'W', 'W', 'H']), cx, y + 6)
  blit(s, sprite(['W', 'W', 'W', 'W', 'H']), cx + 9, y + 6)
  blit(s, body, cx, y + 7)
  blit(s, hair, cx + 1, y)
  dissolveLegs(s, y + 16)
  return outline(s, 'K')
}

// ═══ a wider bestiary ═══════════════════════════════════════════════

/** SUNAKAKE-BABA 砂かけ婆 — a hunched hag who flings blinding sand. */
function sunakake(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const throwArm = Math.round(Math.sin(t) * 3)
  const y = 18 + Math.round(Math.abs(Math.sin(t)) * -2)
  const cx = 15
  const head = sprite(['.HHHH.', 'HHwwHH', 'HwKKwH', 'HwwwwH', 'HKwwKH', '.wwww.'])
  const body = sprite(['.wwwww.', 'wwWWWww', 'wWWWWWw', 'wWWWWWw', '.wWWWw.', '.w...w.'])
  // a fistful of sand, flung
  blit(s, sprite(['B.B', '.B.', 'B.B']), cx + 8 + throwArm, y + 4)
  blit(s, sprite(['w', 'w', 'w', 'w']), cx + 6, y + 6, { shear: throwArm })
  blit(s, body, cx, y + 6)
  blit(s, head, cx + 1, y)
  return outline(s, 'K')
}

/** ABURASUMASHI 油すまし — a squat stone head on a straw cloak, always watching. */
function aburasumashi(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const y = 20 + Math.round(Math.sin(t) * 1) // slow breathing bob, both directions
  const cx = 15
  // eyes blink once a cycle: open (Y) most of the time, a shut line near phase 0.5
  const shut = phase > 0.44 && phase < 0.56
  const eyeL = shut ? 'n' : 'Y'
  const eyeR = shut ? 'n' : 'Y'
  const head = sprite([
    '.gggggg.',
    'gggggggg',
    `g${eyeL}gggg${eyeR}g`,
    'gggggggg',
    'ggnnnngg',
    'gggggggg',
    '.gnnnng.',
  ])
  // the straw cloak ripples: each row shears by its own phase-shifted wave, so
  // the strands sway rather than snapping between two states
  const rows = ['BbBbBbBb', 'bBbBbBbB', 'BbBbBbBb', '.bBbBb..']
  rows.forEach((row, r) => {
    const sway = Math.round(Math.sin(t + r * 0.8) * 1.5)
    blit(s, sprite([row]), cx + sway, y + 8 + r)
  })
  blit(s, head, cx + 1, y)
  return outline(s, 'K')
}

/** WANYŪDŌ 輪入道 — a burning cartwheel with a screaming face at its hub. */
function wanyudo(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const cx = 22
  const cy = 24
  const r = 15
  // the rim
  for (let a = 0; a < 360; a += 12) {
    const rad = ((a + phase * 90) * Math.PI) / 180
    const x = Math.round(cx + Math.cos(rad) * r)
    const yy = Math.round(cy + Math.sin(rad) * r)
    if (x >= 0 && x < W && yy >= 0 && yy < H) s.px[yy * W + x] = a % 24 === 0 ? 'F' : 'O'
  }
  // spokes flicker with fire
  for (let a = 0; a < 360; a += 45) {
    const rad = ((a + phase * 90) * Math.PI) / 180
    for (let d = 4; d < r; d += 3) {
      const x = Math.round(cx + Math.cos(rad) * d)
      const yy = Math.round(cy + Math.sin(rad) * d)
      if (x >= 0 && x < W && yy >= 0 && yy < H) s.px[yy * W + x] = 'o'
    }
  }
  // the face at the hub
  blit(s, sprite(['SSSS', 'SKKS', 'SSSS', 'SKKS'].map((r2) => r2)), cx - 2, cy - 2)
  blit(s, sprite(['R.R', '.R.']), cx - 1, cy - 1)
  return outline(s, 'K')
}

/** OTOROSHI おとろし — a mane of hair, two eyes, and claws, over a shrine gate. */
function otoroshi(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const y = 12
  const cx = 12
  const bulk = sprite([
    'HHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHH',
    'HHYYHHHHHHHHHHYYHH',
    'HHYKHHHHHHHHHHKYHH',
    'HHHHHHHHHHHHHHHHHH',
    'HHHHHVVVVVVHHHHHHH',
    'HHHHHVKKKKVHHHHHHH',
  ])
  blit(s, bulk, cx, y + 1)
  // the top mane is drawn strand-by-strand so it ripples like a curtain of hair:
  // each strand's length breathes on its own phase-shifted wave
  for (let x = 0; x < 18; x++) {
    const len = 1 + Math.round((Math.sin(t * 2 + x * 0.7) * 0.5 + 0.5) * 3)
    for (let d = 0; d < len; d++) s.px[(y - d) * W + (cx + x)] = 'H'
  }
  // the eyes flare wider on the beat (the pupil shrinks as they widen)
  const glare = Math.sin(t) > 0.3
  if (glare) {
    s.px[(y + 3) * W + cx + 3] = 'R'
    s.px[(y + 3) * W + cx + 14] = 'R'
  }
  // claws open and close, reaching on the downbeat
  const reach = Math.round(Math.abs(Math.sin(t)) * 2)
  blit(s, sprite(['V.V.V', '.V.V.']), cx + 2, y + 20 + reach)
  blit(s, sprite(['V.V.V', '.V.V.']), cx + 9, y + 20 + reach)
  return outline(s, 'K')
}

/** UBAGABI 姥ヶ火 — a hag's face inside a hovering ball of pale fire. */
function ubagabi(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const drift = Math.round(Math.sin(t) * 3)
  const cx = 16 + drift
  const y = 12 + Math.round(Math.cos(t) * 2)
  // flame body (cold blue-white)
  const flame = sprite([
    '...UU...',
    '..UUUU..',
    '.UUUUUU.',
    'UUUWWUUU',
    'UUWWWWUU',
    'UUUWWUUU',
    '.UUUUUU.',
    '..UuuU..',
  ])
  blit(s, flame, cx, y)
  // the face in it
  blit(s, sprite(['K.K', '.n.', 'nnn']), cx + 2, y + 3)
  return outline(s, 'K')
}

/** WARAU-ONNA 笑い女 — she is smiling. She has been smiling for some time. */
function warauonna(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const drift = Math.round(Math.sin(t * 0.5) * 2)
  const cx = 15 + drift
  const y = 8
  const head = sprite([
    'HHHHHHHH',
    'HHHHHHHH',
    'HWWWWWWH',
    'HWKWWKWH',
    'HWWWWWWH',
    'HWRRRRWH',
    'HWKKKKWH',
    '.WWWWWW.',
  ])
  const body = sprite(['.WWWWWW.', 'WWwwwwWW', 'WWwwwwWW', '.WwwwwW.'])
  blit(s, sprite(['W', 'W', 'W', 'W']), cx - 1, y + 8, { shear: drift })
  blit(s, sprite(['W', 'W', 'W', 'W']), cx + 8, y + 8, { flip: true })
  blit(s, body, cx, y + 8)
  blit(s, head, cx + 1, y)
  dissolveLegs(s, y + 12)
  return outline(s, 'K')
}

/** KAGE 影 — not a hole like the Mu, but a shadow that stands up on its own. */
function kage(seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const sway = Math.round(Math.sin(t) * 3)
  const cx = 16
  // a person-shaped smear of dark, edged faintly
  const body = [
    '..ZZZZ..',
    '.ZZZZZZ.',
    '.ZZZZZZ.',
    '..ZZZZ..',
    '.ZZZZZZ.',
    'ZZZZZZZZ',
    'ZZZZZZZZ',
    'ZZZZZZZZ',
    '.ZZ..ZZ.',
    '.ZZ..ZZ.',
  ]
  body.forEach((row, yy) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === 'Z') s.px[(14 + yy) * W + cx + x + Math.round(sway * (yy / 10))] = 'Z'
    }
  })
  // two faint cold eyes
  s.px[18 * W + cx + 2] = 'e'
  s.px[18 * W + cx + 5] = 'e'
  void seed
  return outline(s, 'e')
}

export const SPECIES: Species[] = [
  {
    id: 'kozo', name: 'KOZŌ', kanji: '小僧', family: 'chaff', from: 0, weight: 34, fps: 12,
    lore: 'Small, and there are always more of them. Nobody has ever seen one arrive.',
    build: kozo,
  },
  {
    id: 'bakezori', name: 'BAKEZŌRI', kanji: '化け草履', family: 'chaff', from: 4, weight: 16, fps: 16,
    lore: 'A sandal worn for a hundred years and then thrown away. It has walked further than you.',
    build: bakezori,
  },
  {
    id: 'karakasa', name: 'KARAKASA', kanji: '唐傘', family: 'chaff', from: 12, weight: 15, fps: 10,
    lore: 'One eye, one leg, one tongue. It has been in the family a very long time and would like to be put down.',
    build: karakasa,
  },
  {
    id: 'chochin', name: 'CHŌCHIN-OBAKE', kanji: '提灯お化け', family: 'chaff', from: 25, weight: 14, fps: 8,
    lore: 'The paper splits and there is a face in it. It lights nothing. It only makes the dark specific.',
    build: chochin,
  },
  {
    id: 'nopperabo', name: 'NOPPERABŌ', kanji: 'のっぺらぼう', family: 'chaff', from: 40, weight: 12, fps: 6,
    lore: 'You ask it what is wrong and it turns, and there is nothing on the front of its head, and then there is, and then there is not.',
    build: nopperabo,
  },
  {
    id: 'sunakake', name: 'SUNAKAKE-BABA', kanji: '砂かけ婆', family: 'chaff', from: 20, weight: 14, fps: 8,
    lore: 'An old woman who waits by lonely shrine walls and throws sand in your eyes. Nobody ever sees her. That is the complaint, and the proof.',
    build: sunakake,
  },
  {
    id: 'aburasumashi', name: 'ABURASUMASHI', kanji: '油すまし', family: 'chaff', from: 55, weight: 10, fps: 4,
    lore: 'A squat stone-faced thing in a straw cloak. Say "they say an oil-presser used to appear here" on the mountain pass, and it answers: "I still do."',
    build: aburasumashi,
  },
  {
    id: 'wanyudo', name: 'WANYŪDŌ', kanji: '輪入道', family: 'organs', from: 110, weight: 12, fps: 10,
    lore: 'A flaming ox-cart wheel with a damned man’s face at the hub, rolling the gate-road of a hell. Look at it and it takes something small from you, and remembers your street.',
    build: wanyudo,
  },
  {
    id: 'otoroshi', name: 'OTOROSHI', kanji: 'おとろし', family: 'organs', from: 150, weight: 11, fps: 6,
    lore: 'A great mane of hair and claws that crouches on the shrine gate, and drops on the impious. It has been patient. You are not the impious it is waiting for, but you will do.',
    build: otoroshi,
  },
  {
    id: 'oni', name: 'ONI', kanji: '鬼', family: 'organs', from: 15, weight: 26, fps: 6,
    lore: 'Red, horned, and on shift. It is not angry with you. It has been assigned to you.',
    build: (s, p) => oniBase(s, p, false),
  },
  {
    id: 'aooni', name: 'AO-ONI', kanji: '青鬼', family: 'organs', from: 45, weight: 18, fps: 6,
    lore: 'The blue one keeps the record of what the red one does. It has never once looked up.',
    build: (s, p) => oniBase(s, p, true),
  },
  {
    id: 'kappa', name: 'KAPPA', kanji: '河童', family: 'organs', from: 70, weight: 16, fps: 8,
    lore: 'Bow to it and it must bow back, and the water spills from its head. Nobody down here bows.',
    build: kappa,
  },
  {
    id: 'gashadokuro', name: 'GASHADOKURO', kanji: 'がしゃどくろ', family: 'organs', from: 140, weight: 12, fps: 4,
    lore: 'Made of everyone who died on a road and was not buried. It is starving and it cannot ever be otherwise.',
    build: gashadokuro,
  },
  {
    id: 'ushioni', name: 'USHI-ONI', kanji: '牛鬼', family: 'organs', from: 95, weight: 14, fps: 6,
    lore: 'Ox at the head, horror at the rest. It comes out of the water at the shore and it does not go back the way it came.',
    build: ushioni,
  },

  // ── the returned, by how they died ──
  {
    id: 'onryo', name: 'ONRYŌ', kanji: '怨霊', family: 'returned', from: 30, weight: 26, fps: 5,
    lore: 'Died wronged, and would like a word. The hair arrived first and the rest of it followed.',
    build: onryo,
  },
  {
    id: 'ubume', name: 'UBUME', kanji: '産女', family: 'returned', from: 60, weight: 18, fps: 4,
    lore: 'Died in childbirth and is still holding the child. Do not offer to take it. It will let you.',
    build: ubume,
  },
  {
    id: 'funayurei', name: 'FUNAYŪREI', kanji: '船幽霊', family: 'returned', from: 120, weight: 16, fps: 6,
    lore: 'Drowned, and asks every passing thing for a ladle. Give it one and it fills your boat with the sea.',
    build: funayurei,
  },
  {
    id: 'hidarugami', name: 'HIDARUGAMI', kanji: 'ひだる神', family: 'returned', from: 200, weight: 14, fps: 5,
    lore: 'Starved to death on this very road, and shares the feeling. Your legs go first, then the wanting to go on.',
    build: hidarugami,
  },
  {
    id: 'ubagabi', name: 'UBAGABI', kanji: '姥ヶ火', family: 'returned', from: 90, weight: 14, fps: 7,
    lore: 'An old woman who stole lamp-oil from a shrine and drowned for it, and rose as a hovering ball of cold fire with her face inside. She only wants a little light. She will take yours.',
    build: ubagabi,
  },
  {
    id: 'warauonna', name: 'WARAU-ONNA', kanji: '笑い女', family: 'returned', from: 130, weight: 13, fps: 4,
    lore: 'She is smiling. She has been smiling since before you came in. Nothing has been funny for a very long time, and still, she is smiling.',
    build: warauonna,
  },
  {
    id: 'yukionna', name: 'YUKI-ONNA', kanji: '雪女', family: 'returned', from: 160, weight: 15, fps: 4,
    lore: 'Froze, and stayed to do the same for others, and is beautiful about it. The cold she brings is the last warm thing you will feel.',
    build: yukionna,
  },

  // ── the nothing ──
  {
    id: 'kage', name: 'KAGE', kanji: '影', family: 'nothing', from: 120, weight: 16, fps: 4,
    lore: 'Not a hole in the world like the Mu — a shadow that has stopped belonging to anyone, and stood up, and started keeping pace with you a little too well.',
    build: kage,
  },
  {
    id: 'mu', name: 'MU', kanji: '無', family: 'nothing', from: 0, weight: 24, fps: 3,
    lore: 'Not a thing that is dark. The place a thing would be, if there were one. There is not.',
    build: mu,
  },
  {
    id: 'utsuro', name: 'UTSURO', kanji: '虚', family: 'nothing', from: 300, weight: 12, fps: 3,
    lore: 'A hollow that goes down further than the room it is in. Looking into it is the last thing several accounts record.',
    build: utsuro,
  },

  // ═══ wave 1 — the bamboo road, paddies, village, night market ═══
  {
    id: 'konakijiji', name: 'KONAKI-JIJĪ', kanji: '子泣き爺', family: 'chaff', from: 4, weight: 20, fps: 6,
    lore: 'It cries like a lost baby until you pick it up, and then it weighs as much as the mountain it came from, and it does not let go.',
    build: konakijiji,
  },
  {
    id: 'suzurinotamashii', name: 'SUZURI-NO-TAMASHII', kanji: '硯の魂', family: 'chaff', from: 8, weight: 15, fps: 8,
    lore: 'An inkstone ground by one hand for forty years. It kept every word, and it spits them all back as blinding black.',
    build: suzurinotamashii,
  },
  {
    id: 'kawauso', name: 'KAWAUSO', kanji: '獺', family: 'chaff', from: 30, weight: 16, fps: 12,
    lore: 'An otter that learned to laugh like a person and found it funnier than fish. It feints left, always, and never strikes there.',
    build: kawauso,
  },
  {
    id: 'ashimagari', name: 'ASHIMAGARI', kanji: '足まがり', family: 'chaff', from: 34, weight: 14, fps: 8,
    lore: 'Soft as cotton against the shin, and then it has climbed to the knee, and then you are on the ground and it is still climbing.',
    build: ashimagari,
  },
  {
    id: 'dorotabo', name: 'DOROTABŌ', kanji: '泥田坊', family: 'organs', from: 32, weight: 13, fps: 5,
    lore: 'A farmer whose sons sold his field. He rises out of the mud each night with three fingers and one eye, asking for it back.',
    build: dorotabo,
  },
  {
    id: 'kazenbo', name: 'KAZENBŌ', kanji: '火前坊', family: 'returned', from: 35, weight: 13, fps: 6,
    lore: 'A monk who walked into the funeral fire and did not finish burning. He drifts the low ground, still smoking, still praying.',
    build: kazenbo,
  },
  {
    id: 'onamazu', name: 'ŌNAMAZU', kanji: '大鯰', family: 'organs', from: 40, weight: 12, fps: 4,
    lore: 'The great catfish that turns under the islands. When it shifts its weight the ground answers, and everything standing falls.',
    build: onamazu,
  },
  {
    id: 'kejoro', name: 'KEJŌRO', kanji: '毛倡妓', family: 'returned', from: 40, weight: 13, fps: 6,
    lore: 'From the front, a courtesan. From every other side, and there are only other sides, a standing weight of black hair.',
    build: kejoro,
  },
  {
    id: 'kanedama', name: 'KANEDAMA', kanji: '金霊', family: 'nothing', from: 45, weight: 11, fps: 7,
    lore: 'A spirit of money, they say, a blessing. It hangs in the air as a coin of cold light with a square hole, and the hole is the true part.',
    build: kanedama,
  },
  {
    id: 'ittanmomen', name: 'ITTAN-MOMEN', kanji: '一反木綿', family: 'chaff', from: 60, weight: 14, fps: 9,
    lore: 'A single bolt of white cloth that flies at dusk. It wants your face, and it has all the time and all the air it needs.',
    build: ittanmomen,
  },
  {
    id: 'akaname', name: 'AKANAME', kanji: '垢嘗', family: 'chaff', from: 66, weight: 15, fps: 12,
    lore: 'It licks the grime from an unwashed bathhouse at night. Where nobody has cleaned in a very long time, it grows bold, and hungry.',
    build: akaname,
  },
  {
    id: 'tenjoname', name: 'TENJŌNAME', kanji: '天井嘗', family: 'returned', from: 70, weight: 12, fps: 6,
    lore: 'The chill on the back of your neck in an old house is its tongue, testing the ceiling for the taste of who lived and died below.',
    build: tenjoname,
  },
  {
    id: 'mokumokuren', name: 'MOKUMOKUREN', kanji: '目目連', family: 'nothing', from: 72, weight: 10, fps: 4,
    lore: 'A torn paper screen in a house left too long. Every rip has become an eye, and all of them have already found you.',
    build: mokumokuren,
  },
  {
    id: 'honekarakasa', name: 'HONE-KARAKASA', kanji: '骨傘', family: 'chaff', from: 112, weight: 13, fps: 11,
    lore: 'The shrine umbrella’s starved cousin: ribs bare, paper gone, hopping faster than a thing with one leg has any right to.',
    build: honekarakasa,
  },
  {
    id: 'omukade', name: 'ŌMUKADE', kanji: '大百足', family: 'organs', from: 110, weight: 12, fps: 10,
    lore: 'A centipede grown long enough to loop a mountain, iron between its plates. Even the thunder god was afraid of the smaller ones.',
    build: omukade,
  },
  {
    id: 'tesso', name: 'TESSO', kanji: '鉄鼠', family: 'chaff', from: 115, weight: 14, fps: 12,
    lore: 'A monk died with a grudge and came back as ten thousand rats with iron teeth. They ate the sutras first, then the priests.',
    build: tesso,
  },
  {
    id: 'bakeneko', name: 'BAKENEKO', kanji: '化け猫', family: 'returned', from: 118, weight: 12, fps: 7,
    lore: 'A cat that lived long enough to split its tail in two, stand on its back legs, and remember every cruelty done under its roof.',
    build: bakeneko,
  },

  // ═══ wave 2 — the thousand gates, snow country, sea of trees ═══
  {
    id: 'nozuchi', name: 'NOZUCHI', kanji: '野槌', family: 'organs', from: 116, weight: 12, fps: 5,
    lore: 'A serpent shaped like a wooden mallet, no eyes, no neck, only a mouth. It rolls downhill at you and it does not miss.',
    build: nozuchi,
  },
  {
    id: 'nurikabe', name: 'NURIKABE', kanji: '塗壁', family: 'organs', from: 120, weight: 11, fps: 3,
    lore: 'An invisible wall across the night road that grows as you sidestep it. Here it has stopped hiding, and put a slow face on.',
    build: nurikabe,
  },
  {
    id: 'tsukumogami', name: 'TSUKUMOGAMI', kanji: '付喪神', family: 'chaff', from: 160, weight: 15, fps: 8,
    lore: 'Tools that reached a hundred years and woke up resentful of every hand that used them. Now they walk in a small angry parade.',
    build: tsukumogami,
  },
  {
    id: 'hitodama', name: 'HITODAMA', kanji: '人魂', family: 'nothing', from: 160, weight: 11, fps: 6,
    lore: 'The pale fires that leave a body a little before it dies, or a little after. These have not decided which, and are hungry.',
    build: hitodama,
  },
  {
    id: 'jatai', name: 'JATAI', kanji: '蛇帯', family: 'returned', from: 165, weight: 12, fps: 6,
    lore: 'A woman’s sash, worn against her at the end. At night it uncoils, finds the sleeping throat it remembers, and tightens.',
    build: jatai,
  },
  {
    id: 'basan', name: 'BASAN', kanji: '波山', family: 'chaff', from: 170, weight: 13, fps: 9,
    lore: 'A great cockerel that haunts the bamboo and breathes a cold blue fire that gives no heat and burns nothing but the nerve.',
    build: basan,
  },
  {
    id: 'kamaitachi', name: 'KAMAITACHI', kanji: '鎌鼬', family: 'chaff', from: 230, weight: 15, fps: 14,
    lore: 'Three weasels ride the whirlwind: one knocks you down, one cuts you open, one salves it shut — so it never even hurts.',
    build: kamaitachi,
  },
  {
    id: 'tsuraraonna', name: 'TSURARA-ONNA', kanji: '氷柱女', family: 'returned', from: 232, weight: 12, fps: 5,
    lore: 'She forms from a single icicle over a doorway a lonely man admired too long. She is beautiful, and she is very, very cold.',
    build: tsuraraonna,
  },
  {
    id: 'yamawaro', name: 'YAMAWARO', kanji: '山童', family: 'chaff', from: 234, weight: 14, fps: 10,
    lore: 'A one-eyed child of the mountain that becomes the rice-paddy god in spring. Hardy, tireless, and it never comes down alone.',
    build: yamawaro,
  },
  {
    id: 'yukinba', name: 'YUKINBA', kanji: '雪婆', family: 'organs', from: 236, weight: 11, fps: 4,
    lore: 'The snow’s own grandmother, out in the whiteout on a rimed staff, gathering the ones who sat down to rest just for a moment.',
    build: yukinba,
  },
  {
    id: 'oshiroibaba', name: 'OSHIROI-BABĀ', kanji: '白粉婆', family: 'returned', from: 240, weight: 12, fps: 5,
    lore: 'A hag caked in white face-powder, cracked mirror in hand. She served a goddess of paint, and outlived every face she made up.',
    build: oshiroibaba,
  },
  {
    id: 'yukiwarashi', name: 'YUKI-WARASHI', kanji: '雪童子', family: 'nothing', from: 245, weight: 10, fps: 4,
    lore: 'The shape of a child pressed into the blizzard, cut from it, and now walking. Where it stands, the warmth simply leaves you.',
    build: yukiwarashi,
  },
  {
    id: 'aonyobo', name: 'AO-NYŌBŌ', kanji: '青女房', family: 'returned', from: 466, weight: 12, fps: 5,
    lore: 'A lady of a court that fell four hundred years ago, still at her mirror, still painting her teeth black, still waiting for him.',
    build: aonyobo,
  },
  {
    id: 'yamabiko', name: 'YAMABIKO', kanji: '山彦', family: 'returned', from: 465, weight: 12, fps: 6,
    lore: 'The echo that comes back a beat too late and a shade too knowing. Down here the echo has a body, and it answers what you do.',
    build: yamabiko,
  },
  {
    id: 'nobiagari', name: 'NOBIAGARI', kanji: '伸び上がり', family: 'chaff', from: 462, weight: 13, fps: 7,
    lore: 'A small dark thing on the path. Look at it and it is taller. Keep looking and it is taller still. Look away is the only counsel.',
    build: nobiagari,
  },
  {
    id: 'kubikireuma', name: 'KUBIKIRE-UMA', kanji: '首切れ馬', family: 'organs', from: 470, weight: 11, fps: 10,
    lore: 'A headless horse that gallops the roads on certain nights of certain months. It has somewhere to be, and you are in the way.',
    build: kubikireuma,
  },
  {
    id: 'jubokko', name: 'JUBOKKO', kanji: '樹木子', family: 'organs', from: 460, weight: 12, fps: 5,
    lore: 'A tree grown on a battlefield that drank so much blood it needs more. Its branches take you gently, the way roots take water.',
    build: jubokko,
  },
]

export const SPECIES_BY_ID: Record<string, Species> = Object.fromEntries(
  SPECIES.map((s) => [s.id, s]),
)

/** Which species this particular thing is. Deterministic from its seed. */
export function speciesFor(
  family: Species['family'],
  rank: number,
  seed: number,
): Species | null {
  const pool = SPECIES.filter((s) => s.family === family && rank >= s.from)
  if (!pool.length) return null
  const total = pool.reduce((a, s) => a + s.weight, 0)
  let roll = vary(seed ^ 0x51ed, 10000) / 10000 * total
  for (const s of pool) {
    roll -= s.weight
    if (roll <= 0) return s
  }
  return pool[pool.length - 1]
}

export const SPECIES_PAL_EXTRA = {
  P: '#d8cfa8', // lantern paper
  A: '#3d5a86', // ao-oni blue
  a: '#283c5c',
  C: '#4a6b3f', // kappa shell
  c: '#33492c',
  U: '#6f9c5a', // kappa skin
  u: '#4d6d3e',
  v: '#b8ae95', // bone shade
  R: '#c1372b',
  F: '#f2b24a', // flame — the wanyūdō's burning rim, a king's caught light
  Z: '#050506', // the void inside a Mu — darker than the ink black K
  e: '#2b4247', // the faint cold rim of an absence
  B: '#8a7442', // straw, rope, woven grass — the light strand
  b: '#5c4d29', //   and its shadow
  q: '#356b57', // wet marsh green — otters, paddy things
  x: '#cfe6ee', // pale ice, snow-light, a cold glow
  m: '#5a4632', // mud, wet earth, drowned field
  j: '#7e8a3a', // a sickly yellow-green — sickness, marsh-light, decay
}

// ═══════════════════════════════════════════════════════════════════════
// WAVE 1 — the bamboo road, the paddies, the village, the night market
// ═══════════════════════════════════════════════════════════════════════

/** KONAKI-JIJĪ 子泣き爺 — a swaddled infant that turns to stone weight. */
function konakijiji(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 15
  const y = 18 + Math.round(Math.sin(t) * 2)
  const bundle = sprite([
    '.WWWWWW.',
    'WWwwwwWW',
    'WwWWWWwW',
    'WwWggWwW',
    'WwWnnWwW',
    'WwWvvWwW',
    'WWwwwwWW',
    '.WWWWWW.',
    '..IIII..',
  ])
  const cry = phase > 0.5 ? sprite(['nnn', 'nRn', 'nnn']) : sprite(['...', 'nnn', '...'])
  blit(s, bundle, cx, y)
  blit(s, cry, cx + 3, y + 4)
  return outline(s, 'K')
}

/** KEJŌRO 毛倡妓 — a woman who is nothing but hair, seen from behind. */
function kejoro(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 10
  for (let x = 0; x < 22; x++) {
    const len = 24 + Math.round(Math.sin(t + x * 0.5) * 4)
    for (let d = 0; d < len; d++) s.px[(8 + d) * W + (cx + x)] = 'H'
  }
  blit(s, sprite(['W.W', 'WWW', '.W.']), cx + 9, 22 + Math.round(Math.cos(t) * 2))
  return outline(s, 'K')
}

/** SUZURI-NO-TAMASHII 硯の魂 — a possessed inkstone that spits blinding ink. */
function suzurinotamashii(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 12
  const y = 22
  const slab = sprite([
    'IIIIIIIIII',
    'IiiiiiiiiI',
    'IiKKKKKKiI',
    'IiKZZZZKiI',
    'IiKKKKKKiI',
    'IiiiiiiiiI',
    'IIIIIIIIII',
  ])
  blit(s, slab, cx, y)
  blit(s, sprite(['YY', 'KK']), cx + 4, y + 3)
  const ix = cx + 11 + Math.round(Math.abs(Math.sin(t)) * 6)
  blit(s, sprite(['KK', 'KK']), ix, y + 1 + Math.round(Math.sin(t) * 3))
  return outline(s, 'K')
}

/** KAWAUSO 獺 — a trickster otter, quick, feints before it strikes. */
function kawauso(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const lean = Math.round(Math.sin(t * 2) * 3)
  const cx = 8
  const y = 24
  const body = sprite([
    '..qqqq..',
    '.qqqqqq.',
    'qqYqqYqq',
    'qqqnnqqq',
    '.qqqqqq.',
    'qqqqqqqqqqqq',
    'qqqqqqqqqqqqqq',
    '.qq..qq...qqq.',
  ])
  blit(s, body, cx, y, { shear: lean })
  blit(s, sprite(['q', 'q']), cx + 1, y - 2 + lean)
  return outline(s, 'K')
}

/** KAZENBŌ 火前坊 — a burnt monk's ghost, drifting low over the water. */
function kazenbo(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 14 + Math.round(Math.sin(t) * 2)
  const y = 12
  const monk = sprite([
    '.nnnn.',
    'nNNNNn',
    'nNooNn',
    'nNNNNn',
    'nFFFFn',
    'FnnnnF',
    'nNNNNn',
    'nNNNNn',
    '.nNNn.',
  ])
  blit(s, monk, cx, y)
  for (let i = 0; i < 4; i++) {
    const ey = y - 2 - ((Math.round(t * 3) + i * 3) % 8)
    if (ey >= 0) s.px[ey * W + cx + 1 + ((i * 2) % 4)] = 'F'
  }
  dissolveLegs(s, y + 9)
  return outline(s, 'K')
}

/** ŌNAMAZU 大鯰 — the earthquake catfish; a slow, ground-shaking bulk. */
function onamazu(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 6
  const y = 20 + Math.round(Math.sin(t) * 1)
  const body = sprite([
    '...IIIIIIIIII...',
    '..IiiiiiiiiiiI..',
    '.IiiYiiiiiiYiiI.',
    'IiiiiiiiiiiiiiiI',
    '.IiiiiiiiiiiiiI.',
    '..IiiiiiiiiiiI..',
    '...IIIIIIIIII...',
  ])
  blit(s, body, cx, y)
  const wob = Math.round(Math.sin(t * 2) * 2)
  blit(s, sprite(['i...', '.i..', '..ii']), cx - 3, y + 2 + wob)
  blit(s, sprite(['..ii', '.i..', 'i...']), cx - 3, y + 4 - wob)
  return outline(s, 'K')
}

/** DOROTABŌ 泥田坊 — a one-eyed mud figure rising from a stolen field. */
function dorotabo(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const rise = Math.round(Math.abs(Math.sin(t)) * -3)
  const cx = 13
  const y = 16 - rise
  const body = sprite([
    '..mmmm..',
    '.mmmmmm.',
    'mmYmmmmm',
    'mmKmmmmm',
    'mmmnnmmm',
    'mmmmmmmm',
    'mmmmmmmm',
    'mm.mm.mm',
    'm..m..m.',
  ])
  blit(s, body, cx, y)
  blit(s, sprite(['m.m.m', '.mmm.']), cx + 8, y + 4 + Math.round(Math.sin(t) * 2))
  return outline(s, 'K')
}

/** ASHIMAGARI 足まがり — soft cotton that wraps and climbs the legs. */
function ashimagari(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 12
  for (let i = 0; i < 9; i++) {
    const yy = 30 - i * 2
    const off = Math.round(Math.sin(t + i * 0.7) * 4)
    blit(s, sprite(['WWWWWW']), cx + off, yy)
    blit(s, sprite(['wwww']), cx + 1 + off, yy + 1)
  }
  return outline(s, 'K')
}

/** KANEDAMA 金霊 — a hovering coin of light that gives nothing and takes. */
function kanedama(seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 20
  const cy = 20 + Math.round(Math.sin(t) * 3)
  const r = 9
  for (let a = 0; a < 360; a += 18) {
    const rad = (a * Math.PI) / 180
    const px = Math.round(cx + Math.cos(rad) * r)
    const py = Math.round(cy + Math.sin(rad) * r)
    if (px >= 0 && px < W && py >= 0 && py < H) s.px[py * W + px] = (a + Math.round(t * 30)) % 72 < 36 ? 'D' : 'Y'
  }
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) s.px[(cy + dy) * W + (cx + dx)] = 'Z'
  void seed
  return s
}

/** ITTAN-MOMEN 一反木綿 — a flying strip of cloth that smothers. */
function ittanmomen(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  for (let x = 0; x < 40; x++) {
    const yy = 20 + Math.round(Math.sin(t + x * 0.35) * 6)
    s.px[yy * W + (2 + x)] = 'W'
    s.px[(yy + 1) * W + (2 + x)] = 'w'
    s.px[(yy + 2) * W + (2 + x)] = 'W'
  }
  const ey = 20 + Math.round(Math.sin(t) * 6)
  s.px[ey * W + 4] = 'n'
  s.px[(ey + 2) * W + 4] = 'n'
  return outline(s, 'K')
}

/** TENJŌNAME 天井嘗 — a ceiling-licker that drops on a long tongue. */
function tenjoname(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 16
  const drop = Math.round(Math.abs(Math.sin(t)) * 6)
  const body = sprite([
    'GGGGGGGG',
    'GggggggG',
    'GgYggYgG',
    'GggggggG',
    'GgGGGGgG',
    '.GgggG..',
  ])
  blit(s, body, cx, 6 + drop)
  for (let d = 0; d < 12 + drop; d++) s.px[(12 + drop + d) * W + (cx + 4)] = 'R'
  blit(s, sprite(['RR', 'RR']), cx + 3, 24 + drop)
  return outline(s, 'K')
}

/** AKANAME 垢嘗 — the filth-licker, low and scuttling, all tongue. */
function akaname(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 12
  const y = 26 + Math.round(Math.abs(Math.sin(t * 2)) * -2)
  const body = sprite([
    '..GGGG..',
    '.GggggG.',
    'GgYggYgG',
    'GgggggggG',
    'GgggggggGG',
    '.G.GG.G..',
  ])
  blit(s, body, cx, y)
  const lick = Math.round(Math.sin(t * 2) * 3)
  blit(s, sprite(['RRR', 'RRRR', '.RR.']), cx + 3 + lick, y + 5)
  return outline(s, 'K')
}

/** MOKUMOKUREN 目目連 — a torn paper screen that has filled up with eyes. */
function mokumokuren(seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const cx = 8
  const y = 8
  for (let gx = 0; gx <= 28; gx += 7) for (let yy = 0; yy < 32; yy++) s.px[(y + yy) * W + (cx + gx)] = 'l'
  for (let gy = 0; gy <= 32; gy += 8) for (let xx = 0; xx < 29; xx++) s.px[(y + gy) * W + (cx + xx)] = 'l'
  let k = 0
  for (let ry = 0; ry < 4; ry++)
    for (let rx = 0; rx < 4; rx++) {
      const open = ((vary(seed + k, 100) / 100 + phase) % 1) > 0.4
      const ex = cx + 2 + rx * 7
      const ey = y + 3 + ry * 8
      s.px[ey * W + ex] = 'W'
      s.px[ey * W + ex + 1] = 'W'
      s.px[(ey + 1) * W + ex] = open ? 'Y' : 'l'
      s.px[(ey + 1) * W + ex + 1] = open ? 'K' : 'l'
      k++
    }
  return outline(s, 'K')
}

/** ŌMUKADE 大百足 — a giant centipede, iron-plated, a rolling multi-hit. */
function omukade(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  for (let seg = 0; seg < 8; seg++) {
    const x = 4 + seg * 4
    const yy = 20 + Math.round(Math.sin(t + seg * 0.8) * 4)
    blit(s, sprite(['III', 'IiI', 'III']), x, yy)
    if (yy - 1 >= 0) s.px[(yy - 1) * W + x + 1] = 'i'
    s.px[(yy + 3) * W + x + 1] = 'i'
  }
  blit(s, sprite(['OO', 'YY', 'OO']), 2, 20 + Math.round(Math.sin(t) * 4))
  return outline(s, 'K')
}

/** TESSO 鉄鼠 — the iron-rat swarm of a wronged monk; it comes in numbers. */
function tesso(seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  for (let i = 0; i < 6; i++) {
    const bx = 6 + (i % 3) * 12
    const by = 16 + Math.floor(i / 3) * 14 + Math.round(Math.sin(t + i) * 2)
    const rat = sprite([
      '.III.',
      'IiYiI',
      'IiiiI',
      'II.II',
    ])
    blit(s, rat, bx, by)
    s.px[(by + 2) * W + bx + 5] = 'i'
    void seed
  }
  return outline(s, 'K')
}

/** BAKENEKO 化け猫 — a two-tailed cat that dances on the lanterns. */
function bakeneko(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 12
  const y = 16
  const cat = sprite([
    'H..H',
    'HHHH',
    'HYHYH',
    'HHHHH',
    '.HHH.',
    'HHHHHH',
    'HHHHHH',
    '.H..H.',
  ])
  blit(s, cat, cx, y)
  const w1 = Math.round(Math.sin(t) * 3)
  const w2 = Math.round(Math.sin(t + Math.PI) * 3)
  for (let d = 0; d < 7; d++) {
    s.px[(y + 6 + d) * W + (cx + 7 + Math.round((d / 7) * w1))] = 'H'
    s.px[(y + 6 + d) * W + (cx + 9 + Math.round((d / 7) * w2))] = 'H'
  }
  return outline(s, 'K')
}

/** HONE-KARAKASA 骨傘 — a broken-ribbed umbrella, faster and meaner. */
function honekarakasa(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const hop = Math.round(Math.abs(Math.sin(t * 1.5)) * -4)
  const cx = 12
  const y = 14 - hop
  const canopy = sprite([
    '...VV...',
    '..VvvV..',
    '.VvKKvV.',
    'VvKvvKvV',
    'VK.vv.KV',
    'V.V..V.V',
  ])
  blit(s, canopy, cx, y)
  blit(s, sprite(['V.V.V', '.V.V.']), cx + 1, y + 6)
  blit(s, sprite(['YKY']), cx + 2, y + 3)
  blit(s, sprite(['V', 'V', 'V']), cx + 3, y + 8, { shear: Math.round(Math.sin(t) * 2) })
  return outline(s, 'K')
}

// ═══════════════════════════════════════════════════════════════════════
// WAVE 2 — the thousand gates, the snow country, the sea of trees
// ═══════════════════════════════════════════════════════════════════════

/** NURIKABE 塗壁 — the wall that blocks the road, with a dim slow face. */
function nurikabe(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 4
  const y = 8
  for (let yy = 0; yy < 30; yy++)
    for (let xx = 0; xx < 36; xx++) {
      const brick = (yy % 4 === 0) || ((xx + (Math.floor(yy / 4) % 2) * 4) % 8 === 0)
      s.px[(y + yy) * W + (cx + xx)] = brick ? 'i' : 'I'
    }
  // two dim eyes and a flat mouth, blinking slowly
  const open = Math.sin(t) > -0.3
  blit(s, sprite([open ? 'nn' : '..']), cx + 10, y + 11)
  blit(s, sprite([open ? 'nn' : '..']), cx + 22, y + 11)
  blit(s, sprite(['nnnnnn']), cx + 14, y + 20)
  return outline(s, 'K')
}

/** NOZUCHI 野槌 — a mallet-headed serpent; a heavy overhead. */
function nozuchi(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 14
  const rear = Math.round(Math.abs(Math.sin(t)) * -4)
  // fat mallet head, no eyes to speak of
  const head = sprite([
    'mmmmmm',
    'mMMMMm',
    'mMMMMm',
    'mMMMMm',
    'mmmmmm',
  ])
  blit(s, head, cx, 10 + rear)
  // a thick tapering body coiling down
  for (let d = 0; d < 14; d++) {
    const wob = Math.round(Math.sin(t + d * 0.6) * 3)
    const wdt = 6 - Math.floor(d / 3)
    for (let x = 0; x < wdt; x++) s.px[(16 + rear + d) * W + (cx + 1 + wob + x)] = d % 2 ? 'm' : 'M'
  }
  return outline(s, 'K')
}

/** TSUKUMOGAMI 付喪神 — a parade of hundred-year tools, walking together. */
function tsukumogami(seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  // a comb
  blit(s, sprite(['LLLLL', 'l.l.l', 'l.l.l']), 4, 14 + Math.round(Math.sin(t) * 2))
  // a teacup with an eye
  blit(s, sprite(['P...P', 'PpppP', 'PYKpP', 'Pppp.', '.PPP.']), 16, 20 + Math.round(Math.cos(t) * 2))
  // a folding fan
  blit(s, sprite(['..V..', '.VVV.', 'VVVVV', 'DDDDD', '..D..']), 28, 12 + Math.round(Math.sin(t + 1) * 2))
  void seed
  return outline(s, 'K')
}

/** JATAI 蛇帯 — a sash that has become a snake, coiling to strangle. */
function jatai(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 20
  for (let d = 0; d < 30; d++) {
    const a = t + d * 0.4
    const r = 3 + d * 0.35
    const x = Math.round(cx + Math.cos(a) * r)
    const y = Math.round(8 + d * 1.1)
    if (x >= 0 && x < W && y < H) {
      s.px[y * W + x] = d % 2 ? 'L' : 'l'
      if (x + 1 < W) s.px[y * W + x + 1] = 'l'
    }
  }
  // the snake head at the loose end
  blit(s, sprite(['LLL', 'YKL', 'LLL']), cx - 2, 6)
  return outline(s, 'K')
}

/** BASAN 波山 — a cockerel that breathes a cold ghost-fire. */
function basan(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 12
  const y = 16
  const body = sprite([
    '.RR.....',
    'RRRWW...',
    '.RWWWWW.',
    'WWWWWWWW',
    'WWWWWWW.',
    '.WWWWWW.',
    '..W..W..',
  ])
  blit(s, body, cx, y)
  // comb-eye
  s.px[(y + 2) * W + cx + 1] = 'Y'
  // a puff of pale fire from the beak, flickering
  const puff = phase > 0.5
  if (puff) blit(s, sprite(['FF', 'FoF', 'FF']), cx - 3, y + 1 + Math.round(Math.sin(t) * 2))
  return outline(s, 'K')
}

/** HITODAMA 人魂 — soul-flames that gutter, gather, and pull. */
function hitodama(seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  for (let i = 0; i < 5; i++) {
    const a = t + i * 1.25
    const cx = 22 + Math.round(Math.cos(a) * (7 + i))
    const cy = 22 + Math.round(Math.sin(a) * (6 + i))
    const flame = sprite(['.U.', 'UUU', 'UpU', '.p.'])
    blit(s, flame, cx - 1, cy - 1)
    void seed
  }
  return outline(s, 'K')
}

/** YAMAWARO 山童 — a one-eyed mountain child, hardy, comes in a pack. */
function yamawaro(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 15
  const y = 16 + Math.round(Math.abs(Math.sin(t)) * -2)
  const body = sprite([
    '..CCCC..',
    '.CccccC.',
    'CcYKKccC',
    'CccccccC',
    'CcRRRRcC',
    '.CccccC.',
    'Cc....cC',
    'C......C',
  ])
  blit(s, body, cx, y)
  // stubby legs
  blit(s, sprite(['CC', 'cc']), cx + 1, y + 8, { shear: Math.round(Math.sin(t) * 1) })
  blit(s, sprite(['CC', 'cc']), cx + 5, y + 8, { shear: Math.round(-Math.sin(t) * 1) })
  return outline(s, 'K')
}

/** YUKINBA 雪婆 — the snow-hag; a slow, freezing bulk on a staff. */
function yukinba(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 12
  const y = 12 + Math.round(Math.sin(t) * 1)
  const hag = sprite([
    '.xxxx.',
    'xxWWxx',
    'xWnnWx',
    'xWWWWx',
    'xxWWxx',
    'WWWWWW',
    'xWWWWx',
    'xWWWWx',
    'xxWWxx',
    '.x..x.',
  ])
  blit(s, hag, cx, y)
  // a tall staff, rime on it
  for (let d = 0; d < 22; d++) s.px[(y + d) * W + (cx + 9)] = d % 3 === 0 ? 'x' : 'w'
  return outline(s, 'K')
}

/** TSURARA-ONNA 氷柱女 — the icicle-woman; a downward drift-spike. */
function tsuraraonna(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 16 + Math.round(Math.sin(t) * 2)
  const y = 8
  const head = sprite(['.xxxx.', 'xxUUxx', 'xUnnUx', 'xUUUUx', '.xUUx.'])
  blit(s, head, cx, y)
  // a long tapering icicle body
  for (let d = 0; d < 26; d++) {
    const wdt = Math.max(1, 5 - Math.floor(d / 5))
    for (let x = 0; x < wdt; x++) s.px[(y + 5 + d) * W + (cx + 2 - Math.floor(wdt / 2) + x)] = d % 2 ? 'U' : 'x'
  }
  return outline(s, 'K')
}

/** OSHIROI-BABĀ 白粉婆 — a face caked white, mirror in hand; a blinding. */
function oshiroibaba(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 12
  const y = 12
  const face = sprite([
    '.WWWWWW.',
    'WWWWWWWW',
    'WWKWWKWW',
    'WWWWWWWW',
    'WWWnnWWW',
    'WWKKKKWW',
    '.WWWWWW.',
    '.WwwwwW.',
  ])
  blit(s, face, cx, y)
  // a round mirror flashing on the beat
  const flash = Math.sin(t * 2) > 0.3
  blit(s, sprite(['III', flash ? 'IWI' : 'IiI', 'III']), cx + 9, y + 6)
  return outline(s, 'K')
}

/** KAMAITACHI 鎌鼬 — the sickle-weasel wind; three cuts in one blink. */
function kamaitachi(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 10
  const y = 20
  const weasel = sprite([
    '.tt.......',
    'ttYttt....',
    '.ttttttt..',
    '..tttttttt',
    '...tt..tt.',
  ])
  blit(s, weasel, cx, y, { shear: Math.round(Math.sin(t * 3) * 2) })
  // three sickle-cuts slashing the air
  for (let i = 0; i < 3; i++) {
    const cxi = cx + 12 + i * 4
    for (let d = 0; d < 6; d++) s.px[(y - 2 + d) * W + (cxi - d)] = 'I'
  }
  return outline(s, 'K')
}

/** YUKI-WARASHI 雪童子 — a child-shaped absence in the white-out. */
function yukiwarashi(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 16 + Math.round(Math.sin(t) * 2)
  const y = 14
  // a small void child, rimmed in cold light
  const shape = [
    '.ZZZZ.',
    'ZZZZZZ',
    'ZZZZZZ',
    '.ZZZZ.',
    'ZZZZZZ',
    'ZZZZZZ',
    '.Z..Z.',
  ]
  shape.forEach((row, yy) => {
    for (let x = 0; x < row.length; x++) if (row[x] === 'Z') s.px[(y + yy) * W + (cx + x)] = 'Z'
  })
  return outline(s, 'x')
}

/** JUBOKKO 樹木子 — a blood-drinking tree; roots grab and drain. */
function jubokko(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 16
  // trunk
  for (let d = 0; d < 24; d++)
    for (let x = 0; x < 6; x++) s.px[(14 + d) * W + (cx + x)] = x < 2 || x > 3 ? 'm' : 'H'
  // grasping branches
  for (let i = 0; i < 4; i++) {
    const a = t + i * 1.6
    const bx = cx + 3 + Math.round(Math.cos(a) * 10)
    const by = 12 + i * 3 + Math.round(Math.sin(a) * 2)
    if (by >= 0 && by < H && bx >= 0 && bx < W) {
      s.px[by * W + bx] = 'H'
      s.px[by * W + Math.max(0, bx - 1)] = 'C'
    }
  }
  // blood dripping from the bark
  for (let i = 0; i < 3; i++) s.px[((18 + i * 4 + Math.round(t * 2)) % 38) * W + (cx + 2)] = 'R'
  return outline(s, 'K')
}

/** YAMABIKO 山彦 — an echo given a body; it answers you with a copy. */
function yamabiko(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 12
  const y = 16
  const body = sprite([
    '.uuuu.',
    'uuuuuu',
    'uYuuYu',
    'uuUUuu',
    'uuuuuu',
    '.uUUu.',
    'uu..uu',
  ])
  blit(s, body, cx, y)
  // a faint echo of itself, offset, pulsing in and out
  const off = 6 + Math.round(Math.abs(Math.sin(t)) * 4)
  const echo = sprite(['.ee.', 'eeee', 'eeee', '.ee.'])
  blit(s, echo, cx + off, y + 1)
  return outline(s, 'K')
}

/** NOBIAGARI 伸び上がり — a thing that grows taller the longer you look. */
function nobiagari(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const grow = Math.round((Math.sin(phase * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5) * 16)
  const cx = 18
  const top = 30 - grow
  // a thin dark column that rises
  for (let y = top; y < 34; y++) {
    s.px[y * W + cx] = 'n'
    s.px[y * W + cx + 1] = 'H'
    s.px[y * W + cx + 2] = 'H'
    s.px[y * W + cx + 3] = 'n'
  }
  // a small head that lifts with it
  blit(s, sprite(['nHHn', 'HYYH', 'HHHH']), cx, top - 3)
  return outline(s, 'K')
}

/** KUBIKIRE-UMA 首切れ馬 — a headless horse; a trampling charge. */
function kubikireuma(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 4
  const y = 16
  const body = sprite([
    '...HHHHHHHH..',
    '..HHHHHHHHHH.',
    '.HHHHHHHHHHHH',
    'HHHHHHHHHHHH.',
    '.HH..HH..HH..',
  ])
  blit(s, body, cx, y)
  // the severed neck stump, bleeding
  blit(s, sprite(['RR', 'Rn', 'RR']), cx + 10, y + 1)
  // galloping legs
  const g = Math.round(Math.sin(t * 3) * 2)
  blit(s, sprite(['H', 'H', 'n']), cx + 2, y + 5, { shear: g })
  blit(s, sprite(['H', 'H', 'n']), cx + 9, y + 5, { shear: -g })
  return outline(s, 'K')
}

/** AO-NYŌBŌ 青女房 — a blue court-lady still waiting, centuries on. */
function aonyobo(_seed: number, phase: number): Sprite {
  const s = blank(W, H)
  const t = phase * Math.PI * 2
  const cx = 12
  const y = 8
  const head = sprite([
    'HHHHHHHH',
    'HHHHHHHH',
    'HAAAAAAH',
    'HAKAAKAH',
    'HAAAAAAH',
    'HARRRRAH',
    '.AAAAAA.',
  ])
  const robe = sprite([
    '.AAAAAA.',
    'AAaaaaAA',
    'AaAAAAaA',
    'AaAAAAaA',
    'AAaaaaAA',
    'AaAAAAaA',
    '.AAAAAA.',
  ])
  // long sleeves swaying
  blit(s, sprite(['A', 'a', 'A', 'a']), cx - 1, y + 8, { shear: Math.round(Math.sin(t) * 2) })
  blit(s, sprite(['A', 'a', 'A', 'a']), cx + 8, y + 8, { flip: true, shear: Math.round(-Math.sin(t) * 2) })
  blit(s, robe, cx, y + 8)
  blit(s, head, cx, y)
  dissolveLegs(s, y + 15)
  return outline(s, 'K')
}
