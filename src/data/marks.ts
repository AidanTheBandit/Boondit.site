// One mark per project. Drawn on a 20-unit grid, 1.6px stroke, one hot pixel.
// Colours are baked in as attributes because <use> can't be styled by page CSS;
// these are inlined instead so the hover choreography in global.css can reach the groups.
export const marks: Record<string, string> = {
  avunite: `<path d="M20 8.5L31 27H9z" class="d"/>
            <circle cx="20" cy="8.5" r="2.3"/><circle cx="9" cy="27" r="2.3"/><circle cx="31" cy="27" r="2.3"/>
            <circle class="p" cx="20" cy="21" r="2"/>`,

  campra: `<g class="camp"><path d="M4.5 20.5h9v13h-9z"/><path d="M6.5 24h5M6.5 28h5" class="d"/>
           <path d="M26.5 20.5h9v13h-9z"/><path d="M28.5 24h5M28.5 28h5" class="d"/></g>
           <path d="M13.5 12.5c4.5-4 8.5-4 13 0" class="d"/>
           <path d="M9 20.5V16c6-5.5 16-5.5 22 0v4.5" class="d"/>
           <circle class="p" cx="20" cy="9" r="1.5"/>`,

  barkle: `<g class="bubble"><path d="M8 10.5h24v14.5H19l-6 5.5v-5.5H8z"/>
           <path d="M13 16.5h14M13 21h8" class="d"/></g>
           <circle class="p" cx="26" cy="21" r="1.4"/>`,

  store: `<g class="awning"><path d="M9 16l2-8h18l2 8"/><path d="M9 16h22"/></g>
          <path d="M11 16v15h18V16"/><path d="M18 31v-8h4v8"/>
          <circle class="p" cx="20" cy="12.5" r="1.4"/>`,

  rhythm: `<path d="M8 30h24" class="d"/>
           <path class="bar" d="M11 30V22"/><path class="bar" d="M16 30V14"/>
           <path class="bar" d="M21 30V18"/><path class="bar" d="M26 30V9"/>
           <path class="bar" d="M31 30V20"/>
           <circle class="p" cx="26" cy="9" r="1.6"/>`,

  solace: `<path d="M7.5 27h25" class="d"/>
           <path d="M13 27a7 7 0 0 1 14 0"/>
           <path d="M20 12.5v-4M11.5 17l-3-3M28.5 17l3-3M8 22h-4M36 22h-4"/>
           <circle class="p" cx="20" cy="22" r="1.6"/>`,

  gamenight: `<rect class="pad" x="5.5" y="14.5" width="29" height="13" rx="6.5"/>
              <path d="M13 18.5v5M10.5 21h5"/>
              <circle cx="27" cy="19.5" r="1.5"/><circle class="p" cx="27" cy="24.5" r="1.5"/>`,

  firewood: `<rect x="6" y="21" width="24" height="9" rx="4.5"/>
             <rect x="11" y="10" width="23" height="9" rx="4.5"/>
             <circle class="p" cx="11.5" cy="25.5" r="1.9"/>
             <circle cx="16" cy="14.5" r="1.9" class="d"/>`,

  chip: `<rect x="11" y="11" width="18" height="18" rx="2.5"/>
         <rect x="16.5" y="16.5" width="7" height="7" rx="1" class="d"/>
         <path d="M16 11V6M24 11V6M16 29v5M24 29v5M11 16H6M11 24H6M29 16h5M29 24h5"/>
         <circle class="p" cx="20" cy="20" r="1.6"/>`,

  rabbit: `<rect x="6" y="6" width="28" height="28" rx="4.5"/>
           <rect x="9" y="8.5" width="17.5" height="23" rx="2"/>
           <rect x="28.6" y="8.8" width="3.4" height="3.2" rx="1.6"/>
           <rect class="p" x="28.6" y="13.6" width="3.4" height="5.8" rx="1.7"/>`,
};
