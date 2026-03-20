import { createReader } from '@keystatic/core/reader';
import config from '../../keystatic.config.js';

export const reader = createReader(process.cwd(), config);
