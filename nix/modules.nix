{
  lib,
  stdenv,
  deno,
}:
stdenv.mkDerivation {
  name = "eunomia-modules";

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../eunomia/package.json
      ../deno.json
      ../deno.lock
    ];
  };

  outputHash = "sha256-1TKt9DBryfSZL8kS0YrEcg8KNCSusEIsw8h0DSbVqAc=";
  outputHashAlgo = "sha256";
  outputHashMode = "recursive";

  nativeBuildInputs = [deno];

  dontConfigure = true;
  dontCheck = true;
  dontFixup = true;
  dontPatchShebangs = true;

  postUnpack = ''

  '';
  buildPhase = ''
    HOME=$TMPDIR deno install --allow-scripts=npm:protobufjs@7.5.4 --frozen --seed 8008135
  '';
  installPhase = ''
    cp -R node_modules $out
    ls -la $out
  '';
}
