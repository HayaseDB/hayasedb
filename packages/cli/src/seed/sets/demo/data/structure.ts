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
    '絶望の中で鈍く光る ―人類の再起①―',
    "A Dim Light Amid Despair: Humanity's Comeback, Part 1",
    'Cadet training begins and Eren struggles with the vertical manoeuvring equipment.',
  ],
  [
    '4',
    '2013-04-28',
    '解散式の夜 ―人類の再起②―',
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
    '女型の巨人 ―第57回壁外調査①―',
    'Female Titan: The 57th Exterior Scouting Mission, Part 1',
    'An intelligent titan tears through the formation hunting for Eren.',
  ],
  [
    '18',
    '2013-08-11',
    '巨大樹の森 ―第57回壁外調査②―',
    'Forest of Giant Trees: The 57th Exterior Scouting Mission, Part 2',
    'Erwin leads the corps into the forest without explaining his plan.',
  ],
  [
    '19',
    '2013-08-18',
    '噛み付く ―第57回壁外調査③―',
    'Bite: The 57th Exterior Scouting Mission, Part 3',
    'Eren must choose between trusting his squad and fighting alone.',
  ],
  [
    '20',
    '2013-08-25',
    'エルヴィン・スミス ―第57回壁外調査④―',
    'Erwin Smith: The 57th Exterior Scouting Mission, Part 4',
    'The trap closes on the Female Titan at a devastating cost.',
  ],
  [
    '21',
    '2013-09-01',
    '鉄槌 ―第57回壁外調査⑤―',
    'Crushing Blow: The 57th Exterior Scouting Mission, Part 5',
    'The Female Titan breaks free and Levi arrives to intervene.',
  ],
  [
    '22',
    '2013-09-08',
    '敗者達 ―第57回壁外調査⑥―',
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
    number: '3.5',
    type: 'SPECIAL',
    status: 'RELEASED',
    airDate: '2013-12-09',
    durationSeconds: 1_620,
    translations: [
      {
        locale: 'ja-Jpan',
        title: 'イルゼの手帳 調査兵団報告書',
        original: true,
      },
      {
        locale: 'en',
        title: "Ilse's Notebook: Notes from a Scout Regiment Member",
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
      '期待を背に',
      'Let You Down',
      'David loses everything in a single night and takes the military-grade implant that killed its last owner.',
    ],
    [
      '2',
      '2022-09-13',
      '少年は何を思う',
      'Like a Boy',
      'Lucy pulls David into his first real job and the pair start to trust each other.',
    ],
    [
      '3',
      '2022-09-13',
      '裏稼業',
      'Smooth Criminal',
      'Maine adds David to the crew and the edgerunners take on a corporate courier.',
    ],
    [
      '4',
      '2022-09-13',
      'ツキが回って',
      'Lucky You',
      'A run finally goes the crew’s way and David tastes the life the chrome can buy.',
    ],
    [
      '5',
      '2022-09-13',
      '刺さる目線',
      'All Eyez on Me',
      'The crew takes a job that pushes their chrome tolerance past the safe line.',
    ],
    [
      '6',
      '2022-09-13',
      '炎に包まれて',
      'Girl on Fire',
      'Lucy tells David what she wants from the moon and what it will cost.',
    ],
    [
      '7',
      '2022-09-13',
      'もっと強く',
      'Stronger',
      'A rescue turns into a firefight that no amount of chrome can win cleanly.',
    ],
    [
      '8',
      '2022-09-13',
      'いかないで',
      'Stay',
      'Arasaka closes in and David makes a choice he cannot take back.',
    ],
    [
      '9',
      '2022-09-13',
      '人間らしさ',
      'Humanity',
      'David pushes past the last line his body can hold for the people he has left.',
    ],
    [
      '10',
      '2022-09-13',
      '私の月、私の恋',
      'My Moon My Man',
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
        '駆引',
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
        '2007-04-11',
        '再生',
        'Renewal',
        'Years pass and a new generation of successors takes up the Kira case.',
      ],
      [
        '27',
        '2007-04-18',
        '誘拐',
        'Abduction',
        'Mello moves against the task force and the notebook changes hands.',
      ],
      [
        '28',
        '2007-04-25',
        '焦燥',
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
        'Dog & Chainsaw',
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
        'ニャーコの行方',
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
    kind: 'ARC',
    number: '2',
    translations: [
      { locale: 'ja-Jpan', title: '公安編', original: true },
      { locale: 'en', title: 'Assassins Arc' },
      { locale: 'es', title: 'Arco de los Asesinos' },
    ],
    episodes: [
      {
        number: '1',
        type: 'REGULAR',
        status: 'UPCOMING',
        airDate: null,
        durationSeconds: null,
        translations: [
          { locale: 'ja-Jpan', title: '未定', original: true },
          {
            locale: 'en',
            title: 'To be announced',
            overview:
              'Production was confirmed at Jump Festa 2026; no broadcast date has been given.',
          },
        ],
      },
      {
        number: '2',
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
        number: null,
        type: 'PROMO',
        status: 'RELEASED',
        airDate: '2025-12-21',
        durationSeconds: 95,
        translations: [
          { locale: 'ja-Jpan', title: '公安編 ティザーPV', original: true },
          { locale: 'en', title: 'Assassins Arc teaser' },
        ],
      },
    ],
  },
]

const finalSeasonPart1 = released([
  [
    '60',
    '2020-12-07',
    '海の向こう側',
    'The Other Side of the Sea',
    'Four years after the fall of Wall Maria, the war is seen from Marley and a new generation of warrior candidates.',
  ],
  [
    '61',
    '2020-12-14',
    '闇夜の列車',
    'Midnight Train',
    'The Eldian units are pulled back from the front and Falco makes a promise he does not understand.',
  ],
  [
    '62',
    '2020-12-21',
    '希望の扉',
    'The Door of Hope',
    "Reiner's memories return to the day the warriors were chosen and the wall was broken.",
  ],
  [
    '63',
    '2020-12-28',
    '手から手へ',
    'From One Hand to Another',
    'Willy Tybur prepares to address the world as Marley celebrates its victory.',
  ],
])

const finalSeasonPart2 = released([
  [
    '76',
    '2022-01-10',
    '正論',
    'Judgment',
    'The Survey Corps is split over the rumbling as Eren acts without them.',
  ],
  [
    '77',
    '2022-01-17',
    '踏切',
    'Sneak Attack',
    'Marley strikes back at Shiganshina and the alliance is forced into the open.',
  ],
])

const finalSeasonSeasons: SeedSeason[] = [
  {
    kind: 'PART',
    number: '1',
    translations: [
      { locale: 'ja-Jpan', title: 'The Final Season 第1部', original: true },
      { locale: 'en', title: 'The Final Season Part 1' },
      { locale: 'de', title: 'The Final Season Teil 1' },
    ],
    episodes: finalSeasonPart1,
  },
  {
    kind: 'PART',
    number: '2',
    translations: [
      { locale: 'ja-Jpan', title: 'The Final Season 第2部', original: true },
      { locale: 'en', title: 'The Final Season Part 2' },
      { locale: 'de', title: 'The Final Season Teil 2' },
    ],
    episodes: finalSeasonPart2,
  },
]

const kusuriyaEpisodes: SeedEpisode[] = [
  {
    number: '1',
    type: 'REGULAR',
    status: 'UPCOMING',
    airDate: '2026-10-03',
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
    airDate: '2026-10-10',
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
    airDate: '2025-10-22',
    durationSeconds: 120,
    translations: [
      { locale: 'ja-Jpan', title: '第3期 ティザーPV', original: true },
      { locale: 'en', title: 'Season 3 teaser' },
    ],
  },
  {
    number: '13',
    type: 'REGULAR',
    status: 'DELAYED',
    airDate: null,
    durationSeconds: null,
    translations: [
      { locale: 'ja-Jpan', title: '未定', original: true },
      {
        locale: 'en',
        title: 'To be announced',
        overview:
          'The second cour is scheduled for April 2027 and has no episode dates yet.',
      },
    ],
  },
  {
    number: null,
    type: 'SPECIAL',
    status: 'CANCELLED',
    airDate: null,
    durationSeconds: null,
    translations: [
      { locale: 'ja-Jpan', title: '中止', original: true },
      {
        locale: 'en',
        title: 'Cancelled special',
        overview: 'A planned bonus episode that was dropped from the slate.',
      },
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

const demonSlayerEpisodes = released([
  [
    '1',
    '2019-04-06',
    '残酷',
    'Cruelty',
    'Tanjiro comes home to a slaughtered family and a sister who is no longer human.',
  ],
  [
    '2',
    '2019-04-13',
    '育手・鱗滝左近次',
    'Trainer Sakonji Urokodaki',
    'A masked cultivator sends Tanjiro up Mount Sagiri to be judged.',
  ],
  [
    '3',
    '2019-04-20',
    '錆兎と真菰',
    'Sabito and Makomo',
    'Two children in fox masks drill Tanjiro until he can cut the boulder.',
  ],
  [
    '4',
    '2019-04-27',
    '最終選別',
    'Final Selection',
    'Seven nights on a mountain of demons decide who becomes a slayer.',
  ],
])

const jujutsuKaisenEpisodes = released([
  [
    '1',
    '2020-10-03',
    '両面宿儺',
    'Ryomen Sukuna',
    'Yuji swallows a cursed finger to save his friends and becomes a vessel.',
  ],
  [
    '2',
    '2020-10-10',
    '自分のために',
    'For Myself',
    'Gojo offers Yuji a stay of execution if he can master his own body.',
  ],
  [
    '3',
    '2020-10-17',
    '鉄骨娘',
    'Girl of Steel',
    'Nobara arrives in Tokyo and the first-years take their first mission together.',
  ],
  [
    '4',
    '2020-10-24',
    '呪胎戴天',
    'Curse Womb Must Die',
    'A special-grade curse in a derelict building outclasses the students.',
  ],
])

const heroAcademiaEpisodes = released([
  [
    '1',
    '2016-04-03',
    '緑谷出久：オリジン',
    'Izuku Midoriya: Origin',
    'In a world of quirks, a boy born without one still runs toward the danger.',
  ],
  [
    '2',
    '2016-04-10',
    'ヒーローの条件',
    'What It Takes to Be a Hero',
    'All Might tells Izuku the truth about One For All and sets him a trial.',
  ],
  [
    '3',
    '2016-04-17',
    'うなれ筋肉',
    'Roaring Muscles',
    'Ten months of hauling scrap off a beach rebuild a body that can hold the quirk.',
  ],
  [
    '4',
    '2016-04-24',
    'スタートライン',
    'Start Line',
    'The U.A. entrance exam pits Izuku against robots and his own broken bones.',
  ],
])

const hunterHunterEpisodes = released([
  [
    '1',
    '2011-10-02',
    'タビダチ×ト×ナカマタチ',
    'Departure × and × Friends',
    'Gon leaves Whale Island to find the father who left him behind.',
  ],
  [
    '2',
    '2011-10-09',
    'シケン×ノ×シケン',
    'Test × of × Tests',
    'The applicants are led underground and the exam begins before anyone notices.',
  ],
  [
    '3',
    '2011-10-16',
    'ライバル×ガ×サバイバル',
    'Rivals × for × Survival',
    'A marathon through the tunnels thins the field and forms the first alliances.',
  ],
  [
    '4',
    '2011-10-23',
    'キボウ×ト×ヤボウ',
    'Hope × and × Ambition',
    'The Numere Wetlands punish anyone who trusts the wrong face.',
  ],
])

const onePunchManEpisodes = released([
  [
    '1',
    '2015-10-05',
    '最強の男',
    'The Strongest Man',
    'Saitama has trained himself into a hero who ends every fight with one punch, and is bored.',
  ],
  [
    '2',
    '2015-10-12',
    '孤高のサイボーグ',
    'The Lone Cyborg',
    'Genos asks to become a disciple and learns the secret is disappointingly plain.',
  ],
  [
    '3',
    '2015-10-19',
    '執念の科学者',
    'The Obsessive Scientist',
    'A scientist unleashes an evolving monster on City A.',
  ],
  [
    '4',
    '2015-10-26',
    '今時の忍者',
    'The Modern Ninja',
    'Speed-o Sound Sonic decides Saitama is the rival he has been looking for.',
  ],
])

const tokyoGhoulEpisodes = released([
  [
    '1',
    '2014-07-04',
    '悲劇',
    'Tragedy',
    'A date ends with Kaneki on an operating table and a ghoul organ inside him.',
  ],
  [
    '2',
    '2014-07-11',
    '孵化',
    'Incubation',
    'Anteiku takes Kaneki in and teaches him what he can no longer eat.',
  ],
  [
    '3',
    '2014-07-18',
    '白鳩',
    'Dove',
    'Investigators of the CCG arrive in the ward hunting the binge eater.',
  ],
  [
    '4',
    '2014-07-25',
    '晩餐',
    'Supper',
    'Kaneki meets a ghoul who keeps a very different kind of table.',
  ],
])

const aotSeason2Episodes = released([
  [
    '26',
    '2017-04-01',
    '獣の巨人',
    'Beast Titan',
    'Titans appear inside Wall Rose and a speaking titan walks among them.',
  ],
  [
    '27',
    '2017-04-08',
    'ただいま',
    'I’m Home',
    'The scouts split to warn the villages as Sasha returns to her own.',
  ],
  [
    '28',
    '2017-04-15',
    '南西へ',
    'Southwestward',
    'The search for the breach turns up no hole in the wall at all.',
  ],
  [
    '29',
    '2017-04-22',
    '兵士',
    'Soldier',
    'Cornered on a tower, the recruits are forced to hold until dawn.',
  ],
])

const fullmetalEpisodes = released([
  [
    '1',
    '2009-04-05',
    '鋼の錬金術師',
    'Fullmetal Alchemist',
    'The Elric brothers chase a false prophet through Reole and show what alchemy costs.',
  ],
  [
    '2',
    '2009-04-12',
    'はじまりの日',
    'The First Day',
    'A flashback to the night the brothers tried to bring their mother back.',
  ],
  [
    '3',
    '2009-04-19',
    '邪教の街',
    'City of Heresy',
    'Cornello’s miracles are exposed as a philosopher’s stone sleight of hand.',
  ],
  [
    '4',
    '2009-04-26',
    '錬金術師の苦悩',
    'An Alchemist’s Anguish',
    'Shou Tucker’s chimera reveals how far a state alchemist will go.',
  ],
])

const narutoEpisodes = released([
  [
    '1',
    '2002-10-03',
    '参上！うずまきナルト',
    'Enter: Naruto Uzumaki!',
    'A failing student steals a forbidden scroll and learns why the village fears him.',
  ],
  [
    '2',
    '2002-10-10',
    '木ノ葉丸だ　コレ！',
    'My Name Is Konohamaru!',
    'The Hokage’s grandson decides Naruto is the rival he needs.',
  ],
  [
    '3',
    '2002-10-17',
    '宿敵!?　サスケとサクラ',
    'Sasuke and Sakura: Friends or Foes?',
    'Team assignments put Naruto beside the two people he least wants.',
  ],
  [
    '4',
    '2002-10-24',
    '試練！サバイバル演習',
    'Pass or Fail: Survival Test',
    'Kakashi’s bell test is about teamwork, and none of them see it.',
  ],
])

const swordArtOnlineEpisodes = released([
  [
    '1',
    '2012-07-08',
    '剣の世界',
    'The World of Swords',
    'Ten thousand players log in to Aincrad and find the logout button gone.',
  ],
  [
    '2',
    '2012-07-15',
    'ビーター',
    'Beater',
    'The first boss falls, and Kirito takes on a name to keep the others safe.',
  ],
  [
    '3',
    '2012-07-22',
    '赤鼻のトナカイ',
    'The Red-Nosed Reindeer',
    'A guild wipes on a floor it was not ready for and Kirito keeps a promise too late.',
  ],
  [
    '4',
    '2012-07-29',
    '黒の剣士',
    'The Black Swordsman',
    'A murder inside a safe zone should not be possible.',
  ],
])

const heroAcademiaSeason2Episodes = released([
  [
    '14',
    '2017-04-01',
    'そういうことね　お茶子さん',
    'That’s the Idea, Ochaco',
    'U.A. returns to class and the sports festival is announced.',
  ],
  [
    '15',
    '2017-04-08',
    'うなれ体育祭',
    'Roaring Sports Festival',
    'The whole country watches as the first obstacle race begins.',
  ],
  [
    '16',
    '2017-04-15',
    'みんな個性的でいいね',
    'In Their Own Quirky Ways',
    'Robots, mines and a narrow bridge sort the field fast.',
  ],
  [
    '17',
    '2017-04-22',
    '策策策',
    'Strategy, Strategy, Strategy',
    'The cavalry battle forces alliances nobody wanted.',
  ],
])

const promisedNeverlandEpisodes = released([
  [
    '1',
    '2019-01-11',
    '121045',
    '121045',
    'Emma and Norman follow a forgotten toy to the gate and learn what the orphanage is for.',
  ],
  [
    '2',
    '2019-01-18',
    '131045',
    '131045',
    'The children start counting the days they have left without telling the others.',
  ],
  [
    '3',
    '2019-01-25',
    '181045',
    '181045',
    'Mama tightens the rules and a tracker is found on every neck.',
  ],
  [
    '4',
    '2019-02-01',
    '291045',
    '291045',
    'Sister Krone arrives and the game becomes two adults against three children.',
  ],
])

const assassinationClassroomEpisodes = released([
  [
    '1',
    '2015-01-09',
    '暗殺の時間',
    'Assassination Time',
    'Class 3-E is given a target worth ten billion yen and a teacher who cannot be killed.',
  ],
  [
    '2',
    '2015-01-16',
    '野球の時間',
    'Baseball Time',
    'Koro-sensei coaches the baseball team while dodging the students’ knives.',
  ],
  [
    '3',
    '2015-01-30',
    'カルマの時間',
    'Karma Time',
    'Karma returns from suspension and tries a more direct approach.',
  ],
  [
    '4',
    '2015-02-06',
    '大人の時間',
    'Grown-Up Time',
    'A professional assassin joins the staff as the new English teacher.',
  ],
])

const mobPsychoEpisodes = released([
  [
    '1',
    '2016-07-12',
    '自称霊能力者・霊幻新隆～とモブ～',
    'Self-Proclaimed Psychic: Arataka Reigen ~And Mob~',
    'A boy with overwhelming psychic power works for a con man who has none.',
  ],
  [
    '2',
    '2016-07-19',
    '青い春の疑問～脳感電波部登場～',
    'Doubts About Youth ~The Telepathy Club Appears~',
    'Mob joins a club that wants his power more than his company.',
  ],
  [
    '3',
    '2016-07-26',
    '集いへの誘い～簡単に言うとモテたい～',
    'An Invitation to a Meeting ~Simply Put, I Just Want to be Popular~',
    'An evil spirit cult recruits the one student who could end it instantly.',
  ],
  [
    '4',
    '2016-08-02',
    '馬鹿オンリーイベント～同類～',
    'Idiots Only Event ~Kin~',
    'Mob’s brother Ritsu watches the gap between them widen.',
  ],
])

const reZeroEpisodes: SeedEpisode[] = [
  {
    number: '1',
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: '2016-04-04',
    durationSeconds: 3_120,
    translations: [
      {
        locale: 'ja-Jpan',
        title: '始まりの終わりと終わりの始まり',
        original: true,
      },
      {
        locale: 'en',
        title: 'The End of the Beginning and the Beginning of the End',
        overview:
          'Subaru is pulled into another world and dies for the first time.',
      },
    ],
  },
  {
    number: '2',
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: '2016-04-11',
    durationSeconds: 1_440,
    translations: [
      { locale: 'ja-Jpan', title: '再会の魔女', original: true },
      {
        locale: 'en',
        title: 'Reunion with the Witch',
        overview:
          'Return by Death sends him back with nothing but the memory of dying.',
      },
    ],
  },
  {
    number: '3',
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: '2016-04-18',
    durationSeconds: 1_440,
    translations: [
      { locale: 'ja-Jpan', title: 'ゼロから始まる異世界生活', original: true },
      {
        locale: 'en',
        title: 'Starting Life from Zero in Another World',
        overview:
          'Subaru realises the loop is his only weapon and it costs him everything each time.',
      },
    ],
  },
  {
    number: '4',
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: '2016-04-25',
    durationSeconds: 1_440,
    translations: [
      { locale: 'ja-Jpan', title: 'ロズワール邸の団欒', original: true },
      {
        locale: 'en',
        title: 'The Happy Roswaal Mansion Family',
        overview:
          'A quiet week at the mansion hides the next thing that will kill him.',
      },
    ],
  },
]

const aotSeason3Part1 = released([
  [
    '38',
    '2018-07-23',
    '狼煙',
    'Smoke Signal',
    'The Survey Corps moves against the interior police to protect Eren and Historia.',
  ],
  [
    '39',
    '2018-07-30',
    '痛み',
    'Pain',
    'Levi’s squad is hunted through the city by an enemy who knows their moves.',
  ],
  [
    '40',
    '2018-08-06',
    '昔話',
    'Old Story',
    'Erwin’s father asked one question about the walls and did not survive it.',
  ],
  [
    '41',
    '2018-08-13',
    '信頼',
    'Trust',
    'The coup begins and the Corps gambles everything on a single confession.',
  ],
])

const aotSeason3Part2 = released([
  [
    '50',
    '2019-04-29',
    'はじまりの街',
    'The Town Where Everything Began',
    'The scouts return to Shiganshina and find the walls waiting for them.',
  ],
  [
    '51',
    '2019-05-06',
    '雷槍',
    'Thunder Spears',
    'The armoured titan meets a weapon built specifically to open it.',
  ],
  [
    '52',
    '2019-05-13',
    '光臨',
    'Descent',
    'The beast titan takes the high ground and the corps runs out of options.',
  ],
  [
    '53',
    '2019-05-20',
    '完全試合',
    'Perfect Game',
    'Erwin asks his soldiers to buy Levi a few seconds with their lives.',
  ],
])

const aotSeason3Seasons: SeedSeason[] = [
  {
    kind: 'PART',
    number: '1',
    translations: [
      { locale: 'ja-Jpan', title: 'Season 3 第1部', original: true },
      { locale: 'en', title: 'Season 3 Part 1' },
    ],
    episodes: aotSeason3Part1,
  },
  {
    kind: 'PART',
    number: '2',
    translations: [
      { locale: 'ja-Jpan', title: 'Season 3 第2部', original: true },
      { locale: 'en', title: 'Season 3 Part 2' },
    ],
    episodes: aotSeason3Part2,
  },
]

const aotSeason3Part2Episodes = released([
  [
    '50',
    '2019-04-29',
    'はじまりの街',
    'The Town Where Everything Began',
    'The scouts return to Shiganshina and find the walls waiting for them.',
  ],
  [
    '51',
    '2019-05-06',
    '雷槍',
    'Thunder Spears',
    'The armoured titan meets a weapon built specifically to open it.',
  ],
  [
    '52',
    '2019-05-13',
    '光臨',
    'Descent',
    'The beast titan takes the high ground and the corps runs out of options.',
  ],
  [
    '53',
    '2019-05-20',
    '完全試合',
    'Perfect Game',
    'Erwin asks his soldiers to buy Levi a few seconds with their lives.',
  ],
])

const narutoShippudenEpisodes = released([
  [
    '1',
    '2007-02-15',
    '帰郷',
    'Homecoming',
    'Naruto returns to the village after two and a half years away.',
  ],
  [
    '2',
    '2007-02-15',
    '暁、始動',
    'The Akatsuki Makes Its Move',
    'The organisation begins collecting the tailed beasts.',
  ],
  [
    '3',
    '2007-02-22',
    '修業の成果',
    'The Results of Training',
    'Kakashi tests how far his students have actually come.',
  ],
  [
    '4',
    '2007-03-01',
    '砂の人柱力',
    'The Jinchuriki of the Sand',
    'Gaara defends Suna alone against a member of the Akatsuki.',
  ],
])

const heroAcademiaSeason3Episodes = released([
  [
    '39',
    '2018-04-07',
    'ゲーム・スタート',
    'Game Start',
    'Class 1-A heads to a training camp and the villains already know where it is.',
  ],
  [
    '40',
    '2018-04-14',
    'ワイルド・ワイルド・プッシーキャッツ',
    'Wild, Wild Pussycats',
    'The Pussycats put the students through a forest that fights back.',
  ],
  [
    '41',
    '2018-04-21',
    '洸汰くん',
    'Kota',
    'A boy who hates heroes has good reasons nobody asked about.',
  ],
  [
    '42',
    '2018-04-28',
    '僕のヒーロー',
    'My Hero',
    'Izuku breaks his own rules to reach Kota in time.',
  ],
])

const jujutsuKaisenSeason2Episodes = released([
  [
    '25',
    '2023-07-06',
    '懐玉',
    'Hidden Inventory',
    'Gojo and Geto are assigned to escort a girl who is also a vessel.',
  ],
  [
    '26',
    '2023-07-13',
    '懐玉-弐-',
    'Hidden Inventory 2',
    'The escort mission draws both a curse user and a cult.',
  ],
  [
    '27',
    '2023-07-20',
    '懐玉-参-',
    'Hidden Inventory 3',
    'Gojo dies, and then decides not to.',
  ],
  [
    '28',
    '2023-07-27',
    '懐玉-肆-',
    'Hidden Inventory 4',
    'The strongest sorcerer returns and the mission ends anyway.',
  ],
])

const saikiEpisodes = released(
  [
    [
      '1',
      '2016-07-04',
      '超能力者のΨ難（前編）',
      'The Disastrous Life of a Psychic (Part 1)',
      'Saiki explains why omnipotence is mostly an inconvenience.',
    ],
    [
      '2',
      '2016-07-05',
      '超能力者のΨ難（後編）',
      'The Disastrous Life of a Psychic (Part 2)',
      'Keeping a low profile is harder when everyone is loud.',
    ],
    [
      '3',
      '2016-07-06',
      '最低Ψ悪!? 燃堂力',
      'The Worst of the Worst?! Riki Nendou',
      'Nendou attaches himself to Saiki and cannot be read.',
    ],
    [
      '4',
      '2016-07-07',
      '漆黒の翼こと海藤瞬',
      'Shun Kaidou, AKA The Jet-Black Wings',
      'A classmate with delusions of a secret war joins the group.',
    ],
  ],
  300,
)

const juniorHighEpisodes = released(
  [
    [
      '1',
      '2015-10-04',
      '入学！巨人中学校',
      'Starting School! Titan Junior High School',
      'Eren enrols at a school where titans eat the lunches.',
    ],
    [
      '2',
      '2015-10-11',
      '追跡！巨人中学校',
      'Chasing! Titan Junior High School',
      'The club recruitment drive turns into a pursuit.',
    ],
    [
      '3',
      '2015-10-18',
      '闘球！巨人中学校',
      'Dodgeball! Titan Junior High School',
      'A dodgeball match decides more than it should.',
    ],
    [
      '4',
      '2015-10-25',
      '清掃！巨人中学校',
      'Cleanup! Titan Junior High School',
      'Levi discovers the storage shed and loses his composure.',
    ],
  ],
  1_080,
)

const onePieceEpisodes = released([
  [
    '1',
    '1999-10-20',
    '俺はルフィ！海賊王になる男だ！',
    'I’m Luffy! The Man Who’s Gonna Be King of the Pirates!',
    'A boy in a straw hat sets out alone in a barrel.',
  ],
  [
    '2',
    '1999-11-17',
    '大剣豪現る！海賊狩りロロノア・ゾロ',
    'Enter the Great Swordsman! Pirate Hunter Roronoa Zoro',
    'Luffy frees a bounty hunter tied to a post and asks him to join.',
  ],
  [
    '3',
    '1999-11-24',
    'モーガンVSルフィ！謎の美少女は誰？',
    'Morgan vs. Luffy! Who’s This Mysterious Beautiful Young Girl?',
    'The marine base falls and a thief watches from the roof.',
  ],
  [
    '4',
    '1999-12-08',
    'ルフィの過去！赤髪のシャンクス登場',
    'Luffy’s Past! The Red-Haired Shanks Appears!',
    'The debt behind the straw hat is finally shown.',
  ],
])

const silentVoiceEpisodes: SeedEpisode[] = [
  {
    number: null,
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: '2016-09-17',
    durationSeconds: 7_800,
    translations: [
      { locale: 'ja-Jpan', title: '聲の形', original: true },
      {
        locale: 'en',
        title: 'A Silent Voice',
        overview:
          'A boy who bullied a deaf classmate tries, years later, to make it right.',
      },
      { locale: 'de', title: 'A Silent Voice: Die Stille meiner Worte' },
    ],
  },
]

const mugenTrainEpisodes: SeedEpisode[] = [
  {
    number: null,
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: '2020-10-16',
    durationSeconds: 7_020,
    translations: [
      {
        locale: 'ja-Jpan',
        title: '劇場版「鬼滅の刃」無限列車編',
        original: true,
      },
      {
        locale: 'en',
        title: 'Demon Slayer: Kimetsu no Yaiba – The Movie: Mugen Train',
        overview:
          'Tanjiro boards a train where forty passengers have vanished and a Hashira is waiting.',
      },
      { locale: 'fr', title: 'Demon Slayer: Le train de l’infini' },
    ],
  },
]

const aotFilm1Episodes: SeedEpisode[] = [
  {
    number: null,
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: '2014-11-22',
    durationSeconds: 7_080,
    translations: [
      {
        locale: 'ja-Jpan',
        title: '劇場版「進撃の巨人」前編〜紅蓮の弓矢〜',
        original: true,
      },
      {
        locale: 'en',
        title: 'Attack on Titan Part I: Crimson Bow and Arrow',
        overview:
          'A compilation of the fall of Shiganshina and the battle for Trost.',
      },
    ],
  },
]

const aotFilm2Episodes: SeedEpisode[] = [
  {
    number: null,
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: '2015-06-27',
    durationSeconds: 7_200,
    translations: [
      {
        locale: 'ja-Jpan',
        title: '劇場版「進撃の巨人」後編〜自由の翼〜',
        original: true,
      },
      {
        locale: 'en',
        title: 'Attack on Titan Part II: Wings of Freedom',
        overview:
          'A compilation covering the female titan and the 57th expedition.',
      },
    ],
  },
]

const aotChronicleEpisodes: SeedEpisode[] = [
  {
    number: null,
    type: 'REGULAR',
    status: 'RELEASED',
    airDate: '2020-07-17',
    durationSeconds: 7_200,
    translations: [
      { locale: 'ja-Jpan', title: '進撃の巨人 〜クロニクル〜', original: true },
      {
        locale: 'en',
        title: 'Attack on Titan ~Chronicle~',
        overview:
          'A recap film covering the first three seasons ahead of the final one.',
      },
    ],
  },
]

const aotFinalChaptersEpisodes: SeedEpisode[] = [
  {
    number: null,
    type: 'SPECIAL',
    status: 'RELEASED',
    airDate: '2023-03-04',
    durationSeconds: 3_660,
    translations: [
      {
        locale: 'ja-Jpan',
        title: '進撃の巨人 The Final Season完結編 前編',
        original: true,
      },
      {
        locale: 'en',
        title: 'The Final Chapters Special 1',
        overview: 'The rumbling begins and the alliance forms against Eren.',
      },
    ],
  },
]

const episodeOfNamiEpisodes: SeedEpisode[] = [
  {
    number: null,
    type: 'SPECIAL',
    status: 'RELEASED',
    airDate: '2012-08-25',
    durationSeconds: 6_300,
    translations: [
      {
        locale: 'ja-Jpan',
        title: 'ONE PIECE エピソードオブナミ 〜航海士の涙と仲間の絆〜',
        original: true,
      },
      {
        locale: 'en',
        title: 'Episode of Nami: Tears of a Navigator and the Bonds of Friends',
        overview: 'A retelling of Arlong Park from the navigator’s side.',
      },
    ],
  },
]

const aotOvaEpisodes: SeedEpisode[] = [
  {
    number: '1',
    type: 'SPECIAL',
    status: 'RELEASED',
    airDate: '2013-12-09',
    durationSeconds: 1_500,
    translations: [
      {
        locale: 'ja-Jpan',
        title: 'イルゼの手帳 調査兵団報告書',
        original: true,
      },
      {
        locale: 'en',
        title: "Ilse's Notebook: Notes from a Scout Regiment Member",
        overview:
          'Hange investigates the journal of a scout who met a talking titan.',
      },
    ],
  },
  {
    number: '2',
    type: 'SPECIAL',
    status: 'RELEASED',
    airDate: '2014-04-09',
    durationSeconds: 1_500,
    translations: [
      {
        locale: 'ja-Jpan',
        title: '突然の来訪者 拘束された青春の呪縛',
        original: true,
      },
      {
        locale: 'en',
        title: 'The Sudden Visitor: The Torturous Curse of Youth',
        overview: 'A training-corps story about the cost of standing out.',
      },
    ],
  },
  {
    number: '3',
    type: 'SPECIAL',
    status: 'RELEASED',
    airDate: '2014-08-08',
    durationSeconds: 1_500,
    translations: [
      { locale: 'ja-Jpan', title: '困難', original: true },
      {
        locale: 'en',
        title: 'Distress',
        overview: 'The 104th cadets face a survival exercise that goes wrong.',
      },
    ],
  },
]

const lostGirlsEpisodes: SeedEpisode[] = [
  {
    number: '1',
    type: 'SPECIAL',
    status: 'RELEASED',
    airDate: '2017-12-08',
    durationSeconds: 1_500,
    translations: [
      {
        locale: 'ja-Jpan',
        title: 'ウォール・シーナ、グッバイ 前編',
        original: true,
      },
      {
        locale: 'en',
        title: 'Wall Sina, Goodbye: Part One',
        overview: 'Annie takes a missing-person case in the interior.',
      },
    ],
  },
  {
    number: '2',
    type: 'SPECIAL',
    status: 'RELEASED',
    airDate: '2018-04-09',
    durationSeconds: 1_500,
    translations: [
      {
        locale: 'ja-Jpan',
        title: 'ウォール・シーナ、グッバイ 後編',
        original: true,
      },
      {
        locale: 'en',
        title: 'Wall Sina, Goodbye: Part Two',
        overview: 'The case closes on a truth Annie would rather not carry.',
      },
    ],
  },
  {
    number: '3',
    type: 'SPECIAL',
    status: 'RELEASED',
    airDate: '2018-08-09',
    durationSeconds: 1_500,
    translations: [
      {
        locale: 'ja-Jpan',
        title: 'イルゼの手帳 失われた少女たち',
        original: true,
      },
      {
        locale: 'en',
        title: 'Lost in the Cruel World',
        overview: 'Mikasa dreams of the life she might have had.',
      },
    ],
  },
]

const dandadanEpisodes: SeedEpisode[] = [
  {
    number: null,
    type: 'REGULAR',
    status: 'UPCOMING',
    airDate: null,
    durationSeconds: null,
    translations: [
      { locale: 'ja-Jpan', title: '未定', original: true },
      {
        locale: 'en',
        title: 'To be announced',
        overview:
          'Science Saru returns for a third season announced at Jump Festa 2026.',
      },
    ],
  },
]

const eminenceEpisodes: SeedEpisode[] = [
  {
    number: null,
    type: 'REGULAR',
    status: 'UPCOMING',
    airDate: null,
    durationSeconds: null,
    translations: [
      { locale: 'ja-Jpan', title: '未定', original: true },
      {
        locale: 'en',
        title: 'To be announced',
        overview:
          'A sequel film to the second season, revealed at AnimeJapan 2026.',
      },
    ],
  },
]

export const SEED_STRUCTURES: SeedStructure[] = [
  { animeSlug: 'shingeki-no-kyojin', seasons: attackOnTitanSeasons },
  { animeSlug: 'death-note', seasons: deathNoteSeasons },
  {
    animeSlug: 'shingeki-no-kyojin-the-final-season',
    seasons: finalSeasonSeasons,
  },
  { animeSlug: 'chainsaw-man', seasons: chainsawManSeasons },
  { animeSlug: 'flcl', episodes: flclEpisodes },
  { animeSlug: 'cyberpunk-edgerunners', episodes: cyberpunkEpisodes },
  {
    animeSlug: 'kusuriya-no-hitorigoto-3rd-season',
    episodes: kusuriyaEpisodes,
  },
  { animeSlug: 'shelter', episodes: shelterEpisodes },
  { animeSlug: 'kimi-no-na-wa', episodes: yourNameEpisodes },
  { animeSlug: 'kimetsu-no-yaiba', episodes: demonSlayerEpisodes },
  { animeSlug: 'jujutsu-kaisen', episodes: jujutsuKaisenEpisodes },
  { animeSlug: 'boku-no-hero-academia', episodes: heroAcademiaEpisodes },
  { animeSlug: 'hunterhunter-2011', episodes: hunterHunterEpisodes },
  { animeSlug: 'one-punch-man', episodes: onePunchManEpisodes },
  { animeSlug: 'tokyo-ghoul', episodes: tokyoGhoulEpisodes },
  { animeSlug: 'shingeki-no-kyojin-season-2', episodes: aotSeason2Episodes },
  {
    animeSlug: 'hagane-no-renkinjutsushi-fullmetal-alchemist',
    episodes: fullmetalEpisodes,
  },
  { animeSlug: 'naruto', episodes: narutoEpisodes },
  { animeSlug: 'sword-art-online', episodes: swordArtOnlineEpisodes },
  {
    animeSlug: 'boku-no-hero-academia-2',
    episodes: heroAcademiaSeason2Episodes,
  },
  { animeSlug: 'yakusoku-no-neverland', episodes: promisedNeverlandEpisodes },
  { animeSlug: 'ansatsu-kyoushitsu', episodes: assassinationClassroomEpisodes },
  { animeSlug: 'mob-psycho-100', episodes: mobPsychoEpisodes },
  {
    animeSlug: 'rezero-kara-hajimeru-isekai-seikatsu',
    episodes: reZeroEpisodes,
  },
  { animeSlug: 'shingeki-no-kyojin-season-3', seasons: aotSeason3Seasons },
  {
    animeSlug: 'shingeki-no-kyojin-season-3-part-2',
    episodes: aotSeason3Part2Episodes,
  },
  { animeSlug: 'naruto-shippuuden', episodes: narutoShippudenEpisodes },
  {
    animeSlug: 'boku-no-hero-academia-3',
    episodes: heroAcademiaSeason3Episodes,
  },
  {
    animeSlug: 'jujutsu-kaisen-2nd-season',
    episodes: jujutsuKaisenSeason2Episodes,
  },
  { animeSlug: 'saiki-kusuo-no-nan', episodes: saikiEpisodes },
  { animeSlug: 'shingeki-kyojin-chuugakkou', episodes: juniorHighEpisodes },
  { animeSlug: 'one-piece', episodes: onePieceEpisodes },
  { animeSlug: 'koe-no-katachi', episodes: silentVoiceEpisodes },
  {
    animeSlug: 'kimetsu-no-yaiba-mugen-ressha-hen',
    episodes: mugenTrainEpisodes,
  },
  {
    animeSlug: 'shingeki-no-kyojin-zenpen-guren-no-yumiya',
    episodes: aotFilm1Episodes,
  },
  {
    animeSlug: 'shingeki-no-kyojin-kouhen-jiyuu-no-tsubasa',
    episodes: aotFilm2Episodes,
  },
  { animeSlug: 'shingeki-no-kyojin-chronicle', episodes: aotChronicleEpisodes },
  {
    animeSlug: 'shingeki-no-kyojin-the-final-season-kanketsu-hen-zenpen',
    episodes: aotFinalChaptersEpisodes,
  },
  {
    animeSlug:
      'one-piece-episode-of-nami-koukaishi-no-namida-to-nakama-no-kizuna',
    episodes: episodeOfNamiEpisodes,
  },
  { animeSlug: 'shingeki-no-kyojin-ova', episodes: aotOvaEpisodes },
  { animeSlug: 'shingeki-no-kyojin-lost-girls', episodes: lostGirlsEpisodes },
  { animeSlug: 'dandadan-3rd-season', episodes: dandadanEpisodes },
  {
    animeSlug: 'kage-no-jitsuryokusha-ni-naritakute-zankyou-hen',
    episodes: eminenceEpisodes,
  },
]
