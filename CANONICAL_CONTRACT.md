# helioslang-tx-utils canonical contract

## Purpose and authority

I am the Koralabs copy of `@helios-lang/tx-utils`: the transaction builder, coin selection, wallets (software, CIP-30, offline), key derivation and signing, the Cardano query clients (Blockfrost, Koios, Iris, Hydra) and an emulator. Unlike the ledger types, I hold and use private keys (`SimpleWallet`, `RootPrivateKey`, `Bip32PrivateKey`) and I can sign and submit transactions. `merch.handle.me` and the marketplace contracts depend on me, so what I build, select, sign and submit can move real money. Ecosystem rules: `../AGENTS.md` (Critical Correctness, rate limits are law). Most history is the upstream author's; review upstream syncs as behavior changes. Paths in [`.enclave`](./.enclave) need operator approval to merge.

## Invariants (must never be violated)

1. I sign only what the caller hands me, with keys the caller supplied. A key, mnemonic or seed phrase is never logged, written, sent to a client, or kept past what the wallet object needs. `Cip30Wallet` signs only through the browser wallet's own prompt. (`src/wallets/`, `src/keys/`; tests cover COSE signing and key derivation, none assert that keys are never logged or serialized.)
2. A built transaction is balanced (inputs, mints and withdrawals equal outputs plus fee, per asset), pays at least the minimum fee, includes required signers and collateral, and sends change to the intended address. The builder throws instead of emitting a transaction that fails these. (`src/txbuilder/TxBuilder.js` relying on `@helios-lang/ledger` validations; `TxBuilder.test.js`.)
3. Coin selection never selects more than exists, never silently drops assets, and fails with `InsufficientFundsError` or a "no UTxO found" error when funds are short. It does not pick UTxOs holding assets unrelated to the request when avoidable. (`src/coinselection/`; tests `extremumFirst.test.js`, `consolidate.test.js`.)
4. A chain client returns the chain's data or throws. A failed request, a rate-limit refusal or an unparseable body is never turned into an empty UTxO list or a made-up balance. (`src/clients/`; tests `BlockfrostV0Client.test.js`, `IrisClient.test.js`, `getAssetClassInfo.test.js`.)
5. Rate limits are honored: a 429 or `Retry-After` from a provider is waited out as the provider says and remembered across calls, and when the wait is too long the call returns it instead of retrying early. (**Not met**, see limits.)
6. Transaction chaining (`TxChain`, `TxChainBuilder`, `MaskedWallet`) spends only outputs the previous transaction in the chain really creates, and a summary (`TxSummary`) reports what the transaction really does. (`src/chain/`; tests `TxChainBuilder.test.js`, `TxSummary.test.js`.)
7. Only reviewed source is published: `package.json` changes only with operator approval. There is no publish workflow here; `prepack` runs the build.
8. No secrets in git.

## Boundaries and known limits

- Invariant 5 is violated today: `BlockfrostV0Client.fetchRateLimited` keeps its own burst counter and, on a 429, retries up to seven times on a fixed 100 ms doubling schedule, ignoring any `Retry-After` or reset header, and keeps no wait across calls. The other clients have no rate handling I could find. No test proves a wait.
- The library uses `console.log`/`console.warn` in `TxBuilder.js` and `WalletHelper.js`; I did not check that nothing sensitive is printed.
- Balance and fee checks come from `@helios-lang/ledger` and the network parameters passed in. Stale parameters under-pay the fee.
- Hydra and emulator code are separate surfaces; the emulator is test-only.
- No test builds, signs and decodes a transaction end to end and compares to a reference vector.
- Consumers pin old versions (`^0.3.16` in marketplace contracts, `^0.4.8` in merch); a fix here reaches them only on upgrade.

## Refactors needed to enforce this

- Replace `fetchRateLimited`'s retry loop with the shared rule: read `Retry-After` and reset headers, remember the wait per provider across calls, return the wait instead of retrying early, and add a test with a fake clock that proves it.
- Add a test that a wallet created from a phrase never exposes the phrase or private key through logging, `dump()` or JSON serialization.
- Add a builder test that fails when change would go to an address other than the wallet's, and a balance-per-asset test for mints.
- Make clients throw on non-2xx and malformed bodies, with tests for 404, 500 and truncated JSON.
