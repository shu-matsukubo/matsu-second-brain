import { defineEnv, oneOf, string } from 'void/env';

export default defineEnv({
  MATSU_SECOND_BRAIN_READ_TOKEN: string().optional(),
  VIEWER_DATA_SOURCE: oneOf(['mock', 'github']).default('mock'),
});
