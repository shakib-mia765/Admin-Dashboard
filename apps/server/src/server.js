import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './shared/logger.js';
const server=app.listen(env.PORT,()=>logger.info({port:env.PORT},'API started'));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.close(()=>process.exit(0)));
