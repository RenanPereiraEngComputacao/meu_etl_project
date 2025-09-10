@echo off
setlocal enabledelayedexpansion

:: =====================================
:: CONFIGURAÇÕES DO BACKUP
:: =====================================
set PGHOST=localhost
set PGPORT=5433
set PGUSER=postgres
set PGPASSWORD=W1nd@tch1.pereira
set PASTA_BACKUP=C:\backups_postgres

:: Criar pasta de backup se não existir
if not exist "%PASTA_BACKUP%" mkdir "%PASTA_BACKUP%"

:: Gerar nome do arquivo com data/hora
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do (
    set DATA=%%d-%%b-%%c
)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (
    set HORA=%%a-%%b
)

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
