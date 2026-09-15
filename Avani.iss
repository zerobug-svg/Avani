[Setup]
AppName=Avani
AppVersion=1.0.0
DefaultDirName={autopf}\Avani
DefaultGroupName=Avani
OutputDir=installer
OutputBaseFilename=Avani-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible

[Files]
Source: "dist\Avani.exe"; DestDir: "{app}"; Flags: ignoreversion

[Icons]
Name: "{autodesktop}\Avani"; Filename: "{app}\Avani.exe"
Name: "{group}\Avani"; Filename: "{app}\Avani.exe"

[Run]
Filename: "{app}\Avani.exe"; Description: "Launch Avani"; Flags: nowait postinstall skipifsilent