/**
 * Quick test script to verify LLM provider initialization
 */

import { createLLMProvider, isLLMAvailable } from './dist/index.js';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read API key from playground config
import { readFile } from 'node:fs/promises';
const playgroundConfig = await readFile('./playground/docs/astro.config.mjs', 'utf-8');
const apiKeyMatch = playgroundConfig.match(/OPENAI_API_KEY:\s*process\.env\.OPENAI_API_KEY/);

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY not set in environment');
  process.exit(1);
}

console.log('✓ API key found:', process.env.OPENAI_API_KEY.substring(0, 20) + '...');
console.log('✓ API key length:', process.env.OPENAI_API_KEY.length);

const config = {
  type: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
};

console.log('\n🔍 Testing isLLMAvailable...');
const available = await isLLMAvailable(config, __dirname);
console.log('Result:', available);

if (available) {
  console.log('\n✅ LLM provider is available!');
  console.log('\n🔍 Creating provider instance...');
  try {
    const provider = createLLMProvider(config, __dirname);
    console.log('✓ Provider created:', provider.name);
    
    const isAvail = await provider.isAvailable();
    console.log('✓ Provider.isAvailable():', isAvail);
    
    console.log('\n🔍 Testing detection (this will make an API call)...');
    const result = await provider.detectSourceContext({
      docPath: '/api',
      docContent: '# API Reference\n\nThis page documents the API endpoints.',
      docTitle: 'API Reference',
      availableFiles: ['index.ts', 'api.ts', 'utils.ts'],
      availableFolders: ['src/', 'lib/'],
    });
    
    console.log('\n✅ Detection result:');
    console.log('  Files:', result.files);
    console.log('  Folders:', result.folders);
    console.log('  Confidence:', result.confidence);
    console.log('  Reasoning:', result.reasoning.slice(0, 2));
    
  } catch (error) {
    console.error('\n❌ Error creating/using provider:', error.message);
    console.error('Stack:', error.stack);
  }
} else {
  console.log('\n❌ LLM provider not available');
}
