#!/usr/bin/env node
// copy-dist.js — copia dist/lumiere-clinic/browser/* para dist/lumiere-clinic/
const fs   = require('fs');
const path = require('path');

const src = path.join(__dirname, 'dist', 'lumiere-clinic', 'browser');
const dst = path.join(__dirname, 'dist', 'lumiere-clinic');

if (!fs.existsSync(src)) {
  console.log('Pasta browser/ nao encontrada — nada a copiar');
  process.exit(0);
}

function copyDir(from, to) {
  fs.readdirSync(from).forEach(item => {
    const s = path.join(from, item);
    const d = path.join(to, item);
    if (fs.statSync(s).isDirectory()) {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  });
}

copyDir(src, dst);
console.log('✅ browser/* copiado para dist/lumiere-clinic/');
