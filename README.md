# Halden

```
npm install && npm start
```

http://localhost:5173.

The service worker is only on `npm run build && npm run preview` (port 4173). I kept it out of `npm start` because it fights Vite.

108 games, filters in the URL, a win feed, a cashier, a promo row, and a 3-reel on the slots. Tables open a note.

## What you can actually do

Query params are `q`, `cat`, `prov`, `tag`, `sort`, `play`, `focus`. Search waits 280ms, then writes `q`. Clear filters leaves `play` alone. It also leaves `broken` and `empty` alone if you added those yourself.

EUR, USD, GBP at 1, 0.92, 1.17. Math is in cents, rounded once. A deposit fails when the amount's last significant digit is 9: 19, 9, and 18.99 fail. 19.50, 20, and 90 do not. The dialog does not say so.

`?broken=catalog|promos|wallet|feed|all` fails the first try. Retry works. `?empty=catalog|promos|wallet` comes back empty.

English, German, Arabic. Theme and hue sit on the document element, so the grid does not re-render when you change them.

## Trade-offs

The feed keeps its own state. The catalog does not subscribe to it, or to the wallet, so a tick does not rebuild the cards. The feed therefore imports the game list itself.

A deposit does not copy the balance. The same rounded cents are added, and removed if it is declined, so a spin that lands during the wait is not wiped. A reload during that wait drops the pending row.

The RTP on the machine is counted from the strip, with the same `linePayout` the spin uses. Pair pays on the first two reels only.

## Bonus items

- H1. German and Arabic are both filled in. German is the long one. Arabic sets `dir`.
- H2. Failed fetch falls back to `halden.catalog` / `halden.promos`. The installable worker is the preview build, not dev.
- H3. Ctrl+K or Cmd+K. Fuzzy. A studio ranks above a weak title hit. Arrows and Enter.
- H4. Hue slider writes `--hue`.
- H5. Jackpot is a canvas on `requestAnimationFrame`. Hidden tab stops it. Reduced motion, and Arabic, just show the number. Rolling Arabic glyph by glyph comes out backwards.
- H6. Drag the grip, or Alt and the arrows, or the two buttons. Stored in `halden.favs`.
- H7. No. The feed keeps 40 rows. I would virtualize a long list, not this one.
- H8. Slots only. Stake comes off first, one spin at a time. Close it while it is spinning and the result already drawn still pays.

How to check each one, and the line I trust least, is in `PROOF.md`. The machine is `proof/copper-kettle.zip`.
