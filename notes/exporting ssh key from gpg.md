---
tags: [gpg,ssh]
---

- gpg --export-secret-ssh-key doesn't work
- gpg --export-ssh-key works to export public key

-----------

- to export secret ssh key first remove password from your [A]uthentication subkey
	- you can do this with `gpg --edit-key KEYID` and then `passwd` and `save`
- then do `gpg --export-secret-subkeys KEYID! | openpgp2ssh KEYID > ssh_key`

