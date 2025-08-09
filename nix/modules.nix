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
      ../bun.lockb
      ../package.json
    ];
  };

  outputHash = "sha256-wa4yMkpWjn6QdDQHdyX5xhPe56IV+xrI98AzKQbbdMs=";
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
