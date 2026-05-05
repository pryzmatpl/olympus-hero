/**
 * Predefined shared-story arcs: each beat gives the narrator a concrete goal.
 * Used for room creation, prompt shaping, and (in shared_story mode) auto-advance after narrator beats.
 */

/** @typedef {{ key: string, title: string, directive: string }} StoryArcBeat */

/** @typedef {{ id: string, name: string, tagline: string, beats: StoryArcBeat[] }} StoryArcTemplate */

export const DEFAULT_STORY_ARC_ID = 'generic_arc';

/** @type {StoryArcTemplate[]} */
export const STORY_ARC_TEMPLATES = [
  {
    id: 'generic_arc',
    name: 'Classic Cosmic Quest',
    tagline: 'A five-beat hero journey: calm → trouble → reversal → peak → closure.',
    beats: [
      {
        key: 'intro',
        title: 'Crossing the Threshold',
        directive:
          'Ground the party in a vivid location tied to their backstories; foreshadow a looming imbalance in the cosmos; end with a sensory hook that invites the heroes to declare intent.',
      },
      {
        key: 'conflict',
        title: 'Trials of Conviction',
        directive:
          'Present a social, environmental, or mystical obstacle that splits opinions among heroes; force a choice with no perfect answer; foreshadow the cost of pride or denial.',
      },
      {
        key: 'twist',
        title: 'The Constellation Turns',
        directive:
          'Reveal that an ally, omen, or law of the realm is not what it seemed; rewrite the stakes; give each hero one line or action that reflects their core flaw or gift.',
      },
      {
        key: 'climax',
        title: 'Breaking the Sky',
        directive:
          'Stack physical danger, emotional consequence, and thematic payoff; let two heroes complement each other’s strengths; threaten a permanent change to the cosmic order.',
      },
      {
        key: 'resolution',
        title: 'New Light on the Horizon',
        directive:
          'Resolve the immediate threat while leaving a purposeful thread; show how the party has changed; invite players to name the next rumor, destination, or oath.',
      },
    ],
  },
  {
    id: 'starfall_conspiracy',
    name: 'The Starfall Conspiracy',
    tagline: 'Constellations flicker as someone trades fates for power.',
    beats: [
      {
        key: 'intro',
        title: 'Meteors Without Wishes',
        directive:
          'Open on a night when shooting stars fail to answer prayers; seed whispers of a black market in stolen destinies; weave at least one hero’s omen into the weather itself.',
      },
      {
        key: 'conflict',
        title: 'The Cartography of Lies',
        directive:
          'Introduce a celestial map, registry, or bureaucracy that omits a known hero; create paranoia about whose future has been sold; offer a clue only a skeptic and a believer can interpret together.',
      },
      {
        key: 'twist',
        title: 'The Broker Wears a Familiar Face',
        directive:
          'Expose the conspiracy’s face: someone who justified harm as mercy; flip a prior kindness into leverage; force the party to confront complicity vs. justice.',
      },
      {
        key: 'climax',
        title: 'Chains of the Night Sky',
        directive:
          'Stage a confrontation where constellations strain or snap; risk erasing memories, names, or loves; demand sacrifice that is reversible only through trust between heroes.',
      },
      {
        key: 'resolution',
        title: 'Aftermath of the Falling Stars',
        directive:
          'Return stolen threads of fate imperfectly repaired; clarify what was won and lost; tempt the heroes with a morally gray next contract or investigation.',
      },
    ],
  },
  {
    id: 'sunvault_heist',
    name: 'Heist at the Sunvault',
    tagline: 'Raid a temple of perpetual noon before the oath seals shut.',
    beats: [
      {
        key: 'intro',
        title: 'Invitation Carved in Gold',
        directive:
          'Establish the Sunvault’s oppressive brilliance and clockwork vows; imply a ticking window; tie entry to something personal each hero refuses to surrender.',
      },
      {
        key: 'conflict',
        title: 'Mirrors and Oaths',
        directive:
          'Trap the heroes with oathbound guardians or reflections that mimic doubt; escalate past stealth into improvisation; jeopardize friendship if anyone breaks silence.',
      },
      {
        key: 'twist',
        title: 'The Treasure Was the Seal',
        directive:
          'Reveal the true objective shifts mid-heist (e.g. the relic protects something worse); a participant must break a vow to proceed; herald an escape that costs daylight itself.',
      },
      {
        key: 'climax',
        title: 'When Noon Strikes Zero',
        directive:
          'Collapse corridors of light into lethal geometry; juxtapose brute nerve with careful ritual; narrowly avoid permadeath-grade consequences tied to cosmic law.',
      },
      {
        key: 'resolution',
        title: 'Shadows Returning',
        directive:
          'Escape into bruised dusk with complications; scars, debts, or curses linger; whisper the next faction hunting what they carried out.',
      },
    ],
  },
  {
    id: 'oath_of_echoes',
    name: 'Oath of Echoes',
    tagline: 'Old promises echo across lives—someone is collecting them.',
    beats: [
      {
        key: 'intro',
        title: 'Whispers in Parallel',
        directive:
          'Haunt the scene with déjà vu, shared dreams, or repeated phrases across heroes; hint that an oath outlived its speaker; keep unease literary, not jump-scare.',
      },
      {
        key: 'conflict',
        title: 'The Ledger of Names',
        directive:
          'Introduce a cult, court, or archive that trades oaths as currency; pit duty against desire; create a moral trap where keeping a word harms innocents.',
      },
      {
        key: 'twist',
        title: 'The Echo Wears Your Voice',
        directive:
          'Reveal the antagonist’s motivation mirrors a hero’s past vow twisted by grief; question whether breaking an oath can be mercy; destabilize trust with half-true memories.',
      },
      {
        key: 'climax',
        title: 'Shattering the Chorus',
        directive:
          'Weaponize layered echoes—multiple timelines or voices acting at once; demand a hero speak a new vow to cancel an old one at great cost; peak emotional and magical tension.',
      },
      {
        key: 'resolution',
        title: 'Silence With Teeth',
        directive:
          'Quiet the worst reverberations while leaving one intentional echo (hook); show how relationships shifted; invite players to define the next binding word.',
      },
    ],
  },
];

const BY_ID = new Map(STORY_ARC_TEMPLATES.map((t) => [t.id, t]));

/**
 * @param {string} [arcId]
 * @returns {StoryArcTemplate}
 */
export function getStoryArcTemplate(arcId) {
  const id = typeof arcId === 'string' && arcId.trim() ? arcId.trim() : DEFAULT_STORY_ARC_ID;
  return BY_ID.get(id) || BY_ID.get(DEFAULT_STORY_ARC_ID);
}

export function listStoryArcSummaries() {
  return STORY_ARC_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    tagline: t.tagline,
    beatCount: t.beats.length,
  }));
}

/**
 * @param {StoryArcTemplate} template
 * @param {number} stepIndex
 * @returns {StoryArcBeat | null}
 */
export function getBeatAtStep(template, stepIndex) {
  if (!template?.beats?.length) return null;
  const i = Math.max(0, Math.min(stepIndex, template.beats.length - 1));
  return template.beats[i] || null;
}
