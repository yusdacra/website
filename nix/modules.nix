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

  nativeBuildInputs = [bun];

  outputHash = "sha256-fwpwLHGy3OB9exGCXCg0XjKBb6PuhMYpjIR77kob9ns=";
  outputHashAlgo = "sha256";
  outputHashMode = "recursive";

  dontConfigure = true;
  dontCheck = true;
  dontFixup = true;

  buildPhase = ''
    HOME=$TMPDIR bun install --no-cache --no-progress --frozen-lockfile
  '';
  installPhase = ''
    cp -R node_modules $out
    ls -la $out
  '';
}
