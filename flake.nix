{
  inputs = {
    htmlNix = {
      url = "github:yusdacra/html.nix";
      inputs.flakeUtils.follows = "flakeUtils";
    };
    flakeUtils.url = "github:numtide/flake-utils";
  };

  outputs = { htmlNix, flakeUtils, ... }@inputs:
    with flakeUtils.lib;
    eachDefaultSystem (system:
      let
        lib = htmlNix.lib.${system};
        ownTemplater = x: x;
        site = lib.pkgsLib.mkSiteFrom { src = ./.; templater = context: ownTemplater (lib.templaters.basic context); };
      in
      rec {
        apps = {
          website = mkApp {
            drv = lib.pkgsLib.mkServeFromSite site;
            name = "serve";
          };
        };
        packages = {
          website = lib.pkgsLib.mkSitePath site;
        };
        defaultPackage = packages.website;
        defaultApp = apps.website;
      });
}
