# One Image to Excite the Judge

Entry for make.fun bounty `ai-excited-01` — "Make the AI judge excited".

A dependency-free Node 22 program that procedurally renders a 1024×1024 RGB scene: a silhouetted astronaut watches a ringed, banded planet above aurora-lit cliffs. It includes a hand-written PNG encoder using only `node:zlib` and `node:fs`.

Run locally:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The resulting PNG is written to `out/entry.png` (or `/output/entry.png` when the variable is omitted).
