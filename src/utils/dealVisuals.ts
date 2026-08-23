import rpgRocketImg from '../assets/images/rpg_rocket_launcher_1786358929002.jpg';
import bedCleaningImg from '../assets/images/bed_being_cleaned_1786358964307.jpg';
import cleanBrushImg from '../assets/images/clean_scrub_brush_1786358992684.jpg';
import sandwichNutellaImg from '../assets/images/sandwich_nutella_jar_1786359026378.jpg';
import mcShulkerImg from '../assets/images/mc_op_shulker_1786359045673.jpg';
import knifeMeleeImg from '../assets/images/knife_melee_mastery_1786359728716.jpg';
import mcMineSpaceImg from '../assets/images/mc_mine_space_excavation_1786390150793.jpg';
import mcMegaBaseImg from '../assets/images/mc_mega_base_1786521629515.jpg';

// Minecraft Mega Base Room Photos provided by user
import mcMegabaseBedroomImg from '../assets/images/mc_megabase_bedroom_1786523663847.jpg';
import mcMegabaseBananaRoomImg from '../assets/images/mc_megabase_banana_room_1786523678733.jpg';
import mcMegabaseHallImg from '../assets/images/mc_megabase_hall_1786523693503.jpg';

// High resolution atmospheric category backgrounds requested by user
import bgBurgerNutellaImg from '../assets/images/bg_burger_nutella_1786391023682.jpg';
import bgLemonadeChaiTeaImg from '../assets/images/bg_lemonade_chai_tea_1786391035776.jpg';
import bgMcToolsBlocksImg from '../assets/images/bg_mc_tools_blocks_1786391010797.jpg';
import bgRivalsRobloxRealImg from '../assets/images/bg_rivals_roblox_real_1786390996443.jpg';
import bgRoomCleanImg from '../assets/images/bg_room_clean_1786390778102.jpg';
import bgCatChoresImg from '../assets/images/bg_cat_chores_1786478613188.jpg';
import catChoreCareImg from '../assets/images/cat_chore_care_1786478626313.jpg';
import catTreatImg from '../assets/images/cat_treat_snack_1786730352381.jpg';
import bgRobloxFischImg from '../assets/images/bg_roblox_fisch_leviathans_1787290588755.jpg';

export interface MegaBasePhoto {
  id: string;
  roomName: string;
  label: string;
  subtitle: string;
  src: string;
  topBadge: string;
  description: string;
}

export const MEGA_BASE_PHOTOS: MegaBasePhoto[] = [
  {
    id: 'bedroom',
    roomName: 'Bed Room',
    label: 'Bed Room',
    subtitle: 'Cozy Master Bedroom with Log Pillars & Wall TV Setup',
    src: mcMegabaseBedroomImg,
    topBadge: 'Abdul Deals • Bed Room',
    description: 'Custom dark oak master suite with green bed, stripped wood log corner posts, wall-mounted flat screen TV with stereo speakers, and warm glowstone backlighting.',
  },
  {
    id: 'banana_room',
    roomName: 'Banana Room with Jukebox',
    label: 'Banana Room with Jukebox',
    subtitle: 'Golden Honey Chamber with Music Disc Jukebox Station',
    src: mcMegabaseBananaRoomImg,
    topBadge: 'Abdul Deals • Banana Room with Jukebox',
    description: 'Vibrant golden honey and gold block sanctuary known as the Banana Room, featuring a dedicated jukebox playing music discs with warm amber voxel glow.',
  },
  {
    id: 'hall',
    roomName: 'Hall',
    label: 'Hall',
    subtitle: 'Grand Banquet Throne Room with Diamond & Emerald Throne Chairs',
    src: mcMegabaseHallImg,
    topBadge: 'Abdul Deals • Hall',
    description: 'Monumental royal banquet hall featuring a long transparent glass banquet table, lavish diamond and emerald gemstone throne chairs, and celestial glowstone chandeliers.',
  },
];

export const DEAL_ASSETS = {
  rpgRocket: rpgRocketImg,
  bedCleaning: bedCleaningImg,
  cleanBrush: cleanBrushImg,
  sandwichNutella: sandwichNutellaImg,
  mcShulker: mcShulkerImg,
  knifeMelee: knifeMeleeImg,
  mcMineSpace: mcMineSpaceImg,
  mcMegaBase: mcMegaBaseImg,
  mcMegaBedroom: mcMegabaseBedroomImg,
  mcMegaBananaRoom: mcMegabaseBananaRoomImg,
  mcMegaHall: mcMegabaseHallImg,
  burgerNutella: bgBurgerNutellaImg,
  drinksAll: bgLemonadeChaiTeaImg,
  mcToolsBlocks: bgMcToolsBlocksImg,
  rivalsRoblox: bgRivalsRobloxRealImg,
  roomClean: bgRoomCleanImg,
  catChores: bgCatChoresImg,
  catCare: catChoreCareImg,
  catTreat: catTreatImg,
  robloxFisch: bgRobloxFischImg,
};

export const CATEGORY_BACKGROUNDS: Record<string, string> = {
  rivals: bgRivalsRobloxRealImg,
  room: bgRoomCleanImg,
  food: bgBurgerNutellaImg,
  drinks: bgLemonadeChaiTeaImg,
  minecraft: bgMcToolsBlocksImg,
  cats: bgCatChoresImg,
  fisch: bgRobloxFischImg,
};

export function getCategoryBackground(categoryId: string): string | null {
  return CATEGORY_BACKGROUNDS[categoryId] || null;
}

export const CATEGORY_IMAGE_MAP: Record<string, string> = {
  rivals: bgRivalsRobloxRealImg,
  room: bgRoomCleanImg,
  food: bgBurgerNutellaImg,
  drinks: bgLemonadeChaiTeaImg,
  minecraft: bgMcToolsBlocksImg,
  cats: bgCatChoresImg,
  fisch: bgRobloxFischImg,
};

/**
 * Returns the best real graphic or generated artwork for a deal or category
 */
export function getDealVisualImage(deal: {
  id?: string;
  categoryId?: string;
  title?: string;
  emoji?: string;
  imageUrl?: string;
}): string | null {
  if (deal.imageUrl) return deal.imageUrl;

  const titleLower = (deal.title || '').toLowerCase();
  const catId = deal.categoryId || '';

  // Roblox Fisch deals
  if (
    catId === 'fisch' ||
    titleLower.includes('fisch') ||
    titleLower.includes('leviathan') ||
    titleLower.includes('levaithon') ||
    titleLower.includes('leavithon') ||
    titleLower.includes('lava') ||
    titleLower.includes('magma') ||
    titleLower.includes('frozen') ||
    titleLower.includes('dragon') ||
    titleLower.includes('drgon') ||
    titleLower.includes('crystallized') ||
    titleLower.includes('crysltiated') ||
    titleLower.includes('calm zone') ||
    titleLower.includes('scyla') ||
    titleLower.includes('scylla') ||
    titleLower.includes('fang rod') ||
    titleLower.includes('angler') ||
    titleLower.includes('rod')
  ) {
    return bgRobloxFischImg;
  }

  // Treat deal matching
  if (deal.id === 'cat-feed-treat' || titleLower.includes('treat') || titleLower.includes('feed cat') || titleLower.includes('snack for cat')) {
    return catTreatImg;
  }

  // Cat chores matching
  if (catId === 'cats' || titleLower.includes('cat') || titleLower.includes('litter') || titleLower.includes('feline') || titleLower.includes('kitten')) {
    return catChoreCareImg;
  }

  // Specific keyword matching
  if (titleLower.includes('mega base') || titleLower.includes('bulid a base') || titleLower.includes('build a base') || titleLower.includes('fortress') || titleLower.includes('pro base')) {
    return mcMegaBaseImg;
  }
  if (titleLower.includes('mine space') || titleLower.includes('mine / base') || titleLower.includes('plot') || titleLower.includes('excavation') || titleLower.includes('quarry') || titleLower.includes('space for')) {
    return mcMineSpaceImg;
  }
  if (titleLower.includes('knife') || titleLower.includes('500 kills') || titleLower.includes('melee')) {
    return knifeMeleeImg;
  }
  if (titleLower.includes('bed') || titleLower.includes('middle room')) {
    return bedCleaningImg;
  }
  if (titleLower.includes('clean') || titleLower.includes('door') || titleLower.includes('brush') || titleLower.includes('scrub') || titleLower.includes('dust')) {
    return cleanBrushImg;
  }
  if (titleLower.includes('nutella') || titleLower.includes('sandwich') || titleLower.includes('bun') || titleLower.includes('bread') || titleLower.includes('snack') || catId === 'food') {
    return sandwichNutellaImg;
  }
  if (catId === 'rivals' || titleLower.includes('rivals') || titleLower.includes('season pass') || titleLower.includes('ranked') || titleLower.includes('level') || titleLower.includes('task') || titleLower.includes('rpg')) {
    return rpgRocketImg;
  }
  if (catId === 'minecraft' || titleLower.includes('shulker') || titleLower.includes('coin') || titleLower.includes('survival') || titleLower.includes('notch') || titleLower.includes('base')) {
    return mcShulkerImg;
  }
  if (catId === 'room') {
    return bedCleaningImg;
  }

  return null;
}
