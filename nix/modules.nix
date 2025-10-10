{
  lib,
  stdenv,
  deno,
}:
stdenv.mkDerivation {
  name = "gazesys-modules";

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../deno.lock
      ../package.json
    ];
  };

  outputHash = "sha256-FhJT1CR5FyGlWMYjGDQDSebXtPWdRvDn5DR/rtk/T+4=";
  outputHashAlgo = "sha256";
  outputHashMode = "recursive";

  nativeBuildInputs = [deno];

  dontConfigure = true;
  dontCheck = true;
  dontFixup = true;
  dontPatchShebangs = true;

  buildPhase = ''
    HOME=$TMPDIR deno install --allow-scripts=npm:protobufjs@7.5.4 --frozen --seed 8008135
  '';
  installPhase = ''
    cp -R node_modules $out
    ls -la $out
  '';
}
