import { QUEST_MAIN } from '../data/gameData.js';

// Builds a dialogue script for an NPC based on current save state.
// Returns { title, lines: string[], choices?: [{label, action}] }
export function buildDialogue(npcId, save) {
  const q = save.quests.mainQuest;

  if (npcId === 'elowen') {
    if (q.state === 'not_started') {
      return {
        title: 'Headkeeper Elowen',
        lines: [
          'Å, en Wingkeeper! Godt at du kom forbi.',
          'Stjernekartet mitt har mistet all energi — de tre stjernefragmentene som holder det i live, har spredt seg ut i dalen.',
          'Vil du hjelpe meg å finne dem igjen?',
        ],
        choices: [
          { label: 'Ja, jeg vil gjerne hjelpe deg', action: 'accept_quest' },
          { label: 'Kanskje litt senere', action: 'decline' },
        ],
      };
    }
    if (q.state === 'active' && q.fragmentsFound < 3) {
      return {
        title: 'Headkeeper Elowen',
        lines: [
          'Se deg rundt i dalen — fragmentene gløder svakt når du er i nærheten.',
          `Stjernefragmenter funnet: ${q.fragmentsFound} av 3.`,
        ],
      };
    }
    if (q.state === 'active' && q.fragmentsFound >= 3) {
      return {
        title: 'Headkeeper Elowen',
        lines: [
          'Du fant dem alle tre! Fantastisk arbeid.',
          'Stjernekartet gløder allerede varmere. Ta imot dette som takk.',
          `Du mottok ${QUEST_MAIN.rewardStardust} Stjernestøv og «Stjernekartists brosje».`,
        ],
        onFinish: 'complete_quest',
      };
    }
    return {
      title: 'Headkeeper Elowen',
      lines: [
        'Stjernekartet lyser sterkere enn på årevis, takket være deg.',
        'Lunaria har flere hemmeligheter å vise deg etter hvert — men ta deg tid til å utforske dalen først.',
      ],
    };
  }

  if (npcId === 'mira') {
    if (!save.dialogueFlags.miraChoice) {
      return {
        title: 'Mira Vale',
        lines: [
          'Hei og velkommen til Vennskapstorget!',
          'Jeg elsker å se hva folk finner på å ta på seg. Hva synes du selv om stilen din i dag?',
        ],
        choices: [
          { label: 'Jeg liker å holde det enkelt', action: 'mira_simple' },
          { label: 'Jeg elsker å eksperimentere med stil', action: 'mira_bold' },
        ],
      };
    }
    const line = save.dialogueFlags.miraChoice === 'mira_bold'
      ? 'Det visste jeg! Du har et blikk for det uventede. Kom innom igjen — jeg finner alltid noe nytt å snakke om.'
      : 'Enkelt og ekte, akkurat som dalen selv. Kom innom igjen når som helst!';
    return { title: 'Mira Vale', lines: [line] };
  }

  if (npcId === 'rowan') {
    if (!save.dialogueFlags.rowanClueGiven) {
      return {
        title: 'Rowan Thale',
        lines: [
          'Sst — hører du det? Noe beveger seg lengre inne i Whisperwood.',
          'Jeg tror en liten skapning der inne trenger hjelp, men stien er ikke trygg å utforske ennå.',
          'Jeg skriver det ned i dagboken min. Kanskje du kan hjelpe når tiden er inne.',
        ],
        onFinish: 'rowan_clue',
      };
    }
    return {
      title: 'Rowan Thale',
      lines: ['Whisperwood venter fortsatt på oss. Jeg holder øynene åpne til vi kan gå dit sammen.'],
    };
  }

  return { title: 'Ukjent', lines: ['...'] };
}
