{
  inputs = {
    htmlNix = {
      url = "https://git.gaze.systems/dusk/html.nix/archive/master.zip";
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

        aboutContent =
          builtins.readFile
          (
            ssgLib.parseMarkdown
            "about.html"
            (builtins.readFile ./about.md)
          );

        site = local:
          ssgLib.mkSiteFrom {
            inherit local;
            src = ./.;
            templater = ctx: let
              out =
                htmlLib.templaters.basic
                (
                  ctx
                  // {
                    indexContent = ''
                      ${aboutContent}
                      <img class="logo" src="resources/gaze-office.webp" style="position: fixed; left: 87%; top: 9%;">
                    '';
                  }
                );
            in
              out
              // {
                site =
                  out.site
                  // {
                    resources."gaze-office.webp" =
                      ./resources/GazeOfficeIcon.webp;
                    "site.css" = ''
                      ${out.site."site.css"}
                      ${
                        htmlLib.css.media "max-width: 48em"
                        {
                          "img.logo" = {
                            display = "none";
                          };
                        }
                      }
                    '';
                  };
              };
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
