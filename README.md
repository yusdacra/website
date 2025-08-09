code for one of its (90008) human-facing data endpoints.

- the website itself uses sveltekit (w/ typescript) and tailwindcss. it's served with bun.
- the logs and guestbook show posts from its bsky account and a guestbook account respectively, hosted on its pds.
- it's deployed to a server with nix, so it's packaged with nix (see flake.nix).

notes to itself:

- don't use tags starting with h- (same goes for p-) in root layout or page, this causes hcard parsers to trip up
