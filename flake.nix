{
  inputs.parts.url = "github:hercules-ci/flake-parts";
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  inputs.systems.url = "github:nix-systems/x86_64-linux";
  inputs.naked-shell.url = "github:yusdacra/mk-naked-shell";

  outputs = inp:
    inp.parts.lib.mkFlake {inputs = inp;} {
      systems = import inp.systems;
      imports = [
        inp.naked-shell.flakeModule
      ];
      perSystem = {
        config,
        system,
        ...
      }: let
        pkgs = inp.nixpkgs.legacyPackages.${system};
        packageJson = builtins.fromJSON (builtins.readFile ./package.json);
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
          pname = "${packageJson.name}-modules";
          version = packageJson.version;

          src = ./.;
          
          outputHash = "sha256-Rk67wKAXOngKPagpAx8Zlqx7ogBBeQb4srMaJYsVobc=";
          outputHashAlgo = "sha256";
          outputHashMode = "recursive";

          nativeBuildInputs = with pkgs; [bun];

          dontConfigure = true;
          # impureEnvVars = pkgs.lib.fetchers.proxyImpureEnvVars
          #   ++ [ "GIT_PROXY_COMMAND" "SOCKS_SERVER" ];

          buildPhase = "bun install --no-cache --no-progress --frozen-lockfile";
          installPhase = ''
            mkdir -p $out/node_modules

            # Do not copy .cache or .bin
            cp -R ./node_modules/* $out/node_modules
            ls -la $out/node_modules
          '';
          dontFixup = true;
          dontPatchShebangs = true;
        };
        packages.gazesys = pkgs.stdenv.mkDerivation {
          pname = packageJson.name;
          version = packageJson.version;

          src = ./.;

          nativeBuildInputs = [pkgs.makeBinaryWrapper pkgs.rsync];
          buildInputs = [pkgs.bun];

          PUBLIC_BASE_URL="http://localhost:5173";
          GUESTBOOK_BASE_URL="http://localhost:8080";

          configurePhase = ''
            runHook preConfigure
            cp -R --no-preserve=ownership ${config.packages.gazesys-modules} node_modules
            find node_modules -type d -exec chmod 755 {} \;
            substituteInPlace node_modules/.bin/vite \
              --replace-fail "/usr/bin/env node" "${pkgs.nodejs-slim_latest}/bin/node"
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
            ln -s ${config.packages.gazesys-modules} $out
            cp -R ./build/* $out

            makeBinaryWrapper ${pkgs.bun}/bin/bun $out/bin/${packageJson.name} \
              --prefix PATH : ${pkgs.lib.makeBinPath [ pkgs.bun ]} \
              --add-flags "run --bun --prefer-offline --no-install --cwd $out start"

            runHook postInstall
          '';
        };
        packages.default = config.packages.gazesys;
      };
    };
}
