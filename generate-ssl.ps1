# ============================================================================
# Script PowerShell de génération des certificats SSL pour le simulateur Mali
# ============================================================================

Write-Host "🔐 Génération des certificats SSL pour le simulateur Mali..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que OpenSSL est installé
$opensslPath = Get-Command openssl -ErrorAction SilentlyContinue
if (-not $opensslPath) {
    Write-Host "❌ OpenSSL n'est pas installé ou n'est pas dans le PATH." -ForegroundColor Red
    Write-Host "   Veuillez installer OpenSSL pour Windows :" -ForegroundColor Yellow
    Write-Host "   - Télécharger depuis : https://slproweb.com/products/Win32OpenSSL.html" -ForegroundColor Yellow
    Write-Host "   - Ou utiliser Chocolatey : choco install openssl" -ForegroundColor Yellow
    exit 1
}

# Se placer dans le dossier ssl-certs
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$sslCertsPath = Join-Path $scriptPath "ssl-certs"

if (-not (Test-Path $sslCertsPath)) {
    Write-Host "❌ Le dossier ssl-certs n'existe pas" -ForegroundColor Red
    exit 1
}

Set-Location $sslCertsPath

# Vérifier que le fichier de configuration existe
if (-not (Test-Path "openssl.cnf")) {
    Write-Host "❌ Le fichier openssl.cnf n'existe pas dans ssl-certs/" -ForegroundColor Red
    exit 1
}

# Générer la clé privée
Write-Host "📝 Génération de la clé privée (4096 bits)..." -ForegroundColor Yellow
$keyGen = & openssl genrsa -out key.pem 4096 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la génération de la clé privée" -ForegroundColor Red
    Write-Host $keyGen -ForegroundColor Red
    exit 1
}

# Générer le certificat auto-signé
Write-Host "📝 Génération du certificat auto-signé (valide 365 jours)..." -ForegroundColor Yellow
$certGen = & openssl req -new -x509 -key key.pem -out cert.pem -days 365 -config openssl.cnf 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la génération du certificat" -ForegroundColor Red
    Write-Host $certGen -ForegroundColor Red
    exit 1
}

# Définir les permissions appropriées (Windows)
$acl = Get-Acl key.pem
$permission = "BUILTIN\Administrators","FullControl","Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl key.pem $acl

Write-Host ""
Write-Host "✅ Certificats SSL générés avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Fichiers créés :" -ForegroundColor Cyan
Write-Host "   - ssl-certs/key.pem (clé privée)"
Write-Host "   - ssl-certs/cert.pem (certificat)"
Write-Host ""
Write-Host "🚀 Vous pouvez maintenant démarrer le serveur en HTTPS :" -ForegroundColor Green
Write-Host "   npm start"
Write-Host ""
Write-Host "⚠️  Note : Les certificats sont auto-signés." -ForegroundColor Yellow
Write-Host "   Le navigateur affichera un avertissement de sécurité."
Write-Host "   C'est normal pour un environnement de développement."
Write-Host ""

