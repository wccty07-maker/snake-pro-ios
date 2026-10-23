#!/usr/bin/env python3
import os
import re
import sys

pbxproj_path = sys.argv[1] if len(sys.argv) > 1 else 'ios/App/App.xcodeproj/project.pbxproj'
team_id = sys.argv[2] if len(sys.argv) > 2 else os.environ.get('APPLE_TEAM_ID', 'N2S5289QDM')

if not os.path.exists(pbxproj_path):
    print(f"Error: {pbxproj_path} not found")
    sys.exit(1)

with open(pbxproj_path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"Patching {pbxproj_path} with Development Team: {team_id}")

# 1. Patch TargetAttributes in PBXProject to set DevelopmentTeam and ProvisioningStyle = Manual
def patch_target_attributes(match):
    block = match.group(0)
    # Check if DevelopmentTeam is present
    if 'DevelopmentTeam =' in block:
        block = re.sub(r'DevelopmentTeam\s*=\s*[^;]+;', f'DevelopmentTeam = {team_id};', block)
    else:
        block = re.sub(r'(\s*CreatedOnToolsVersion\s*=\s*[^;]+;)', f'\\1\n\t\t\t\t\t\tDevelopmentTeam = {team_id};', block)
    
    # Set ProvisioningStyle to Manual
    if 'ProvisioningStyle =' in block:
        block = re.sub(r'ProvisioningStyle\s*=\s*[^;]+;', 'ProvisioningStyle = Manual;', block)
    else:
        block = re.sub(r'(\s*DevelopmentTeam\s*=\s*[^;]+;)', '\\1\n\t\t\t\t\t\tProvisioningStyle = Manual;', block)
    return block

content = re.sub(r'TargetAttributes\s*=\s*\{[\s\S]*?\n\t\t\t\};', patch_target_attributes, content)

# 2. Patch every buildSettings block in XCBuildConfiguration section
def patch_build_settings(match):
    settings = match.group(1)
    
    # Replace or add DEVELOPMENT_TEAM
    if 'DEVELOPMENT_TEAM' in settings:
        settings = re.sub(r'DEVELOPMENT_TEAM\s*=\s*[^;]+;', f'DEVELOPMENT_TEAM = {team_id};', settings)
    else:
        settings = settings.rstrip() + f'\n\t\t\t\tDEVELOPMENT_TEAM = {team_id};\n\t\t\t'
        
    # Replace or add CODE_SIGN_STYLE
    if 'CODE_SIGN_STYLE' in settings:
        settings = re.sub(r'CODE_SIGN_STYLE\s*=\s*[^;]+;', 'CODE_SIGN_STYLE = Manual;', settings)
    else:
        settings = settings.rstrip() + '\n\t\t\t\tCODE_SIGN_STYLE = Manual;\n\t\t\t'

    return f'buildSettings = {{{settings}}};'

content = re.sub(r'buildSettings\s*=\s*\{([\s\S]*?)\};', patch_build_settings, content)

with open(pbxproj_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Successfully patched {pbxproj_path} with DevelopmentTeam={team_id} and Manual signing!")
