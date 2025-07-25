#!/usr/bin/env node

// Simple Node.js script to run the TypeScript pricing script in CI
// This avoids the ts-node ESM issues in GitHub Actions

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tsFile = join(__dirname, 'generatePricingJson.ts');

// Try different approaches to run the TypeScript file
const approaches = [
  // Approach 1: Use ts-node with explicit ESM loader
  {
    command: 'node',
    args: ['--loader', 'ts-node/esm', '--experimental-specifier-resolution=node', tsFile],
    env: { ...process.env, NODE_OPTIONS: '--loader ts-node/esm' }
  },
  // Approach 2: Use npx ts-node with project config
  {
    command: 'npx',
    args: ['ts-node', '--project', '../tsconfig.scripts.json', tsFile],
    env: { ...process.env, NODE_OPTIONS: '--loader ts-node/esm' }
  },
  // Approach 3: Compile first then run
  {
    command: 'sh',
    args: ['-c', `npx tsc --project ../tsconfig.scripts.json && node ../dist/generatePricingJson.js`],
    env: process.env
  }
];

async function runScript() {
  for (let i = 0; i < approaches.length; i++) {
    const approach = approaches[i];
    console.log(`Trying approach ${i + 1}: ${approach.command} ${approach.args.join(' ')}`);
    
    try {
      const result = await new Promise((resolve, reject) => {
        const child = spawn(approach.command, approach.args, {
          stdio: 'inherit',
          env: approach.env,
          cwd: __dirname
        });
        
        child.on('close', (code) => {
          if (code === 0) {
            resolve(true);
          } else {
            reject(new Error(`Process exited with code ${code}`));
          }
        });
        
        child.on('error', reject);
      });
      
      if (result) {
        console.log(`Success with approach ${i + 1}`);
        process.exit(0);
      }
    } catch (error) {
      console.log(`Approach ${i + 1} failed:`, error.message);
      if (i === approaches.length - 1) {
        console.error('All approaches failed');
        process.exit(1);
      }
    }
  }
}

runScript();
