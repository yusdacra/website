#!/usr/bin/env bash

setopt +x

git commit -m "$1" && git push
git tag -f latest && git push -f --tags

sleep 15s

cd $HOME/ark
nix flake update blog
nix run .#nh -- os build -H wolumonde .
nix run .#apps.nixinate.wolumonde -L --show-trace
