import type { StatKey } from './upgrades'
import type { EquipSlot, Rarity } from './relics'

/**
 * THE HUNDRED AND TWENTY.
 *
 * A catalogue of named things to wear. These are IDENTITY, not new maths — a
 * drop of a given slot and rarity is named after one of these bases and carries
 * its lore, while its stats come from the affixes rolled on top (see
 * sim/relics.ts). That split is deliberate: it lets the game hold a hundred and
 * twenty distinct, equippable pieces without adding a single new stat multiplier
 * — and this project has broken its own economy twice by adding those. Weapon
 * classes and base stats come later, behind the balance harness (Phase 7).
 *
 * 102 bases here + 18 authored uniques (Myth / True-Name, in relics.ts) = 120.
 * Every base is a real object or garment from the folklore. Nothing invented.
 */

export type ItemBase = {
  id: string
  name: string
  kanji: string
  slot: EquipSlot
  /** the tier this base drops at (Issued through Cursed; Myth+ are uniques) */
  tier: Exclude<Rarity, 'myth' | 'truename'>
  lore: string
}

export const ITEM_BASES: ItemBase[] = [
  // ═══ WEAPON 刃 ═══
  { id: 'w_nuribo', name: 'Lacquer Stick', kanji: '塗り棒', slot: 'weapon', tier: 'issued', lore: 'A length of black-lacquered wood. It was a railing, once.' },
  { id: 'w_kama', name: 'Reaping Sickle', kanji: '鎌', slot: 'weapon', tier: 'issued', lore: 'For rice. There is no rice here.' },
  { id: 'w_bo', name: 'Pilgrim Staff', kanji: '棒', slot: 'weapon', tier: 'issued', lore: 'It has walked further than the hand that holds it.' },
  { id: 'w_tanto', name: 'Plain Tantō', kanji: '短刀', slot: 'weapon', tier: 'issued', lore: 'Short enough to hide. Long enough to finish.' },
  { id: 'w_hocho', name: "Cook's Knife", kanji: '包丁', slot: 'weapon', tier: 'issued', lore: 'It knows exactly where the joints are.' },
  { id: 'w_wakizashi', name: 'Wakizashi', kanji: '脇差', slot: 'weapon', tier: 'kept', lore: 'The companion blade. It never leaves your side, which is the trouble.' },
  { id: 'w_tessen', name: 'Iron War Fan', kanji: '鉄扇', slot: 'weapon', tier: 'kept', lore: 'Folded, a fan. Open, an argument.' },
  { id: 'w_ono', name: "Woodsman's Axe", kanji: '斧', slot: 'weapon', tier: 'kept', lore: 'It took the trees of a whole world. It is not tired.' },
  { id: 'w_yari', name: 'Straight Spear', kanji: '槍', slot: 'weapon', tier: 'kept', lore: 'Keeps the thing at the far end of the thing.' },
  { id: 'w_katana', name: 'Katana', kanji: '刀', slot: 'weapon', tier: 'kept', lore: 'One edge, one purpose, one owner at a time.' },
  { id: 'w_tachi', name: 'Ashwood Tachi', kanji: '太刀', slot: 'weapon', tier: 'named', lore: 'Older than the katana and prouder of it. Worn edge-down, so it hangs like a question.' },
  { id: 'w_naginata', name: 'Temple Naginata', kanji: '薙刀', slot: 'weapon', tier: 'named', lore: 'The monks kept it by the door. The door is gone. The habit is not.' },
  { id: 'w_kusarigama', name: 'Chain-Sickle', kanji: '鎖鎌', slot: 'weapon', tier: 'named', lore: 'A blade, a weight, and a great deal of rope between them. It reaches around corners.' },
  { id: 'w_odachi', name: 'Field Ōdachi', kanji: '大太刀', slot: 'weapon', tier: 'blessed', lore: 'Too long to draw indoors. Everywhere down here is indoors.' },
  { id: 'w_nodachi', name: 'Cavalry Nodachi', kanji: '野太刀', slot: 'weapon', tier: 'blessed', lore: 'It was made to take the legs from horses. It has not lowered its standards.' },
  { id: 'w_kanabo', name: 'Studded Kanabō', kanji: '金棒', slot: 'weapon', tier: 'cursed', lore: 'An oni’s club. It swings you as much as you swing it.' },
  { id: 'w_namakubi', name: 'The Blunted Blade', kanji: '鈍刀', slot: 'weapon', tier: 'cursed', lore: 'It cuts what it should not and spares what it should not. It has opinions.' },

  // ═══ BODY 胴 ═══
  { id: 'b_mino', name: 'Straw Mino', kanji: '蓑', slot: 'body', tier: 'issued', lore: 'A rain-cloak of woven straw. It sheds water and very little else.' },
  { id: 'b_kimono', name: 'Grey Kimono', kanji: '着物', slot: 'body', tier: 'issued', lore: 'Wrapped left over right, the way you wrap the living.' },
  { id: 'b_samue', name: "Labourer's Samue", kanji: '作務衣', slot: 'body', tier: 'issued', lore: 'Worn by monks doing chores. The chores never end here either.' },
  { id: 'b_haramaki', name: 'Belly Wrap', kanji: '腹巻', slot: 'body', tier: 'issued', lore: 'Armour for the one part of you that always flinches first.' },
  { id: 'b_yukata', name: 'Thin Yukata', kanji: '浴衣', slot: 'body', tier: 'issued', lore: 'Summer cloth. It has been summer nowhere for a long time.' },
  { id: 'b_domaru', name: 'Dō-maru', kanji: '胴丸', slot: 'body', tier: 'kept', lore: 'Lacquered scales laced with cord. It closes at the side, like a secret.' },
  { id: 'b_kesa', name: "Monk's Kesa", kanji: '袈裟', slot: 'body', tier: 'kept', lore: 'Sewn from discarded rags on purpose. Humility, stitched.' },
  { id: 'b_jinbaori', name: 'Campaign Surcoat', kanji: '陣羽織', slot: 'body', tier: 'kept', lore: 'Worn over the armour, to be seen. There is no one left to see it.' },
  { id: 'b_kusari', name: 'Chain Shirt', kanji: '鎖帷子', slot: 'body', tier: 'kept', lore: 'A thousand rings, each one someone’s afternoon.' },
  { id: 'b_hitatare', name: 'Warrior Hitatare', kanji: '直垂', slot: 'body', tier: 'named', lore: 'The formal dress of men who died formally.' },
  { id: 'b_oyoroi', name: 'Great Ō-yoroi', kanji: '大鎧', slot: 'body', tier: 'named', lore: 'A box of a suit, built for the bow and the saddle. It remembers being ridden in.' },
  { id: 'b_katchu', name: 'Lacquer Cuirass', kanji: '甲冑', slot: 'body', tier: 'named', lore: 'Forty coats of urushi. Each one a year someone did not spend on anything else.' },
  { id: 'b_hara_ate', name: 'Blessed Hara-ate', kanji: '腹当', slot: 'body', tier: 'blessed', lore: 'A priest breathed a sutra into the lacquer. It has held so far.' },
  { id: 'b_tosei', name: 'Modern Gusoku', kanji: '当世具足', slot: 'body', tier: 'blessed', lore: 'Made after guns, to stop guns. There are no guns here, and it is bored.' },
  { id: 'b_shinigami', name: 'The Grave-Shroud', kanji: '経帷子', slot: 'body', tier: 'cursed', lore: 'The white robe they dress the dead in. It fits you far too well.' },
  { id: 'b_kawa', name: 'Flayed-Hide Coat', kanji: '皮衣', slot: 'body', tier: 'cursed', lore: 'Warm. Do not ask whose.' },

  // ═══ HEAD 兜 ═══
  { id: 'h_hachimaki', name: 'Cloth Headband', kanji: '鉢巻', slot: 'head', tier: 'issued', lore: 'Keeps the sweat and the doubt out of your eyes.' },
  { id: 'h_sugegasa', name: 'Straw Sedge Hat', kanji: '菅笠', slot: 'head', tier: 'issued', lore: 'A wide woven cone. The pilgrims wore it to be nobody in particular.' },
  { id: 'h_zukin', name: 'Dark Hood', kanji: '頭巾', slot: 'head', tier: 'issued', lore: 'It hides the face. Down here that is a courtesy to everyone.' },
  { id: 'h_eboshi', name: 'Black Eboshi', kanji: '烏帽子', slot: 'head', tier: 'issued', lore: 'A tall lacquered cap of rank. The rank lapsed.' },
  { id: 'h_hachigane', name: 'Forehead Guard', kanji: '額金', slot: 'head', tier: 'kept', lore: 'A plate on a cord. It has stopped exactly one thing, once, and never says which.' },
  { id: 'h_jingasa', name: "Soldier's War Hat", kanji: '陣笠', slot: 'head', tier: 'kept', lore: 'Lacquered, conical, issued by the ten thousand. You have seen it on the dead.' },
  { id: 'h_kabuto', name: 'Iron Kabuto', kanji: '兜', slot: 'head', tier: 'kept', lore: 'Riveted from plates like a struck bell. It rings when hit, which is a warning to no one.' },
  { id: 'h_hannya', name: 'Hannya Mask', kanji: '般若', slot: 'head', tier: 'named', lore: 'A woman’s jealousy carved into horns and gold teeth. She is still in there, mostly.' },
  { id: 'h_menpo', name: 'War Mask', kanji: '面頬', slot: 'head', tier: 'named', lore: 'Iron shaped into a snarl, so the enemy meets your worst face first.' },
  { id: 'h_tengu', name: 'Tengu Mask', kanji: '天狗', slot: 'head', tier: 'named', lore: 'Red, long-nosed, and proud. It teaches the sword and takes the soul as payment.' },
  { id: 'h_kuwagata', name: 'Antlered Kabuto', kanji: '鍬形', slot: 'head', tier: 'blessed', lore: 'The great gilt crest of a general. It made men look up. Look what that got them.' },
  { id: 'h_shishi', name: 'Lion-Dog Helm', kanji: '獅子', slot: 'head', tier: 'blessed', lore: 'Guards the shrine gate. It has followed you in, which the shrine would not like.' },
  { id: 'h_onimen', name: 'Oni Mask', kanji: '鬼面', slot: 'head', tier: 'cursed', lore: 'Put it on to frighten demons. Wear it too long and you save them the trip.' },
  { id: 'h_noppera', name: 'The Blank Face', kanji: '無面', slot: 'head', tier: 'cursed', lore: 'Smooth. No eyes, no mouth. It shows the dead nothing to recognise — including you.' },

  // ═══ HANDS 手 ═══
  { id: 'g_tekko', name: 'Cloth Tekkō', kanji: '手甲', slot: 'hands', tier: 'issued', lore: 'A cloth guard from wrist to knuckle. Stops the cold, mostly.' },
  { id: 'g_gunte', name: 'Working Gloves', kanji: '軍手', slot: 'hands', tier: 'issued', lore: 'For rope and rough wood. Your hands have done neither in a while.' },
  { id: 'g_wan', name: 'Wrist Wraps', kanji: '腕貫', slot: 'hands', tier: 'issued', lore: 'Bound tight so nothing rattles when you move. Nothing should.' },
  { id: 'g_yugake', name: "Archer's Glove", kanji: '弓懸', slot: 'hands', tier: 'issued', lore: 'Three fingers hardened for the string. The bow is long gone.' },
  { id: 'g_kote', name: 'Armoured Kote', kanji: '籠手', slot: 'hands', tier: 'kept', lore: 'Chain and plate sleeved onto cloth. The arm underneath is the weak part now.' },
  { id: 'g_tenugui', name: 'Bound Grip', kanji: '手拭', slot: 'hands', tier: 'kept', lore: 'A cloth wound round the palm so the blade never turns. It never turns.' },
  { id: 'g_shishi_kote', name: 'Beast-Faced Kote', kanji: '獅噛籠手', slot: 'hands', tier: 'kept', lore: 'A snarling face lacquered on the back of each hand, to bite what you grab.' },
  { id: 'g_tekkokagi', name: 'Iron Claws', kanji: '手鉤', slot: 'hands', tier: 'named', lore: 'Hooks strapped across the palm. For climbing walls, and for the things at the top of them.' },
  { id: 'g_nekote', name: 'Cat’s-Claw Gauntlet', kanji: '猫手', slot: 'hands', tier: 'named', lore: 'Fingertip blades. Quiet, personal, and exactly as unpleasant as they sound.' },
  { id: 'g_oni_kote', name: 'Oni-Grip Gauntlet', kanji: '鬼籠手', slot: 'hands', tier: 'blessed', lore: 'Forged in the shape of a demon’s hand, so a demon’s strength has somewhere to go.' },
  { id: 'g_sennin', name: "Hermit's Wrappings", kanji: '仙人手', slot: 'hands', tier: 'blessed', lore: 'A recluse wound these on and forgot his own name on purpose. They kept the knack.' },
  { id: 'g_shibari', name: 'The Binding Cords', kanji: '縛り手', slot: 'hands', tier: 'cursed', lore: 'They grip wonderfully. They do not entirely let go when asked.' },

  // ═══ LEGS 脛 ═══
  { id: 'l_waraji', name: 'Straw Sandals', kanji: '草鞋', slot: 'legs', tier: 'issued', lore: 'Woven for a single pilgrimage. You are well past one.' },
  { id: 'l_tabi', name: 'Split-Toe Tabi', kanji: '足袋', slot: 'legs', tier: 'issued', lore: 'Quiet on floorboards. The floorboards down here still creak.' },
  { id: 'l_kyahan', name: 'Cloth Gaiters', kanji: '脚絆', slot: 'legs', tier: 'issued', lore: 'Wound up the shin against thorns and the wet. Both, endlessly.' },
  { id: 'l_geta', name: 'Lacquer Geta', kanji: '下駄', slot: 'legs', tier: 'issued', lore: 'Wooden clogs that announce you two rooms early.' },
  { id: 'l_hakama', name: 'Pleated Hakama', kanji: '袴', slot: 'legs', tier: 'kept', lore: 'Seven pleats, seven virtues. You are down to about three.' },
  { id: 'l_suneate', name: 'Shin Guards', kanji: '臑当', slot: 'legs', tier: 'kept', lore: 'Splints of iron on a cloth backing. The shin is where the road hits first.' },
  { id: 'l_momohiki', name: 'Fitted Leggings', kanji: '股引', slot: 'legs', tier: 'kept', lore: 'Close-cut for a long walk. It has been the longest walk.' },
  { id: 'l_kegutsu', name: 'Fur Boots', kanji: '毛沓', slot: 'legs', tier: 'named', lore: 'Bearskin over the foot, for the mountain passes. This is lower than any mountain.' },
  { id: 'l_haidate', name: 'Thigh Armour', kanji: '佩楯', slot: 'legs', tier: 'named', lore: 'A skirt of small plates. It clinks like a purse and guards like a wall.' },
  { id: 'l_ashigaru', name: "Footsoldier's Greaves", kanji: '足軽脛当', slot: 'legs', tier: 'named', lore: 'Issued to men whose whole job was to keep walking forward. You know the type.' },
  { id: 'l_tengu_geta', name: 'One-Tooth Geta', kanji: '一本歯', slot: 'legs', tier: 'blessed', lore: 'The tengu balance on a single wooden tooth. So, now, do you.' },
  { id: 'l_hayabusa', name: 'Falcon Sandals', kanji: '隼', slot: 'legs', tier: 'blessed', lore: 'The courier who wore these ran a message that ended a war. He did not stop in time.' },
  { id: 'l_nureashi', name: 'The Drowned Wraps', kanji: '濡足', slot: 'legs', tier: 'cursed', lore: 'Always cold, always wet, always leaving prints that fill with river water.' },
  { id: 'l_sanzu', name: 'Sanzu Sandals', kanji: '三途草鞋', slot: 'legs', tier: 'cursed', lore: 'Woven for the crossing and never taken off after. They still want to go back.' },

  // ═══ CHARM 札 ═══
  { id: 'c_omamori', name: 'Shrine Amulet', kanji: '御守', slot: 'charm', tier: 'issued', lore: 'A silk pouch you must never open. You have wanted to for years.' },
  { id: 'c_juzu', name: 'Prayer Beads', kanji: '数珠', slot: 'charm', tier: 'issued', lore: 'One hundred and eight beads, one per earthly desire. You have rubbed several smooth.' },
  { id: 'c_suzu', name: 'Small Bell', kanji: '鈴', slot: 'charm', tier: 'issued', lore: 'Rung to call the gods’ attention. Down here that may be a mistake.' },
  { id: 'c_ofuda_c', name: 'Paper Talisman', kanji: '御札', slot: 'charm', tier: 'issued', lore: 'A god’s name in ink. The god has not answered mail in some time.' },
  { id: 'c_inro', name: 'Lacquer Inrō', kanji: '印籠', slot: 'charm', tier: 'issued', lore: 'A little stacked case for medicine. The medicine is long used.' },
  { id: 'c_magatama', name: 'Curved Magatama', kanji: '勾玉', slot: 'charm', tier: 'kept', lore: 'A comma-shaped jewel, old as the country. It has outlasted every hand that held it.' },
  { id: 'c_netsuke', name: 'Bone Netsuke', kanji: '根付', slot: 'charm', tier: 'kept', lore: 'A carved toggle, a demon the size of a thumb. It watches your belt.' },
  { id: 'c_sensu', name: 'Folding Fan', kanji: '扇子', slot: 'charm', tier: 'kept', lore: 'Open it and a poem is painted inside. It is about how nothing lasts.' },
  { id: 'c_kagami', name: 'Bronze Mirror', kanji: '鏡', slot: 'charm', tier: 'kept', lore: 'It shows what is behind you a moment before you turn. Usually nothing. Usually.' },
  { id: 'c_gohei', name: 'Sacred Wand', kanji: '御幣', slot: 'charm', tier: 'named', lore: 'Zigzag paper on a stick, waved to purify. It is very tired.' },
  { id: 'c_dorei', name: 'Clay Spirit-Bell', kanji: '土鈴', slot: 'charm', tier: 'named', lore: 'A baked-earth bell with a dull, private ring only you can quite hear.' },
  { id: 'c_shaku', name: 'Ritual Sceptre', kanji: '笏', slot: 'charm', tier: 'named', lore: 'Held flat before the face at court, so no one read your expression. Handy, here.' },
  { id: 'c_tama', name: 'Wish-Granting Jewel', kanji: '如意宝珠', slot: 'charm', tier: 'blessed', lore: 'The jewel the buddhas hold. This is a very good copy. Probably a copy.' },
  { id: 'c_kane', name: 'Cracked Hand-Bell', kanji: '欠鐘', slot: 'charm', tier: 'blessed', lore: 'It tolled a temple’s last morning and split doing it. It still keeps the hour.' },
  { id: 'c_shoku', name: 'The Guttered Candle', kanji: '残燭', slot: 'charm', tier: 'cursed', lore: 'The last of a hundred. Carrying it means the counting is nearly done.' },
  { id: 'c_katashiro', name: 'The Paper Effigy', kanji: '形代', slot: 'charm', tier: 'cursed', lore: 'A doll cut in your shape to take your misfortune. It has taken rather a lot, and swollen.' },

  // ═══ the rest, levelling every slot to seventeen ═══
  { id: 'b_tatami', name: 'Folding Tatami Armour', kanji: '畳具足', slot: 'body', tier: 'kept', lore: 'Plates sewn to cloth so it packs into a box. A soldier’s whole defence, rolled up like bedding.' },
  { id: 'h_amigasa', name: 'Woven Amigasa', kanji: '編笠', slot: 'head', tier: 'issued', lore: 'A flat woven hat pulled low. It says: no one you need to greet.' },
  { id: 'h_zunari', name: 'Zunari Helm', kanji: '頭形兜', slot: 'head', tier: 'kept', lore: 'A plain head-shaped helm of a few broad plates. It does the one thing a helm must, and stops.' },
  { id: 'h_kitsune', name: 'Fox Mask', kanji: '狐面', slot: 'head', tier: 'named', lore: 'White with red markings, worn at festivals to invite the god Inari. Down here it invites his messengers.' },
  { id: 'g_ashinaka_te', name: 'Half Kote', kanji: '半籠手', slot: 'hands', tier: 'issued', lore: 'A short armoured sleeve, wrist to elbow. Cheap, plain, and better than the bare arm.' },
  { id: 'g_tsutsu', name: 'Tube Bracers', kanji: '筒籠手', slot: 'hands', tier: 'kept', lore: 'Solid iron pipes hinged along the forearm. They turn a blade with a flat, final sound.' },
  { id: 'g_kikko', name: 'Brigandine Gloves', kanji: '亀甲手', slot: 'hands', tier: 'kept', lore: 'Hexagonal plates sewn under cloth, like a tortoise’s shell on the back of each hand.' },
  { id: 'g_oni_tsume', name: 'Demon Talons', kanji: '鬼爪', slot: 'hands', tier: 'named', lore: 'Long lacquered claws over each finger. They were a dancer’s once. The dance was about tearing.' },
  { id: 'g_shibite', name: "The Dead Man's Grip", kanji: '死手', slot: 'hands', tier: 'cursed', lore: 'It closes the way a corpse’s hand closes: slowly, completely, and not on your instruction.' },
  { id: 'l_ashinaka', name: 'Half-Sole Sandals', kanji: '足半', slot: 'legs', tier: 'issued', lore: 'Sandals ending at the arch, so the heel drives into the ground. Made for running, and for not stopping.' },
  { id: 'l_kobakama', name: 'Short Hakama', kanji: '小袴', slot: 'legs', tier: 'kept', lore: 'Cut high for the road. It has seen more of the road than most roads.' },
  { id: 'l_tsuranuki', name: 'Fur-Lined Tsuranuki', kanji: '貫', slot: 'legs', tier: 'named', lore: 'Bearhide boots for a general on horseback, laced to the knee. The horse did not come this far.' },
  { id: 'c_yorishiro', name: 'Spirit Vessel', kanji: '依代', slot: 'charm', tier: 'named', lore: 'An object a god may choose to enter and inhabit. Something has accepted the invitation. You are not sure what.' },
]

export const ITEM_BASE_BY_ID: Record<string, ItemBase> = Object.fromEntries(
  ITEM_BASES.map((b) => [b.id, b]),
)

/**
 * Pick a base for a drop of this slot and tier. Deterministic from the seed, so
 * the same drop is always the same named thing. Falls back to any base of the
 * slot if a tier has none, and returns null only if a slot somehow has nothing.
 */
export function baseFor(slot: EquipSlot, tier: ItemBase['tier'], seed: number): ItemBase | null {
  const exact = ITEM_BASES.filter((b) => b.slot === slot && b.tier === tier)
  const pool = exact.length ? exact : ITEM_BASES.filter((b) => b.slot === slot)
  if (!pool.length) return null
  return pool[(seed >>> 0) % pool.length]
}

// ═══════════ P7 — the stats these things actually carry ═══════════
//
// Each base grants a SIGNATURE stat matched to its slot, on top of whatever
// affixes rolled. Crucially these never touch income (bone/ash find): a
// multiplicative income modifier feeds its own income and goes superexponential,
// which is the one mistake this project has made twice. Signature stats are pure
// combat power — the same risk class as an affix, which the economy already
// tolerates and the harness already covers.

/** The stat a slot's items lean into. Never `bf`/`af`/`omen`. */
export const SLOT_STAT: Record<EquipSlot, StatKey> = {
  weapon: 'atk',
  body: 'hp',
  head: 'hp',
  hands: 'cc',
  legs: 'spd',
  charm: 'res',
}

/** How big the signature is, by tier — as a fraction added to the stat. */
const TIER_SIGNATURE: Record<ItemBase['tier'], number> = {
  issued: 0.05,
  kept: 0.08,
  named: 0.12,
  blessed: 0.18,
  cursed: 0.18,
}

export function baseSignature(base: ItemBase): { stat: StatKey; value: number } {
  return { stat: SLOT_STAT[base.slot], value: TIER_SIGNATURE[base.tier] }
}

/**
 * Weapon classes — how a blade feels in the hand. Light blades swing faster;
 * heavy ones land far harder when they crit; balanced blades split the
 * difference. This is combat feel, not income, so it is safe to make it real.
 */
export type WeaponClass = 'light' | 'balanced' | 'heavy'

const HEAVY_WEAPONS = new Set([
  'w_kanabo',
  'w_nodachi',
  'w_odachi',
  'w_ono',
  'w_naginata',
  'w_bo',
  'w_namakubi',
])
const LIGHT_WEAPONS = new Set([
  'w_tanto',
  'w_hocho',
  'w_kama',
  'w_wakizashi',
  'w_tessen',
  'w_kusarigama',
  'w_nuribo',
])

export function weaponClass(baseId: string): WeaponClass {
  if (HEAVY_WEAPONS.has(baseId)) return 'heavy'
  if (LIGHT_WEAPONS.has(baseId)) return 'light'
  return 'balanced'
}

/** Multipliers a weapon class applies while equipped. Feel, not income. */
export const WEAPON_CLASS_MODS: Record<WeaponClass, { spd?: number; cm?: number }> = {
  light: { spd: 1.15 },
  heavy: { cm: 1.35 },
  balanced: { spd: 1.06, cm: 1.12 },
}
