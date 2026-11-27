# Cinderborn art and animation

The visual pass uses detailed fantasy pixel art with ink-and-brass interface
framing. Ash starts in travel clothes and gains an armored silhouette with a
better weapon. NPC roles use distinct silhouettes and house colors. Readable
combat warning geometry remains above ground details.

## Resource research

- Selected: [Tiny Swords by Pixel Frog](https://pixelfrog-assets.itch.io/tiny-swords),
  the explicitly labeled **TS_old version_CC0 Licensed**, upload 9428013.
  The downloaded archive is Tiny Swords (Update 010). It supplies real idle,
  walk and attack frames, scenery and effects. The current pack's different
  license and paid enemy pack were not used.
- [Kenney Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) is CC0, but its
  16px tiles offer less character detail for this visual direction.
- [LPC character generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator)
  offers extensive customization, with per-piece licensing and credit records.
  No LPC art is included in this release.
- Available skills reviewed: `develop-web-game` for the implementation and
  visual test loop; `imagegen` for possible custom illustration. This pass uses
  the downloaded CC0 artwork and original code-native effects, with no image
  generation, paid service or new runtime library.

## Implementation

- Original PNGs and provenance live in `public/art/tiny-swords/`; credits ship
  at `art/credits.html`, linked from the title and pause screens.
- `art.js` loads relative local assets and caches color-treated frames.
- `animation.js` and `actors.js` derive idle, walking, attack, casting, hit and
  death presentation from gameplay. Visual state never enters saves.
- `scenery.js` composes textured terrain, sprite scenery, foliage motion,
  flowing river water, forge embers, fen lights and weather.
- `render.js` draws terrain, telegraphs, sorted actors, effects and nameplates.
  Foreground roofs and trees fade when they would hide Ash.
- `icons.js` and `art.css` provide original scalable emblems and matching UI.
- Pixel edges are preserved with nearest-neighbor sprite rendering. High-DPI
  canvas backing and SVG interface emblems stay sharp on larger displays.
  Enlarging source pixels is not represented as newly painted detail.
- Reduced motion freezes decorative loops and removes dash afterimages while
  retaining the combat animation needed to understand attacks.

## Validation

Verify asset dimensions/hashes, sprite frame bounds and animation transitions;
inspect desktop and narrow screenshots; complete both campaign routes and three
echoes; check live asset delivery and save continuity after GitHub publication.
