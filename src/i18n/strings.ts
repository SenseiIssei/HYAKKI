/**
 * The message catalogue.
 *
 * The navigable interface — menu, options, the actions you click — in five
 * tongues. The world's own kanji stays kanji in every language, and the
 * narrative (lore, the hundred stories, item flavour) stays in its written
 * English: translating folklore horror by machine would only flatten it. A
 * missing key falls back to English, and a missing English falls back to the
 * key itself, so nothing ever renders blank.
 */

export type Locale = 'en' | 'de' | 'ja' | 'fr' | 'es'

export const LOCALES: { id: Locale; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' },
  { id: 'ja', label: '日本語' },
  { id: 'fr', label: 'Français' },
  { id: 'es', label: 'Español' },
]

type Entry = Partial<Record<Locale, string>> & { en: string }

export const STRINGS: Record<string, Entry> = {
  // ── the front gate ──
  'menu.tagline': {
    en: 'A hundred demons. Which is to say: too many to count.',
    de: 'Hundert Dämonen. Das heißt: zu viele, um sie zu zählen.',
    ja: '百の鬼。つまり、数えきれぬほど。',
    fr: 'Cent démons. C’est-à-dire : trop pour les compter.',
    es: 'Cien demonios. Es decir: demasiados para contarlos.',
  },
  'menu.continue': { en: 'Continue', de: 'Fortsetzen', ja: '続ける', fr: 'Continuer', es: 'Continuar' },
  'menu.continue_sub': {
    en: 'keep walking',
    de: 'weitergehen',
    ja: '歩き続ける',
    fr: 'poursuivre la marche',
    es: 'seguir caminando',
  },
  'menu.newgame': {
    en: 'New Game',
    de: 'Neues Spiel',
    ja: '新しく始める',
    fr: 'Nouvelle partie',
    es: 'Partida nueva',
  },
  'menu.newgame_sub': {
    en: 'choose what you were',
    de: 'wähle, was du warst',
    ja: '在りし姿を選ぶ',
    fr: 'choisis ce que tu étais',
    es: 'elige lo que fuiste',
  },
  'menu.begin_again': {
    en: 'Begin Again',
    de: 'Von vorn beginnen',
    ja: '再び始める',
    fr: 'Recommencer',
    es: 'Empezar de nuevo',
  },
  'menu.dungeon': {
    en: 'Enter Dungeon',
    de: 'Verlies betreten',
    ja: '迷宮へ入る',
    fr: 'Entrer dans le donjon',
    es: 'Entrar en la mazmorra',
  },
  'menu.dungeon_sub': {
    en: 'delve with your gear · loot the dark',
    de: 'mit deiner Ausrüstung hinab · plündere das Dunkel',
    ja: '装備を携えて潜り、闇を漁る',
    fr: 'plonge avec ton équipement · pille les ténèbres',
    es: 'desciende con tu equipo · saquea la oscuridad',
  },
  'menu.wards': { en: 'The Wards', de: 'Die Talismane', ja: '御札', fr: 'Les Talismans', es: 'Los Amuletos' },
  'menu.wards_sub': {
    en: 'paper against what walks',
    de: 'Papier gegen das, was wandelt',
    ja: '歩むものへの紙',
    fr: 'du papier contre ce qui marche',
    es: 'papel contra lo que camina',
  },
  'menu.candles': {
    en: 'A Hundred Candles',
    de: 'Hundert Kerzen',
    ja: '百物語',
    fr: 'Cent Bougies',
    es: 'Cien Velas',
  },
  'menu.inventory': {
    en: 'Inventory',
    de: 'Ausrüstung',
    ja: '持ち物',
    fr: 'Inventaire',
    es: 'Inventario',
  },
  'menu.register': {
    en: 'The Register',
    de: 'Das Verzeichnis',
    ja: '台帳',
    fr: 'Le Registre',
    es: 'El Registro',
  },
  'menu.register_sub': {
    en: 'everything it has counted',
    de: 'alles, was es gezählt hat',
    ja: '数えられたすべて',
    fr: 'tout ce qu’il a compté',
    es: 'todo lo que ha contado',
  },
  'menu.options': { en: 'Options', de: 'Optionen', ja: '設定', fr: 'Options', es: 'Opciones' },
  'menu.quit': { en: 'Quit', de: 'Beenden', ja: '終了', fr: 'Quitter', es: 'Salir' },
  'menu.stop_watching': {
    en: 'Stop watching',
    de: 'Nicht mehr zusehen',
    ja: '見るのをやめる',
    fr: 'Cesser de regarder',
    es: 'Dejar de mirar',
  },
  'menu.stop_watching_sub': {
    en: 'it keeps going',
    de: 'es geht weiter',
    ja: '歩みは続く',
    fr: 'la marche continue',
    es: 'la marcha continúa',
  },

  // ── the "begin again" confirmation ──
  'confirm.unmake': {
    en: 'Unmake them',
    de: 'Sie auslöschen',
    ja: '消し去る',
    fr: 'Les défaire',
    es: 'Deshacerlos',
  },
  'confirm.leave': {
    en: 'Leave them walking',
    de: 'Sie weitergehen lassen',
    ja: '歩ませておく',
    fr: 'Les laisser marcher',
    es: 'Dejarlos caminar',
  },
  'confirm.warn2': {
    en: 'Starting again unmakes all of it. There is no undo.',
    de: 'Von vorn zu beginnen löscht alles aus. Es gibt kein Zurück.',
    ja: '始め直せば、すべてが消える。取り消しはない。',
    fr: 'Recommencer efface tout. Il n’y a pas de retour.',
    es: 'Empezar de nuevo lo borra todo. No hay vuelta atrás.',
  },

  // ── common actions ──
  'action.close': { en: 'Close', de: 'Schließen', ja: '閉じる', fr: 'Fermer', es: 'Cerrar' },
  'action.take': { en: 'Take it', de: 'Nimm es', ja: '受け取る', fr: 'Prends-le', es: 'Tómalo' },
  'action.equip': { en: 'Equip', de: 'Anlegen', ja: '装備', fr: 'Équiper', es: 'Equipar' },
  'action.unequip': { en: 'Take off', de: 'Ablegen', ja: '外す', fr: 'Retirer', es: 'Quitar' },
  'action.melt': { en: 'Melt', de: 'Einschmelzen', ja: '溶かす', fr: 'Fondre', es: 'Fundir' },
  'action.wash': { en: 'Wash', de: 'Waschen', ja: '清める', fr: 'Laver', es: 'Lavar' },

  // ── inventory ──
  'inv.worn': { en: 'Worn', de: 'Getragen', ja: '装着', fr: 'Porté', es: 'Puesto' },
  'inv.held': { en: 'Held', de: 'Getragen im Beutel', ja: '所持', fr: 'Porté', es: 'En bolsa' },
  'inv.weigh': { en: 'Weigh', de: 'Abwägen', ja: '比べる', fr: 'Peser', es: 'Sopesar' },
  'inv.empty_slot': { en: 'empty', de: 'leer', ja: '空き', fr: 'vide', es: 'vacío' },
  'inv.locked_slot': {
    en: 'opens deeper in',
    de: 'öffnet sich tiefer unten',
    ja: '深部で開く',
    fr: 's’ouvre plus bas',
    es: 'se abre más abajo',
  },

  // ── slot names ──
  'slot.weapon': { en: 'Weapon', de: 'Waffe', ja: '武器', fr: 'Arme', es: 'Arma' },
  'slot.body': { en: 'Body', de: 'Körper', ja: '胴', fr: 'Corps', es: 'Cuerpo' },
  'slot.head': { en: 'Head', de: 'Kopf', ja: '頭', fr: 'Tête', es: 'Cabeza' },
  'slot.hands': { en: 'Hands', de: 'Hände', ja: '手', fr: 'Mains', es: 'Manos' },
  'slot.legs': { en: 'Legs', de: 'Beine', ja: '脚', fr: 'Jambes', es: 'Piernas' },
  'slot.charm': { en: 'Charm', de: 'Talisman', ja: '護符', fr: 'Charme', es: 'Amuleto' },

  // ── options ──
  'opt.sound': { en: 'Sound', de: 'Ton', ja: '音', fr: 'Son', es: 'Sonido' },
  'opt.display': { en: 'Display', de: 'Anzeige', ja: '表示', fr: 'Affichage', es: 'Pantalla' },
  'opt.language': { en: 'Language', de: 'Sprache', ja: '言語', fr: 'Langue', es: 'Idioma' },
  'opt.music': { en: 'Music', de: 'Musik', ja: '音楽', fr: 'Musique', es: 'Música' },
  'opt.numbers_only': {
    en: 'Numbers only — no sigils, combat as a log',
    de: 'Nur Zahlen — keine Siegel, Kampf als Protokoll',
    ja: '数字のみ — 印なし、戦闘は記録として',
    fr: 'Chiffres seuls — sans sceaux, combat en journal',
    es: 'Solo números — sin sellos, combate como registro',
  },
  'opt.damage_numbers': {
    en: 'Floating damage numbers',
    de: 'Aufsteigende Schadenszahlen',
    ja: '飛ぶダメージ数字',
    fr: 'Nombres de dégâts flottants',
    es: 'Números de daño flotantes',
  },
  'opt.impact': {
    en: 'Impact — hit-stop and screen shake',
    de: 'Wucht — Trefferstopp und Bildschirmwackeln',
    ja: '衝撃 — ヒットストップと画面揺れ',
    fr: 'Impact — arrêt sur coup et tremblement',
    es: 'Impacto — pausa de golpe y temblor',
  },
  'opt.text_size': { en: 'Text size', de: 'Textgröße', ja: '文字の大きさ', fr: 'Taille du texte', es: 'Tamaño del texto' },

  // ── the "better item, equip?" prompt ──
  'equip.better': {
    en: 'A better item.',
    de: 'Ein besseres Stück.',
    ja: 'より良い品。',
    fr: 'Un meilleur objet.',
    es: 'Un objeto mejor.',
  },
  'equip.q': { en: 'Equip it?', de: 'Anlegen?', ja: '装備する？', fr: 'L’équiper ?', es: '¿Equiparlo?' },
  'equip.yes': { en: 'Equip', de: 'Anlegen', ja: '装備', fr: 'Équiper', es: 'Equipar' },
  'equip.no': { en: 'Keep in bag', de: 'Im Beutel lassen', ja: '袋のまま', fr: 'Garder', es: 'Guardar' },
  'equip.always': {
    en: 'Always auto-equip',
    de: 'Immer automatisch',
    ja: '常に自動装備',
    fr: 'Toujours automatique',
    es: 'Siempre automático',
  },
  'opt.autoequip': {
    en: 'Better items',
    de: 'Bessere Gegenstände',
    ja: 'より良い装備',
    fr: 'Meilleurs objets',
    es: 'Mejores objetos',
  },
  'opt.autoequip.ask': { en: 'Ask', de: 'Fragen', ja: '尋ねる', fr: 'Demander', es: 'Preguntar' },
  'opt.autoequip.auto': { en: 'Auto-equip', de: 'Automatisch', ja: '自動装備', fr: 'Automatique', es: 'Automático' },
  'opt.autoequip.off': { en: 'Off', de: 'Aus', ja: 'なし', fr: 'Désactivé', es: 'Apagado' },

  // ── the ever-present footer line ──
  'footer.tagline': {
    en: 'Nothing here was drawn by hand.',
    de: 'Nichts hier wurde von Hand gezeichnet.',
    ja: 'ここに手描きのものは何一つない。',
    fr: 'Rien ici n’a été dessiné à la main.',
    es: 'Nada de esto fue dibujado a mano.',
  },
}
