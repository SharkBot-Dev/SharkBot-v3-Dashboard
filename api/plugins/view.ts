import view from '@fastify/view';
import ejs from 'ejs';
import path, { join } from 'path';
import fp from 'fastify-plugin';
import { fileURLToPath } from 'url';

export default fp(async (fastify) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    fastify.register(view, {
        engine: { ejs },
        root: join(__dirname, '../views'),
        layout: 'main.ejs'
    });
});