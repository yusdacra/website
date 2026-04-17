{
  inputs.parts.url = "github:hercules-ci/flake-parts";
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  inputs.naked-shell.url = "github:90-008/mk-naked-shell";

  outputs = inp:
    inp.parts.lib.mkFlake {inputs = inp;} {
      systems = ["x86_64-linux"];
      imports = [
        inp.naked-shell.flakeModule
      ];
      perSystem = {
        lib,
        config,
        pkgs,
        ...
      }: {
        devShells.default = pkgs.mkShell {
          name = "eunomia-devshell";
          packages = with pkgs; [
            nodejs-slim_latest deno skia
            svelte-language-server
            typescript-language-server
          ];
          shellHook = ''
            export PATH="$PATH:$PWD/node_modules/.bin"
            export LD_LIBRARY_PATH="${lib.makeLibraryPath [pkgs.skia pkgs.stdenv.cc.cc.lib]}"
          '';
        };
        packages.eunomia-modules = pkgs.callPackage ./nix/modules.nix {};
        packages.eunomia = pkgs.callPackage ./nix {
          inherit (config.packages) eunomia-modules;
        };
        packages.default = config.packages.eunomia;
    };
  };
}
