code for my personal website.

- the website itself uses sveltekit (w/ typescript) and tailwindcss. it's served with bun.
- the logs and guestbook show posts from my bsky account and a guestbook account respectively, hosted on my pds.
- it's deployed to my server with nix, so it's packaged with nix (see flake.nix).

notes to self:

- don't use tags starting with h- (same goes for p-) in root layout or page, this causes hcard parsers to trip up