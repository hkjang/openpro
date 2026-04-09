$scriptPath = Join-Path $PSScriptRoot 'openpro'
& node $scriptPath @args
exit $LASTEXITCODE
