{
  lib,
  stdenv,
  deno,
  nodejs,
  makeBinaryWrapper,
  gazesys-modules,
  PUBLIC_BASE_URL ? "http://localhost:5173",
}:
stdenv.mkDerivation {
  name = "gazesys-website";

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../src
      ../static
      ../deno.lock
      ../package.json
      ../postcss.config.js
      ../svelte.config.js
      ../tailwind.config.js
      ../tsconfig.json
      ../vite.config.ts
    ];
  };

  nativeBuildInputs = [makeBinaryWrapper];
  buildInputs = [deno];

  inherit PUBLIC_BASE_URL;

  dontCheck = true;

  configurePhase = ''
    runHook preConfigure
    cp -R --no-preserve=ownership ${gazesys-modules} node_modules
    find node_modules -type d -exec chmod 755 {} \;
    substituteInPlace node_modules/.bin/vite \
      --replace-fail "/usr/bin/env node" "${nodejs}/bin/node"
    runHook postConfigure
  '';
  buildPhase = ''
    runHook preBuild
    HOME=$TMPDIR deno run --cached-only build
    runHook postBuild
  '';
  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin
    cp -R ./build/* $out
    cp -R ./node_modules $out

    makeBinaryWrapper ${deno}/bin/deno $out/bin/website \
      --prefix PATH : ${lib.makeBinPath [ deno ]} \
      --add-flags "run --allow-all --node-modules-dir=manual --cached-only $out/index.js"

    runHook postInstall
  '';
}
