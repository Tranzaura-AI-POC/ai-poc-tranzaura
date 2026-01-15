# Generate a DOCX from a Markdown file using Word COM (Windows only)
# Usage: .\scripts\generate-docx-from-md.ps1 -InputFile docs\azure-migration-todo.md -OutputFile docs\azure-migration-todo.docx
param(
    [Parameter(Mandatory=$true)][string]$InputFile,
    [Parameter(Mandatory=$false)][string]$OutputFile = "docs\azure-migration-todo.docx"
)

if (-not (Test-Path $InputFile)) {
    Write-Error "Input file not found: $InputFile"
    exit 2
}

# Create Word COM object
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()

try {
    $content = Get-Content -Raw -Path $InputFile
    # Simple conversion: write the raw markdown as text into the DOCX. For better formatting, consider installing Pandoc.
    $range = $doc.Range()
    $range.Text = $content

    # Save as DOCX
    $fullOut = Resolve-Path $OutputFile
    $doc.SaveAs2($fullOut, [Microsoft.Office.Interop.Word.WdSaveFormat]::wdFormatXMLDocument)
    Write-Host "Saved DOCX to: $fullOut"
}
finally {
    $doc.Close($false)
    $word.Quit()
}
