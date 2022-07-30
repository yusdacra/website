{
  inputs = {
    htmlNix = {
      url = "github:yusdacra/html.nix";
      inputs.flakeUtils.follows = "flakeUtils";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flakeUtils.url = "github:numtide/flake-utils";
  };

  outputs = {
    htmlNix,
    flakeUtils,
    nixpkgs,
    ...
  } @ inputs:
    with flakeUtils.lib;
      eachDefaultSystem (system: let
        pkgs = nixpkgs.legacyPackages.${system};

        inherit (builtins) readFile;
        ssgLib = htmlNix.lib.${system}.pkgsLib;
        htmlLib = htmlNix.lib;

        site = local:
          ssgLib.mkSiteFrom {
            inherit local;
            src = ./.;
            templater = ctx:
              htmlLib.templaters.basic
              (
                ctx
                // {
                  indexContent = builtins.readFile ./main-content.html;
                  resources = {
                    "gaze-office.webp" = ./resources/GazeOfficeIcon.webp;
                  };
                }
              );
          };
      in rec {
        apps = {
          website = mkApp {
            drv = ssgLib.mkServeFromSite (site true);
            name = "serve";
          };
        };
        packages = {
          website = ssgLib.mkSitePath (site false);
        };
      });
}
