param([string]$Mode = "compile")
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $root "target\plain-classes"
New-Item -ItemType Directory -Force -Path $out | Out-Null
$plain = @(
  "ThreadPoolSaturationLab.java", "VirtualThreadPinningLab.java",
  "DirectMemoryPressureLab.java", "ClassLoaderIdentityLab.java", "GcAllocationWorkload.java",
  "AdvancedApisLab.java", "SelectorEchoLab.java"
) | ForEach-Object { Join-Path $root "src\main\java\io\shopverse\labs\$_" }
javac --release 24 -d $out $plain
if ($LASTEXITCODE -ne 0) { throw "javac failed with exit code $LASTEXITCODE" }
if ($Mode -eq "smoke") {
  java -cp $out io.shopverse.labs.ThreadPoolSaturationLab
  if ($LASTEXITCODE -ne 0) { throw "saturation lab failed" }
  java -cp $out io.shopverse.labs.ClassLoaderIdentityLab
  if ($LASTEXITCODE -ne 0) { throw "class-loader lab failed" }
  java -cp $out io.shopverse.labs.VirtualThreadPinningLab
  if ($LASTEXITCODE -ne 0) { throw "virtual-thread lab failed" }
  java -cp $out io.shopverse.labs.AdvancedApisLab
  if ($LASTEXITCODE -ne 0) { throw "advanced APIs lab failed" }
}
