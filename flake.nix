{
  inputs = {
    html-nix.url = "git+https://git.gaze.systems/dusk/html.nix.git";
    nixpkgs.follows = "html-nix/nixpkgs";
    parts.follows = "html-nix/parts";
  };

  outputs = inputs @ {parts, ...}:
    parts.lib.mkFlake {inherit inputs;} (topArgs: {
      systems = ["x86_64-linux"];
      imports = [inputs.html-nix.flakeModule];
      perSystem = {
        config,
        lib,
        ...
      }: let
        l = lib // builtins;
        html-nix = config.html-nix.lib;
        site = local:
          html-nix.mkSiteFrom {
            inherit local;
            src = ./src;
            config = {
              baseurl = "https://gaze.systems";
              title = "dusk's place";
              iconPath = "resources/icon.png";
              siteLang = "en";
            };
            templater = ctx:
              l.pipe ctx [
                topArgs.config.html-nix.lib.templaters.simple
                (ctx:
                  l.recursiveUpdate ctx {
                    site."resources"."icon.png" = ./src/resources/icon.png;
                  })
              ];
          };
        dev = html-nix.mkServeFromSite (site true);
      in {
        packages.site = html-nix.mkSitePathFrom (site false);
        apps.site.program = "${dev}/bin/serve";
      };
    });
}
