@echo off
REM Script para instalar dependências do BiomePampa ERP
REM Este arquivo deve ser executado no CMD (não PowerShell)

cd /d D:\Backup\Angular\BiomePampa

echo ====================================
echo BiomePampa ERP - Instalacao
echo ====================================
echo.

echo Verificando Node.js...
node --version
echo Verificando npm...
npm --version
echo.

echo Instalando dependencias do projeto...
npm install

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo INSTALACAO CONCLUIDA COM SUCESSO!
    echo ====================================
    echo.
    echo Para iniciar a aplicacao, use:
    echo npm start
    echo.
) else (
    echo.
    echo ERRO na instalacao!
    echo.
)

pause
