#!/bin/bash
# =====================================================
# Script de recuperação — Vania Herculano Frontend
# Execute este arquivo quando houver problema com npm
# =====================================================

echo "🔧 Recuperando dependências do frontend Angular 17..."
echo ""

# 1. Remover node_modules e lock file corrompidos
echo "1/3 — Removendo node_modules e package-lock.json..."
rm -rf node_modules
rm -f package-lock.json

# 2. Limpar cache do npm
echo "2/3 — Limpando cache do npm..."
npm cache clean --force

# 3. Instalar versões corretas
echo "3/3 — Instalando Angular 17 (versões fixas)..."
npm install --legacy-peer-deps

echo ""
echo "✅ Pronto! Agora rode:"
echo "   npm start         (para desenvolvimento)"
echo "   npm run build     (para produção)"
