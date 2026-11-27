// Original vector emblems; remain crisp at any interface scale.
const paths={
 slash:'<path d="M10 22 27 5l1 8-15 14M7 19l10 10M6 30l5-5M5 27l4 4"/>',
 fire:'<path d="M18 3c3 9-4 10-1 16 4-1 5-5 5-7 8 9 7 18-4 19C6 31 5 20 12 14c-1 7 3 8 4 7-5-7 4-10 2-18Z"/>',
 mend:'<path d="M13 5h8v8h8v8h-8v8h-8v-8H5v-8h8Z"/><path d="m4 4 2 2m24-2-2 2M4 30l2-2m24 2-2-2"/>',
 dash:'<path d="m9 6 10 11L9 28m7-22 10 11-10 11M3 12h5M2 18h6m-5 6h5"/>',
 nova:'<circle cx="17" cy="17" r="8"/><path d="M17 1v6m0 20v6M1 17h6m20 0h6M5 5l5 5m14 14 5 5M5 29l5-5M24 10l5-5m-12 8v8m-4-4h8"/>',
 aegis:'<path d="m17 3 12 5v11c0 6-12 12-12 12S5 25 5 19V8Z"/><path d="m17 9 5 8-5 7-5-7Z"/>',
 potion:'<path d="M12 3h10v5H12Zm2 5v6C3 23 8 31 17 31s14-8 3-17V8M10 23h14"/><path d="M14 18v4"/>',
 record:'<path d="M8 4h18v26H8Zm4 6h10m-10 5h10m-10 5h7m-7 5h9"/>'
};
export const icon=id=>`<svg viewBox="0 0 34 34" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[id]||paths.record}</svg>`;
