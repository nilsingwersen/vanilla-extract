#!/usr/bin/env -S npx tsx

import { Bench } from 'tinybench';
import { default as vecss } from '@vanilla-extract/css';
import { default as vefs } from '@vanilla-extract/css/fileScope';

const bench = new Bench({ time: 100 });

bench.add('slow generate identifier', () => {
  vefs.setFileScope('benchmark.ts');
  vecss.generateIdentifier('debug');
});

await bench.warmup(); // make results more reliable, ref: https://github.com/tinylibs/tinybench/pull/50
await bench.run();

console.table(bench.table());
