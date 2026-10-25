/**
 * Standby Bot Roster for 10 Birr Room (Zero-Database-Impact Architecture)
 *
 * 200 authentic Ethiopian bot profiles containing culturally accurate male/female names,
 * father names, and valid Ethiopian phone prefixes (09xx, 07xx).
 *
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * 1. This roster is stored purely in-memory in code to guarantee ZERO database modifications
 *    or pollution on the shared Neon PostgreSQL database.
 * 2. It is strictly dedicated to Room 10 ('room-10' / ARENA_ROOM_ID).
 * 3. Rooms 20, 50, and 100 remain 100% untouched and do not use this standby pool.
 */

export interface StandbyBotProfile {
  id: string;
  name: string;
  phone: string;
}

export const ETHIOPIAN_200_BOT_ROSTER: ReadonlyArray<StandbyBotProfile> = Object.freeze([
  { id: 'bot_standby_001', name: 'Abebe Bikila', phone: '0911100000' },
  { id: 'bot_standby_002', name: 'Dawit Kebede', phone: '0912103821' },
  { id: 'bot_standby_003', name: 'Yohannes Tadesse', phone: '0913107642' },
  { id: 'bot_standby_004', name: 'Henok Haile', phone: '0920111463' },
  { id: 'bot_standby_005', name: 'Yared Assefa', phone: '0921115284' },
  { id: 'bot_standby_006', name: 'Tewodros Girma', phone: '0922119105' },
  { id: 'bot_standby_007', name: 'Ermias Mengistu', phone: '0929122926' },
  { id: 'bot_standby_008', name: 'Samuel Alemayehu', phone: '0930126747' },
  { id: 'bot_standby_009', name: 'Natnael Worku', phone: '0935130568' },
  { id: 'bot_standby_010', name: 'Biruk Tefera', phone: '0940134389' },
  { id: 'bot_standby_011', name: 'Solomon Tesfaye', phone: '0944138210' },
  { id: 'bot_standby_012', name: 'Daniel Wolde', phone: '0952142031' },
  { id: 'bot_standby_013', name: 'Nahom Desta', phone: '0970145852' },
  { id: 'bot_standby_014', name: 'Abel Berhanu', phone: '0711149673' },
  { id: 'bot_standby_015', name: 'Bereket Fikadu', phone: '0712153494' },
  { id: 'bot_standby_016', name: 'Eyob Getachew', phone: '0777157315' },
  { id: 'bot_standby_017', name: 'Surafel Kassahun', phone: '0911161136' },
  { id: 'bot_standby_018', name: 'Mikiyas Mulugeta', phone: '0912164957' },
  { id: 'bot_standby_019', name: 'Biniyam Zenebe', phone: '0913168778' },
  { id: 'bot_standby_020', name: 'Robel Fisseha', phone: '0920172599' },
  { id: 'bot_standby_021', name: 'Fikadu Negash', phone: '0921176420' },
  { id: 'bot_standby_022', name: 'Getachew Seyoum', phone: '0922180241' },
  { id: 'bot_standby_023', name: 'Girma Tekle', phone: '0929184062' },
  { id: 'bot_standby_024', name: 'Kassahun Yilma', phone: '0930187883' },
  { id: 'bot_standby_025', name: 'Mulugeta Tariku', phone: '0935191704' },
  { id: 'bot_standby_026', name: 'Tadesse Teshome', phone: '0940195525' },
  { id: 'bot_standby_027', name: 'Worku Belete', phone: '0944199346' },
  { id: 'bot_standby_028', name: 'Zenebe Tamirat', phone: '0952203167' },
  { id: 'bot_standby_029', name: 'Alemayehu Eshetu', phone: '0970206988' },
  { id: 'bot_standby_030', name: 'Assefa Gizachew', phone: '0711210809' },
  { id: 'bot_standby_031', name: 'Berhanu Melaku', phone: '0712214630' },
  { id: 'bot_standby_032', name: 'Desta Mesfin', phone: '0777218451' },
  { id: 'bot_standby_033', name: 'Fisseha Endale', phone: '0911222272' },
  { id: 'bot_standby_034', name: 'Haile Dereje', phone: '0912226093' },
  { id: 'bot_standby_035', name: 'Kebede Zelalem', phone: '0913229914' },
  { id: 'bot_standby_036', name: 'Mengistu Abiy', phone: '0920233735' },
  { id: 'bot_standby_037', name: 'Negash Ephrem', phone: '0921237556' },
  { id: 'bot_standby_038', name: 'Seyoum Fitsum', phone: '0922241377' },
  { id: 'bot_standby_039', name: 'Tekle Matiwos', phone: '0929245198' },
  { id: 'bot_standby_040', name: 'Tesfaye Samson', phone: '0930249019' },
  { id: 'bot_standby_041', name: 'Tariku Temesgen', phone: '0935252840' },
  { id: 'bot_standby_042', name: 'Teshome Wondimu', phone: '0940256661' },
  { id: 'bot_standby_043', name: 'Belete Yonas', phone: '0944260482' },
  { id: 'bot_standby_044', name: 'Tamirat Zerihun', phone: '0952264303' },
  { id: 'bot_standby_045', name: 'Eshetu Anteneh', phone: '0970268124' },
  { id: 'bot_standby_046', name: 'Gizachew Bisrat', phone: '0711271945' },
  { id: 'bot_standby_047', name: 'Melaku Chala', phone: '0712275766' },
  { id: 'bot_standby_048', name: 'Mesfin Demeke', phone: '0777279587' },
  { id: 'bot_standby_049', name: 'Endale Elias', phone: '0911283408' },
  { id: 'bot_standby_050', name: 'Dereje Fantahun', phone: '0912287229' },
  { id: 'bot_standby_051', name: 'Zelalem Gashaw', phone: '0913291050' },
  { id: 'bot_standby_052', name: 'Senay Habtamu', phone: '0920294871' },
  { id: 'bot_standby_053', name: 'Kirubel Lemma', phone: '0921298692' },
  { id: 'bot_standby_054', name: 'Abiy Sileshi', phone: '0922302513' },
  { id: 'bot_standby_055', name: 'Ephrem Tolosa', phone: '0929306334' },
  { id: 'bot_standby_056', name: 'Fitsum Zewdu', phone: '0930310155' },
  { id: 'bot_standby_057', name: 'Gossaye Bekele', phone: '0935313976' },
  { id: 'bot_standby_058', name: 'Jemberu Molla', phone: '0940317797' },
  { id: 'bot_standby_059', name: 'Matiwos Ayalew', phone: '0944321618' },
  { id: 'bot_standby_060', name: 'Samson Mekonnen', phone: '0952325439' },
  { id: 'bot_standby_061', name: 'Temesgen Bogale', phone: '0970329260' },
  { id: 'bot_standby_062', name: 'Wondimu Belay', phone: '0711333081' },
  { id: 'bot_standby_063', name: 'Yonas Abera', phone: '0712336902' },
  { id: 'bot_standby_064', name: 'Zerihun Negussie', phone: '0777340723' },
  { id: 'bot_standby_065', name: 'Anteneh Ayele', phone: '0911344544' },
  { id: 'bot_standby_066', name: 'Bisrat Hailu', phone: '0912348365' },
  { id: 'bot_standby_067', name: 'Chala Kassa', phone: '0913352186' },
  { id: 'bot_standby_068', name: 'Demeke Desalegn', phone: '0920356007' },
  { id: 'bot_standby_069', name: 'Elias Shiferaw', phone: '0921359828' },
  { id: 'bot_standby_070', name: 'Fantahun Chekol', phone: '0922363649' },
  { id: 'bot_standby_071', name: 'Gashaw Baye', phone: '0929367470' },
  { id: 'bot_standby_072', name: 'Habtamu Gebeyehu', phone: '0930371291' },
  { id: 'bot_standby_073', name: 'Lemma Mamo', phone: '0935375112' },
  { id: 'bot_standby_074', name: 'Sileshi Regassa', phone: '0940378933' },
  { id: 'bot_standby_075', name: 'Tolosa Tolera', phone: '0944382754' },
  { id: 'bot_standby_076', name: 'Wendesen Feyisa', phone: '0952386575' },
  { id: 'bot_standby_077', name: 'Yabsira Tulu', phone: '0970390396' },
  { id: 'bot_standby_078', name: 'Zewdu Gemechu', phone: '0711394217' },
  { id: 'bot_standby_079', name: 'Bekele Bedada', phone: '0712398038' },
  { id: 'bot_standby_080', name: 'Molla Dejene', phone: '0777401859' },
  { id: 'bot_standby_081', name: 'Ayalew Woldemariam', phone: '0911405680' },
  { id: 'bot_standby_082', name: 'Mekonnen Gebremariam', phone: '0912409501' },
  { id: 'bot_standby_083', name: 'Bogale Weldegebriel', phone: '0913413322' },
  { id: 'bot_standby_084', name: 'Belay Gebremeskel', phone: '0920417143' },
  { id: 'bot_standby_085', name: 'Abera Gidey', phone: '0921420964' },
  { id: 'bot_standby_086', name: 'Negussie Tesema', phone: '0922424785' },
  { id: 'bot_standby_087', name: 'Ayele Kidanemariam', phone: '0929428606' },
  { id: 'bot_standby_088', name: 'Hailu Lulseged', phone: '0930432427' },
  { id: 'bot_standby_089', name: 'Kassa Gossaye', phone: '0935436248' },
  { id: 'bot_standby_090', name: 'Desalegn Jemberu', phone: '0940440069' },
  { id: 'bot_standby_091', name: 'Shiferaw Senay', phone: '0944443890' },
  { id: 'bot_standby_092', name: 'Chekol Kirubel', phone: '0952447711' },
  { id: 'bot_standby_093', name: 'Baye Wendesen', phone: '0970451532' },
  { id: 'bot_standby_094', name: 'Gebeyehu Yabsira', phone: '0711455353' },
  { id: 'bot_standby_095', name: 'Mamo Nega', phone: '0712459174' },
  { id: 'bot_standby_096', name: 'Regassa Petros', phone: '0777462995' },
  { id: 'bot_standby_097', name: 'Tolera Umer', phone: '0911466816' },
  { id: 'bot_standby_098', name: 'Feyisa Rashid', phone: '0912470637' },
  { id: 'bot_standby_099', name: 'Tulu Mahder', phone: '0913474458' },
  { id: 'bot_standby_100', name: 'Gemechu Nuredin', phone: '0920478279' },
  { id: 'bot_standby_101', name: 'Selamawit Bikila', phone: '0921482100' },
  { id: 'bot_standby_102', name: 'Tigist Kebede', phone: '0922485921' },
  { id: 'bot_standby_103', name: 'Meron Tadesse', phone: '0929489742' },
  { id: 'bot_standby_104', name: 'Bethlehem Haile', phone: '0930493563' },
  { id: 'bot_standby_105', name: 'Almaz Assefa', phone: '0935497384' },
  { id: 'bot_standby_106', name: 'Aster Girma', phone: '0940501205' },
  { id: 'bot_standby_107', name: 'Rahel Mengistu', phone: '0944505026' },
  { id: 'bot_standby_108', name: 'Hiwot Alemayehu', phone: '0952508847' },
  { id: 'bot_standby_109', name: 'Meseret Worku', phone: '0970512668' },
  { id: 'bot_standby_110', name: 'Tsion Tefera', phone: '0711516489' },
  { id: 'bot_standby_111', name: 'Hana Tesfaye', phone: '0712520310' },
  { id: 'bot_standby_112', name: 'Senait Wolde', phone: '0777524131' },
  { id: 'bot_standby_113', name: 'Emebet Desta', phone: '0911527952' },
  { id: 'bot_standby_114', name: 'Frehiwot Berhanu', phone: '0912531773' },
  { id: 'bot_standby_115', name: 'Kidist Fikadu', phone: '0913535594' },
  { id: 'bot_standby_116', name: 'Lensa Getachew', phone: '0920539415' },
  { id: 'bot_standby_117', name: 'Mahlet Kassahun', phone: '0921543236' },
  { id: 'bot_standby_118', name: 'Netsanet Mulugeta', phone: '0922547057' },
  { id: 'bot_standby_119', name: 'Roman Zenebe', phone: '0929550878' },
  { id: 'bot_standby_120', name: 'Sara Fisseha', phone: '0930554699' },
  { id: 'bot_standby_121', name: 'Tsedey Negash', phone: '0935558520' },
  { id: 'bot_standby_122', name: 'Yemisrach Seyoum', phone: '0940562341' },
  { id: 'bot_standby_123', name: 'Zewditu Tekle', phone: '0944566162' },
  { id: 'bot_standby_124', name: 'Aberash Yilma', phone: '0952569983' },
  { id: 'bot_standby_125', name: 'Bizunesh Tariku', phone: '0970573804' },
  { id: 'bot_standby_126', name: 'Chaltu Teshome', phone: '0711577625' },
  { id: 'bot_standby_127', name: 'Derartu Belete', phone: '0712581446' },
  { id: 'bot_standby_128', name: 'Etsegenet Tamirat', phone: '0777585267' },
  { id: 'bot_standby_129', name: 'Fantu Eshetu', phone: '0911589088' },
  { id: 'bot_standby_130', name: 'Genet Gizachew', phone: '0912592909' },
  { id: 'bot_standby_131', name: 'Hawi Melaku', phone: '0913596730' },
  { id: 'bot_standby_132', name: 'Konjit Mesfin', phone: '0920600551' },
  { id: 'bot_standby_133', name: 'Lemlem Endale', phone: '0921604372' },
  { id: 'bot_standby_134', name: 'Martha Dereje', phone: '0922608193' },
  { id: 'bot_standby_135', name: 'Nigist Zelalem', phone: '0929612014' },
  { id: 'bot_standby_136', name: 'Rekik Abiy', phone: '0930615835' },
  { id: 'bot_standby_137', name: 'Samrawit Ephrem', phone: '0935619656' },
  { id: 'bot_standby_138', name: 'Tirhas Fitsum', phone: '0940623477' },
  { id: 'bot_standby_139', name: 'Wubit Matiwos', phone: '0944627298' },
  { id: 'bot_standby_140', name: 'Yetnayet Samson', phone: '0952631119' },
  { id: 'bot_standby_141', name: 'Birtukan Temesgen', phone: '0970634940' },
  { id: 'bot_standby_142', name: 'Danawit Wondimu', phone: '0711638761' },
  { id: 'bot_standby_143', name: 'Emnet Yonas', phone: '0712642582' },
  { id: 'bot_standby_144', name: 'Feven Zerihun', phone: '0777646403' },
  { id: 'bot_standby_145', name: 'Gelila Anteneh', phone: '0911650224' },
  { id: 'bot_standby_146', name: 'Helina Bisrat', phone: '0912654045' },
  { id: 'bot_standby_147', name: 'Kalkidan Chala', phone: '0913657866' },
  { id: 'bot_standby_148', name: 'Lidya Demeke', phone: '0920661687' },
  { id: 'bot_standby_149', name: 'Mehret Elias', phone: '0921665508' },
  { id: 'bot_standby_150', name: 'Nardos Fantahun', phone: '0922669329' },
  { id: 'bot_standby_151', name: 'Ruth Gashaw', phone: '0929673150' },
  { id: 'bot_standby_152', name: 'Saron Habtamu', phone: '0930676971' },
  { id: 'bot_standby_153', name: 'Tinbit Lemma', phone: '0935680792' },
  { id: 'bot_standby_154', name: 'Weynshet Sileshi', phone: '0940684613' },
  { id: 'bot_standby_155', name: 'Yeabsira Tolosa', phone: '0944688434' },
  { id: 'bot_standby_156', name: 'Asnakech Zewdu', phone: '0952692255' },
  { id: 'bot_standby_157', name: 'Bilen Bekele', phone: '0970696076' },
  { id: 'bot_standby_158', name: 'Dagmawit Molla', phone: '0711699897' },
  { id: 'bot_standby_159', name: 'Eden Ayalew', phone: '0712703718' },
  { id: 'bot_standby_160', name: 'Hermela Mekonnen', phone: '0777707539' },
  { id: 'bot_standby_161', name: 'Lewam Bogale', phone: '0911711360' },
  { id: 'bot_standby_162', name: 'Mihret Belay', phone: '0912715181' },
  { id: 'bot_standby_163', name: 'Nuhamin Abera', phone: '0913719002' },
  { id: 'bot_standby_164', name: 'Rediet Negussie', phone: '0920722823' },
  { id: 'bot_standby_165', name: 'Sifen Ayele', phone: '0921726644' },
  { id: 'bot_standby_166', name: 'Tihitina Hailu', phone: '0922730465' },
  { id: 'bot_standby_167', name: 'Winta Kassa', phone: '0929734286' },
  { id: 'bot_standby_168', name: 'Yordanos Desalegn', phone: '0930738107' },
  { id: 'bot_standby_169', name: 'Zena Shiferaw', phone: '0935741928' },
  { id: 'bot_standby_170', name: 'Ayantu Chekol', phone: '0940745749' },
  { id: 'bot_standby_171', name: 'Blen Baye', phone: '0944749570' },
  { id: 'bot_standby_172', name: 'Dina Gebeyehu', phone: '0952753391' },
  { id: 'bot_standby_173', name: 'Eleni Mamo', phone: '0970757212' },
  { id: 'bot_standby_174', name: 'Feker Regassa', phone: '0711761033' },
  { id: 'bot_standby_175', name: 'Haimanot Tolera', phone: '0712764854' },
  { id: 'bot_standby_176', name: 'Ililli Feyisa', phone: '0777768675' },
  { id: 'bot_standby_177', name: 'Kemer Tulu', phone: '0911772496' },
  { id: 'bot_standby_178', name: 'Luwam Gemechu', phone: '0912776317' },
  { id: 'bot_standby_179', name: 'Mizan Bedada', phone: '0913780138' },
  { id: 'bot_standby_180', name: 'Ruhama Dejene', phone: '0920783959' },
  { id: 'bot_standby_181', name: 'Tsige Woldemariam', phone: '0921787780' },
  { id: 'bot_standby_182', name: 'Zufan Gebremariam', phone: '0922791601' },
  { id: 'bot_standby_183', name: 'Metadel Weldegebriel', phone: '0929795422' },
  { id: 'bot_standby_184', name: 'Edom Gebremeskel', phone: '0930799243' },
  { id: 'bot_standby_185', name: 'Kiya Gidey', phone: '0935803064' },
  { id: 'bot_standby_186', name: 'Saba Tesema', phone: '0940806885' },
  { id: 'bot_standby_187', name: 'Marta Kidanemariam', phone: '0944810706' },
  { id: 'bot_standby_188', name: 'Selam Lulseged', phone: '0952814527' },
  { id: 'bot_standby_189', name: 'Beti Gossaye', phone: '0970818348' },
  { id: 'bot_standby_190', name: 'Hermi Jemberu', phone: '0711822169' },
  { id: 'bot_standby_191', name: 'Kiddy Senay', phone: '0712825990' },
  { id: 'bot_standby_192', name: 'Mimi Kirubel', phone: '0777829811' },
  { id: 'bot_standby_193', name: 'Lili Wendesen', phone: '0911833632' },
  { id: 'bot_standby_194', name: 'Titi Yabsira', phone: '0912837453' },
  { id: 'bot_standby_195', name: 'Fifi Nega', phone: '0913841274' },
  { id: 'bot_standby_196', name: 'Sosina Petros', phone: '0920845095' },
  { id: 'bot_standby_197', name: 'Kokeb Umer', phone: '0921848916' },
  { id: 'bot_standby_198', name: 'Enat Rashid', phone: '0922852737' },
  { id: 'bot_standby_199', name: 'Fenet Mahder', phone: '0929856558' },
  { id: 'bot_standby_200', name: 'Hirut Nuredin', phone: '0930860379' }
]);

/**
 * Standby Bot Pool Configuration & Range Bounds
 */
export const MIN_STANDBY_BOT_COUNT = 0;
export const MAX_STANDBY_BOT_COUNT = 50;
export const DEFAULT_STANDBY_BOT_COUNT = 20;

// Legacy backwards compatibility alias
export const STANDBY_BOT_COUNT = 50;

export interface BotEngineConfig {
  mode: 'dynamic' | 'fixed' | 'disabled';
  minBots: number;        // 0 to 50 (default 2)
  maxBots: number;        // 0 to 50 (default 50)
  fixedCount: number;     // 0 to 50 (default 20)
  staggeredJoin: boolean; // trickle bots in lobby countdown
  livingClock: boolean;   // continuous autonomous game loop
}

/**
 * Organic traffic curve generator for dynamic bot target counts.
 * Simulates quiet tables, average rooms, and peak rush-hours organically.
 */
export function generateDynamicBotTarget(min: number = 2, max: number = 50): number {
  const safeMin = Math.max(MIN_STANDBY_BOT_COUNT, Math.min(min, MAX_STANDBY_BOT_COUNT));
  const safeMax = Math.max(safeMin, Math.min(max, MAX_STANDBY_BOT_COUNT));
  if (safeMin >= safeMax) return safeMin;

  const rand = Math.random();
  if (rand < 0.15) {
    // 15% chance: Quiet table (e.g. 2 to 9 bots)
    const quietCap = Math.min(safeMax, Math.max(safeMin, 9));
    return Math.floor(safeMin + Math.random() * (quietCap - safeMin + 1));
  } else if (rand < 0.75) {
    // 60% chance: Normal bustling room (e.g. 10 to 30 bots)
    const low = Math.min(safeMax, Math.max(safeMin, 10));
    const high = Math.min(safeMax, Math.max(low, 30));
    return Math.floor(low + Math.random() * (high - low + 1));
  } else {
    // 25% chance: Peak mega pot (e.g. 31 to 50 bots)
    const low = Math.min(safeMax, Math.max(safeMin, 31));
    return Math.floor(low + Math.random() * (safeMax - low + 1));
  }
}

/**
 * Uniformly samples N distinct bots from the 200-bot roster.
 * Uses Fisher-Yates true random shuffle to guarantee dynamic rotation
 * so players never see the same bots repeatedly.
 *
 * @param count Number of bots to sample (default 20, supports 0 to 50)
 * @param excludeIds Optional set of bot IDs to exclude from this round
 * @returns Array of StandbyBotProfile
 */
export function sampleStandbyBots(count: number = DEFAULT_STANDBY_BOT_COUNT, excludeIds?: Set<string>): StandbyBotProfile[] {
  if (count <= 0) {
    return [];
  }

  const eligible = excludeIds && excludeIds.size > 0
    ? ETHIOPIAN_200_BOT_ROSTER.filter(b => !excludeIds.has(b.id))
    : [...ETHIOPIAN_200_BOT_ROSTER];

  // Fisher-Yates Shuffle on a copy
  const shuffled = [...eligible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Checks if a given user/bot ID belongs to the standby bot roster.
 */
export function isStandbyBotId(id?: string): boolean {
  if (!id) return false;
  return id.startsWith('bot_standby_');
}

/**
 * Fast lookup helper for a standby bot by ID.
 */
export function getStandbyBotById(id: string): StandbyBotProfile | undefined {
  return ETHIOPIAN_200_BOT_ROSTER.find(b => b.id === id);
}
