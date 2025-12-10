{
  lib,
  stdenv,
  deno,
  nodejs,
  makeBinaryWrapper,
  eunomia-modules,
  PUBLIC_BASE_URL ? "http://localhost:5173",
}:
stdenv.mkDerivation {
  name = "eunomia";

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../deno.lock
      ../deno.json
      ../eunomia
    ];
  };

  nativeBuildInputs = [makeBinaryWrapper];
  buildInputs = [deno];

  inherit PUBLIC_BASE_URL;

  dontCheck = true;

  configurePhase = ''
    runHook preConfigure
    cp -R --no-preserve=ownership ${eunomia-modules} node_modules
    find node_modules -type d -exec chmod 755 {} \;
    substituteInPlace node_modules/.bin/vite \
      --replace-fail "/usr/bin/env node" "${nodejs}/bin/node"
    runHook postConfigure
  '';
  buildPhase = ''
    runHook preBuild
    pushd eunomia
    HOME=$TMPDIR ../node_modules/.bin/vite build
    popd
    runHook postBuild
  '';
  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin
    cp -R ./eunomia/build/* $out
    cp -R ./node_modules $out

    makeBinaryWrapper ${deno}/bin/deno $out/bin/eunomia \
      --prefix PATH : ${lib.makeBinPath [ deno ]} \
      --add-flags "run --allow-all --node-modules-dir=manual --cached-only $out/index.js"

    runHook postInstall
  '';
}
