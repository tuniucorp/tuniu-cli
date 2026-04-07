import { main } from './cli.js';

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
