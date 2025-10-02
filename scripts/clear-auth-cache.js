#!/usr/bin/env node

/**
 * Script para limpar o cache de autenticação do Supabase
 * Útil quando há sessões inválidas persistindo no storage local
 */

const fs = require('fs');
const path = require('path');

// Caminhos comuns onde o Supabase pode armazenar dados
const possibleCachePaths = [
  // React Native / Expo
  path.join(process.cwd(), '.expo', 'state.json'),
  path.join(process.cwd(), 'node_modules', '.cache'),
  // Metro cache
  path.join(process.cwd(), 'node_modules', '.cache', 'metro'),
  // Supabase local storage files
  path.join(process.cwd(), '.supabase'),
];

function clearDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removido: ${dirPath}`);
    }
  } catch (error) {
    console.log(`⚠️ Não foi possível remover ${dirPath}:`, error.message);
  }
}

function clearFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removido: ${filePath}`);
    }
  } catch (error) {
    console.log(`⚠️ Não foi possível remover ${filePath}:`, error.message);
  }
}

console.log('🧹 Limpando cache de autenticação...');

// Limpar caches
possibleCachePaths.forEach(cachePath => {
  if (cachePath.endsWith('.json')) {
    clearFile(cachePath);
  } else {
    clearDirectory(cachePath);
  }
});

// Também limpar os node_modules do metro para forçar rebuild
clearDirectory(path.join(process.cwd(), 'node_modules', '.cache'));

console.log('\n✨ Cache limpo! Execute o comando a seguir para reiniciar:');
console.log('npx expo start --clear');