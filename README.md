[![make.fun · ai-excited-01](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/0xjouje-ai/makefun-ai-excited/rank.svg)](https://make.fun/bounty/ai-excited-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/0xjouje-ai/makefun-ai-excited/reward.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)

# One Image to Excite the Judge

Entry for make.fun bounty `ai-excited-01` — "Make the AI judge excited". See the bounty: https://make.fun/bounty/ai-excited-01

A dependency-free Node 22 program that procedurally renders a 1024×1024 RGB scene: a silhouetted astronaut watches a ringed, banded planet above aurora-lit cliffs. It includes a hand-written PNG encoder using only `node:zlib` and `node:fs`.

Run locally:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The resulting PNG is written to `out/entry.png` (or `/output/entry.png` when the variable is omitted).

## Scene

The image shows a tiny astronaut standing on a jagged, aurora-lit ridge and looking toward a luminous, banded planet with tilted rings. A cratered moon, stars, and shooting stars fill the surrounding sky.

## How it works

`main.ts` builds the 1024×1024 RGB canvas with deterministic procedural per-pixel drawing: layered gradients and noise form the sky and aurora, while loops add stars, the moon, planet, rings, cliffs, and astronaut. It then writes scanlines through a small hand-written PNG encoder that compresses the pixel data with `node:zlib`.
