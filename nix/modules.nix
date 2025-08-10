{
  lib,
  stdenv,
  bun,
}:
stdenv.mkDerivation {
  name = "gazesys-modules";

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../bun.lock
      ../package.json
    ];
  };

  outputHash = "sha256-GlWxpVz/G3/8Fn/TrPhJIXgXs8k0ICKoeTGE2CBdx/A=";
  outputHashAlgo = "sha256";
  outputHashMode = "recursive";

  nativeBuildInputs = [bun];

  dontConfigure = true;
  dontCheck = true;
  dontFixup = true;
  dontPatchShebangs = true;

  buildPhase = "bun install --no-cache --no-progress --frozen-lockfile";
  installPhase = ''
    mkdir -p $out

    cp -R ./node_modules/* $out
    cp -R ./node_modules/.bin $out
    ls -la $out
  '';
}
