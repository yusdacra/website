{
  lib,
  stdenv,
  bun,
}:
stdenv.mkDerivation {
  name = "endpoint-modules";

  src = lib.fileset.toSource {
    root = ../.;
    fileset = lib.fileset.unions [
      ../package.json
      ../bun.lock
    ];
  };

  nativeBuildInputs = [ bun ];

  dontConfigure = true;
  dontCheck = true;
  dontFixup = true;
  dontPatchShebangs = true;

  postUnpack = ''

  '';
  buildPhase = ''
    HOME=$TMPDIR bun install --frozen-lockfile
  '';
  installPhase = ''
    cp -R node_modules $out
    ls -la $out
  '';
}
