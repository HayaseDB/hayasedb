import type { SeedEpisode, SeedSeason, SeedStructure } from '../../../types'

type EpisodeRow = [
  number: string,
  airDate: string,
  japanese: string,
  english: string,
  overview?: string,
]

const DEFAULT_DURATION = 1_440

function released(
  rows: EpisodeRow[],
  durationSeconds = DEFAULT_DURATION,
): SeedEpisode[] {
  return rows.map(([number, airDate, japanese, english, overview]) => ({
    number,
    type: 'REGULAR',
    status: 'RELEASED',
    airDate,
    durationSeconds,
    translations: [
      { locale: 'ja-Jpan', title: japanese, original: true },
      { locale: 'en', title: english, overview },
    ],
  }))
}

const attackOnTitanCour1 = released([
  [
    '1',
    '2013-04-07',
    '二千年後の君へ ―シガンシナ陥落①―',
    'To You, in 2000 Years: The Fall of Shiganshina, Part 1',
    'The Colossal Titan breaches Wall Maria and Eren watches his mother die in the ruins of Shiganshina.',
  ],
  [
    '2',
    '2013-04-14',
    'その日 ―シガンシナ陥落②―',
    'That Day: The Fall of Shiganshina, Part 2',
    'Survivors flee behind Wall Rose while Eren swears to wipe every titan from the earth.',
  ],
  [
    '3',
    '2013-04-21',
    '解散式の夜 ―人類の再起①―',
    "A Dim Light Amid Despair: Humanity's Comeback, Part 1",
    'Cadet training begins and Eren struggles with the vertical manoeuvring equipment.',
  ],
  [
    '4',
    '2013-04-28',
    '初陣 ―トロスト区攻防戦①―',
    "The Night of the Closing Ceremony: Humanity's Comeback, Part 2",
    'Graduation celebrations end abruptly as the Colossal Titan returns to Trost.',
  ],
  [
    '5',
    '2013-05-05',
    '初陣 ―トロスト区攻防戦①―',
    'First Battle: The Struggle for Trost, Part 1',
    'The cadets face real titans for the first time and the vanguard is overwhelmed.',
  ],
  [
    '6',
    '2013-05-12',
    '少女が見た世界 ―トロスト区攻防戦②―',
    'The World the Girl Saw: The Struggle for Trost, Part 2',
    "Mikasa's past with Eren is revealed as she rallies the retreating cadets.",
  ],
  [
    '7',
    '2013-05-19',
    '小さな刃 ―トロスト区攻防戦③―',
    'Small Blade: The Struggle for Trost, Part 3',
    'Armin is rescued by a titan that turns on its own kind.',
  ],
  [
    '8',
    '2013-05-26',
    '心臓の鼓動が聞こえる ―トロスト区攻防戦④―',
    'I Can Hear His Heartbeat: The Struggle for Trost, Part 4',
    'The mysterious titan clears a path toward the supply depot.',
  ],
  [
    '9',
    '2013-06-02',
    '左腕の行方 ―トロスト区攻防戦⑤―',
    'Whereabouts of His Left Arm: The Struggle for Trost, Part 5',
    "Eren emerges from the titan's nape and the garrison turns its cannons on him.",
  ],
  [
    '10',
    '2013-06-09',
    '応える ―トロスト区攻防戦⑥―',
    'Response: The Struggle for Trost, Part 6',
    'Armin argues for Eren before Commander Pyxis as the plan to seal the gate forms.',
  ],
  [
    '11',
    '2013-06-16',
    '偶像 ―トロスト区攻防戦⑦―',
    'Idol: The Struggle for Trost, Part 7',
    'Pyxis rallies the terrified soldiers behind an untested weapon.',
  ],
  [
    '12',
    '2013-06-23',
    '傷 ―トロスト区攻防戦⑧―',
    'Wound: The Struggle for Trost, Part 8',
    'Eren loses control of his titan form and turns on Mikasa.',
  ],
  [
    '13',
    '2013-06-30',
    '原初的欲求 ―トロスト区攻防戦⑨―',
    'Primal Desire: The Struggle for Trost, Part 9',
    'The boulder is set and Trost becomes the first district reclaimed from the titans.',
  ],
])

const attackOnTitanCour2 = released([
  [
    '14',
    '2013-07-14',
    'まだ目を見れない ―反撃前夜①―',
    "Can't Look into His Eyes Yet: Eve of the Counterattack, Part 1",
    'Eren wakes in a cell and is placed under the authority of the Survey Corps.',
  ],
  [
    '15',
    '2013-07-21',
    '特別作戦班 ―反撃前夜②―',
    'Special Operations Squad: Eve of the Counterattack, Part 2',
    "Levi's handpicked squad takes Eren to an abandoned castle beyond the walls.",
  ],
  [
    '16',
    '2013-07-28',
    '今、何をすべきか ―反撃前夜③―',
    'What Needs to Be Done Now: Eve of the Counterattack, Part 3',
    'Preparations begin for the 57th expedition outside Wall Rose.',
  ],
  [
    '17',
    '2013-08-04',
    '女型の巨人 ―壁外調査①―',
    'Female Titan: The 57th Exterior Scouting Mission, Part 1',
    'An intelligent titan tears through the formation hunting for Eren.',
  ],
  [
    '18',
    '2013-08-11',
    '巨大樹の森 ―壁外調査②―',
    'Forest of Giant Trees: The 57th Exterior Scouting Mission, Part 2',
    'Erwin leads the corps into the forest without explaining his plan.',
  ],
  [
    '19',
    '2013-08-18',
    '噛みつく ―壁外調査③―',
    'Bite: The 57th Exterior Scouting Mission, Part 3',
    'Eren must choose between trusting his squad and fighting alone.',
  ],
  [
    '20',
    '2013-08-25',
    'エルヴィン・スミス ―壁外調査④―',
    'Erwin Smith: The 57th Exterior Scouting Mission, Part 4',
    'The trap closes on the Female Titan at a devastating cost.',
  ],
  [
    '21',
    '2013-09-01',
    '鉄槌 ―壁外調査⑤―',
    'Crushing Blow: The 57th Exterior Scouting Mission, Part 5',
    'The Female Titan breaks free and Levi arrives to intervene.',
  ],
  [
    '22',
    '2013-09-08',
    '敗者たち ―壁外調査⑥―',
    'The Defeated: The 57th Exterior Scouting Mission, Part 6',
    'The expedition returns with heavy losses and no answers.',
  ],
  [
    '23',
    '2013-09-15',
    '微笑み ―ストヘス区急襲①―',
    'Smile: Assault on Stohess, Part 1',
    'The corps escorts Eren to the capital with a plan to expose the Female Titan.',
  ],
  [
    '24',
    '2013-09-22',
    '慈悲 ―ストヘス区急襲②―',
    'Mercy: Assault on Stohess, Part 2',
    'Annie is cornered in the streets of Stohess.',
  ],
  [
    '25',
    '2013-09-29',
    '壁 ―ストヘス区急襲③―',
    'Wall: Assault on Stohess, Part 3',
    'The battle ends with a revelation hidden inside the walls themselves.',
  ],
])

const attackOnTitanSpecials: SeedEpisode[] = [
  {
    number: '13.5',
    type: 'RECAP',
    status: 'RELEASED',
    airDate: '2013-07-07',
    durationSeconds: 1_440,
    translations: [
      { locale: 'ja-Jpan', title: 'あの日から', original: true },
      {
        locale: 'en',
        title: 'Since That Day',
        overview:
          'A recap of the fall of Shiganshina and the battle for Trost.',
      },
    ],
  },
  {
    number: '25.5',
    type: 'RECAP',
    status: 'RELEASED',
    airDate: '2014-01-10',
    durationSeconds: 1_440,
    translations: [
      { locale: 'ja-Jpan', title: 'イルゼの手帳', original: true },
      {
        locale: 'en',
        title: "Ilse's Notebook",
        overview:
          'Hange investigates the journal of a scout who met a talking titan.',
      },
    ],
  },
  {
    number: null,
    type: 'PROMO',
    status: 'RELEASED',
    airDate: '2013-03-20',
    durationSeconds: 90,
    translations: [
      { locale: 'ja-Jpan', title: '進撃の巨人 本予告', original: true },
      { locale: 'en', title: 'Main Trailer' },
    ],
  },
]

const attackOnTitanSeasons: SeedSeason[] = [
  {
    kind: 'COUR',
    number: '1',
    translations: [
      { locale: 'ja-Jpan', title: '第1クール', original: true },
      { locale: 'en', title: 'Cour 1' },
      { locale: 'de', title: 'Cour 1' },
    ],
    episodes: attackOnTitanCour1,
  },
  {
    kind: 'COUR',
    number: '2',
    translations: [
      { locale: 'ja-Jpan', title: '第2クール', original: true },
      { locale: 'en', title: 'Cour 2' },
      { locale: 'de', title: 'Cour 2' },
    ],
    episodes: attackOnTitanCour2,
  },
  {
    kind: 'SPECIALS',
    number: null,
    translations: [
      { locale: 'ja-Jpan', title: '特別編', original: true },
      { locale: 'en', title: 'Specials' },
    ],
    episodes: attackOnTitanSpecials,
  },
]

const flclEpisodes = released(
  [
    [
      '1',
      '2000-04-26',
      'フリクリ',
      'Fooly Cooly',
      "Naota's ordinary life is upended when a Vespa-riding stranger runs him over and a robot emerges from his forehead.",
    ],
    [
      '2',
      '2000-06-21',
      'ファイスタ',
      'Fire Starter',
      'A string of fires stirs old memories for Mamimi while Naota adjusts to the new resident of his home.',
    ],
    [
      '3',
      '2000-08-23',
      'マルラバ',
      'Marquis de Carabas',
      'Naota and class president Ninamori rehearse a school play as pressure builds around her family.',
    ],
    [
      '4',
      '2000-10-25',
      'フリキリ',
      'Full Swing',
      'A baseball game forces Naota to decide whether he is ready to swing for himself.',
    ],
    [
      '5',
      '2000-12-21',
      'ブラブレ',
      'Brittle Bullet',
      'Amarao reveals more about Haruko as a new threat closes in on the town.',
    ],
    [
      '6',
      '2001-03-16',
      'フリクラ',
      'FLCLimax',
      'With Medical Mechanica bearing down, Naota confronts Haruko and the summer that changed him.',
    ],
  ],
  1_500,
)

const cyberpunkEpisodes = released(
  [
    [
      '1',
      '2022-09-13',
      'ラットボーイ',
      'Let You Down',
      'David loses everything in a single night and takes the military-grade implant that killed its last owner.',
    ],
    [
      '2',
      '2022-09-13',
      'ラッキーホール',
      'Like a Boy',
      'Lucy pulls David into his first real job and the pair start to trust each other.',
    ],
    [
      '3',
      '2022-09-13',
      'スモークとミラーズ',
      'Smooth Criminal',
      'Maine adds David to the crew and the edgerunners take on a corporate courier.',
    ],
    [
      '4',
      '2022-09-13',
      'ネオンの街で',
      'Nocturne Op. 55 No. 1',
      'A quiet night out shows David the life he could have outside the street.',
    ],
    [
      '5',
      '2022-09-13',
      'オールモスト・ゼア',
      'All Eyez on Me',
      'The crew takes a job that pushes their chrome tolerance past the safe line.',
    ],
    [
      '6',
      '2022-09-13',
      'ジラーレ',
      'Girl on Fire',
      'Lucy tells David what she wants from the moon and what it will cost.',
    ],
    [
      '7',
      '2022-09-13',
      'ウィンター',
      'Stronger',
      'A rescue turns into a firefight that no amount of chrome can win cleanly.',
    ],
    [
      '8',
      '2022-09-13',
      'ドント・フィア・ザ・リーパー',
      'Rebel Rebel',
      'Arasaka closes in and David makes a choice he cannot take back.',
    ],
    [
      '9',
      '2022-09-13',
      'あの子は月へ',
      'My Moon My Man',
      'The last run ends the only way Night City ever lets it end.',
    ],
    [
      '10',
      '2022-09-13',
      'エッジランナーズ',
      'Edgerunners',
      'Lucy keeps a promise above a city that never looks up.',
    ],
  ],
  1_500,
)

const deathNoteSeasons: SeedSeason[] = [
  {
    kind: 'ARC',
    number: '1',
    translations: [
      { locale: 'ja-Jpan', title: 'L編', original: true },
      { locale: 'en', title: 'The L Arc' },
      { locale: 'fr', title: 'Arc L' },
    ],
    episodes: released([
      [
        '1',
        '2006-10-04',
        '新生',
        'Rebirth',
        'Light Yagami finds a notebook that kills anyone whose name is written in it.',
      ],
      [
        '2',
        '2006-10-11',
        '対決',
        'Confrontation',
        'A worldwide broadcast draws Kira into his first duel with L.',
      ],
      [
        '3',
        '2006-10-18',
        '取引',
        'Dealings',
        'Light manipulates the investigation while L narrows the search to Kanto.',
      ],
      [
        '4',
        '2006-10-25',
        '追跡',
        'Pursuit',
        'FBI agents are assigned to the Japanese task force families.',
      ],
      [
        '5',
        '2006-11-01',
        '策略',
        'Tactics',
        'Light engineers an alibi that costs an agent their life.',
      ],
    ]),
  },
  {
    kind: 'ARC',
    number: '2',
    translations: [
      { locale: 'ja-Jpan', title: 'ニア編', original: true },
      { locale: 'en', title: 'The Near Arc' },
      { locale: 'fr', title: 'Arc Near' },
    ],
    episodes: released([
      [
        '26',
        '2007-04-04',
        '再生',
        'Renewal',
        'Years pass and a new generation of successors takes up the Kira case.',
      ],
      [
        '27',
        '2007-04-11',
        'あぶり出し',
        'Abduction',
        'Mello moves against the task force and the notebook changes hands.',
      ],
      [
        '28',
        '2007-04-18',
        '仮面',
        'Impatience',
        'Near begins to read the pattern behind the new Kira killings.',
      ],
    ]),
  },
]

const chainsawManSeasons: SeedSeason[] = [
  {
    kind: 'SEASON',
    number: '1',
    translations: [
      { locale: 'ja-Jpan', title: '第1期', original: true },
      { locale: 'en', title: 'Season 1' },
      { locale: 'es', title: 'Temporada 1' },
    ],
    episodes: released([
      [
        '1',
        '2022-10-12',
        '犬とチェンソー',
        'Dog and Chainsaw',
        'Denji sells everything he has to pay a debt and dies for it, until Pochita makes a deal.',
      ],
      [
        '2',
        '2022-10-19',
        '東京到着',
        'Arrival in Tokyo',
        'Denji joins Public Safety and learns what a normal life is supposed to look like.',
      ],
      [
        '3',
        '2022-10-26',
        '帰れ',
        'Meowy’s Whereabouts',
        'A routine extermination traps the team inside a devil that feeds on fear.',
      ],
      [
        '4',
        '2022-11-02',
        '救出',
        'Rescue',
        'Power bargains for her cat and Denji learns what she is willing to trade.',
      ],
    ]),
  },
  {
    kind: 'PART',
    number: '2',
    translations: [
      { locale: 'ja-Jpan', title: '第2部', original: true },
      { locale: 'en', title: 'Part 2' },
      { locale: 'es', title: 'Parte 2' },
    ],
    episodes: [
      {
        number: '13',
        type: 'REGULAR',
        status: 'UPCOMING',
        airDate: null,
        durationSeconds: null,
        translations: [
          { locale: 'ja-Jpan', title: '未定', original: true },
          { locale: 'en', title: 'To be announced' },
        ],
      },
      {
        number: '14',
        type: 'REGULAR',
        status: 'DELAYED',
        airDate: null,
        durationSeconds: null,
        translations: [
          { locale: 'ja-Jpan', title: '延期', original: true },
          {
            locale: 'en',
            title: 'Postponed',
            overview:
              'Production was pushed back and no new date has been set.',
          },
        ],
      },
      {
        number: '15',
        type: 'SPECIAL',
        status: 'CANCELLED',
        airDate: null,
        durationSeconds: null,
        translations: [
          { locale: 'ja-Jpan', title: '中止', original: true },
          {
            locale: 'en',
            title: 'Cancelled special',
            overview:
              'A planned bonus episode that was dropped from the slate.',
          },
        ],
      },
    ],
  },
]

const kusuriyaEpisodes: SeedEpisode[] = [
  {
    number: '1',
    type: 'REGULAR',
    status: 'UPCOMING',
    airDate: '2026-04-04',
    durationSeconds: 1_440,
    translations: [
      { locale: 'ja-Jpan', title: '第一話', original: true },
      {
        locale: 'en',
        title: 'Episode 1',
        overview: 'The third season opens with Maomao back in the rear palace.',
      },
    ],
  },
  {
    number: '2',
    type: 'REGULAR',
    status: 'UPCOMING',
    airDate: '2026-04-11',
    durationSeconds: 1_440,
    translations: [
      { locale: 'ja-Jpan', title: '第二話', original: true },
      { locale: 'en', title: 'Episode 2' },
    ],
  },
  {
    number: null,
    type: 'PROMO',
    status: 'RELEASED',
    airDate: '2025-12-20',
    durationSeconds: 120,
    translations: [
      { locale: 'ja-Jpan', title: '第3期 ティザーPV', original: true },
      { locale: 'en', title: 'Season 3 teaser' },
    ],
  },
]

const shelterEpisodes: SeedEpisode[] = [
  {
    number: '1',
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: '2016-10-18',
    durationSeconds: 366,
    translations: [
      { locale: 'ja-Jpan', title: 'シェルター', original: true },
      {
        locale: 'en',
        title: 'Shelter',
        overview:
          'Rin lives inside a simulation built by her father as the world she knew ends.',
      },
      { locale: 'pt-BR', title: 'Shelter' },
    ],
  },
]

const yourNameEpisodes: SeedEpisode[] = [
  {
    number: null,
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: '2016-08-26',
    durationSeconds: 6_360,
    translations: [
      { locale: 'ja-Jpan', title: '君の名は。', original: true },
      {
        locale: 'en',
        title: 'Your Name.',
        overview:
          'Two strangers discover they have been trading places in their sleep, and that time is not on their side.',
      },
      { locale: 'de', title: 'Your Name. – Gestern, heute und für immer' },
    ],
  },
  {
    number: null,
    type: 'PROMO',
    status: 'RELEASED',
    airDate: '2016-06-10',
    durationSeconds: 105,
    translations: [
      { locale: 'ja-Jpan', title: '本予告', original: true },
      { locale: 'en', title: 'Theatrical trailer' },
    ],
  },
]

export const SEED_STRUCTURES: SeedStructure[] = [
  { animeSlug: 'shingeki-no-kyojin', seasons: attackOnTitanSeasons },
  { animeSlug: 'death-note', seasons: deathNoteSeasons },
  { animeSlug: 'chainsaw-man', seasons: chainsawManSeasons },
  { animeSlug: 'flcl', episodes: flclEpisodes },
  { animeSlug: 'cyberpunk-edgerunners', episodes: cyberpunkEpisodes },
  {
    animeSlug: 'kusuriya-no-hitorigoto-3rd-season',
    episodes: kusuriyaEpisodes,
  },
  { animeSlug: 'shelter', episodes: shelterEpisodes },
  { animeSlug: 'kimi-no-na-wa', episodes: yourNameEpisodes },
]
