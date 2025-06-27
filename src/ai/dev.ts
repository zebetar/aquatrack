/**
 * @fileoverview This file is the entry point for the Genkit development server.
 * It dynamically imports all flow files from the `src/ai/flows` directory and
 * starts the Genkit development server, making the flows available for local
 * testing and interaction via the Genkit developer UI.
 *
 * To run the server, use the command: `genkit start`
 */
import {getFlows} from '@google/genkit/dev-server';
import {readdirSync} from 'fs';
import {join} from 'path';

const flowsPath = join(__dirname, 'flows');
const flowFiles = readdirSync(flowsPath)
  .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
  .map(file => join(flowsPath, file));

export const flows = getFlows(flowFiles);
