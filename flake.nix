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
              descriptionsById = {
                "404" = "Page not found.";
                "index" = "Home page of dusk's place with information about the website.";
                "posts" = "A listing of posts published on the website.";
                "_exporting_ssh_key_from_gpg" = "Instructions explaining how to export SSH keys from GPG.";
              };
              footerContent = ''
                <div class="bg-svg"></div>
                <div class="bg-svg-fg"></div>
              '';
            };
            templater = ctx:
              l.pipe ctx [
                topArgs.config.html-nix.lib.templaters.simple
                (ctx:
                  l.recursiveUpdate ctx {
                    site."resources"."icon.png" = ./src/resources/icon.png;
                    site."resources"."wave.svg" = ./src/resources/wave.svg;
                    site."resources"."wavealt.svg" = ./src/resources/wave-alt.svg;
                    site."site.css" = ''
                      ${ctx.site."site.css"}
                      
                      .bg-svg, .bg-svg-fg {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        width: 100vw;

                        background-size: cover;
                        background-repeat: repeat-x;
                      }

                      .bg-svg {
                        z-index: -2;
                        height: 50vh;

                        background-image: url(resources/wave.svg);

                        animation: move-svg 200s linear infinite;
                      }

                      .bg-svg-fg {
                        z-index: -1;
                        height: 40vh;

                        background-image: url(resources/wavealt.svg);

                        animation: move-svg 100s linear infinite reverse;
                      }

                      @keyframes move-svg {
                        0% {
                          background-position: 0 0;
                        }

                        50% {
                          background-position: 100vw 0;
                        }

                        100% {
                          background-position: 200vw 0;
                        }
                      }

                      body {
                        background: #3d1f7a;
                        color: #fff;
                      }

                      a {
                        color: #007fff;
                      }

                      a.novisited:visited {
                        color: #007fff;
                      }

                      a:visited {
                        color: #bf40bf;
                      }

                      pre,code {
                        background: #333;
                        color: #fff;
                      }
                    '';
                  }
                )
              ];
          };
        dev = html-nix.mkServeFromSite (site true);
      in {
        packages.site = html-nix.mkSitePathFrom (site false);
        apps.site.program = "${dev}/bin/serve";
      };
    });
}
