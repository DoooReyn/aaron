@echo off
setlocal enabledelayedexpansion

set OUTPUT_DIR=.
set PROTOC_TS=..\\..\\node_modules\\.bin\\protoc-gen-ts_proto.cmd

if not exist %OUTPUT_DIR% mkdir %OUTPUT_DIR%

echo ================ start ================

set /a ok=0
set /a bad=0

for %%f in (proto\\*.proto) do (
    protoc  --plugin=protoc-gen-ts_proto="%PROTOC_TS%" ^
            --ts_proto_out=%OUTPUT_DIR% ^
            %%f
    
    if !errorlevel! equ 0 (
        set /a ok+=1
        echo [T] %%f
    ) else (
	set  /a bad+=1
        echo [F] %%f
    )
)

echo [OK] %ok% [BAD] %bad%
echo ================ ended ================

endlocal
