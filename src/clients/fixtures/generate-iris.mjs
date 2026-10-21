import { writeFileSync } from "node:fs"
import {
    DEFAULT_NETWORK_PARAMS,
    makeAddress,
    makeAssets,
    makeInlineTxOutputDatum,
    makeTx,
    makeTxBody,
    makeTxInput,
    makeTxOutput,
    makeTxOutputId,
    makeTxWitnesses,
    makeValue
} from "@helios-lang/ledger"
import {
    makeIntData,
    makeUplcConst,
    makeUplcInt,
    makeUplcProgramV2
} from "@helios-lang/uplc"
import { encodeList } from "@helios-lang/cbor"

// Synthetic Iris wire-format data, not recorded chain data or executable contracts.
// Run manually from any directory; tests only read the resulting static JSON.
const refAddress =
    "addr_test1wrnpd4l7jtfs0sgzuks7w0wvxwkcul6uag34xjvhgsxwj2qk5yq82"
const assetAddress =
    "addr_test1wqyp8f3s30t0kvqa3vfgq8lrhv7vtxrn9w9k9vh5s4syzacyjcr9g"
const policy = "1fd38a7e152b5033e6b2f45447cbb98683a7214f3ab2b71b9ffaa04b"
const token = "7450424720737570706c79"
const script = makeUplcProgramV2(makeUplcConst({ value: makeUplcInt(0) }))
const outputs = [
    makeTxOutput(
        makeAddress(refAddress),
        makeValue(5000000n),
        undefined,
        script
    ),
    makeTxOutput(makeAddress(refAddress), makeValue(2000000n)),
    makeTxOutput(
        makeAddress(assetAddress),
        makeValue(4000000n, makeAssets([[policy, [[token, 1n]]]])),
        makeInlineTxOutputDatum(makeIntData(42))
    )
]
const tx = makeTx(
    makeTxBody({
        inputs: [],
        outputs,
        fee: 0n,
        dcerts: [],
        withdrawals: [],
        minted: makeAssets(),
        signers: [],
        refInputs: []
    }),
    makeTxWitnesses({
        nativeScripts: [],
        signatures: [],
        datums: [],
        redeemers: [],
        v1Scripts: [],
        v2Scripts: [],
        v3Scripts: [],
        v2RefScripts: [],
        v3RefScripts: []
    }),
    true
)
const txID = tx.id().toHex()
const inputs = outputs.map((output, i) =>
    makeTxInput(makeTxOutputId(tx.id(), i), output)
)
const hex = (bytes) => Buffer.from(bytes).toString("hex")
writeFileSync(
    new URL("iris.json", import.meta.url),
    JSON.stringify(
        {
            txID,
            txCbor: hex(tx.toCbor()),
            refUtxoCbor: hex(inputs[0].toCbor(true)),
            spentUtxoCbor: hex(inputs[1].toCbor(true)),
            assetUtxosCbor: hex(encodeList([inputs[2].toCbor(true)])),
            parameters: DEFAULT_NETWORK_PARAMS()
        },
        null,
        4
    ) + "\n"
)
