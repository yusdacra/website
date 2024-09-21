code for my personal website.

- the website itself uses sveltekit (w/ typescript) and tailwindcss. it's served with bun.
- the guestbook backend is written in scala, with http4s. it's compiled to a native binary using graalvm.
- it's deployed to my server with nix, so it's packaged with nix (see flake.nix).