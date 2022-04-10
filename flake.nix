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

  outputs = { htmlNix, flakeUtils, nixpkgs, ... }@inputs:
    with flakeUtils.lib;
    eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        inherit (pkgs.lib) mapAttrsRecursive hasSuffix last pipe;

        lib = htmlNix.lib.${system};
        site = local: lib.pkgsLib.mkSiteFrom {
          inherit local;
          src = ./.;
          templater = lib.templaters.basic;
        };
      in
      rec {
        apps = {
          website = mkApp {
            drv = lib.pkgsLib.mkServeFromSite (site true);
            name = "serve";
          };
        };
        packages = {
          website = lib.pkgsLib.mkSitePath (site false);
        };
        defaultPackage = packages.website;
        defaultApp = apps.website;
      });
}
