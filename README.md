# tx-utils

## Contributor test policy

Tests and coverage run locally only, never in GitHub Actions, including indirect lifecycle, composite, template, and shared-helper execution. `build` and `prepack` invoke tests here and are local-only unless the graph is separated. Preserve local scripts. Build-only automation, publication, deployment, and production guards remain permitted; retire obsolete required test checks.
Coin selection, query layers, wallets
