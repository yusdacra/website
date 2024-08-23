{
  inputs.parts.url = "github:hercules-ci/flake-parts";
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  inputs.systems.url = "github:nix-systems/x86_64-linux";
  inputs.naked-shell.url = "github:yusdacra/mk-naked-shell";
  inputs.sbt-derivation.url = "github:zaninime/sbt-derivation";
  inputs.sbt-derivation.inputs.nixpkgs.follows = "nixpkgs";

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
        pkgs = inp.nixpkgs.legacyPackages.${system}.appendOverlays [inp.sbt-derivation.overlays.default];
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
          
          outputHash = "sha256-f5Z7ecsml1UKXhmGasR6WsAwJcwPU+fEwNucva2sk1M=";
          outputHashAlgo = "sha256";
          outputHashMode = "recursive";

          nativeBuildInputs = with pkgs; [bun];

          dontConfigure = true;
          impureEnvVars = pkgs.lib.fetchers.proxyImpureEnvVars
            ++ [ "GIT_PROXY_COMMAND" "SOCKS_SERVER" ];

          buildPhase = "bun install --no-progress --frozen-lockfile";
          installPhase = "mv node_modules $out";
        };
        packages.gazesys = pkgs.stdenv.mkDerivation {
          pname = packageJson.name;
          version = packageJson.version;

          src = ./.;

          nativeBuildInputs = [pkgs.makeBinaryWrapper];
          buildInputs = [pkgs.bun];

          PUBLIC_BASE_URL="http://localhost:5173";
          GUESTBOOK_BASE_URL="http://localhost:8080";

          configurePhase = ''
            runHook preConfigure
            cp -R ${config.packages.gazesys-modules} node_modules
            substituteInPlace node_modules/.bin/vite \
              --replace "/usr/bin/env node" "${pkgs.nodejs-slim_latest}/bin/node"
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
              --add-flags "run --prefer-offline --no-install --cwd $out start"

            runHook postInstall
          '';
        };
        packages.guestbook-jar = pkgs.mkSbtDerivation rec {
          pname = "guestbook";
          version = "0.0.1-jar";
          depsSha256 = "sha256-hIGZTEZpqgBuo6VGgZ6dQd5kK0RLVNy5REVBBYA3Gak=";
          src = ./guestbook;
          buildPhase = ''
            sbt assembly
            mkdir -p ./target/graalvm-native-image
          '';
          installPhase = ''
            mkdir -p $out
            cp target/scala-3.4.2/${pname}-assembly-0.0.1-SNAPSHOT.jar $out/${pname}.jar
          '';
          nativeBuildInputs = [
            pkgs.graalvm-ce
          ];
        };
        packages.guestbook = pkgs.stdenv.mkDerivation rec {
          inherit (config.packages.guestbook-jar) pname nativeBuildInputs;
          version = "0.0.1";
          src = config.packages.guestbook-jar;
          buildPhase = ''
            native-image -H:+ReportExceptionStackTraces -H:+AddAllCharsets --allow-incomplete-classpath --no-fallback --initialize-at-run-time --enable-http --enable-all-security-services --verbose -jar "./${pname}.jar" ./${pname}
          '';
          installPhase = ''
            mkdir -p $out/bin
            cp ${pname} $out/bin/${pname}
          '';
        };
        packages.default = config.packages.gazesys;
      };
    };
}
