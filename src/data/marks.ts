// One mark per project. Drawn on a 40x40 pixel-aligned grid, 1.6px stroke,
// muted structural accents (.d), purple secondary accents (.a), one hot pink pixel (.p).
// Inlined so hover choreography in global.css can target inner groups.
export const marks: Record<string, string> = {
  avunite: `<path d="M20 8.5L31.5 28H8.5z" class="d"/>
            <path d="M20 14.5v6.5M14.5 24.5L20 21l5.5 3.5" class="a"/>
            <circle cx="20" cy="8.5" r="2.5"/>
            <circle cx="8.5" cy="28" r="2.5"/>
            <circle cx="31.5" cy="28" r="2.5"/>
            <circle class="p" cx="20" cy="21" r="2.1"/>`,

  campra: `<g class="camp">
             <rect x="5" y="20" width="9" height="13" rx="1.5"/>
             <path d="M7.5 24h4M7.5 28h4" class="d"/>
             <rect x="26" y="20" width="9" height="13" rx="1.5"/>
             <path d="M28.5 24h4M28.5 28h4" class="d"/>
           </g>
           <path d="M13 14c4.5-4 9.5-4 14 0" class="a"/>
           <path d="M9.5 20v-4c6-5.5 15-5.5 21 0v4" class="d"/>
           <circle class="p" cx="20" cy="9" r="1.8"/>`,

  barkle: `<g class="bubble">
             <path d="M7.5 10h25a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H19l-6 5.5V26H7.5A1.5 1.5 0 0 1 6 24.5v-13A1.5 1.5 0 0 1 7.5 10z"/>
             <path d="M12.5 16h15M12.5 20.5h9" class="d"/>
           </g>
           <circle class="p" cx="26.5" cy="20.5" r="1.7"/>`,

  store: `<g class="awning">
            <path d="M8.5 16l2.5-8h18l2.5 8"/>
            <path d="M8.5 16h23"/>
            <path d="M15.5 8l-1 8M24.5 8l1 8" class="d"/>
          </g>
          <path d="M11 16v15.5h18V16"/>
          <path d="M17.5 31.5V23h5v8.5" class="a"/>
          <circle class="p" cx="20" cy="12" r="1.6"/>`,

  rhythm: `<path d="M7.5 30.5h25" class="d"/>
           <path class="bar" d="M10.5 30.5V22"/>
           <path class="bar" d="M15.25 30.5V14.5"/>
           <path class="bar a" d="M20 30.5V18.5"/>
           <path class="bar" d="M24.75 30.5V9.5"/>
           <path class="bar" d="M29.5 30.5V20"/>
           <circle class="p" cx="24.75" cy="9.5" r="1.8"/>`,

  solace: `<path d="M7 27.5h26" class="d"/>
           <path d="M12.5 27.5a7.5 7.5 0 0 1 15 0"/>
           <path d="M20 12.5v-4M11.5 17l-3-3M28.5 17l3-3M7.5 22.5H4M36 22.5h-3.5" class="a"/>
           <circle class="p" cx="20" cy="22.5" r="1.9"/>`,

  gamenight: `<g class="pad">
                <rect x="5.5" y="13.5" width="29" height="14" rx="7"/>
                <path d="M13 18v5M10.5 20.5h5"/>
                <circle cx="26.5" cy="18.5" r="1.4" class="a"/>
                <circle class="p" cx="26.5" cy="23" r="1.6"/>
              </g>`,

  firewood: `<g class="logs">
               <rect x="6" y="21" width="24" height="9" rx="4.5"/>
               <rect x="10.5" y="10" width="23.5" height="9" rx="4.5"/>
               <circle cx="15.5" cy="14.5" r="1.9" class="a"/>
               <circle class="p" cx="11.5" cy="25.5" r="2"/>
             </g>`,

  chip: `<rect x="11" y="11" width="18" height="18" rx="2.5"/>
         <rect x="15.5" y="15.5" width="9" height="9" rx="1.2" class="a"/>
         <path d="M15.5 11V6.5M20 11V6.5M24.5 11V6.5M15.5 29v4.5M20 29v4.5M24.5 29v4.5M11 15.5H6.5M11 20H6.5M11 24.5H6.5M29 15.5h4.5M29 20h4.5M29 24.5h4.5" class="d"/>
         <circle class="p" cx="20" cy="20" r="1.8"/>`,

  rabbit: `<rect x="6" y="6" width="28" height="28" rx="4.5"/>
           <rect x="9.5" y="9" width="16.5" height="22" rx="2"/>
           <path d="M12.5 14h6M12.5 18h4" class="d"/>
           <circle cx="30" cy="11" r="1.5" class="a"/>
           <rect class="p" x="28.3" y="15" width="3.4" height="6.5" rx="1.7"/>`,
};
