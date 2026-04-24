{
  lib,
  stdenv,
  bun,
  skia,
  jemalloc,
  musl,
  glibc,
  autoPatchelfHook,
  makeBinaryWrapper,
  endpoint-modules,
  PUBLIC_BASE_URL ? "http://localhost:5173",
}:
stdenv.mkDerivation {
  name = "endpoint";

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../package.json
      ../bun.lock
      ../vite.config.ts
      ../svelte.config.js
      ../tsconfig.json
      ../tailwind.config.js
      ../postcss.config.js
      ../eslint.config.js
      ../.prettierrc
      ../.prettierignore
      ../src
      ../static
    ];
  };

  nativeBuildInputs = [makeBinaryWrapper autoPatchelfHook];
  buildInputs = [bun stdenv.cc.cc.lib skia glibc musl];

  inherit PUBLIC_BASE_URL;

  dontCheck = true;

  configurePhase = ''
    runHook preConfigure
    cp -R --no-preserve=ownership,mode ${endpoint-modules} node_modules
    find node_modules/.bin -exec chmod 755 {} \;
    find node_modules -type d -exec chmod 755 {} \;
    substituteInPlace node_modules/.bin/vite \
      --replace-fail "/usr/bin/env node" "${bun}/bin/bun --bun"
    runHook postConfigure
  '';
  buildPhase = ''
    runHook preBuild
    export LD_LIBRARY_PATH="${lib.makeLibraryPath [stdenv.cc.cc.lib musl glibc]}:$LD_LIBRARY_PATH"
    HOME=$TMPDIR ${bun}/bin/bun --prefer-offline run build
    runHook postBuild
  '';
  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin
    cp -R ./build/* $out
    cp -R ./node_modules $out

    makeBinaryWrapper ${bun}/bin/bun $out/bin/endpoint \
      --prefix PATH : ${lib.makeBinPath [ bun ]} \
      --prefix LD_LIBRARY_PATH : "${lib.makeLibraryPath [skia stdenv.cc.cc.lib]}" \
      --set LD_PRELOAD "${jemalloc}/lib/libjemalloc.so.2" \
      --set MALLOC_ARENA_MAX 2 \
      --set VIPS_CONCURRENY 1 \
      --add-flags "run --bun --no-install --cwd $out index.js"

    runHook postInstall
  '';
}
