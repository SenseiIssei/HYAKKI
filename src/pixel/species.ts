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
    id: 'yukionna', name: 'YUKI-ONNA', kanji: '雪女', family: 'returned', from: 160, weight: 15, fps: 4,
    lore: 'Froze, and stayed to do the same for others, and is beautiful about it. The cold she brings is the last warm thing you will feel.',
    build: yukionna,
  },

  // ── the nothing ──
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
  Z: '#050506', // the void inside a Mu — darker than the ink black K
  e: '#2b4247', // the faint cold rim of an absence
}
