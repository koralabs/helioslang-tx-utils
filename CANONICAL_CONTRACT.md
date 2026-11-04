# helioslang-tx-utils canonical contract

I am the Koralabs copy of `@helios-lang/tx-utils`: transaction builder, coin selection, wallets (software, CIP-30, offline), key derivation and signing, Cardano query clients (Blockfrost, Koios, Iris, Hydra) and an emulator. I hold and use private keys and can sign and submit transactions.

1. **I sign only what the caller hands me, with keys the caller supplied.** A key, mnemonic or seed is never logged, written or sent to a client; `Cip30Wallet` signs only through the browser wallet's own prompt.
2. **A built transaction is balanced** (inputs, mints and withdrawals equal outputs plus fee, per asset), pays at least the minimum fee, includes required signers and collateral, and sends change to the intended address; the builder throws rather than emit one that is not.
3. **Coin selection never selects more than exists or silently drops assets,** and fails with `InsufficientFundsError` or a "no UTxO found" error when funds are short.
4. **Chained transactions (`TxChain`, `TxChainBuilder`, `MaskedWallet`) spend only outputs the previous transaction really creates,** and `TxSummary` reports what the transaction really does.
