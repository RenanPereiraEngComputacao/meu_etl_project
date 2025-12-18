@echo off
setlocal enabledelayedexpansion

:: =====================================
:: CONFIGURAÇÕES DO BACKUP
:: =====================================
set PGHOST=localhost
set PGPORT=5433
set PGUSER=postgres
set PGPASSWORD=W1nd@tch1.pereira
set PASTA_BACKUP=D:\backups_postgres

:: Criar pasta de backup se não existir
if not exist "%PASTA_BACKUP%" mkdir "%PASTA_BACKUP%"

:: =====================================
:: DATA E HORA (MES-DIA-ANO)
:: =====================================

for /f "tokens=1-3 delims=/" %%a in ("%date%") do (
    set MES=%%b
    set DIA=%%a
    set ANO=%%c
)
set DATA=%MES%-%DIA%-%ANO%

for /f "tokens=1-2 delims=: " %%a in ("%time%") do (
    set HORA=%%a-%%b
)

:: Remover caracteres inválidos da hora (em alguns PCs o TIME retorna com .)
set HORA=%HORA:.=%

:: Caminho completo do pg_dumpall
set PG_DUMPALL="C:\Program Files\PostgreSQL\17\bin\pg_dumpall.exe"

:: Comando de backup
echo Iniciando backup de todos os bancos...
%PG_DUMPALL% -h %PGHOST% -p %PGPORT% -U %PGUSER% > "%PASTA_BACKUP%\backup_completo_%DATA%_%HORA%.sql"

if %errorlevel% equ 0 (
    echo Backup concluído com sucesso!
) else (
    echo Ocorreu um erro ao gerar o backup.
)

:: =====================================
:: LIMPEZA DE BACKUPS (Exemplo: Apagar backups com mais de 7 dias)
:: =====================================

echo Iniciando limpeza de backups antigos (mais de 7 dias)...
ForFiles /p "%PASTA_BACKUP%" /s /d -7 /c "cmd /c del @file"
echo Limpeza concluída.

endlocal