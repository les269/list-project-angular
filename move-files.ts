// executors/my-copy/executor.ts
import { ExecutorContext } from '@nrwl/devkit';
import * as fs from 'fs-extra';

export async function myCopyExecutor(options: any, context: ExecutorContext) {
  const { source, destination } = options;

  await fs.copy(source, destination);

  return {
    success: true,
  };
}
