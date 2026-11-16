export type Tool = { name: string; where?: string };

// Where it was used is the only part that means anything to a reader.
export const stack: Tool[] = [
  { name: 'vue', where: 'avunite, rabbit' },
  { name: 'react', where: 'rabbit' },
  { name: 'typescript' },
  { name: 'postgresql', where: 'avunite' },
  { name: 'mongodb' },
  { name: 'java' },
  { name: 'docker' },
  { name: 'kubernetes' },
  { name: 'discord.js' },
  { name: 'prettier' },
];
