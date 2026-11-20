import { createApp } from './app';
import { ENV } from './config/env';

const app = createApp();

app.listen(ENV.port, '0.0.0.0', () => {
  console.log(`VarchLearn Backend running at http://localhost:${ENV.port}/api/v1`);
  console.log(`Swagger API Docs available at http://localhost:${ENV.port}/api/v1/docs`);
});
