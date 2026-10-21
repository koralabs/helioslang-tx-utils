# Iris HTTP fixtures

The original eight IrisClient tests contacted `https://ns5037712.ip-148-113-219.net` and all failed at `fetch` in CI run 39520928568. Their subjects remain valid; their shared external fixture was unavailable. No failing test was deleted or skipped. The default suite now uses synthetic, static Iris wire-format responses at the HTTP boundary, not mocks of IrisClient or ledger decoders. It does not assert availability of the live service or compatibility with an independently recorded server response.

`iris.json` contains a complete serialized transaction, full serialized inputs (including original outputs), a CBOR input list, and network parameters. `generate-iris.mjs` documents provenance and can regenerate it manually with `node src/clients/fixtures/generate-iris.mjs`. The synthetic transaction has no inputs/signatures and is never submitted or claimed to be chain-valid. Its reference script is serialization data only; no validator/compiler code or behavior is changed. Tests load static bytes rather than regenerating expected results using their decoders. Expected transaction ID, output addresses, values, datum, reference script bytes and consuming transaction ID are independently pinned in the tests.

The fetch boundary rejects unexpected hosts, routes, methods and Accept headers rather than falling through to live networking. JSON and CBOR travel through real `Response` objects. The real client handles statuses, headers, parsing, transaction identity checks and domain errors. Existing assertions remain, with additional reference-script, datum, value and quantity assertions.

## Added cases and failure controls

- Spent-output detail: callers receive the spent output ID and consuming transaction from a 409 response; catches dropping the decoded output or Consumed-By header. Negative control: returning the reference-output bytes instead of the spent-output bytes fails the ID assertion.
- Empty address: an empty CBOR list returns exactly an empty array; catches treating no outputs as an error or inventing outputs. Returning a nonempty list would fail.
- Transaction identity: bytes for another transaction are rejected; catches accepting the wrong transaction. Removing the client's identity check would fail the rejection assertion.
- Missing output: HTTP 404 becomes UtxoNotFoundError; catches returning success or a generic HTTP error. Returning the 200 fixture would fail.
- Malformed output: malformed CBOR is rejected; catches accepting an invalid wire body. Returning valid CBOR would fail the rejection assertion.
- Malformed address list: object JSON is rejected instead of accepted as a list; catches silently treating a server error as empty results. Returning array JSON would fail the rejection assertion.
- Service failure: HTTP 503 is surfaced as a service error rather than parsed as transaction CBOR; catches ignoring HTTP status. Returning the 200 transaction fixture would fail.

Local negative-control experiments also replaced parameters with `{}`, transaction bytes with `ff`, reference-output bytes with spent-output bytes, and asset-output lists with `80`. Every experiment made the suite fail; the original fixture was restored and the complete suite rerun. No runtime files were changed for these controls.

These are deterministic client contract tests, not live-server, wallet, browser or chain acceptance. The historical funded-wallet branch remains dormant with its existing empty phrase; no wallet credentials are added or used.
