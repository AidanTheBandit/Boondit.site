export const SITE_TITLE = "Boondit";
export const SITE_DESCRIPTION = `I am Boondit :P`.trim();

export const KNOWN_TECH =
  `Astro,Tailwindcss,Nextjs,Javascript,Typescript,Python,CSS,HTML`.split(",");
export const ABOUT_ME =
  `Hello! Im Boondit (aka Aidan). I am a backend software developer. Welcome to my blog/portfolio of what im working on. I hope you enjoy your stay`.trim();
export const GITHUB_USERNAME = "AidanTheBandit";
export const QUOTE = "I make-a the code";
export const NAV_LINKS: Array<{
  title: string;
  href?: string;
  children?: Array<{ title: string; href: string }>;
}> = [
  {
    title: "Blog",
  },
  {
    title: "Projects",
  },
  {
    title: "Rabbit Tools",
    children: [
      {
        title: "Creation Gen",
        href: "r1-generator",
      },
      {
        title: "R1 MoltBot QR Gen",
        href: "r1-moltbot-qr",
      },
    ],
  },
  {
    title: "Barkle",
    href: "//barkle.chat/@Aidan",
  },
  {
    title: "Github",
    href: "//github.com/" + GITHUB_USERNAME,
  },
  {
    title: "Buy Me a Coffee",
    href: "//buymeacoffee.com/boondit",
  },
];
