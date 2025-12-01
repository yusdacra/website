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
            nodejs-slim_latest deno
            nodePackages.svelte-language-server
            nodePackages.typescript-language-server
          ];
          shellHook = ''
            export PATH="$PATH:$PWD/node_modules/.bin"
          '';
        };
        packages.gazesys-modules = pkgs.callPackage ./nix/modules.nix {};
        packages.gazesys = pkgs.callPackage ./nix {
          inherit (config.packages) gazesys-modules;
        };
        packages.default = config.packages.gazesys;
    };
  };
}
