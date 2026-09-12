import express from 'express';
import cookieParser from 'cookie-parser';
import { apiRouter } from '../server/routes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount the RPG API router at both /api and root to handle any Vercel route rewrites
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
