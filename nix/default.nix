{
  lib,
  stdenv,
  bun,
  skia,
  makeBinaryWrapper,
  eunomia-modules,
  PUBLIC_BASE_URL ? "http://localhost:5173",
}:
let
  ldLibraries = lib.makeLibraryPath [skia stdenv.cc.cc.lib];
in
stdenv.mkDerivation {
  name = "eunomia";

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../eunomia/bun.lock
      ../eunomia
    ];
  };

  nativeBuildInputs = [makeBinaryWrapper bun];
  buildInputs = [stdenv.cc.cc.lib];

  inherit PUBLIC_BASE_URL;

  dontCheck = true;

  configurePhase = ''
    runHook preConfigure
    cp -R --no-preserve=ownership ${eunomia-modules} eunomia/node_modules
    find eunomia/node_modules -type d -exec chmod 755 {} \;
    substituteInPlace eunomia/node_modules/.bin/vite \
      --replace-fail "/usr/bin/env node" "${bun}/bin/bun"
    runHook postConfigure
  '';

  buildPhase = ''
    runHook preBuild
    pushd eunomia
    LD_LIBRARY_PATH="${ldLibraries}" bun run build
    popd
    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin
    cp -R ./eunomia/build $out/build
    cp -R ./eunomia/node_modules $out/node_modules
    cp ./eunomia/package.json $out/package.json

    makeBinaryWrapper ${bun}/bin/bun $out/bin/eunomia \
      --prefix PATH : ${lib.makeBinPath [bun]} \
      --prefix LD_LIBRARY_PATH : "${ldLibraries}" \
      --add-flags "run -b $out/build/index.js"

    runHook postInstall
  '';
}
