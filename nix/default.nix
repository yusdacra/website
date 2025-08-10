{
  lib,
  stdenv,
  bun,
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
      ../bun.lock
      ../package.json
      ../postcss.config.js
      ../svelte.config.js
      ../tailwind.config.js
      ../tsconfig.json
      ../vite.config.ts
    ];
  };

  nativeBuildInputs = [makeBinaryWrapper];
  buildInputs = [bun];

  inherit PUBLIC_BASE_URL;

  dontCheck = true;

  configurePhase = ''
    runHook preConfigure
    cp -R --no-preserve=ownership ${gazesys-modules} node_modules
    find node_modules -type d -exec chmod 755 {} \;
    substituteInPlace node_modules/.bin/vite \
      --replace-fail "/usr/bin/env node" "${bun}/bin/bun --bun"
    runHook postConfigure
  '';
  buildPhase = ''
    runHook preBuild
    bun --prefer-offline run build
    runHook postBuild
  '';
  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin
    cp -R ./build/* $out
    cp -R ./node_modules $out

    makeBinaryWrapper ${bun}/bin/bun $out/bin/website \
      --prefix PATH : ${lib.makeBinPath [ bun ]} \
      --add-flags "run --bun --no-install --cwd $out start"

    runHook postInstall
  '';
}
