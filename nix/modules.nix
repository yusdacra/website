{
  lib,
  stdenv,
  bun,
}:
stdenv.mkDerivation {
  name = "eunomia-modules";

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../eunomia/package.json
      ../eunomia/bun.lock
    ];
  };

  outputHash = "sha256-5c5J7+PMjy7Ed6ciIc2NhVHUcOt4qnK6RTUTjM0cstQ=";
  outputHashAlgo = "sha256";
  outputHashMode = "recursive";

  nativeBuildInputs = [bun];

  dontConfigure = true;
  dontCheck = true;
  dontFixup = true;
  dontPatchShebangs = true;

  buildPhase = ''
    export BUN_INSTALL_CACHE_DIR="$TMPDIR/bun-cache"
    export BUN_INSTALL_GLOBAL_DIR="$TMPDIR/bun"
    
    cd eunomia
    bun install --frozen-lockfile --no-progress
  '';

  installPhase = ''
    cp -R node_modules $out
  '';
}
