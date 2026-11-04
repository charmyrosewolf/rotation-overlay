# rotation-overlay

A small always-on-top window that shows combat rotations next to the game: one tab per team,
coloured chips per action, optional key labels, a collapse-to-bar button and two opacity
sliders. Rotations are plain JSON files under `rotations/`, read at runtime, so editing one
updates the open window without a rebuild. Electron + electron-vite + React, styled with CSS
Modules and one `tokens.css`.

## Dev

```bash
npm install
npm run dev
```

- Dev server runs on port **5175**.
- UI edits and rotation JSON both hot-reload. Main/preload edits restart the app.
- `npm test` runs the Vitest suites, `npm run typecheck` checks both tsconfigs.

Day-to-day: `npm run build` once, then `npm start`. Rotation edits still apply live in the built
copy; only code changes need a rebuild.

Opening the dev URL in a plain browser works too: no app bar, an opaque page and a pop-out
button, with the rotations bundled by Vite instead of read by Electron.

## Adding a rotation

One team per file: `rotations/<game>/<members-in-field-order>.json`, kebab-case, in slot order
1-2-3 (e.g. `rotations/wuwa/chisa-rebecca-cantarella.json`). The folder is the game, the
filename is the members; neither is repeated inside the file.

```json
{
  "label": "🌀 Left · Cantarella",
  "order": 1,
  "variants": [
    {
      "id": "standard",
      "label": "Standard",
      "units": [
        {
          "icon": "✂️",
          "name": "Chisa — opener",
          "summary": "cut, ult",
          "steps": [
            [{ "type": "skill", "label": "Cut", "key": "E" }, { "note": "wait for the mark" }],
            [{ "type": "lib", "label": "Ult", "key": "R" }]
          ],
          "note": "repeat from Rebecca"
        }
      ],
      "tips": ["**Swap** after the second cut"]
    }
  ]
}
```

- Tabs sort by game, then `order`, then filename. The first variant is the default; a team with
  one variant shows no variant tabs.
- Chip `type` is one of `basic`, `skill`, `echo`, `lib`, `heavy`, `io`, `move`. `key` is shown
  when the *keys* box is ticked.
- A step is one numbered row of chips and `{ "note": … }` items.
- Tips join with ` · `; `**bold**` is their only markup.
- Every object is strict: an unknown key is an error. A bad file shows a card naming the file and
  the failing field, and the other tabs keep working.

The schema itself is `src/renderer/src/data/schema.ts` (zod; the types come from it).

## Future TODOs

- Per-game legend and key labels, once a second game arrives.
- HSR and Genshin rotations.
- Share a rotation file (export / import).
- Revisit the styling approach.
