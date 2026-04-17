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

  outputHash = "sha256-tjOrxsiD3TwFGDOoqXPHnWMr3x0BUvwke2I1GJ4Syqw=";
  outputHashAlgo = "sha256";
  outputHashMode = "recursive";

  nativeBuildInputs = [ deno ];

  dontConfigure = true;
  dontCheck = true;
  dontFixup = true;
  dontPatchShebangs = true;

  postUnpack = ''

  '';
  buildPhase = ''
    HOME=$TMPDIR deno install --allow-scripts=npm:protobufjs,npm:sharp,npm:skia-canvas --frozen --seed 8008135
  '';
  installPhase = ''
    cp -R node_modules $out
    ls -la $out
  '';
}
