export type RashiKey =
  | 'mesh'
  | 'vrishabh'
  | 'mithun'
  | 'kark'
  | 'singh'
  | 'kanya'
  | 'tula'
  | 'vrishchik'
  | 'dhanu'
  | 'makar'
  | 'kumbh'
  | 'meen';

export type SacredTree = {
  name: string;
  significance: string;
  karma?: number;
  vitality?: number;
  harmony?: number;
};

export type RashiInfo = {
  key: RashiKey;
  name: string;
  deity?: string;
  nakshatras: string[];
  trees: SacredTree[];
};

export type RevealedTree = {
  tree: SacredTree;
  rashi: RashiInfo;
  nakshatra?: string;
};

export const RASHI_DATA: RashiInfo[] = [
  {
    key: 'mesh',
    name: 'Mesh',
    deity: 'Mangal',
    nakshatras: ['Ashwini', 'Bharani', 'Krittika'],
    trees: [
      {
        name: 'Khair',
        significance:
          'Strength & courage. Planting Khair channels the energy of Mangal and aligns your Rashi with environmental Karma.',
        karma: 14,
        vitality: 20,
        harmony: 16,
      },
      {
        name: 'Imali',
        significance:
          'Protection & vitality. Imali strengthens Mars energy and supports bold, purposeful action in nature.',
        karma: 16,
        vitality: 22,
        harmony: 14,
      },
    ],
  },
  {
    key: 'vrishabh',
    name: 'Vrishabh',
    deity: 'Shukra',
    nakshatras: ['Krittika', 'Rohini', 'Mrigashira'],
    trees: [
      {
        name: 'Jamun',
        significance:
          'Abundance & stability. Jamun connects you to Shukra’s grace and nurtures lasting prosperity through green Karma.',
        karma: 15,
        vitality: 18,
        harmony: 20,
      },
      {
        name: 'Gular',
        significance:
          'Grounded beauty. Gular aligns Vrishabh with earthy Venus energy and deepens harmony with the land.',
        karma: 13,
        vitality: 19,
        harmony: 21,
      },
    ],
  },
  {
    key: 'mithun',
    name: 'Mithun',
    deity: 'Budh',
    nakshatras: ['Mrigashira', 'Ardra', 'Punarvasu'],
    trees: [
      {
        name: 'Apamarg',
        significance:
          'Wisdom & focus. Planting Apamarg channels the energy of Budh and aligns Nakshatra with environmental Karma.',
        karma: 15,
        vitality: 22,
        harmony: 18,
      },
      {
        name: 'Arjun',
        significance:
          'Clarity & communication. Arjun supports Mithun’s mercurial mind and sharpens intent through sacred planting.',
        karma: 17,
        vitality: 19,
        harmony: 16,
      },
    ],
  },
  {
    key: 'kark',
    name: 'Kark',
    deity: 'Chandra',
    nakshatras: ['Punarvasu', 'Pushya', 'Ashlesha'],
    trees: [
      {
        name: 'Peepal',
        significance:
          'Emotional balance. Peepal honours Chandra and brings calm, nurturing energy to your sacred grove.',
        karma: 18,
        vitality: 17,
        harmony: 22,
      },
      {
        name: 'Palash',
        significance:
          'Devotion & renewal. Palash aligns Kark with lunar cycles and softens the heart toward nature.',
        karma: 16,
        vitality: 20,
        harmony: 19,
      },
    ],
  },
  {
    key: 'singh',
    name: 'Singh',
    deity: 'Surya',
    nakshatras: ['Magha', 'Purva Phalguni', 'Uttara Phalguni'],
    trees: [
      {
        name: 'Bel',
        significance:
          'Radiance & leadership. Bel tree channels Surya’s light and empowers Singh to shine through green action.',
        karma: 20,
        vitality: 21,
        harmony: 15,
      },
      {
        name: 'Khair',
        significance:
          'Royal strength. Khair supports Singh’s noble spirit and anchors solar energy in the soil.',
        karma: 18,
        vitality: 23,
        harmony: 14,
      },
    ],
  },
  {
    key: 'kanya',
    name: 'Kanya',
    deity: 'Budh',
    nakshatras: ['Uttara Phalguni', 'Hasta', 'Chitra'],
    trees: [
      {
        name: 'Apamarg',
        significance:
          'Precision & healing. Apamarg refines Kanya’s mercurial gifts and supports mindful environmental service.',
        karma: 16,
        vitality: 20,
        harmony: 17,
      },
      {
        name: 'Aam',
        significance:
          'Nourishment & order. Mango (Aam) brings sweetness and structure to Kanya’s sacred planting path.',
        karma: 14,
        vitality: 21,
        harmony: 19,
      },
    ],
  },
  {
    key: 'tula',
    name: 'Tula',
    deity: 'Shukra',
    nakshatras: ['Chitra', 'Swati', 'Vishakha'],
    trees: [
      {
        name: 'Parijat',
        significance:
          'Harmony & grace. Parijat reflects Shukra’s balance and invites beauty into your eco-spiritual journey.',
        karma: 17,
        vitality: 16,
        harmony: 23,
      },
      {
        name: 'Gular',
        significance:
          'Fairness & peace. Gular steadies Tula’s scales and deepens connection with living ecosystems.',
        karma: 15,
        vitality: 18,
        harmony: 21,
      },
    ],
  },
  {
    key: 'vrishchik',
    name: 'Vrishchik',
    deity: 'Mangal',
    nakshatras: ['Vishakha', 'Anuradha', 'Jyeshtha'],
    trees: [
      {
        name: 'Bel',
        significance:
          'Transformation & protection. Bel channels Mars intensity into healing growth for Vrishchik.',
        karma: 19,
        vitality: 22,
        harmony: 15,
      },
      {
        name: 'Neem',
        significance:
          'Purification & resilience. Neem clears negative energy and strengthens Vrishchik’s sacred bond with earth.',
        karma: 17,
        vitality: 24,
        harmony: 16,
      },
    ],
  },
  {
    key: 'dhanu',
    name: 'Dhanu',
    deity: 'Guru',
    nakshatras: ['Mool', 'Purva Ashadha', 'Uttara Ashadha'],
    trees: [
      {
        name: 'Peepal',
        significance:
          'Wisdom & expansion. Peepal aligns Dhanu with Guru’s guidance and elevates your environmental dharma.',
        karma: 21,
        vitality: 19,
        harmony: 18,
      },
      {
        name: 'Bargad',
        significance:
          'Knowledge & shelter. Banyan (Bargad) roots Dhanu in timeless wisdom and community-minded green Karma.',
        karma: 20,
        vitality: 17,
        harmony: 20,
      },
    ],
  },
  {
    key: 'makar',
    name: 'Makar',
    deity: 'Shani',
    nakshatras: ['Uttara Ashadha', 'Shravana', 'Dhanishtha'],
    trees: [
      {
        name: 'Shami',
        significance:
          'Discipline & endurance. Shami honours Shani and builds steady, lasting impact through tree planting.',
        karma: 18,
        vitality: 16,
        harmony: 17,
      },
      {
        name: 'Arjun',
        significance:
          'Patience & strength. Arjun supports Makar’s disciplined path toward meaningful ecological contribution.',
        karma: 16,
        vitality: 20,
        harmony: 18,
      },
    ],
  },
  {
    key: 'kumbh',
    name: 'Kumbh',
    deity: 'Shani',
    nakshatras: ['Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada'],
    trees: [
      {
        name: 'Peepal',
        significance:
          'Innovation & service. Peepal connects Kumbh to higher purpose and humanitarian green action.',
        karma: 17,
        vitality: 18,
        harmony: 19,
      },
      {
        name: 'Shami',
        significance:
          'Vision & stability. Shami grounds Kumbh’s ideals in practical, Saturn-guided environmental Karma.',
        karma: 19,
        vitality: 17,
        harmony: 20,
      },
    ],
  },
  {
    key: 'meen',
    name: 'Meen',
    deity: 'Guru',
    nakshatras: ['Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'],
    trees: [
      {
        name: 'Aam',
        significance:
          'Compassion & devotion. Mango (Aam) softens Meen’s spiritual nature and blesses the land with sweetness.',
        karma: 16,
        vitality: 19,
        harmony: 22,
      },
      {
        name: 'Bargad',
        significance:
          'Faith & unity. Banyan (Bargad) weaves Meen into a larger living tapestry of sacred green Karma.',
        karma: 18,
        vitality: 18,
        harmony: 21,
      },
    ],
  },
];

const RASHI_BY_KEY = Object.fromEntries(RASHI_DATA.map(r => [r.key, r])) as Record<
  RashiKey,
  RashiInfo
>;

/** Vedic (sidereal) sun-sign ranges — approximate MMDD boundaries */
export function getRashiFromDate(date: Date): RashiInfo {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const md = month * 100 + day;

  let key: RashiKey;
  if (md >= 414 && md <= 514) key = 'mesh';
  else if (md >= 515 && md <= 614) key = 'vrishabh';
  else if (md >= 615 && md <= 714) key = 'mithun';
  else if (md >= 715 && md <= 814) key = 'kark';
  else if (md >= 815 && md <= 915) key = 'singh';
  else if (md >= 916 && md <= 1016) key = 'kanya';
  else if (md >= 1017 && md <= 1114) key = 'tula';
  else if (md >= 1115 && md <= 1214) key = 'vrishchik';
  else if (md >= 1215 || md <= 113) key = 'dhanu';
  else if (md >= 114 && md <= 212) key = 'makar';
  else if (md >= 213 && md <= 313) key = 'kumbh';
  else key = 'meen';

  return RASHI_BY_KEY[key];
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function revealSacredTree(birthDate: Date): RevealedTree {
  const rashi = getRashiFromDate(birthDate);
  const tree = pickRandom(rashi.trees);
  const nakshatra = pickRandom(rashi.nakshatras);

  return { tree, rashi, nakshatra };
}
