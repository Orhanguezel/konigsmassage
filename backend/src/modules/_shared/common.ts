// src/modules/_shared/common.ts

import { z } from 'zod';

export const boolLike = z.union([
  z.boolean(),
  z.literal(0),
  z.literal(1),
  z.literal('0'),
  z.literal('1'),
  z.literal('true'),
  z.literal('false'),
]);

export type BooleanLike = boolean | 0 | 1 | '0' | '1' | 'true' | 'false';