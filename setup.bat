@echo off
REM Script de instalação do Node.js para BiomePampa ERP
REM Este script instala Node.js via Chocolatey ou download direto

echo ====================================
echo BiomePampa ERP - Setup
echo ====================================
echo.

REM Verificar se Chocolatey está instalado
where choco >nul 2>nul
if %errorlevel% equ 0 (
    echo Chocolatey encontrado. Instalando Node.js...
    choco install nodejs -y
) else (
    echo Chocolatey não encontrado.
    echo.
    echo Por favor, instale Node.js manualmente:
    echo 1. Acesse https://nodejs.org/
    echo 2. Baixe a versão LTS (recomendado)
    echo 3. Execute o instalador
    echo 4. Reinicie o terminal PowerShell
    echo 5. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo.
echo Node.js instalado com sucesso!
echo Instalando dependências do projeto...
call npm install

echo.
echo Setup completo! Para iniciar a aplicação, execute:
echo npm start
echo.
pause
