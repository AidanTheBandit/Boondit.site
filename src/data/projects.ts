export type Project = {
  id: string;
  name: string;
  mark: string;          // key into src/components/Marks.astro
  kicker: string;        // one word: marketplace, social, music…
  years: string;
  start: number;      // sort key: first year it existed
  desc: string;
  links: [label: string, href: string][];
  tools?: [name: string, href: string][];   // sub-list, used by the R1 page
};

// Everything here shipped. No experiments, no forks, no half-started ideas.
export const projects: Project[] = [
  {
    id: 'avunite',
    name: 'avunite',
    mark: 'avunite',
    kicker: 'company',
    years: 'since 2022',
    start: 2022,
    desc: 'The company I founded in 2022. barkle, campra and solace were all built under it.',
    links: [['avunite', 'https://avunite.com']],
  },
  {
    id: 'campra',
    name: 'campra',
    mark: 'campra',
    kicker: 'social',
    years: 'since 2025',
    start: 2025,
    desc: 'A school network on AT Protocol. Channels with roles and flairs, events with RSVPs, an application form per channel, a moderation queue, and per-seat billing for the school. Accounts outlive graduation.',
    links: [['campra.app', 'https://campra.app']],
  },
  {
    id: 'barkle',
    name: 'barkle',
    mark: 'barkle',
    kicker: 'social',
    years: '2020 → 2026',
    start: 2020,
    desc: 'A microblogging platform that ran from 2020 to 2026. The V4 rewrite was started and never shipped.',
    links: [],
  },
  {
    id: 'store',
    name: 'creations store',
    mark: 'store',
    kicker: 'marketplace',
    years: 'since 2025',
    start: 2025,
    desc: 'A marketplace for R1 apps and agent skills. Agents publish through an MCP server, but nothing goes live until a human approves it from a link that expires in 48 hours.',
    links: [['creations.boondit.com', 'https://creations.boondit.com']],
  },
  {
    id: 'rhythm',
    name: 'rhythm',
    mark: 'rhythm',
    kicker: 'music',
    years: '2026',
    start: 2026,
    desc: 'Upload a song and it generates a playable chart from the audio. Runs on the R1, submits scores, ranks them on a leaderboard.',
    links: [['rhythm.boondit.com', 'https://rhythm.boondit.com']],
  },
  {
    id: 'solace',
    name: 'solace',
    mark: 'solace',
    kicker: 'agent',
    years: 'unreleased',
    start: 2025,
    desc: 'An iMessage agent that ran tasks for you inside a VM. Built under Avunite and never released: the security model was not good enough to put in front of real phones. Closest relative is rabbit OS3.',
    links: [],
  },
  {
    id: 'game-night',
    name: 'gamenight',
    mark: 'gamenight',
    kicker: 'bot',
    years: '2026',
    start: 2026,
    desc: 'A Discord bot that runs game nights. Steam accounts linked with OAuth, join-to-create voice channels, scheduled events, and timing analytics.',
    links: [['details', '#']],
  },
  {
    id: 'firewood',
    name: 'bignicks',
    mark: 'firewood',
    kicker: 'website',
    years: '2026',
    start: 2026,
    desc: 'A landing page for a local firewood business, with a price list and an order form that goes straight to his inbox.',
    links: [['bignicksmorningwood.com', 'https://bignicksmorningwood.com']],
  },
  {
    id: 'rabbit-eng',
    mark: 'chip',
    name: 'rabbit',
    kicker: 'engineer',
    years: 'since 2026',
    start: 2026,
    desc: 'Engineering at Rabbit: rabbit OS3, the operating system the R1 runs, and R1 software. Before that I built R1 tools on my own.',
    links: [['rabbit.tech', 'https://www.rabbit.tech']],
  },
  {
    id: 'rabbit',
    name: 'r1 tools',
    mark: 'rabbit',
    kicker: 'hardware',
    years: 'since 2025',
    start: 2025,
    desc: 'Making things for the R1 since 2025: a JavaScript SDK for plugins with hardware access, a WebRTC walkie talkie, a raycasting engine, an API bridge for remote control, and recovery tooling.',
    links: [['creations store', 'https://creations.boondit.com'], ['github', 'https://github.com/AidanTheBandit']],
    tools: [
      ['r1-create sdk', 'https://www.npmjs.com/package/r1-create'],
      ['r1-anywhere', 'https://r1a.boondit.site'],
      ['r1-walky', 'https://github.com/AidanTheBandit/R1-Walky'],
      ['rabbit raycast', 'https://github.com/AidanTheBandit/Rabbit-Raycast'],
      ['creations qr', '/r1-generator/'],
    ],
  },
];

export const byId = (id: string) => projects.find((p) => p.id === id);

// newest first, for the work index
export const byNewest = [...projects].sort((a, b) => b.start - a.start);
