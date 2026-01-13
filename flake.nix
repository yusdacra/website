{
  inputs.parts.url = "github:hercules-ci/flake-parts";
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  inputs.naked-shell.url = "github:90-008/mk-naked-shell";
  inputs.nci.url = "github:90-008/nix-cargo-integration";
  inputs.nci.inputs.nixpkgs.follows = "nixpkgs";

  outputs = inp:
    inp.parts.lib.mkFlake {inputs = inp;} {
      systems = ["x86_64-linux"];
      imports = [
        inp.naked-shell.flakeModule
        # inp.nci.flakeModule
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
            nodePackages.svelte-language-server
            nodePackages.typescript-language-server
            rustc rust-analyzer cargo wasm-pack wasm-bindgen-cli lld rustfmt binaryen
          ];
          shellHook = ''
            export PATH="$PATH:$PWD/node_modules/.bin"
            export LD_LIBRARY_PATH="${lib.makeLibraryPath [pkgs.skia]}"
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
