{
  nixConfig.extra-substituters = "https://cache.garnix.io";
  nixConfig.extra-trusted-public-keys = "cache.garnix.io:CTFPyKSLcx5RMJKfLo5EEPUObbA78b0YQ2DTCJXqr9g=";

  inputs = {
    emanote.url = "github:srid/emanote";
    nixpkgs.follows = "emanote/nixpkgs";
    flake-parts.follows = "emanote/flake-parts";
  };

  outputs = inputs@{self, flake-parts, nixpkgs, ...}:
    flake-parts.lib.mkFlake { inherit self; } {
      systems = ["x86_64-linux"];
      imports = [inputs.emanote.flakeModule];
      perSystem = {self', ...}: {
        emanote.sites."blog" = {
          path = ./.;
          pathString = ".";
        };
      };
    };
}