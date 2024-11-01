code for my personal website.

- the website itself uses sveltekit (w/ typescript) and tailwindcss. it's served with bun.
- the guestbook backend is written in scala, with http4s. it's compiled to a native binary using graalvm.
- there is a discord bot written in rust so i can just DM to it and post a log entry.
- it's deployed to my server with nix, so it's packaged with nix (see flake.nix).

notes to self:

- don't use tags starting with h- in root layout or page, this causes hcard parsers to trip up