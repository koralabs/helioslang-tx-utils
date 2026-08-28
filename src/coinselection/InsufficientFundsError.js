import { addValues } from "@koralabs/helioslang-ledger"

/**
 * @import { TxInput, Value } from "@koralabs/helioslang-ledger"
 */

export class InsufficientFundsError extends Error {
    /**
     * @param {Value} need
     * @param {TxInput[]} have
     */
    constructor(need, have) {
        super(
            `Insufficient funds error: need ${JSON.stringify(need.dump(), undefined, 2)}, have UTxOs ${have.map((utxo) => JSON.stringify(utxo.dump(), undefined, 2))} (total ${JSON.stringify(addValues(have).dump(), undefined, 2)})`
        )
    }
}
