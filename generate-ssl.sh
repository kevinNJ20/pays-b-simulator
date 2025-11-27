#!/bin/bash

# ============================================================================
# Script de génération des certificats SSL pour le simulateur Mali
# ============================================================================

echo "🔐 Génération des certificats SSL pour le simulateur Mali..."
echo ""

# Vérifier que OpenSSL est installé
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL n'est pas installé. Veuillez l'installer d'abord."
    echo "   Ubuntu/Debian: sudo apt install openssl"
    echo "   CentOS/RHEL: sudo yum install openssl"
    exit 1
fi

# Se placer dans le dossier ssl-certs
cd "$(dirname "$0")/ssl-certs" || exit 1

# Vérifier que le fichier de configuration existe
if [ ! -f "openssl.cnf" ]; then
    echo "❌ Le fichier openssl.cnf n'existe pas dans ssl-certs/"
    exit 1
fi

# Générer la clé privée
echo "📝 Génération de la clé privée (4096 bits)..."
openssl genrsa -out key.pem 4096

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la génération de la clé privée"
    exit 1
fi

# Générer le certificat auto-signé
echo "📝 Génération du certificat auto-signé (valide 365 jours)..."
openssl req -new -x509 -key key.pem -out cert.pem -days 365 -config openssl.cnf

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la génération du certificat"
    exit 1
fi

# Définir les permissions appropriées
chmod 600 key.pem
chmod 644 cert.pem

echo ""
echo "✅ Certificats SSL générés avec succès !"
echo ""
echo "📁 Fichiers créés :"
echo "   - ssl-certs/key.pem (clé privée)"
echo "   - ssl-certs/cert.pem (certificat)"
echo ""
echo "🚀 Vous pouvez maintenant démarrer le serveur en HTTPS :"
echo "   npm start"
echo ""
echo "⚠️  Note : Les certificats sont auto-signés."
echo "   Le navigateur affichera un avertissement de sécurité."
echo "   C'est normal pour un environnement de développement."
echo ""

