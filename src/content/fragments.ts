import type { GameState } from '../sim/types'

/**
 * The narrative payload. Fragments unlock by DEPTH OF PLAY, never by a quest,
 * and never block anything. They appear as one line in the log and are read in
 * the Archive whenever the player wants.
 *
 * A player who reads none of these still experiences the turn, because the turn
 * is mechanical: the Returned wear real past coat numbers, CHORUS summons the
 * same ghosts as allies, and THE MYRIAD is statted from every run you have
 * recorded. docs/14-NARRATIVE.md
 */
export type Fragment = {
  n: number
  title: string
  text: string
  /** the act it belongs to, for the Archive */
  act: 1 | 2 | 3
  when: (s: GameState) => boolean
}

const rev = (n: number) => (s: GameState) => s.reveilles >= n
const rank = (n: number) => (s: GameState) => s.bestRankEver >= n
const deaths = (n: number) => (s: GameState) => s.totalDeaths >= n
const kills = (n: number) => (s: GameState) => s.totalKills >= n
const cleared = (n: number) => (s: GameState) => s.descentsCleared >= n
const interred = (n: number) => (s: GameState) => s.interments >= n
const relics = (n: number) => (s: GameState) => s.inventory.length >= n

export const FRAGMENTS: Fragment[] = [
  // ── ACT I — THE MARCH ─────────────────────────────────────────────
  {
    n: 1, act: 1, title: 'Muster Roll',
    when: rev(1),
    text: 'Ten thousand names, and the clerk has written them all in the same hand. Nobody has ever been able to explain this. It is noted, in the margin, that it was noted before.',
  },
  {
    n: 2, act: 1, title: 'March Order',
    when: rev(2),
    text: 'You will proceed to the wound. You will proceed into the wound. There is no third instruction and the space for one has been left blank.',
  },
  {
    n: 3, act: 1, title: 'Quartermaster’s Inventory',
    when: rank(20),
    text: 'Coats: ten thousand. Boots: ten thousand pairs. Bells: one. Lamps: one. Nails: eight. There is a ninth nail in the ledger, crossed out, and then crossed back in.',
  },
  {
    n: 4, act: 1, title: 'Casualty Return, Amended',
    when: deaths(3),
    text: 'Ten thousand sent. Ten thousand returned. Ten thousand sent. The clerk has written the same line eleven times. In the margin, in a different hand: "stop."',
  },
  {
    n: 5, act: 1, title: 'On the Nature of the Wound',
    when: rank(50),
    text: 'It is warm. It should not be warm. The surgeons agree that it should not be warm and have agreed this on four separate occasions, in writing, at increasing length.',
  },
  {
    n: 6, act: 1, title: 'Bell',
    when: rev(8),
    text: 'Reveille sounds on the downstroke. It has always sounded on the downstroke. Nobody has ever heard the upstroke and nobody has ever thought to ask where it went.',
  },
  {
    n: 7, act: 1, title: 'A Note on Ash',
    when: rev(12),
    text: 'What burns in there does not go up. It settles. You can carry it. It is the only thing anyone has managed to carry out, and it is not clear that carrying it out is what happens.',
  },
  {
    n: 8, act: 1, title: 'Standing Instruction',
    when: rank(100),
    text: 'If you meet something wearing a coat, check the number. If the number is lower than yours, continue. If the number is higher than yours, continue. Do not stop to check the number.',
  },
  {
    n: 9, act: 1, title: 'The Clerk’s Own Line',
    when: rev(20),
    text: 'I have been asked to record how long. I have recorded how long. I have been asked again, by the same officer, with the same face, and I have recorded it again, and the two numbers do not agree, and both of them are mine.',
  },
  {
    n: 10, act: 1, title: 'Ration Tin',
    when: deaths(15),
    text: 'Licked clean. Not recently. The tin is stamped with a number and the number is yours and you have never seen this tin before.',
  },

  // ── ACT II — THE COUNT ────────────────────────────────────────────
  {
    n: 11, act: 2, title: 'Letter, Undelivered',
    when: rev(30),
    text: 'I have been trying to work out how long. The bells are no help. I asked the man beside me his number and he gave me mine. I did not correct him. He seemed certain.',
  },
  {
    n: 12, act: 2, title: 'On the Returned',
    when: (s) => s.ghosts.length >= 10,
    text: 'They come back up the line wearing coats. The coats are ours. We have checked. We have checked more than once and the checking is the part that stopped being bearable.',
  },
  {
    n: 13, act: 2, title: 'Field Note',
    when: rank(200),
    text: 'It fought the way I fight. Not similarly. The way I fight. It made the mistake I make with my left hand and it made it at the same point in the exchange.',
  },
  {
    n: 14, act: 2, title: 'The Census Speaks',
    when: (s) => s.wardenNames >= 4,
    text: 'It asked me how many I was. I said one. It wrote down a number and turned the page so I could not see it, which was a courtesy, and I have thought about that courtesy every day since.',
  },
  {
    n: 15, act: 2, title: 'Interment',
    when: (s) => s.interments >= 1,
    text: 'They bury what is left and something gets up out of it. This is described in the order of march as "relief". The word has been chosen carefully by somebody who is no longer available for questions.',
  },
  {
    n: 16, act: 2, title: 'On Names',
    when: (s) => s.names >= 3,
    text: 'A soldier with a number can be replaced by another number. A soldier with a name has to be replaced by that name. This is why we are not given them. This is why they can be taken.',
  },
  {
    n: 17, act: 2, title: 'Vow',
    when: (s) => s.vows.length >= 1,
    text: 'Nobody asks you to swear anything. You do it because the arithmetic is better and because a thing you chose hurts differently than a thing you were handed.',
  },
  {
    n: 18, act: 2, title: 'The Museum',
    when: (s) => s.descentsCleared >= 1,
    text: 'Every wound the god took, mounted and labelled. Some of the labels are in my handwriting. I do not remember writing them. I remember the wounds.',
  },
  {
    n: 19, act: 2, title: 'Depth',
    when: rank(500),
    text: 'The colour goes out of it around here. Not darkness. The other thing. Things are still lit; there is simply less to be lit about them.',
  },
  {
    n: 20, act: 2, title: 'Overheard at the Mouth',
    when: rev(60),
    text: '"How many times?" "I have stopped." "Stopped counting?" "Stopped being the one who counts."',
  },
  {
    n: 21, act: 2, title: 'Amended Again',
    when: deaths(80),
    text: 'The casualty return has been amended so many times that the amendments have their own ledger, and that ledger has been amended, and the hand is still mine.',
  },
  {
    n: 22, act: 2, title: 'Soldier #—',
    when: rev(100),
    text: 'You are addressed by number now. It has been happening for some time. Nobody announced the change and you did not notice the first one.',
  },

  // ── ACT III — THE TURN ────────────────────────────────────────────
  {
    n: 23, act: 3, title: 'What a Myriad Is',
    when: rank(1000),
    text: 'A myriad is ten thousand soldiers. That is the whole of the definition. It was not intended to be a definition of anything else.',
  },
  {
    n: 24, act: 3, title: 'What a God Is',
    when: rank(2000),
    text: 'A sufficient number of the same thing, counting. That is all. The surgeons found no organ that was not simply more of the others, arranged so as to agree.',
  },
  {
    n: 25, act: 3, title: 'The Replacement',
    when: (s) => s.interments >= 3,
    text: 'The Myriad did not kill it by defeating it. There was nothing there to defeat. They killed it by being enough of the same thing, in the same place, counting — and a replacement takes time to finish becoming.',
  },
  {
    n: 26, act: 3, title: 'Why It Will Not Stop',
    when: rank(4000),
    text: 'It is not an immune system. Nothing is defending anything. It is assembly. Every corpse it hands back has been checked against a specification, and the specification is getting closer.',
  },
  {
    n: 27, act: 3, title: 'The Last Order',
    when: (s) => s.apotheoses >= 1 || s.ichor > 0,
    text: 'There was never a ten thousandth. There were nine thousand nine hundred and ninety-nine, and a space at the end of the line, and an instruction to fill it. You have been filling it. You are almost finished.',
  },
  {
    n: 28, act: 3, title: 'On the Nothing',
    when: (s) => s.bestRankEver >= 500 && s.apotheoses >= 1,
    text: 'They have no names. Every other thing down here was given one, however badly. These were not omitted. There was nothing to omit.',
  },
  {
    n: 29, act: 3, title: 'The Margin',
    when: (s) => s.apotheoses >= 2,
    text: 'Somebody wrote "stop" in the margin of the casualty return, once, in a different hand, and never again. It has been checked against every hand in the Myriad. It matches one of them.',
  },
  {
    n: 30, act: 3, title: 'Ten Thousand',
    when: (s) => s.myriadFelled,
    text: 'The number on your coat does not change any more. There is nowhere for it to go. You are the space at the end of the line and the line is behind you and it is still coming.',
  },

  // ── ACT I — THE ROAD AND THE THINGS ON IT ─────────────────────────
  {
    n: 31, act: 1, title: 'On the Small Ones',
    when: kills(50),
    text: 'KOZŌ are counted in the return as "chaff, various." The clerk who chose that word was asked to justify it and wrote: they are children, sir, and there is no end of them, and I have run out of ways to write that down.',
  },
  {
    n: 32, act: 1, title: 'The Hundredth Year',
    when: kills(200),
    text: 'A thing kept a hundred years opens an eye. This is not a curse. It is simply what happens to anything that is used and used and never once thanked. The army is aware. The army issues nothing older than ninety-nine years.',
  },
  {
    n: 33, act: 1, title: 'Property Return, Annotated',
    when: rank(15),
    text: 'One sandal, straw, worn. One umbrella, oiled paper, torn. One lantern, paper, split. All three items are listed as MISSING and all three items are listed, four pages later, as ENEMY. No one has reconciled the pages.',
  },
  {
    n: 34, act: 1, title: 'The River',
    when: rank(30),
    text: 'The Sanzu is crossed three ways: the bridge, the shallows, the deep water, and which one you get is decided by what you did. You have crossed it eleven times. You have never once seen the bridge.',
  },
  {
    n: 35, act: 1, title: 'The Old Woman at the Bank',
    when: rank(40),
    text: 'She takes your clothes and hangs them on the branch, and the branch bends, and the depth of the bend is the weight of what you did. Yours bent once and did not come back up. She has stopped weighing you. She just takes the coat now.',
  },
  {
    n: 36, act: 1, title: 'Riverbed at Sai',
    when: deaths(5),
    text: 'Children stack stones on the bank to build a tower to heaven, and each night the demons kick them flat, and each morning the children start again. You have been issued a shovel. You have not been told which side you are working for.',
  },
  {
    n: 37, act: 1, title: 'Kit Inspection',
    when: rev(4),
    text: 'Straw cloak: adequate. Blade: adequate. Boots: adequate. Soldier: adequate. Every line on this form reads adequate, in the same hand, and the form was filled in before you arrived.',
  },
  {
    n: 38, act: 1, title: 'On the Red and the Blue',
    when: kills(500),
    text: 'The red one does the work. The blue one keeps the record of the work. When you kill the red one the blue one writes it down without looking up, and when you kill the blue one the red one keeps going, because it was never reading.',
  },
  {
    n: 39, act: 1, title: 'The Dish on Its Head',
    when: kills(800),
    text: 'A KAPPA must be bowed to. It will bow back, being unfailingly polite, and the water will run out of the dish on its skull and it will be helpless. This works every time. It has worked every time for a thousand years and the KAPPA still bow back.',
  },
  {
    n: 40, act: 1, title: 'Standing Orders, Paragraph One',
    when: rev(6),
    text: 'You are not required to understand the objective. You are required to advance toward it. Paragraph two, which defined the objective, has been removed at the request of the office that wrote it.',
  },
  {
    n: 41, act: 1, title: 'A Hundred Candles',
    when: rev(8),
    text: 'The game is played with a hundred candles: tell a ghost story, blow one out, and when the last goes dark something arrives. The garrison played it. The garrison is very careful now to always leave one lit. This is why there is a lantern in every window and why none of them are for seeing by.',
  },
  {
    n: 42, act: 1, title: 'On Bones',
    when: kills(1500),
    text: 'The ishi you collect are not currency. There is nothing down here to buy. They are simply what is left, and the army has decided that a soldier who is collecting something is a soldier who is not asking questions.',
  },
  {
    n: 43, act: 1, title: 'The Great Skeleton',
    when: rank(60),
    text: 'GASHADOKURO is assembled from everyone who starved without being buried. It is not one ghost. It is a consensus. When it opens its jaw you can hear the individual complaints, and they are all the same complaint, and it is not about dying.',
  },
  {
    n: 44, act: 1, title: 'Casualty Return, Blank',
    when: deaths(10),
    text: 'The form has a field for CAUSE. Acceptable entries are: enemy action, misadventure, and other. Ninety-one per cent of returns filed from the Hollow are marked other. There has been no review.',
  },
  {
    n: 45, act: 1, title: 'The Procession',
    when: rank(80),
    text: 'One night in every summer month they walk — the hundred, in a line, through the streets, and any human who sees them dies unless a sutra is on their person. The Hyakki Yagyō has been walking through the Hollow every night for as long as the records go back. Nobody has thought to ask what it is fleeing.',
  },
  {
    n: 46, act: 1, title: 'Sutra, Unissued',
    when: rev(10),
    text: 'Quartermaster confirms the protective sutra is standard issue and confirms that stocks are adequate and confirms that none have been issued. All three statements are true. The sutras are in the store. The store is on the other side of the Hollow.',
  },

  // ── ACT II — THE COURT AND THE MACHINERY ──────────────────────────
  {
    n: 47, act: 2, title: 'The Ten',
    when: rank(100),
    text: 'Ten kings sit in sequence and the dead are passed along the bench, each king ruling on one aspect, none of them ruling on the whole. This is not cruelty. It is procedure. Cruelty would require someone to have read the file end to end.',
  },
  {
    n: 48, act: 2, title: 'The First King',
    when: (s) => s.standsThisRun >= 1 || s.bestRankEver >= 110,
    text: 'SHINKŌ-Ō asks only when you died. Not how, not why. He has a very small job and he does it perfectly and he has never once been wrong, and the dead who reach him are always surprised that this is not a comfort.',
  },
  {
    n: 49, act: 2, title: 'The Mirror',
    when: rank(130),
    text: 'The second court keeps a mirror that shows what you did rather than what you say you did. There is no arguing with it. Soldiers report that the worst part is not being caught. The worst part is that it is boring to watch, and it takes exactly as long as your life did.',
  },
  {
    n: 50, act: 2, title: 'On Hearings',
    when: (s) => s.standFails >= 1,
    text: 'A Stand is not a battle. It is a hearing that has run out of paper. When the timer ends the court does not rule against you — it simply stops hearing you, which the regulations are careful to note is a different thing.',
  },
  {
    n: 51, act: 2, title: 'Adjournment',
    when: (s) => s.standFails >= 3,
    text: 'You have been adjourned three times. An adjournment is not a loss. It is recorded in the margin as "the matter was not reached." The matter is never reached. There is a room where the matters that were not reached are kept and it is the largest room in the Hollow.',
  },
  {
    n: 52, act: 2, title: 'The Eight Hot Ones',
    when: rank(160),
    text: 'Eight hells, stacked, each one lasting longer than the last by a factor nobody writes down because the number stops meaning anything around the third. The engineers who built them were very proud of the stacking. Nobody asks what is under the eighth.',
  },
  {
    n: 53, act: 2, title: 'Descent Authorisation',
    when: cleared(1),
    text: 'You are authorised to proceed below. You are not authorised to return by the route you took. This is not a punishment; it is that the route does not persist. It was made by you walking down it and it closes behind you like water.',
  },
  {
    n: 54, act: 2, title: 'What the Keys Are',
    when: cleared(3),
    text: 'They are not keys. They are permissions, and they regenerate because somewhere above you a clerk is signing them at a fixed rate, and has been, without pause, for longer than the clerk has been alive.',
  },
  {
    n: 55, act: 2, title: 'On Relics',
    when: relics(3),
    text: 'Every relic was somebody’s. The blade has a notch its owner put there. The charm was folded by someone who believed folding it would work. It did not work. You are carrying the proof of that and it is making you stronger.',
  },
  {
    n: 56, act: 2, title: 'Inventory, Contested',
    when: relics(8),
    text: 'Eight items recovered, eight items entered, eight items claimed by the estates of the deceased. The estates have been informed that the deceased are, technically, still on strength, and that the matter cannot be settled until they are not.',
  },
  {
    n: 57, act: 2, title: 'The Second Death',
    when: deaths(25),
    text: 'You can die in Yomi. Everyone assumes you cannot, on the grounds that it is already the place for that. The assumption is filed under UNTESTED and has been for some time and you have now tested it twenty-five times.',
  },
  {
    n: 58, act: 2, title: 'On the Returned',
    when: (s) => s.echoes >= 1 || s.ghosts.length >= 10,
    text: 'The coats come back before the men do. Sometimes only the coats come back. The Hollow is scrupulous about returning property and has never been asked to return anything else.',
  },
  {
    n: 59, act: 2, title: 'Chorus',
    when: (s) => s.echoes >= 3,
    text: 'They fight beside you and they do not speak, and this is the mercy in it. Every one of them knows how this ends, because every one of them has already done it, and none of them will tell you, because none of them were told.',
  },
  {
    n: 60, act: 2, title: 'Interment, Form A',
    when: interred(1),
    text: 'To be interred is to be given a name and taken off the roll. You have been given a name. You have not been taken off the roll. The clerk apologises and notes that the two halves of the procedure are handled by different offices.',
  },
  {
    n: 61, act: 2, title: 'Interment, Form B',
    when: interred(3),
    text: 'Three names now. A man with three names is not three men; he is one man that the record has failed on three separate occasions. The record does not see the distinction and the record is what you are made of down here.',
  },
  {
    n: 62, act: 2, title: 'The Vow',
    when: (s) => s.vows.length >= 1,
    text: 'A vow makes the road worse and the reward larger, and the office that administers vows has never once had to enforce one. Everybody keeps them. That is the finding that disturbed the auditors: not that the vows are binding, but that they do not need to be.',
  },
  {
    n: 63, act: 2, title: 'On Ash',
    when: interred(2),
    text: 'Ash is what a Reveille leaves. It is measured by weight and the weight is always exactly right, and no one has ever explained how the Hollow knows how much of you to weigh before you have finished burning.',
  },
  {
    n: 64, act: 2, title: 'Efficiency Note',
    when: rev(25),
    text: 'A review has found that the Hollow processes ten thousand soldiers with a staff of one clerk and no supervisor, and rates this OUTSTANDING. The review does not record who conducted it. The review is in the clerk’s hand.',
  },

  // ── ACT III — THE FLOOR OF IT ─────────────────────────────────────
  {
    n: 65, act: 3, title: 'She Who Went First',
    when: rank(400),
    text: 'She went down to bring someone back and was told not to look, and looked, and what she saw was not a monster. It was simply what happens, continuing, in the dark, at its own pace, without any interest in being seen.',
  },
  {
    n: 66, act: 3, title: 'The Thousand a Day',
    when: rank(600),
    text: 'I will take a thousand of the living every day, she said. Then I will give life to one thousand five hundred, he said, and left. Both parties consider the matter settled. Neither party has checked the arithmetic against the size of the room.',
  },
  {
    n: 67, act: 3, title: 'The Boulder',
    when: rank(800),
    text: 'He sealed the pass with a stone a thousand men could not move and walked back into the world and washed, and the washing made new gods, and everyone remembers that part. Nobody stayed to watch the stone. The stone is doing fine. The stone is not the problem.',
  },
  {
    n: 68, act: 3, title: 'On the Food',
    when: (s) => s.apotheoses >= 1,
    text: 'Eat anything here and you belong here. This is the only rule in Yomi that has never had an exception, an appeal, or a form. You have eaten nothing. It has made no difference at all, and that is the part worth thinking about.',
  },
  {
    n: 69, act: 3, title: 'Apotheosis, Note',
    when: (s) => s.apotheoses >= 1,
    text: 'The word means being made a god. The Hollow uses it in the technical sense: a change of category on the roll. You have been recategorised. Your duties are unchanged.',
  },
  {
    n: 70, act: 3, title: 'The Authored',
    when: (s) => s.authored !== null,
    text: 'Your best is now standing at a gate with a spear, and it will not stand aside, and it is not pretending. It genuinely believes it is holding the line. It is. The line is just facing the other way now.',
  },
  {
    n: 71, act: 3, title: 'Reissue',
    when: (s) => s.authored !== null && s.apotheoses >= 2,
    text: 'The Hollow reissues its dead because it has never been authorised to discharge anyone. This is not malice. Discharge requires a signature from an office that was closed before the Hollow was dug.',
  },
  {
    n: 72, act: 3, title: 'What the Number Means',
    when: rank(1200),
    text: 'Ten thousand is not a count. In the old writing it is the character for "everything," used when the writer has stopped counting and wants you to stop too. Your coat says you are the last of everything. The clerk who issued it was not being poetic. The clerk had run out of characters.',
  },
  {
    n: 73, act: 3, title: 'On the Hollow',
    when: rank(1600),
    text: 'It is not a place. It is the shape left when something is removed carefully enough that the edges hold. Everyone assumes something was taken out of the world to make it. The engineers’ notes suggest the opposite: that the Hollow is the original, and the world is the part that was added later, badly, over the top.',
  },
  {
    n: 74, act: 3, title: 'The Clerk',
    when: (s) => s.apotheoses >= 3,
    text: 'You have found the office. There is one desk, one lamp, one hand, and ten thousand files, and the hand is writing your name in a file that is already full of it. You ask the clerk to stop. The clerk writes down that you asked.',
  },
  {
    n: 75, act: 3, title: 'Same Hand',
    when: (s) => s.apotheoses >= 3,
    text: 'Every name in the muster is in the same hand because there was only ever one soldier and ten thousand attempts at writing him down. You are not the ten-thousandth man. You are the ten-thousandth draft.',
  },
  {
    n: 76, act: 3, title: 'The Margin, Continued',
    when: (s) => s.apotheoses >= 4,
    text: 'The word in the margin was checked against every hand in the Myriad and matched one of them. It has now been checked again, more carefully. It matches yours. It was written before you could hold a brush.',
  },
  {
    n: 77, act: 3, title: 'On Ghosts',
    when: (s) => s.ghosts.length >= 100,
    text: 'A yūrei stays because something is unfinished, and goes when it is finished, and this is the whole of the theology. A hundred of you are standing in the dark behind this sentence. None of them have gone. Consider what that says about the work.',
  },
  {
    n: 78, act: 3, title: 'The Objection',
    when: (s) => s.myriadFelled,
    text: 'At the end you are permitted one objection, in writing, to be filed with the office that issued the march order. The office that issued the march order is this one. You are holding the brush. You have been holding it the entire time.',
  },
  {
    n: 79, act: 3, title: 'Discharge',
    when: (s) => s.myriadFelled && s.apotheoses >= 2,
    text: 'The form exists. It has always existed. It requires one signature, from the officer commanding, and the officer commanding is a space on a page that nobody has ever been appointed to fill, and the space is exactly the size of a man.',
  },
  {
    n: 80, act: 3, title: 'Stop',
    when: (s) => s.myriadFelled && s.apotheoses >= 3,
    text: 'You write it in the margin, in a different hand, once, and never again. Somebody a long way below you is just now reaching the part of the file where it appears. They will check it against every hand in the Myriad. It will match one of them.',
  },

  // ── THE HUNDRED STORIES ───────────────────────────────────────────
  // Hyakumonogatari Kaidankai: a hundred candles, a hundred tales, and the
  // agreement that after the last one something comes. These are the stories
  // the garrison tells, unlocked by the deep play only a long campaign reaches.
  {
    n: 81, act: 3, title: 'The First Candle',
    when: (s) => s.reveilles >= 30,
    text: 'The game is old and the rule is simple. A hundred candles, a hundred stories, and one candle put out at the end of each. You have lit the first. There is a great deal of light in the room still. That is the part everyone remembers fondly, afterward.',
  },
  {
    n: 82, act: 3, title: 'The Woman in the Snow',
    when: (s) => s.reveilles >= 35,
    text: 'She spares the young one on the condition he never tell, and then she marries him, and years later he tells, fondly, not realising. She does not kill him. She has children to think of now. She only looks at him the way the cold looks at a window, and leaves.',
  },
  {
    n: 83, act: 3, title: 'The Ears',
    when: (s) => s.ghosts.length >= 200,
    text: 'They wrote the sutra over every inch of the blind boy so the dead could not find him, and forgot his ears. The dead came, and found two ears floating in the dark with no boy attached, and took what they could. He lived. He was known, forever after, as the one who was almost hidden well enough.',
  },
  {
    n: 84, act: 3, title: 'The Peony Lantern',
    when: (s) => s.echoes >= 4,
    text: 'He hears her sandals on the path each night and lets her in each night, and the neighbour looks through the wall and sees him embracing a skeleton with a peony lantern beside it. They warn him. He bars the door. He is found in the morning, smiling, in the graveyard, which is a kind of keeping a promise.',
  },
  {
    n: 85, act: 3, title: 'The Wall',
    when: (s) => s.bestRankEver >= 500,
    text: 'Nurikabe. You are walking, and then you are not, because there is a wall, and the wall was not there and is not not there. You cannot go around it — it widens as you try. The old advice is to knock on it low, at the bottom. Nobody remembers why it works. It works.',
  },
  {
    n: 86, act: 3, title: 'The Faceless',
    when: (s) => s.bestRankEver >= 600,
    text: 'You meet someone weeping on the road and ask what is wrong, and they turn, and there is nothing on the front of their head at all. You run to a lantern-seller and gasp out what you saw, and he says “was it a face like this?” and wipes his own away. There is no telling how far this goes. There may be no one down here with a face.',
  },
  {
    n: 87, act: 3, title: 'The Long Tongue',
    when: (s) => s.descentsCleared >= 8,
    text: 'Akaname. It comes at night to the filthy bath and licks it clean, and this is presented in the old book as a horror, and every child who hears it thinks: but then the bath is clean. The horror was never the tongue. It was being the kind of house it would visit.',
  },
  {
    n: 88, act: 3, title: 'The Boy on the Ceiling',
    when: (s) => s.totalDeaths >= 60,
    text: 'You wake because you feel watched and there is a child pressed flat against the ceiling, looking down, patient. Zashiki-warashi brings a house fortune while it stays and ruin the day it leaves. So the correct response to the horror on your ceiling is to beg it, please, to stay.',
  },
  {
    n: 89, act: 3, title: 'The Cow-Faced Prophet',
    when: (s) => s.apotheoses >= 1,
    text: 'The kudan is born, speaks one true prophecy, and dies within three days, and its prophecies have never once been wrong. It has been telling you the same thing every time you reach this depth. You have not been writing it down. It is getting tired of repeating itself.',
  },
  {
    n: 90, act: 3, title: 'The Severed Head Rain',
    when: (s) => s.apotheoses >= 1,
    text: 'On certain nights it does not rain water. The old accounts are calm about this, which is the frightening part — they note the phenomenon, its season, its direction, as if cataloguing weather. Everything here has been catalogued. Everything here has been survived by a clerk with good handwriting.',
  },
  {
    n: 91, act: 3, title: 'The Umbrella That Watched',
    when: (s) => s.totalKills >= 8000,
    text: 'You have put down thousands of the woken objects and you begin to understand the arrangement. They were used and thrown out and came back with one eye, and all they ever wanted was to be acknowledged before the end. You have been acknowledging them, one at a time, with a blade. It counts. It is not what they meant, but it counts.',
  },
  {
    n: 92, act: 3, title: 'The Drum of the Storm',
    when: (s) => s.bestRankEver >= 800,
    text: 'Raijin beats the drums and the thunder comes, and children are told to hide their navels or he will take them. It is a small story to keep small people safe from lightning. Down here it has curdled: there is a drumming, far off, always approaching, and everyone is very careful now about what they let it take.',
  },
  {
    n: 93, act: 3, title: 'The Thousand-Year Fox',
    when: (s) => s.reveilles >= 60,
    text: 'A fox that lives long enough grows tails, and wisdom, and the ability to wear a face that is not a face. The oldest of them advise emperors. One of them has been advising you, in the shape of your own resolve, telling you the deeper dark is worth it. You have always agreed. You have never asked whose interest that serves.',
  },
  {
    n: 94, act: 3, title: 'The Spider Woman',
    when: (s) => s.descentsCleared >= 15,
    text: 'Jorōgumo is beautiful until the moment she is architecture. The web is the story: everything caught in it was, at some earlier point, moving under its own power toward something it wanted. You have wanted the depths this whole time. Consider, once, what has been letting you want them.',
  },
  {
    n: 95, act: 3, title: 'The Ninety-Sixth Candle',
    when: (s) => s.apotheoses >= 2,
    text: 'Four left. The room is dim now. This is the part of the night the old accounts stop being playful, because at this point the players always report the same thing: that the dark between the candles has begun to seem occupied, and that no one is willing to be the one who says so.',
  },
  {
    n: 96, act: 3, title: 'The Thing at Ninety-Nine',
    when: (s) => s.apotheoses >= 3,
    text: 'The traditional wisdom is to stop at ninety-nine. Tell the ninety-ninth story, leave the last candle burning, and go home while there is still one light. Every account that survived to be written down stopped at ninety-nine. This is worth sitting with. The complete accounts are the ones nobody was left to write.',
  },
  {
    n: 97, act: 3, title: 'The Blue Face',
    when: (s) => s.myriadFelled,
    text: 'Aoandon. When the hundredth story is told and the hundredth candle snuffed, a woman in white with a blue-lit face, horns, and blackened teeth is said to appear in the dark that follows. She is not described as doing anything. She is only there, at the end of the counting, which turns out to be enough.',
  },
  {
    n: 98, act: 3, title: 'The Reason for the Rule',
    when: (s) => s.myriadFelled && s.apotheoses >= 2,
    text: 'The stories were never the summoning. The counting was. A hundred is the number that means everything, and to count to it deliberately, in the dark, one small dread at a time, is to build a road for the thing that lives at everything to walk in on. You have been counting your whole descent. You called this playing.',
  },
  {
    n: 99, act: 3, title: 'The Ninety-Ninth',
    when: (s) => s.myriadFelled && s.apotheoses >= 4,
    text: 'This is the last story you get for free. There is one after it. You could stop here — leave the final candle, keep the one light, close the book with everything survived and nothing owed. The room is very dark and very quiet and the choice is, genuinely, yours. It always was. That was the cruelty in it.',
  },
  {
    n: 100, act: 3, title: 'The Hundredth Story',
    // The one story you cannot be given. It opens only when the other
    // ninety-nine are read — the counting completed, deliberately, in the dark.
    when: (s) => s.fragments.filter((n) => n >= 1 && n <= 99).length >= 99,
    text: 'There is no text. You reached the end of the counting and the last candle is in your hand and the room is waiting to see whether you put it out. Nothing here has ever been able to make you do anything. That was the whole horror and the whole mercy of it. Snuff it or keep it. Either way, now, you know what you are: the hundredth thing, the one the stories were counting toward, standing in your own dark, holding the only light.',
  },
]

export const FRAGMENT_BY_N: Record<number, Fragment> = Object.fromEntries(
  FRAGMENTS.map((f) => [f.n, f]),
)

/** Any fragment newly earned since last checked. */
export function newFragments(s: GameState): Fragment[] {
  return FRAGMENTS.filter((f) => !s.fragments.includes(f.n) && f.when(s))
}

/** The hundred stories of Hyakumonogatari, minus the one you cannot be given. */
export const CANDLE_COUNT = 100

/** How many of the first ninety-nine candles have been put out. */
export function snuffedCount(snuffed: number[]): number {
  return snuffed.filter((n) => n >= 1 && n <= 99).length
}

/** 0..1 — how dark the room has become. Only the read stories count. */
export function roomDarkness(snuffed: number[]): number {
  return Math.min(1, snuffedCount(snuffed) / 99)
}

/**
 * The hundredth story opens only when the other ninety-nine are dark — the
 * counting deliberately completed. This is the one gate in the game that is
 * about having *read*, not having *reached*.
 */
export function canSnuffHundredth(snuffed: number[]): boolean {
  return snuffedCount(snuffed) >= 99
}
