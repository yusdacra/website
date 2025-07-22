{
  inputs.parts.url = "github:hercules-ci/flake-parts";
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  inputs.naked-shell.url = "github:90-008/mk-naked-shell";

  outputs = inp:
    inp.parts.lib.mkFlake {inputs = inp;} {
      systems = ["x86_64-linux"];
      imports = [
        inp.naked-shell.flakeModule
      ];
      perSystem = {
        config,
        system,
        ...
      }: let
        pkgs = inp.nixpkgs.legacyPackages.${system};
      in {
        devShells.default = config.mk-naked-shell.lib.mkNakedShell {
          name = "gazesys-devshell";
          packages = with pkgs; [
            nodejs-slim_latest bun
            nodePackages.svelte-language-server
            nodePackages.typescript-language-server
          ];
          shellHook = ''
            export PATH="$PATH:$PWD/node_modules/.bin"
          '';
        };
        packages.gazesys-modules = pkgs.stdenv.mkDerivation {
          name = "gazesys-modules";

          src = ./.;

          outputHash = "sha256-CO0bFv5WbNBSgucHCb+I9kIZEkh6QqWngRra0luMtSI=";
          outputHashAlgo = "sha256";
          outputHashMode = "recursive";

          nativeBuildInputs = [pkgs.bun];

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
        };
        packages.gazesys = pkgs.stdenv.mkDerivation {
          name = "gazesys-website";

          src = ./.;

          nativeBuildInputs = [pkgs.makeBinaryWrapper];
          buildInputs = [pkgs.bun];

          PUBLIC_BASE_URL="http://localhost:5173";

          dontCheck = true;

          configurePhase = ''
            runHook preConfigure
            cp -R --no-preserve=ownership ${config.packages.gazesys-modules} node_modules
            find node_modules -type d -exec chmod 755 {} \;
            substituteInPlace node_modules/.bin/vite \
              --replace-fail "/usr/bin/env node" "${pkgs.bun}/bin/bun --bun"
            runHook postConfigure
          '';
          buildPhase = ''
            runHook preBuild
            bun --prefer-offline run build
            runHook postBuild
          '';
          installPhase = ''
            runHook preInstall

            mkdir -p $out/bin
            cp -R ./build/* $out

            makeBinaryWrapper ${pkgs.bun}/bin/bun $out/bin/website \
              --prefix PATH : ${pkgs.lib.makeBinPath [ pkgs.bun ]} \
              --add-flags "run --bun --no-install --cwd $out start"

            runHook postInstall
          '';
        };
        packages.default = config.packages.gazesys;
      };
    };
}
