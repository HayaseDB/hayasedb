import type { SeedAnime } from '../../../types'

export const SEED_ANIME: SeedAnime[] = [
  {
    slug: 'shingeki-no-kyojin',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Shingeki no Kyojin',
    titleEnglish: 'Attack on Titan',
    titleNative: '進撃の巨人',
    description:
      'Several hundred years ago, humans were nearly exterminated by titans. Titans are typically several stories tall, seem to have no intelligence, devour human beings and, worst of all, seem to do it for the pleasure rather than as a food source. A small percentage of humanity survived by walling themselves in a city protected by extremely high walls, even taller than the biggest of titans.\n\nFlash forward to the present and the city has not seen a titan in over 100 years. Teenage boy Eren and his foster sister Mikasa witness something horrific as the city walls are destroyed by a colossal titan that appears out of thin air. As the smaller titans flood the city, the two kids watch in horror as their mother is eaten alive. Eren vows that he will murder every single titan and take revenge for all of mankind.\n\n(Source: MangaHelpers)',
    startDate: {
      year: 2013,
      month: 4,
      day: 7,
    },
    endDate: {
      year: 2013,
      month: 9,
      day: 28,
    },
    genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
    relations: [
      {
        target: 'shingeki-no-kyojin-zenpen-guren-no-yumiya',
        kind: 'ALTERNATIVE',
      },
      {
        target: 'shingeki-no-kyojin-kouhen-jiyuu-no-tsubasa',
        kind: 'ALTERNATIVE',
      },
      {
        target: 'shingeki-no-kyojin-season-2',
        kind: 'SEQUEL',
      },
      {
        target: 'shingeki-kyojin-chuugakkou',
        kind: 'SPIN_OFF',
      },
      {
        target: 'shingeki-no-kyojin-ova',
        kind: 'SIDE_STORY',
      },
      {
        target: 'shingeki-no-kyojin-chronicle',
        kind: 'SUMMARY',
      },
      {
        target: 'shingeki-no-kyojin-lost-girls',
        kind: 'SIDE_STORY',
      },
    ],
    media: {
      cover: 'shingeki-no-kyojin-cover.webp',
      banner: 'shingeki-no-kyojin-banner.webp',
      gallery: [
        'shingeki-no-kyojin-gallery-1.webp',
        'shingeki-no-kyojin-gallery-2.webp',
        'shingeki-no-kyojin-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'kimetsu-no-yaiba',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Kimetsu no Yaiba',
    titleEnglish: 'Demon Slayer: Kimetsu no Yaiba',
    titleNative: '鬼滅の刃',
    description:
      'It is the Taisho Period in Japan. Tanjiro, a kindhearted boy who sells charcoal for a living, finds his family slaughtered by a demon. To make matters worse, his younger sister Nezuko, the sole survivor, has been transformed into a demon herself. Though devastated by this grim reality, Tanjiro resolves to become a “demon slayer” so that he can turn his sister back into a human, and kill the demon that massacred his family.\n\n(Source: Crunchyroll)',
    startDate: {
      year: 2019,
      month: 4,
      day: 6,
    },
    endDate: {
      year: 2019,
      month: 9,
      day: 28,
    },
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy', 'Supernatural'],
    relations: [
      {
        target: 'kimetsu-no-yaiba-mugen-ressha-hen',
        kind: 'SEQUEL',
      },
    ],
    media: {
      cover: 'kimetsu-no-yaiba-cover.webp',
      banner: 'kimetsu-no-yaiba-banner.webp',
      gallery: [
        'kimetsu-no-yaiba-gallery-1.webp',
        'kimetsu-no-yaiba-gallery-2.webp',
        'kimetsu-no-yaiba-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'jujutsu-kaisen',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Jujutsu Kaisen',
    titleEnglish: 'JUJUTSU KAISEN',
    titleNative: '呪術廻戦',
    description:
      'A boy fights... for "the right death."\n\nHardship, regret, shame: the negative feelings that humans feel become Curses that lurk in our everyday lives. The Curses run rampant throughout the world, capable of leading people to terrible misfortune and even death. What\'s more, the Curses can only be exorcised by another Curse.\n\nItadori Yuji is a boy with tremendous physical strength, though he lives a completely ordinary high school life. One day, to save a friend who has been attacked by Curses, he eats the finger of the Double-Faced Specter, taking the Curse into his own soul. From then on, he shares one body with the Double-Faced Specter. Guided by the most powerful of sorcerers, Gojou Satoru, Itadori is admitted to the Tokyo Metropolitan Technical High School of Sorcery, an organization that fights the Curses... and thus begins the heroic tale of a boy who became a Curse to exorcise a Curse, a life from which he could never turn back.\n\n(Source: Crunchyroll)\n\nNote: The first episode received an early web premiere on September 19th, 2020. The regular TV broadcast started on October 3rd, 2020.',
    startDate: {
      year: 2020,
      month: 10,
      day: 3,
    },
    endDate: {
      year: 2021,
      month: 3,
      day: 27,
    },
    genres: ['Action', 'Drama', 'Supernatural'],
    relations: [
      {
        target: 'jujutsu-kaisen-2nd-season',
        kind: 'SEQUEL',
      },
    ],
    media: {
      cover: 'jujutsu-kaisen-cover.webp',
      banner: 'jujutsu-kaisen-banner.webp',
      gallery: [
        'jujutsu-kaisen-gallery-1.webp',
        'jujutsu-kaisen-gallery-2.webp',
        'jujutsu-kaisen-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'death-note',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'DEATH NOTE',
    titleEnglish: 'Death Note',
    titleNative: 'DEATH NOTE',
    description:
      'Light Yagami is a genius high school student who is about to learn about life through a book of death. When a bored shinigami, a God of Death, named Ryuk drops a black notepad called a Death Note, Light receives power over life and death with the stroke of a pen. Determined to use this dark gift for the best, Light sets out to rid the world of evil… namely, the people he believes to be evil. Should anyone hold such power?\n\nThe consequences of Light’s actions will set the world ablaze.\n\n(Source: VIZ Media)',
    startDate: {
      year: 2006,
      month: 10,
      day: 4,
    },
    endDate: {
      year: 2007,
      month: 6,
      day: 27,
    },
    genres: ['Mystery', 'Psychological', 'Supernatural', 'Thriller'],
    media: {
      cover: 'death-note-cover.webp',
      banner: 'death-note-banner.webp',
      gallery: [
        'death-note-gallery-1.webp',
        'death-note-gallery-2.webp',
        'death-note-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'boku-no-hero-academia',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Boku no Hero Academia',
    titleEnglish: 'My Hero Academia',
    titleNative: '僕のヒーローアカデミア',
    description:
      "What would the world be like if 80 percent of the population manifested extraordinary superpowers called “Quirks” at age four? Heroes and villains would be battling it out everywhere! Becoming a hero would mean learning to use your power, but where would you go to study? U.A. High's Hero Program of course! But what would you do if you were one of the 20 percent who were born Quirkless?\n\nMiddle school student Izuku Midoriya wants to be a hero more than anything, but he hasn't got an ounce of power in him. With no chance of ever getting into the prestigious U.A. High School for budding heroes, his life is looking more and more like a dead end. Then an encounter with All Might, the greatest hero of them all gives him a chance to change his destiny…\n\n(Source: VIZ Media)",
    startDate: {
      year: 2016,
      month: 4,
      day: 3,
    },
    endDate: {
      year: 2016,
      month: 6,
      day: 26,
    },
    genres: ['Action', 'Adventure', 'Comedy'],
    relations: [
      {
        target: 'boku-no-hero-academia-2',
        kind: 'SEQUEL',
      },
    ],
    media: {
      cover: 'boku-no-hero-academia-cover.webp',
      banner: 'boku-no-hero-academia-banner.webp',
      gallery: [
        'boku-no-hero-academia-gallery-1.webp',
        'boku-no-hero-academia-gallery-2.webp',
        'boku-no-hero-academia-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'hunterhunter-2011',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'HUNTER×HUNTER (2011)',
    titleEnglish: 'Hunter x Hunter (2011)',
    titleNative: 'HUNTER×HUNTER (2011)',
    description:
      "A new adaption of the manga of the same name by Togashi Yoshihiro.\n\nA Hunter is one who travels the world doing all sorts of dangerous tasks. From capturing criminals to searching deep within uncharted lands for any lost treasures. Gon is a young boy whose father disappeared long ago, being a Hunter. He believes if he could also follow his father's path, he could one day reunite with him.\n\nAfter becoming 12, Gon leaves his home and takes on the task of entering the Hunter exam, notorious for its low success rate and high probability of death to become an official Hunter. He befriends the revenge-driven Kurapika, the doctor-to-be Leorio and the rebellious ex-assassin Killua in the exam, with their friendship prevailing throughout the many trials and threats they come upon taking on the dangerous career of a Hunter.",
    startDate: {
      year: 2011,
      month: 10,
      day: 2,
    },
    endDate: {
      year: 2014,
      month: 9,
      day: 24,
    },
    genres: ['Action', 'Adventure', 'Fantasy'],
    media: {
      cover: 'hunterhunter-2011-cover.webp',
      banner: 'hunterhunter-2011-banner.webp',
      gallery: [
        'hunterhunter-2011-gallery-1.webp',
        'hunterhunter-2011-gallery-2.webp',
        'hunterhunter-2011-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'one-punch-man',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'One Punch Man',
    titleEnglish: 'One-Punch Man',
    titleNative: 'ワンパンマン',
    description:
      "Saitama has a rather peculiar hobby, being a superhero, but despite his heroic deeds and superhuman abilities, a shadow looms over his life. He's become much too powerful, to the point that every opponent ends up defeated with a single punch.\n\nThe lack of challenge has driven him into a state of apathy, as he watches his life pass by having lost all enthusiasm, at least until he's unwillingly thrust in the role of being a mentor to the young and revenge-driven Genos.",
    startDate: {
      year: 2015,
      month: 10,
      day: 5,
    },
    endDate: {
      year: 2015,
      month: 12,
      day: 21,
    },
    genres: ['Action', 'Comedy', 'Sci-Fi', 'Supernatural'],
    media: {
      cover: 'one-punch-man-cover.webp',
      banner: 'one-punch-man-banner.webp',
      gallery: [
        'one-punch-man-gallery-1.webp',
        'one-punch-man-gallery-2.webp',
        'one-punch-man-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'one-piece',
    format: 'TV',
    status: 'RELEASING',
    titleRomaji: 'ONE PIECE',
    titleEnglish: 'ONE PIECE',
    titleNative: 'ONE PIECE',
    description:
      "Gold Roger was known as the Pirate King, the strongest and most infamous being to have sailed the Grand Line. The capture and death of Roger by the World Government brought a change throughout the world. His last words before his death revealed the location of the greatest treasure in the world, One Piece. It was this revelation that brought about the Grand Age of Pirates, men who dreamed of finding One Piece (which promises an unlimited amount of riches and fame), and quite possibly the most coveted of titles for the person who found it, the title of the Pirate King.\n\nEnter Monkey D. Luffy, a 17-year-old boy that defies your standard definition of a pirate. Rather than the popular persona of a wicked, hardened, toothless pirate who ransacks villages for fun, Luffy’s reason for being a pirate is one of pure wonder; the thought of an exciting adventure and meeting new and intriguing people, along with finding One Piece, are his reasons of becoming a pirate. Following in the footsteps of his childhood hero, Luffy and his crew travel across the Grand Line, experiencing crazy adventures, unveiling dark mysteries and battling strong enemies, all in order to reach One Piece.\n\n*This includes the following special episodes:\n\n- Chopperman to the Rescue! Protect the TV Station by the Shore! (Episode 336)\n\n- The Strongest Tag-Team! Luffy and Toriko's Hard Struggle! (Episode 492)\n\n- Team Formation! Save Chopper (Episode 542)\n\n- History's Strongest Collaboration vs. Glutton of the Sea (Episode 590)\n\n- 20th Anniversary! Special Romance Dawn (Episode 907)",
    startDate: {
      year: 1999,
      month: 10,
      day: 20,
    },
    genres: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy'],
    relations: [
      {
        target:
          'one-piece-episode-of-nami-koukaishi-no-namida-to-nakama-no-kizuna',
        kind: 'SUMMARY',
      },
      {
        target: 'choppers',
        kind: 'SPIN_OFF',
      },
    ],
    media: {
      cover: 'one-piece-cover.webp',
      banner: 'one-piece-banner.webp',
      gallery: [
        'one-piece-gallery-1.webp',
        'one-piece-gallery-2.webp',
        'one-piece-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'tokyo-ghoul',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Tokyo Ghoul',
    titleEnglish: 'Tokyo Ghoul',
    titleNative: '東京喰種 トーキョーグール',
    description:
      'The suspense horror/dark fantasy story is set in Tokyo, which is haunted by mysterious "ghouls" who are devouring humans. People are gripped by the fear of these ghouls whose identities are masked in mystery. An ordinary college student named Kaneki encounters Rize, a girl who is an avid reader like him, at the café he frequents. Little does he realize that his fate will change overnight.\n\n(Source: Anime News Network)',
    startDate: {
      year: 2014,
      month: 7,
      day: 4,
    },
    endDate: {
      year: 2014,
      month: 9,
      day: 19,
    },
    genres: [
      'Action',
      'Drama',
      'Horror',
      'Mystery',
      'Psychological',
      'Supernatural',
    ],
    media: {
      cover: 'tokyo-ghoul-cover.webp',
      banner: 'tokyo-ghoul-banner.webp',
      gallery: [
        'tokyo-ghoul-gallery-1.webp',
        'tokyo-ghoul-gallery-2.webp',
        'tokyo-ghoul-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'shingeki-no-kyojin-season-2',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Shingeki no Kyojin Season 2',
    titleEnglish: 'Attack on Titan Season 2',
    titleNative: '進撃の巨人 Season２',
    description:
      "Eren Jaeger swore to wipe out every last Titan, but in a battle for his life he wound up becoming the thing he hates most. With his new powers, he fights for humanity's freedom facing the monsters that threaten his home. After a bittersweet victory against the Female Titan, Eren finds no time to rest—a horde of Titans is approaching Wall Rose and the battle for humanity continues!\n\n(Source: Funimation)",
    startDate: {
      year: 2017,
      month: 4,
      day: 1,
    },
    endDate: {
      year: 2017,
      month: 6,
      day: 17,
    },
    genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
    relations: [
      {
        target: 'shingeki-no-kyojin',
        kind: 'PREQUEL',
      },
      {
        target: 'shingeki-no-kyojin-season-3',
        kind: 'SEQUEL',
      },
      {
        target: 'shingeki-no-kyojin-chronicle',
        kind: 'SUMMARY',
      },
    ],
    media: {
      cover: 'shingeki-no-kyojin-season-2-cover.webp',
      banner: 'shingeki-no-kyojin-season-2-banner.webp',
      gallery: [
        'shingeki-no-kyojin-season-2-gallery-1.webp',
        'shingeki-no-kyojin-season-2-gallery-2.webp',
        'shingeki-no-kyojin-season-2-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'hagane-no-renkinjutsushi-fullmetal-alchemist',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Hagane no Renkinjutsushi: FULLMETAL ALCHEMIST',
    titleEnglish: 'Fullmetal Alchemist: Brotherhood',
    titleNative: '鋼の錬金術師 FULLMETAL ALCHEMIST',
    description:
      "\"In order for something to be obtained, something of equal value must be lost.\"\n\nAlchemy is bound by this Law of Equivalent Exchange—something the young brothers Edward and Alphonse Elric only realize after attempting human transmutation: the one forbidden act of alchemy. They pay a terrible price for their transgression—Edward loses his left leg, Alphonse his physical body. It is only by the desperate sacrifice of Edward's right arm that he is able to affix Alphonse's soul to a suit of armor. Devastated and alone, it is the hope that they would both eventually return to their original bodies that gives Edward the inspiration to obtain metal limbs called \"automail\" and become a state alchemist, the Fullmetal Alchemist.\n\nThree years of searching later, the brothers seek the Philosopher's Stone, a mythical relic that allows an alchemist to overcome the Law of Equivalent Exchange. Even with military allies Colonel Roy Mustang, Lieutenant Riza Hawkeye, and Lieutenant Colonel Maes Hughes on their side, the brothers find themselves caught up in a nationwide conspiracy that leads them not only to the true nature of the elusive Philosopher's Stone, but their country's murky history as well. In between finding a serial killer and racing against time, Edward and Alphonse must ask themselves if what they are doing will make them human again... or take away their humanity.\n\n(Source: MAL Rewrite)",
    startDate: {
      year: 2009,
      month: 4,
      day: 5,
    },
    endDate: {
      year: 2010,
      month: 7,
      day: 4,
    },
    genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
    media: {
      cover: 'hagane-no-renkinjutsushi-fullmetal-alchemist-cover.webp',
      banner: 'hagane-no-renkinjutsushi-fullmetal-alchemist-banner.webp',
      gallery: [
        'hagane-no-renkinjutsushi-fullmetal-alchemist-gallery-1.webp',
        'hagane-no-renkinjutsushi-fullmetal-alchemist-gallery-2.webp',
        'hagane-no-renkinjutsushi-fullmetal-alchemist-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'naruto',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'NARUTO',
    titleEnglish: 'Naruto',
    titleNative: 'NARUTO -ナルト-',
    description:
      "Naruto Uzumaki, a hyperactive and knuckle-headed ninja, lives in Konohagakure, the Hidden Leaf village. Moments prior to his birth, a huge demon known as the Kyuubi, the Nine-tailed Fox, attacked Konohagakure and wreaked havoc. In order to put an end to the Kyuubi's rampage, the leader of the village, the 4th Hokage, sacrificed his life and sealed the monstrous beast inside the newborn Naruto. \n\nShunned because of the presence of the Kyuubi inside him, Naruto struggles to find his place in the village. He strives to become the Hokage of Konohagakure, and he meets many friends and foes along the way. \n\n(Source: MAL Rewrite)",
    startDate: {
      year: 2002,
      month: 10,
      day: 3,
    },
    endDate: {
      year: 2007,
      month: 2,
      day: 8,
    },
    genres: [
      'Action',
      'Adventure',
      'Comedy',
      'Drama',
      'Fantasy',
      'Supernatural',
    ],
    relations: [
      {
        target: 'naruto-shippuuden',
        kind: 'SEQUEL',
      },
    ],
    media: {
      cover: 'naruto-cover.webp',
      banner: 'naruto-banner.webp',
      gallery: [
        'naruto-gallery-1.webp',
        'naruto-gallery-2.webp',
        'naruto-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'sword-art-online',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Sword Art Online',
    titleEnglish: 'Sword Art Online',
    titleNative: 'ソードアート・オンライン',
    description:
      "In the near future, a Virtual Reality Massive Multiplayer Online Role-Playing Game (VRMMORPG) called Sword Art Online has been released where players control their avatars with their bodies using a piece of technology called Nerve Gear. One day, players discover they cannot log out, as the game creator is holding them captive unless they reach the 100th floor of the game's tower and defeat the final boss. However, if they die in the game, they die in real life. Their struggle for survival starts now...\n\n(Source: Crunchyroll)",
    startDate: {
      year: 2012,
      month: 7,
      day: 8,
    },
    endDate: {
      year: 2012,
      month: 12,
      day: 23,
    },
    genres: ['Action', 'Adventure', 'Fantasy', 'Romance'],
    media: {
      cover: 'sword-art-online-cover.webp',
      banner: 'sword-art-online-banner.webp',
      gallery: [
        'sword-art-online-gallery-1.webp',
        'sword-art-online-gallery-2.webp',
        'sword-art-online-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'koe-no-katachi',
    format: 'MOVIE',
    status: 'FINISHED',
    titleRomaji: 'Koe no Katachi',
    titleEnglish: 'A Silent Voice',
    titleNative: '聲の形',
    description:
      'After transferring into a new school, a deaf girl, Shouko Nishimiya, is bullied by the popular Shouya Ishida. As Shouya continues to bully Shouko, the class turns its back on him. Shouko transfers and Shouya grows up as an outcast. Alone and depressed, the regretful Shouya finds Shouko to make amends.\n\n(Source: Eleven Arts)',
    startDate: {
      year: 2016,
      month: 9,
      day: 17,
    },
    endDate: {
      year: 2016,
      month: 9,
      day: 17,
    },
    genres: ['Drama', 'Romance', 'Slice of Life'],
    media: {
      cover: 'koe-no-katachi-cover.webp',
      banner: 'koe-no-katachi-banner.webp',
    },
  },
  {
    slug: 'kimi-no-na-wa',
    format: 'MOVIE',
    status: 'FINISHED',
    titleRomaji: 'Kimi no Na wa.',
    titleEnglish: 'Your Name.',
    titleNative: '君の名は。',
    description:
      "Mitsuha Miyamizu, a high school girl, yearns to live the life of a boy in the bustling city of Tokyo—a dream that stands in stark contrast to her present life in the countryside. Meanwhile in the city, Taki Tachibana lives a busy life as a high school student while juggling his part-time job and hopes for a future in architecture.\n\nOne day, Mitsuha awakens in a room that is not her own and suddenly finds herself living the dream life in Tokyo—but in Taki's body! Elsewhere, Taki finds himself living Mitsuha's life in the humble countryside. In pursuit of an answer to this strange phenomenon, they begin to search for one another.\n\nKimi no Na wa. revolves around Mitsuha and Taki's actions, which begin to have a dramatic impact on each other's lives, weaving them into a fabric held together by fate and circumstance.\n\n(Source: MAL Rewrite)",
    startDate: {
      year: 2016,
      month: 8,
      day: 26,
    },
    endDate: {
      year: 2016,
      month: 8,
      day: 26,
    },
    genres: ['Drama', 'Romance', 'Supernatural'],
    media: {
      cover: 'kimi-no-na-wa-cover.webp',
      banner: 'kimi-no-na-wa-banner.webp',
    },
  },
  {
    slug: 'shingeki-no-kyojin-season-3',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Shingeki no Kyojin Season 3',
    titleEnglish: 'Attack on Titan Season 3',
    titleNative: '進撃の巨人 Season３',
    description:
      "Eren and his companions in the 104th are assigned to the newly-formed Levi Squad, whose assignment is to keep Eren and Historia safe given Eren's newly-discovered power and Historia's knowledge and pedigree. Levi and Erwin have good reason to be concerned, because the priest of the Church that Hanji had hidden away was found tortured to death, making it clear that the Military Police are involved with the cover-up. Things get more harrowing when the MPs make a move on Erwin and the Levi Squad narrowly avoids capture. Eren is also having problems with his Titan transformation, and a deadly killer has been hired to secure Eren and Historia, one Levi knows all too well from his youth.\n\n(Source: Anime News Network)",
    startDate: {
      year: 2018,
      month: 7,
      day: 23,
    },
    endDate: {
      year: 2018,
      month: 10,
      day: 15,
    },
    genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
    relations: [
      {
        target: 'shingeki-no-kyojin-season-2',
        kind: 'PREQUEL',
      },
      {
        target: 'shingeki-no-kyojin-season-3-part-2',
        kind: 'SEQUEL',
      },
      {
        target: 'shingeki-no-kyojin-chronicle',
        kind: 'SUMMARY',
      },
      {
        target: 'shingeki-no-kyojin-lost-girls',
        kind: 'SIDE_STORY',
      },
    ],
    media: {
      cover: 'shingeki-no-kyojin-season-3-cover.webp',
      banner: 'shingeki-no-kyojin-season-3-banner.webp',
      gallery: [
        'shingeki-no-kyojin-season-3-gallery-1.webp',
        'shingeki-no-kyojin-season-3-gallery-2.webp',
        'shingeki-no-kyojin-season-3-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'boku-no-hero-academia-2',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Boku no Hero Academia 2',
    titleEnglish: 'My Hero Academia Season 2',
    titleNative: '僕のヒーローアカデミア２',
    description:
      'Taking off right after the last episode of the first season. The school is temporarily closed due to security. When U.A. restarts, it is announced that the highly anticipated School Sports Festival will soon be taking place. All classes: Hero, Support, General and Business will be participating. Tournaments all round will decide who is the top Hero in training.\n\n(Source: Anime News Network)',
    startDate: {
      year: 2017,
      month: 4,
      day: 1,
    },
    endDate: {
      year: 2017,
      month: 9,
      day: 30,
    },
    genres: ['Action', 'Adventure', 'Comedy'],
    relations: [
      {
        target: 'boku-no-hero-academia-3',
        kind: 'SEQUEL',
      },
      {
        target: 'boku-no-hero-academia',
        kind: 'PREQUEL',
      },
    ],
    media: {
      cover: 'boku-no-hero-academia-2-cover.webp',
      banner: 'boku-no-hero-academia-2-banner.webp',
      gallery: [
        'boku-no-hero-academia-2-gallery-1.webp',
        'boku-no-hero-academia-2-gallery-2.webp',
        'boku-no-hero-academia-2-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'shingeki-no-kyojin-the-final-season',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Shingeki no Kyojin: The Final Season',
    titleEnglish: 'Attack on Titan Final Season',
    titleNative: '進撃の巨人 The Final Season',
    description:
      'It’s been four years since the Scout Regiment reached the shoreline, and the world looks different now. Things are heating up as the fate of the Scout Regiment—and the people of Paradis—are determined at last. However, Eren is missing. Will he reappear before age-old tensions between Marleyans and Eldians result in the war of all wars?\n\n(Source: Crunchyroll)',
    startDate: {
      year: 2020,
      month: 12,
      day: 7,
    },
    endDate: {
      year: 2021,
      month: 3,
      day: 29,
    },
    genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
    relations: [
      {
        target: 'shingeki-no-kyojin-season-3-part-2',
        kind: 'PREQUEL',
      },
    ],
    media: {
      cover: 'shingeki-no-kyojin-the-final-season-cover.webp',
      banner: 'shingeki-no-kyojin-the-final-season-banner.webp',
      gallery: [
        'shingeki-no-kyojin-the-final-season-gallery-1.webp',
        'shingeki-no-kyojin-the-final-season-gallery-2.webp',
        'shingeki-no-kyojin-the-final-season-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'yakusoku-no-neverland',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Yakusoku no Neverland',
    titleEnglish: 'The Promised Neverland',
    titleNative: '約束のネバーランド',
    description:
      'Emma, Norman and Ray are the brightest kids at the Grace Field House orphanage. And under the care of the woman they refer to as “Mom,” all the kids have enjoyed a comfortable life. Good food, clean clothes and the perfect environment to learn—what more could an orphan ask for? One day, though, Emma and Norman uncover the dark truth of the outside world they are forbidden from seeing.\n\n(Source: VIZ Media)',
    startDate: {
      year: 2019,
      month: 1,
      day: 10,
    },
    endDate: {
      year: 2019,
      month: 3,
      day: 29,
    },
    genres: [
      'Drama',
      'Fantasy',
      'Horror',
      'Mystery',
      'Psychological',
      'Thriller',
    ],
    media: {
      cover: 'yakusoku-no-neverland-cover.webp',
      banner: 'yakusoku-no-neverland-banner.webp',
      gallery: [
        'yakusoku-no-neverland-gallery-1.webp',
        'yakusoku-no-neverland-gallery-2.webp',
        'yakusoku-no-neverland-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'chainsaw-man',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Chainsaw Man',
    titleEnglish: 'Chainsaw Man',
    titleNative: 'チェンソーマン',
    description:
      'Denji is a teenage boy living with a Chainsaw Devil named Pochita. Due to the debt his father left behind, he has been living a rock-bottom life while repaying his debt by harvesting devil corpses with Pochita.\n\nOne day, Denji is betrayed and killed. As his consciousness fades, he makes a contract with Pochita and gets revived as "Chainsaw Man" — a man with a devil\'s heart.\n\n(Source: Crunchyroll)',
    startDate: {
      year: 2022,
      month: 10,
      day: 12,
    },
    endDate: {
      year: 2022,
      month: 12,
      day: 28,
    },
    genres: ['Action', 'Drama', 'Horror', 'Supernatural'],
    media: {
      cover: 'chainsaw-man-cover.webp',
      banner: 'chainsaw-man-banner.webp',
    },
  },
  {
    slug: 'ansatsu-kyoushitsu',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Ansatsu Kyoushitsu',
    titleEnglish: 'Assassination Classroom',
    titleNative: '暗殺教室',
    description:
      'The students of class 3-E have a mission: kill their teacher before graduation. He has already destroyed the moon, and has promised to destroy the Earth if he can not be killed within a year. But how can this class of misfits kill a tentacled monster, capable of reaching Mach 20 speed, who may be the best teacher any of them have ever had?',
    startDate: {
      year: 2015,
      month: 1,
      day: 10,
    },
    endDate: {
      year: 2015,
      month: 6,
      day: 20,
    },
    genres: ['Action', 'Comedy', 'Drama', 'Supernatural'],
    media: {
      cover: 'ansatsu-kyoushitsu-cover.webp',
      banner: 'ansatsu-kyoushitsu-banner.webp',
      gallery: [
        'ansatsu-kyoushitsu-gallery-1.webp',
        'ansatsu-kyoushitsu-gallery-2.webp',
        'ansatsu-kyoushitsu-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'mob-psycho-100',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Mob Psycho 100',
    titleEnglish: 'Mob Psycho 100',
    titleNative: 'モブサイコ100',
    description:
      'The story revolves around "Mob," a boy who will explode if his emotional capacity reaches 100%. This boy with psychic powers earned his nickname "Mob" because he does not stand out among other people. He keeps his psychic powers bottled up so he can live normally, but if his emotional level reaches 100, something will overwhelm his entire body.\n\n(Source: Anime News Network)',
    startDate: {
      year: 2016,
      month: 7,
      day: 12,
    },
    endDate: {
      year: 2016,
      month: 9,
      day: 27,
    },
    genres: [
      'Action',
      'Comedy',
      'Drama',
      'Psychological',
      'Slice of Life',
      'Supernatural',
    ],
    media: {
      cover: 'mob-psycho-100-cover.webp',
      banner: 'mob-psycho-100-banner.webp',
      gallery: [
        'mob-psycho-100-gallery-1.webp',
        'mob-psycho-100-gallery-2.webp',
        'mob-psycho-100-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'rezero-kara-hajimeru-isekai-seikatsu',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Re:Zero kara Hajimeru Isekai Seikatsu',
    titleEnglish: 'Re:ZERO -Starting Life in Another World-',
    titleNative: 'Re:ゼロから始める異世界生活',
    description:
      'In the story, Subaru Natsuki is an ordinary high school student who is lost in an alternate world, where he is rescued by a beautiful, silver-haired girl. He stays near her to return the favor, but the destiny she is burdened with is more than Subaru can imagine. Enemies attack one by one, and both of them are killed. He then finds out he has the power to rewind death, back to the time he first came to this world. But only he remembers what has happened since.\n\n(Source: Anime News Network)\n\nNotes:\n\n- The first episode aired with a runtime of ~50 minutes as opposed to the standard 25 minute long episode.\n\n- In the Winter 2020 season, Re:ZERO was rebroadcast and re-edited to fit into an hour time-slot. This edit included the first OVA and added slight modifications to certain scenes throughout. It also added an additional scene at the end of the final episode.',
    startDate: {
      year: 2016,
      month: 4,
      day: 4,
    },
    endDate: {
      year: 2016,
      month: 9,
      day: 19,
    },
    genres: [
      'Action',
      'Adventure',
      'Drama',
      'Fantasy',
      'Psychological',
      'Romance',
      'Thriller',
    ],
    media: {
      cover: 'rezero-kara-hajimeru-isekai-seikatsu-cover.webp',
      banner: 'rezero-kara-hajimeru-isekai-seikatsu-banner.webp',
      gallery: [
        'rezero-kara-hajimeru-isekai-seikatsu-gallery-1.webp',
        'rezero-kara-hajimeru-isekai-seikatsu-gallery-2.webp',
        'rezero-kara-hajimeru-isekai-seikatsu-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'shingeki-no-kyojin-season-3-part-2',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Shingeki no Kyojin Season 3 Part 2',
    titleEnglish: 'Attack on Titan Season 3 Part 2',
    titleNative: '進撃の巨人 Season３ Part.2',
    description:
      'The battle to retake Wall Maria begins now! With Eren’s new hardening ability, the Scouts are confident they can seal the wall and take back Shiganshina District. If they succeed, Eren can finally unlock the secrets of the basement—and the world. But danger lies in wait as Reiner, Bertholdt, and the Beast Titan have plans of their own. Could this be humanity’s final battle for survival?\n\n(Source: Funimation)',
    startDate: {
      year: 2019,
      month: 4,
      day: 29,
    },
    endDate: {
      year: 2019,
      month: 7,
      day: 1,
    },
    genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
    relations: [
      {
        target: 'shingeki-no-kyojin-season-3',
        kind: 'PREQUEL',
      },
      {
        target: 'shingeki-no-kyojin-the-final-season',
        kind: 'SEQUEL',
      },
      {
        target: 'shingeki-no-kyojin-chronicle',
        kind: 'SUMMARY',
      },
    ],
    media: {
      cover: 'shingeki-no-kyojin-season-3-part-2-cover.webp',
      banner: 'shingeki-no-kyojin-season-3-part-2-banner.webp',
      gallery: [
        'shingeki-no-kyojin-season-3-part-2-gallery-1.webp',
        'shingeki-no-kyojin-season-3-part-2-gallery-2.webp',
        'shingeki-no-kyojin-season-3-part-2-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'naruto-shippuuden',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'NARUTO: Shippuuden',
    titleEnglish: 'Naruto: Shippuden',
    titleNative: 'NARUTO -ナルト- 疾風伝',
    description:
      'Naruto: Shippuuden is the continuation of the original animated TV series Naruto. The story revolves around an older and slightly more matured Uzumaki Naruto and his quest to save his friend Uchiha Sasuke from the grips of the snake-like Shinobi, Orochimaru. After 2 and a half years Naruto finally returns to his village of Konoha, and sets about putting his ambitions to work, though it will not be easy, as he has amassed a few (more dangerous) enemies, in the likes of the shinobi organization; Akatsuki. \n\n(Source: Anime News Network)',
    startDate: {
      year: 2007,
      month: 2,
      day: 15,
    },
    endDate: {
      year: 2017,
      month: 3,
      day: 23,
    },
    genres: [
      'Action',
      'Adventure',
      'Comedy',
      'Drama',
      'Fantasy',
      'Supernatural',
    ],
    relations: [
      {
        target: 'naruto',
        kind: 'PREQUEL',
      },
    ],
    media: {
      cover: 'naruto-shippuuden-cover.webp',
      banner: 'naruto-shippuuden-banner.webp',
      gallery: [
        'naruto-shippuuden-gallery-1.webp',
        'naruto-shippuuden-gallery-2.webp',
        'naruto-shippuuden-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'boku-no-hero-academia-3',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Boku no Hero Academia 3',
    titleEnglish: 'My Hero Academia Season 3',
    titleNative: '僕のヒーローアカデミア３',
    description:
      "Summer is here, and the heroes of Class 1-A and 1-B are in for the toughest training camp of their lives! A group of seasoned pros pushes everyone's Quirks to new heights as the students face one overwhelming challenge after another. Braving the elements in this secret location becomes the least of their worries when routine training turns into a critical struggle for survival.\n\n(Source: Crunchyroll)",
    startDate: {
      year: 2018,
      month: 4,
      day: 7,
    },
    endDate: {
      year: 2018,
      month: 9,
      day: 29,
    },
    genres: ['Action', 'Adventure', 'Comedy', 'Drama'],
    relations: [
      {
        target: 'boku-no-hero-academia-2',
        kind: 'PREQUEL',
      },
    ],
    media: {
      cover: 'boku-no-hero-academia-3-cover.webp',
      banner: 'boku-no-hero-academia-3-banner.webp',
      gallery: [
        'boku-no-hero-academia-3-gallery-1.webp',
        'boku-no-hero-academia-3-gallery-2.webp',
        'boku-no-hero-academia-3-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'kimetsu-no-yaiba-mugen-ressha-hen',
    format: 'MOVIE',
    status: 'FINISHED',
    titleRomaji: 'Kimetsu no Yaiba: Mugen Ressha-hen',
    titleEnglish: 'Demon Slayer -Kimetsu no Yaiba- The Movie: Mugen Train',
    titleNative: '鬼滅の刃 無限列車編',
    description:
      'This Demon Slayer movie sees Tanjiro Kamado and friends from the Demon Slayer corps board the Infinity Train on a new mission to investigate a mysterious series of disappearances, perpetrated by a demon who has been tormenting people and killing the demon slayers who oppose it.',
    startDate: {
      year: 2020,
      month: 10,
      day: 16,
    },
    endDate: {
      year: 2020,
      month: 10,
      day: 16,
    },
    genres: [
      'Action',
      'Adventure',
      'Drama',
      'Fantasy',
      'Mystery',
      'Supernatural',
    ],
    relations: [
      {
        target: 'kimetsu-no-yaiba',
        kind: 'PREQUEL',
      },
    ],
    media: {
      cover: 'kimetsu-no-yaiba-mugen-ressha-hen-cover.webp',
      banner: 'kimetsu-no-yaiba-mugen-ressha-hen-banner.webp',
      gallery: [
        'kimetsu-no-yaiba-mugen-ressha-hen-gallery-1.webp',
        'kimetsu-no-yaiba-mugen-ressha-hen-gallery-2.webp',
        'kimetsu-no-yaiba-mugen-ressha-hen-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'jujutsu-kaisen-2nd-season',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Jujutsu Kaisen 2nd Season',
    titleEnglish: 'JUJUTSU KAISEN Season 2',
    titleNative: '呪術廻戦 第2期',
    description:
      'The second season of Jujutsu Kaisen.\n\nThe past comes to light when second-year students Satoru Gojou and Suguru Getou are tasked with escorting young Riko Amanai to Master Tengen. But when a non-sorcerer user tries to kill them, their mission to protect the Star Plasma Vessel threatens to turn them into bitter enemies and cement their destinies—one as the world’s strongest sorcerer, and the other its most twisted curse user!\n\n(Source: Crunchyroll)',
    startDate: {
      year: 2023,
      month: 7,
      day: 6,
    },
    endDate: {
      year: 2023,
      month: 12,
      day: 28,
    },
    genres: ['Action', 'Drama', 'Supernatural'],
    relations: [
      {
        target: 'jujutsu-kaisen',
        kind: 'PREQUEL',
      },
    ],
    media: {
      cover: 'jujutsu-kaisen-2nd-season-cover.webp',
      banner: 'jujutsu-kaisen-2nd-season-banner.webp',
      gallery: [
        'jujutsu-kaisen-2nd-season-gallery-1.webp',
        'jujutsu-kaisen-2nd-season-gallery-2.webp',
        'jujutsu-kaisen-2nd-season-gallery-3.webp',
      ],
    },
  },
  {
    slug: 'cyberpunk-edgerunners',
    format: 'ONA',
    status: 'FINISHED',
    titleRomaji: 'Cyberpunk: Edgerunners',
    titleEnglish: 'Cyberpunk: Edgerunners',
    titleNative: 'サイバーパンク エッジランナーズ',
    description:
      'An original anime series set in in the universe of Cyberpunk 2077.\n\nCyberpunk: Edgerunners tells a standalone, 10-episode story about a street kid trying to survive in a technology and body modification-obsessed city of the future. Having everything to lose, he chooses to stay alive by becoming an edgerunner—a mercenary outlaw also known as a cyberpunk.\n\n(Source: CD PROJEKT RED)\n\nNote: The first episode received a pre-screening at Anime Expo on July 2, 2022. The first 3 dubbed episodes were streamed on Twitch as part of a co-stream promotion on September 12, a day before the show’s premiere.',
    startDate: {
      year: 2022,
      month: 9,
      day: 13,
    },
    endDate: {
      year: 2022,
      month: 9,
      day: 13,
    },
    genres: ['Action', 'Drama', 'Psychological', 'Sci-Fi'],
    media: {
      cover: 'cyberpunk-edgerunners-cover.webp',
      banner: 'cyberpunk-edgerunners-banner.webp',
    },
  },
  {
    slug: 'saiki-kusuo-no-nan',
    format: 'TV_SHORT',
    status: 'FINISHED',
    titleRomaji: 'Saiki Kusuo no Ψ-nan',
    titleEnglish: 'The Disastrous Life of Saiki K.',
    titleNative: '斉木楠雄のΨ難',
    description:
      "To the average person, psychic abilities might seem a blessing; for Kusuo Saiki, however, this couldn't be further from the truth. Gifted with a wide assortment of supernatural abilities ranging from telepathy to x-ray vision, he finds this so-called blessing to be nothing but a curse. As all the inconveniences his powers cause constantly pile up, all Kusuo aims for is an ordinary, hassle-free life—a life where ignorance is bliss.\n\nUnfortunately, the life of a psychic is far from quiet. Though Kusuo tries to stay out of the spotlight by keeping his powers a secret from his classmates, he ends up inadvertently attracting the attention of many odd characters, such as the empty-headed Riki Nendou and the delusional Shun Kaidou. Forced to deal with the craziness of the people around him, Kusuo comes to learn that the ordinary life he has been striving for is a lot more difficult to achieve than expected.\n\nNote: Aired in 2 versions, a 120-episode 5-minute short series, and a combined 24-episode 24-minute TV series with the same content.",
    startDate: {
      year: 2016,
      month: 7,
      day: 4,
    },
    endDate: {
      year: 2016,
      month: 12,
      day: 26,
    },
    genres: ['Comedy', 'Slice of Life', 'Supernatural'],
    media: {
      cover: 'saiki-kusuo-no-nan-cover.webp',
      banner: 'saiki-kusuo-no-nan-banner.webp',
    },
  },
  {
    slug: 'shingeki-no-kyojin-the-final-season-kanketsu-hen-zenpen',
    format: 'SPECIAL',
    status: 'FINISHED',
    titleRomaji: 'Shingeki no Kyojin: The Final Season - Kanketsu-hen Zenpen',
    titleEnglish: 'Attack on Titan Final Season THE FINAL CHAPTERS Special 1',
    titleNative: '進撃の巨人 The Final Season完結編 前編',
    description:
      'The fate of the world hangs in the balance as Eren unleashes the ultimate power of the Titans. With a burning determination to eliminate all who threaten Eldia, he leads an unstoppable army of Colossal Titans towards Marley. Now a motley crew of his former comrades and enemies scramble to halt his deadly mission, the only question is, can they stop him?\n\n(Source: Crunchyroll)',
    startDate: {
      year: 2023,
      month: 3,
      day: 4,
    },
    endDate: {
      year: 2023,
      month: 3,
      day: 4,
    },
    genres: ['Action', 'Drama', 'Fantasy', 'Mystery', 'Psychological'],
    media: {
      cover:
        'shingeki-no-kyojin-the-final-season-kanketsu-hen-zenpen-cover.webp',
      banner:
        'shingeki-no-kyojin-the-final-season-kanketsu-hen-zenpen-banner.webp',
    },
  },
  {
    slug: 'flcl',
    format: 'OVA',
    status: 'FINISHED',
    titleRomaji: 'FLCL',
    titleEnglish: 'FLCL',
    titleNative: 'フリクリ',
    description:
      "Naota is a detached sixth grader afflicted by the pangs of puberty. He's fooling around with his brother's ex-girlfriend when a crazed girl on a motor scooter runs him over, brains him with a bass guitar, and moves into his house. This pink-haired girl, Haruko - who claims she's an alien - hurls Naota into the middle of a mega-corporation's secret agenda. Oh, and now giant battling robots shoot from his skull. Mix in mind-bending animation and tunes that echo through your cerebellum to top off the trip that will have you falling hard for FLCL.\n\n(Source: Funimation)",
    startDate: {
      year: 2000,
      month: 4,
      day: 26,
    },
    endDate: {
      year: 2001,
      month: 3,
      day: 16,
    },
    genres: ['Action', 'Comedy', 'Mecha', 'Sci-Fi'],
    media: {
      cover: 'flcl-cover.webp',
      banner: 'flcl-banner.webp',
    },
  },
  {
    slug: 'shingeki-no-kyojin-ova',
    format: 'OVA',
    status: 'FINISHED',
    titleRomaji: 'Shingeki no Kyojin OVA',
    titleEnglish: 'Attack on Titan OVA',
    titleNative: '進撃の巨人 OVA',
    description:
      'OVA 1: An old journal is found by Levi and Erwin when they conduct the surveillance operation outside the wall. The contents of "Ilse\'s Journal" result in some unexpected actions from Hange.\n\nOVA 2: Another story of the 104th Trainee Squad.\n\nOVA 3: Will depict a "memorable episode before the 104th Training Corps became unified."\n\n(Source: Anime News Network)',
    startDate: {
      year: 2013,
      month: 12,
      day: 9,
    },
    endDate: {
      year: 2014,
      month: 8,
      day: 8,
    },
    genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
    relations: [
      {
        target: 'shingeki-no-kyojin',
        kind: 'PARENT_STORY',
      },
    ],
    media: {
      cover: 'shingeki-no-kyojin-ova-cover.webp',
      banner: 'shingeki-no-kyojin-ova-banner.webp',
    },
  },
  {
    slug: 'shingeki-no-kyojin-lost-girls',
    format: 'OVA',
    status: 'FINISHED',
    titleRomaji: 'Shingeki no Kyojin: LOST GIRLS',
    titleEnglish: 'Attack on Titan: Lost Girls',
    titleNative: '進撃の巨人 LOST GIRLS',
    description:
      'A three-part OVA adapting the "Shingeki no Kyojin: Lost Girls" spinoff novel that will be bundled with the 24th, 25th and 26th limited edition volumes of the manga.\n\nWall Sina, Goodbye:\n\nAnnie Leonhart has a job to do—and a resulting absence that must stay off her record at all costs. With no one else to turn to, she asks her comrade Hitch Dreyse to cover for her. She agrees but puts forward a single condition: Annie must solve the fruitless missing person case Hitch was assigned. The case revolves around Carly Stratmann, a university graduate and the daughter of wealthy businessman Elliot Stratmann. With only a single day to solve the case and the underground of the Stohess District crawling with thugs, Annie must put her all into finding this girl. Yet, every answer she uncovers only leads to further questions—how has the illegal drug coderoin found its way to Stohess, what is Elliot hiding, and where has Carly disappeared to?\n\nLost in the Cruel World:\n\nWith worry for Eren Yeager gripping her heart, Mikasa Ackerman begins to remember. She remembers her conversations with Armin Arlert, her concern for her friends, and most painfully, the time she had almost lost everything. As fear takes control, she begins to experience an alternate version of her past—some things can be changed, but are there events so inescapable that she can\'t even prevent them in her dreams?',
    startDate: {
      year: 2017,
      month: 12,
      day: 8,
    },
    endDate: {
      year: 2018,
      month: 8,
      day: 9,
    },
    genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
    relations: [
      {
        target: 'shingeki-no-kyojin',
        kind: 'PARENT_STORY',
      },
      {
        target: 'shingeki-no-kyojin-season-3',
        kind: 'PARENT_STORY',
      },
    ],
    media: {
      cover: 'shingeki-no-kyojin-lost-girls-cover.webp',
      banner: 'shingeki-no-kyojin-lost-girls-banner.webp',
    },
  },
  {
    slug: 'shelter',
    format: 'MUSIC',
    status: 'FINISHED',
    titleRomaji: 'Shelter',
    titleEnglish: 'Shelter',
    titleNative: 'シェルター',
    description:
      'Rin, a 17-year-old girl, lives inside a futuristic simulator in infinite, beautiful loneliness. Each day, she awakens in virtual reality to create a world for herself.\n\n(Source: Official Site)',
    startDate: {
      year: 2016,
      month: 10,
      day: 18,
    },
    endDate: {
      year: 2016,
      month: 10,
      day: 18,
    },
    genres: ['Sci-Fi'],
    media: {
      cover: 'shelter-cover.webp',
      banner: 'shelter-banner.webp',
    },
  },
  {
    slug: 'shingeki-kyojin-chuugakkou',
    format: 'TV',
    status: 'FINISHED',
    titleRomaji: 'Shingeki! Kyojin Chuugakkou',
    titleEnglish: 'Attack on Titan: Junior High',
    titleNative: '進撃！巨人中学校',
    description:
      "The school comedy story is set in a junior high school and centers on the original manga's characters such as Eren and Mikasa as they battle with Titans. The spin-off incorporates gags while using Shingeki no Kyojin's story and notable scenes as its basis.",
    startDate: {
      year: 2015,
      month: 10,
      day: 4,
    },
    endDate: {
      year: 2015,
      month: 12,
      day: 20,
    },
    genres: ['Comedy', 'Fantasy', 'Slice of Life'],
    media: {
      cover: 'shingeki-kyojin-chuugakkou-cover.webp',
      banner: 'shingeki-kyojin-chuugakkou-banner.webp',
    },
  },
  {
    slug: 'kusuriya-no-hitorigoto-3rd-season',
    format: 'TV',
    status: 'NOT_YET_RELEASED',
    titleRomaji: 'Kusuriya no Hitorigoto 3rd Season',
    titleEnglish: 'The Apothecary Diaries Season 3',
    titleNative: '薬屋のひとりごと 第3期',
    description:
      'The third season of Kusuriya no Hitorigoto.\n\nIn the aftermath of the Shi Clan’s rebellion, things have finally settled down, and Maomao has returned to her old life as a pharmacist in the pleasure district.\n\nOne day, triggered by a breakfast served at the Verdigris House, Maomao senses an anomaly and begins investigating its true nature.\n\nMeanwhile, Jinshi, who has revealed his true identity as the Imperial brother and begun to face his heavy responsibilities, is deeply troubled by the final message left by Loulan: a warning of an impending "disaster that will strike the nation."\n\nTo make matters worse, rumors of a mysterious shrine maiden who deceives the people begin to spread, casting a dark shadow over the country of Li once again.\n\nFrom the depths of the inner court to the city streets, and across foreign borders—the world grows wider, and the stakes even higher for Maomao and Jinshi.\n\n(Source: Crunchyroll News)',
    startDate: {
      year: 2026,
      month: 10,
      day: 2,
    },
    genres: ['Drama', 'Mystery'],
    media: {
      cover: 'kusuriya-no-hitorigoto-3rd-season-cover.webp',
      banner: 'kusuriya-no-hitorigoto-3rd-season-banner.webp',
    },
  },
  {
    slug: 'dandadan-3rd-season',
    format: 'TV',
    status: 'NOT_YET_RELEASED',
    titleRomaji: 'Dandadan 3rd Season',
    titleEnglish: 'DAN DA DAN Season 3',
    titleNative: 'ダンダダン 第3期',
    description: 'The third season of Dandadan.',
    startDate: {
      year: 2027,
      month: null,
      day: null,
    },
    genres: ['Action', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi', 'Supernatural'],
    media: {
      cover: 'dandadan-3rd-season-cover.webp',
      banner: 'dandadan-3rd-season-banner.webp',
    },
  },
  {
    slug: 'kage-no-jitsuryokusha-ni-naritakute-zankyou-hen',
    format: 'MOVIE',
    status: 'NOT_YET_RELEASED',
    titleRomaji: 'Kage no Jitsuryokusha ni Naritakute!: Zankyou-hen',
    titleEnglish: 'The Eminence in Shadow the Movie',
    titleNative: '劇場版 陰の実力者になりたくて！ 残響編',
    description:
      'Theatrical follow-up to Kage no Jitsuryokusha ni Naritakute! 2nd season.',
    startDate: {
      year: 2027,
      month: null,
      day: null,
    },
    genres: ['Action', 'Comedy', 'Fantasy'],
    media: {
      cover: 'kage-no-jitsuryokusha-ni-naritakute-zankyou-hen-cover.webp',
      banner: 'kage-no-jitsuryokusha-ni-naritakute-zankyou-hen-banner.webp',
    },
  },
  {
    slug: 'shingeki-no-kyojin-chronicle',
    format: 'MOVIE',
    status: 'FINISHED',
    titleRomaji: 'Shingeki no Kyojin: Chronicle',
    titleEnglish: 'Attack on Titan ~Chronicle~',
    titleNative: '進撃の巨人 〜クロニクル〜',
    description: 'Movie compiling the first 3 seasons of Shingeki no Kyojin.',
    startDate: {
      year: 2020,
      month: 7,
      day: 17,
    },
    endDate: {
      year: 2020,
      month: 7,
      day: 17,
    },
    genres: ['Action', 'Drama', 'Fantasy', 'Mystery'],
    media: {
      cover: 'shingeki-no-kyojin-chronicle-cover.webp',
      banner: 'shingeki-no-kyojin-chronicle-banner.webp',
    },
  },
  {
    slug: 'shingeki-no-kyojin-kouhen-jiyuu-no-tsubasa',
    format: 'MOVIE',
    status: 'FINISHED',
    titleRomaji: 'Shingeki no Kyojin Kouhen: Jiyuu no Tsubasa',
    titleEnglish: 'Attack on Titan Part II: Wings of Freedom',
    titleNative: '劇場版「進撃の巨人」後編～自由の翼～',
    description:
      'A recompilation of the anime series. The new films will feature new dubbing and a 5.1ch remaster with returning voice cast members. The second film will cover 14 through 25.',
    startDate: {
      year: 2015,
      month: 6,
      day: 27,
    },
    endDate: {
      year: 2015,
      month: 6,
      day: 27,
    },
    genres: ['Action', 'Drama', 'Fantasy'],
    relations: [
      {
        target: 'shingeki-no-kyojin',
        kind: 'ALTERNATIVE',
      },
      {
        target: 'shingeki-no-kyojin-zenpen-guren-no-yumiya',
        kind: 'PREQUEL',
      },
    ],
    media: {
      cover: 'shingeki-no-kyojin-kouhen-jiyuu-no-tsubasa-cover.webp',
      banner: 'shingeki-no-kyojin-kouhen-jiyuu-no-tsubasa-banner.webp',
    },
  },
  {
    slug: 'yuuri-on-ice-the-movie-ice-adolescence',
    format: 'MOVIE',
    status: 'CANCELLED',
    titleRomaji: 'Yuuri!!! on ICE The Movie: ICE ADOLESCENCE',
    titleEnglish: 'Yuri!!! on Ice the Movie: Ice Adolescence',
    titleNative: 'ユーリ!!! on ICE 劇場版 : ICE ADOLESCENCE',
    description: 'Sequel movie to Yuri!!! on Ice.',
    genres: ['Sports'],
    media: {
      cover: 'yuuri-on-ice-the-movie-ice-adolescence-cover.webp',
      banner: 'yuuri-on-ice-the-movie-ice-adolescence-banner.webp',
    },
  },
  {
    slug: 'shingeki-no-kyojin-zenpen-guren-no-yumiya',
    format: 'MOVIE',
    status: 'FINISHED',
    titleRomaji: 'Shingeki no Kyojin Zenpen: Guren no Yumiya',
    titleEnglish: 'Attack on Titan Part I: Crimson Bow and Arrow',
    titleNative: '劇場版「進撃の巨人」前編～紅蓮の弓矢～',
    description:
      'A recompilation of the anime series. The new films will feature new dubbing and a 5.1ch remaster with returning voice cast members. The first film will cover episodes 1 through 13.',
    startDate: {
      year: 2014,
      month: 11,
      day: 22,
    },
    endDate: {
      year: 2014,
      month: 11,
      day: 22,
    },
    genres: ['Action', 'Drama', 'Fantasy'],
    relations: [
      {
        target: 'shingeki-no-kyojin',
        kind: 'ALTERNATIVE',
      },
      {
        target: 'shingeki-no-kyojin-kouhen-jiyuu-no-tsubasa',
        kind: 'SEQUEL',
      },
    ],
    media: {
      cover: 'shingeki-no-kyojin-zenpen-guren-no-yumiya-cover.webp',
      banner: 'shingeki-no-kyojin-zenpen-guren-no-yumiya-banner.webp',
    },
  },
  {
    slug: 'one-piece-episode-of-nami-koukaishi-no-namida-to-nakama-no-kizuna',
    format: 'SPECIAL',
    status: 'FINISHED',
    titleRomaji:
      'ONE PIECE: Episode of Nami - Koukaishi no Namida to Nakama no Kizuna',
    titleEnglish:
      'One Piece: Episode of Nami - Tears of a Navigator and the Bonds of Friends',
    titleNative: 'ONE PIECE エピソードオブナミ 〜航海士の涙と仲間の絆〜',
    description: 'A retelling of the Arlong Park arc, with new animation.',
    startDate: {
      year: 2012,
      month: 8,
      day: 25,
    },
    endDate: {
      year: 2012,
      month: 8,
      day: 25,
    },
    genres: ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy'],
    media: {
      cover:
        'one-piece-episode-of-nami-koukaishi-no-namida-to-nakama-no-kizuna-cover.webp',
      banner:
        'one-piece-episode-of-nami-koukaishi-no-namida-to-nakama-no-kizuna-banner.webp',
    },
  },
  {
    slug: 'choppers',
    format: 'TV_SHORT',
    status: 'FINISHED',
    titleRomaji: "CHOPPER's",
    titleEnglish: "CHOPPER's",
    titleNative: "CHOPPER's",
    description:
      'A comedic short series following Tony Tony Chopper and his everyday misadventures away from the main crew.',
    startDate: {
      year: 2026,
      month: 1,
      day: 5,
    },
    endDate: {
      year: 2026,
      month: 3,
      day: 23,
    },
    genres: ['Slice of Life'],
    media: {
      cover: 'choppers-cover.webp',
      banner: 'choppers-banner.webp',
    },
  },
]
