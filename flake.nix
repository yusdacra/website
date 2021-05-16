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
        site = local: lib.pkgsLib.mkSiteFrom { inherit local; src = ./.; templater = context: ownTemplater (lib.templaters.basic context); };
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
