// Original Rainbow interface glyphs: one 24px / 1.6-stroke visual language.
const paths={
 arrow:'<path d="M4 12h15M13 6l6 6-6 6"/>',
 families:'<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21v-3a6 6 0 0 1 12 0v3m1-7a5 5 0 0 1 7 4v3"/>',
 communities:'<path d="M12 22V11M12 15C3 15 3 7 3 4c6 0 9 3 9 7m0 6c8 0 9-6 9-10-6 0-9 3-9 7"/>',
 projects:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="7" r="2"/><circle cx="12" cy="20" r="2"/><path d="m7 5 10 2M6 7l5 11m7-9-5 9"/>',
 place:'<path d="M19 9c0 6-7 12-7 12S5 15 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2.5"/>',
 seed:'<path d="M12 21V9m0 6C4 15 4 7 4 5c5 0 8 4 8 7m0-2c0-5 4-8 8-8 0 6-2 10-8 10"/>',
 horizon:'<path d="M2 17h20M5 13a7 7 0 0 1 14 0M12 1v3M3 5l2 2m16-2-2 2M4 21h16"/>',
 copy:'<rect x="8" y="8" width="13" height="13" rx="3"/><path d="M16 5V3H3v13h2"/>',
 message:'<path d="M21 11a9 9 0 0 1-9 9H4l-2 2V11a9 9 0 0 1 19 0Z"/><path d="M7 9h10M7 13h7"/>',
 check:'<path d="m4 12 5 5L20 5"/>',
 instagram:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none"/>',
};
export const icon=name=>`<svg class="rs-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]||paths.arrow}</svg>`;
