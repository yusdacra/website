{
  inputs = {
    htmlNix = {
      url = "github:yusdacra/html.nix";
      inputs.flakeUtils.follows = "flakeUtils";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flakeUtils.url = "github:numtide/flake-utils";
  };

  outputs = { htmlNix, flakeUtils, nixpkgs, ... }@inputs:
    with flakeUtils.lib;
    eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        inherit (pkgs.lib) mapAttrsRecursive hasSuffix last pipe;

        lib = htmlNix.lib.${system};
        ownTemplater = context: context // {
          site =
            let
              headerStyle = with lib.css; css {
                "div.botheader" = {
                  position = "fixed";
                  padding-bottom = "0.5%";
                  bottom = 0;
                  left = 0;
                  right = 0;
                  margin-left = "auto";
                  margin-right = "auto";
                  text-align = "center";
                  background = "#111111";
                };
              };
              header = with lib.tags; div { class = "botheader"; }
                (a { href = "https://github.com/yusdacra/html.nix"; } "made with Nix in html.nix");
            in
            (
              mapAttrsRecursive
                (path: value:
                  if hasSuffix ".html" (last path) then "${value}\n${header}" else value)
                context.site
            ) // { "site.css" = "${context.site."site.css"}\n${headerStyle}"; };
        };
        site = local: lib.pkgsLib.mkSiteFrom { inherit local; src = ./.; templater = context: pipe context [ lib.templaters.basic ownTemplater ]; };
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
