# Checking it

- H1. Language select in the header. Deutsch, then العربية. `dir` on the document goes `rtl`. At 360px the page should not scroll sideways.
- H2. `npm run build && npm run preview`, then Application → Service Workers. Go offline and reload. On `npm start` there is no worker: load the lobby once, go offline, reload. You get the last list, with a note.
- H3. Ctrl+K (Cmd+K on a Mac). Type `keel`. The studio is above Kettle Black. Enter sets `?prov=keel`.
- H4. Accent in the header. Drag it, reload. `halden.hue` is still set.
- H5. Jackpot in the header. Hide the tab and it stops. Reduced motion steps once a second.
- H6. Star two games. Drag the grip in Saved. Alt+Left / Alt+Right move them, and so do the buttons. Reload.
- H7. Not done.
- H8. Open Copper Kettle and spin. The button stays disabled until it stops, and the balance moves once. `?play=the-polite-wolf` is a table.

Other URLs:

- `?cat=slots&prov=keel&tag=megaways&sort=rtp&q=line` matches nothing. Clear filters brings the games back.
- `?broken=catalog`, then Try again. Same idea for `promos`, `wallet`, `feed`.
- `?empty=catalog` is an empty payload, so there is no clear button.
- Deposit 20. It posts. Deposit 19, or 18.99, declines and the balance returns. 19.50 posts.

## The line I trust least

`src/state/wallet.tsx`, the decline. It puts back `creditCents`, the same rounded number that was added. A spin during the wait changes the ledger in between, and that stake has to stay. The test runs that sequence in `settleDeposit`. The component repeats it. If those two copies diverge, the test still passes.

With another week I would precache the shell at build time, move the cashier to a server, and virtualize the grid if it got past a thousand games. The feed can stay a short list.
