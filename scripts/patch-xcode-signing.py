#!/usr/bin/env python3
"""
Target-Scoped Xcode Signing Patch Script (V50)

Strictly scopes Manual Signing settings (DEVELOPMENT_TEAM, CODE_SIGN_STYLE,
CODE_SIGN_IDENTITY, PROVISIONING_PROFILE_SPECIFIER, PROVISIONING_PROFILE) to the
main application PBXNativeTarget ("com.apple.product-type.application") ONLY,
while actively stripping signing overrides from Project-Level XCBuildConfigurations
so Swift Package Manager (SPM) targets never inherit the app's provisioning profile.
"""

import os
import re
import sys

SIGNING_KEYS_TO_STRIP_FROM_PROJECT = [
    'PROVISIONING_PROFILE_SPECIFIER',
    'PROVISIONING_PROFILE',
    'CODE_SIGN_STYLE',
    'CODE_SIGN_IDENTITY',
    '"CODE_SIGN_IDENTITY[sdk=iphoneos*]"',
    'DEVELOPMENT_TEAM',
    'OTHER_CODE_SIGN_FLAGS',
]


def find_main_app_target(content: str):
    """Locate the main application PBXNativeTarget (UUID, buildConfigurationList UUID)."""
    section_match = re.search(
        r'/\* Begin PBXNativeTarget section \*/([\s\S]*?)/\* End PBXNativeTarget section \*/',
        content,
    )
    if not section_match:
        raise RuntimeError('PBXNativeTarget section not found in project.pbxproj')

    section = section_match.group(1)
    # Match each target entry: <UUID> /* <Name> */ = { ... };
    target_pattern = re.compile(
        r'([A-F0-9]{24})\s*(?:/\*[^*]*\*/\s*)?=\s*\{([\s\S]*?)\n\t\t\};'
    )
    app_targets = []
    for m in target_pattern.finditer(section):
        target_uuid = m.group(1)
        body = m.group(2)
        if 'productType = "com.apple.product-type.application";' in body:
            cfg_match = re.search(r'buildConfigurationList\s*=\s*([A-F0-9]{24})', body)
            name_match = re.search(r'\bname\s*=\s*"?([^";]+)"?;', body)
            if cfg_match:
                app_targets.append(
                    (target_uuid, cfg_match.group(1), name_match.group(1) if name_match else 'App')
                )

    if not app_targets:
        raise RuntimeError('No application PBXNativeTarget found in project.pbxproj')

    # Prefer target named "App" if multiple exist
    for t in app_targets:
        if t[2] == 'App':
            return t
    return app_targets[0]


def find_project_config_list(content: str):
    """Locate the PBXProject buildConfigurationList UUID."""
    section_match = re.search(
        r'/\* Begin PBXProject section \*/([\s\S]*?)/\* End PBXProject section \*/',
        content,
    )
    if not section_match:
        return None
    m = re.search(r'buildConfigurationList\s*=\s*([A-F0-9]{24})', section_match.group(1))
    return m.group(1) if m else None


def find_config_uuids_for_list(content: str, config_list_uuid: str):
    """Return all XCBuildConfiguration UUIDs referenced by a given XCConfigurationList UUID."""
    if not config_list_uuid:
        return set()
    section_match = re.search(
        r'/\* Begin XCConfigurationList section \*/([\s\S]*?)/\* End XCConfigurationList section \*/',
        content,
    )
    if not section_match:
        return set()
    list_pattern = re.compile(
        rf'{re.escape(config_list_uuid)}\s*(?:/\*[^*]*\*/\s*)?=\s*\{{([\s\S]*?)\n\t\t\}};'
    )
    m = list_pattern.search(section_match.group(1))
    if not m:
        return set()
    bc_match = re.search(r'buildConfigurations\s*=\s*\(([\s\S]*?)\);', m.group(1))
    if not bc_match:
        return set()
    return set(re.findall(r'([A-F0-9]{24})', bc_match.group(1)))


def upsert_setting(settings: str, key: str, value_literal: str) -> str:
    """Replace an existing build setting or append it cleanly inside buildSettings."""
    escaped_key = re.escape(key)
    pattern = re.compile(rf'^([ \t]*){escaped_key}\s*=\s*[^;]+;\s*$', re.MULTILINE)
    if pattern.search(settings):
        return pattern.sub(rf'\g<1>{key} = {value_literal};', settings)
    return settings.rstrip() + f'\n\t\t\t\t{key} = {value_literal};\n\t\t\t'


def remove_setting(settings: str, key: str) -> str:
    """Remove all occurrences of a build setting line from buildSettings."""
    escaped_key = re.escape(key)
    pattern = re.compile(rf'^[ \t]*{escaped_key}\s*=\s*[^;]+;\r?\n?', re.MULTILINE)
    return pattern.sub('', settings)


def patch_pbxproj(
    pbxproj_path: str,
    team_id: str,
    profile_name: str = '',
    build_number: str = '',
    profile_uuid: str = '',
) -> None:
    if not os.path.exists(pbxproj_path):
        raise FileNotFoundError(f'project.pbxproj not found: {pbxproj_path}')

    with open(pbxproj_path, 'r', encoding='utf-8') as f:
        content = f.read()

    app_target_uuid, app_cfg_list_uuid, app_target_name = find_main_app_target(content)
    project_cfg_list_uuid = find_project_config_list(content)

    app_config_uuids = find_config_uuids_for_list(content, app_cfg_list_uuid)
    project_config_uuids = find_config_uuids_for_list(content, project_cfg_list_uuid)

    if not app_config_uuids:
        raise RuntimeError(
            f'No XCBuildConfiguration entries found for main App target {app_target_name} ({app_cfg_list_uuid})'
        )

    print(
        f'[patch-xcode-signing] Target="{app_target_name}" ({app_target_uuid}), '
        f'AppConfigs={sorted(app_config_uuids)}, ProjectConfigs={sorted(project_config_uuids)}, '
        f'Team={team_id}, Profile={profile_name or "(unchanged/none)"}, Build={build_number or "(unchanged)"}'
    )

    # 1. Patch TargetAttributes ONLY for the main application target UUID
    target_attr_pattern = re.compile(
        rf'({re.escape(app_target_uuid)}\s*=\s*\{{[\s\S]*?\n\t\t\t\t\t\}};)'
    )

    def patch_single_target_attr(match):
        block = match.group(1)
        if 'DevelopmentTeam =' in block:
            block = re.sub(r'DevelopmentTeam\s*=\s*[^;]+;', f'DevelopmentTeam = {team_id};', block)
        else:
            block = re.sub(
                r'(\s*CreatedOnToolsVersion\s*=\s*[^;]+;)',
                rf'\1\n\t\t\t\t\t\tDevelopmentTeam = {team_id};',
                block,
            )
        if 'ProvisioningStyle =' in block:
            block = re.sub(r'ProvisioningStyle\s*=\s*[^;]+;', 'ProvisioningStyle = Manual;', block)
        else:
            block = re.sub(
                r'(\s*DevelopmentTeam\s*=\s*[^;]+;)',
                r'\1\n\t\t\t\t\t\tProvisioningStyle = Manual;',
                block,
            )
        return block

    content = target_attr_pattern.sub(patch_single_target_attr, content)

    # 2. Patch XCBuildConfiguration blocks strictly by UUID scope:
    #    - Project-level configs: STRIP all signing/provisioning overrides so SPM targets never inherit them.
    #    - Main App target configs: APPLY Manual Signing, Team, Identity, Profile, Build Number.
    #    - Any other/third-party target configs: DO NOT TOUCH.
    xc_section_pattern = re.compile(
        r'(/\* Begin XCBuildConfiguration section \*/)([\s\S]*?)(/\* End XCBuildConfiguration section \*/)'
    )
    xc_entry_pattern = re.compile(
        r'([ \t]*([A-F0-9]{24})\s*(?:/\*[^*]*\*/\s*)?=\s*\{[\s\S]*?buildSettings\s*=\s*\{)([\s\S]*?)(\};[\s\S]*?\n\t\t\};)'
    )

    def patch_xc_section(sec_match):
        header, body, footer = sec_match.group(1), sec_match.group(2), sec_match.group(3)

        def patch_entry(entry_match):
            prefix, cfg_uuid, settings, suffix = (
                entry_match.group(1),
                entry_match.group(2),
                entry_match.group(3),
                entry_match.group(4),
            )

            if cfg_uuid in project_config_uuids:
                for key in SIGNING_KEYS_TO_STRIP_FROM_PROJECT:
                    settings = remove_setting(settings, key)
                return f'{prefix}{settings}{suffix}'

            if cfg_uuid in app_config_uuids:
                settings = upsert_setting(settings, 'DEVELOPMENT_TEAM', team_id)
                settings = upsert_setting(settings, 'CODE_SIGN_STYLE', 'Manual')
                settings = upsert_setting(settings, 'CODE_SIGN_IDENTITY', '"Apple Distribution"')
                settings = upsert_setting(
                    settings, '"CODE_SIGN_IDENTITY[sdk=iphoneos*]"', '"Apple Distribution"'
                )
                settings = upsert_setting(settings, 'TARGETED_DEVICE_FAMILY', '1')
                settings = upsert_setting(settings, 'MARKETING_VERSION', '1.0')

                if profile_name:
                    settings = upsert_setting(
                        settings, 'PROVISIONING_PROFILE_SPECIFIER', f'"{profile_name}"'
                    )
                if profile_uuid:
                    settings = upsert_setting(
                        settings, 'PROVISIONING_PROFILE', f'"{profile_uuid}"'
                    )
                if build_number:
                    settings = upsert_setting(
                        settings, 'CURRENT_PROJECT_VERSION', str(build_number)
                    )
                return f'{prefix}{settings}{suffix}'

            # Third-party or other target configurations: preserve untouched
            return entry_match.group(0)

        new_body = xc_entry_pattern.sub(patch_entry, body)
        return f'{header}{new_body}{footer}'

    content, count = xc_section_pattern.subn(patch_xc_section, content)
    if count != 1:
        raise RuntimeError('XCBuildConfiguration section could not be patched cleanly')

    with open(pbxproj_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(
        f'[patch-xcode-signing] Successfully scoped Manual Signing to App target "{app_target_name}" '
        f'and stripped Project-Level signing overrides.'
    )


if __name__ == '__main__':
    pbxproj_arg = sys.argv[1] if len(sys.argv) > 1 else 'ios/App/App.xcodeproj/project.pbxproj'
    team_arg = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else os.environ.get('APPLE_TEAM_ID', 'N2S5289QDM')
    profile_name_arg = sys.argv[3] if len(sys.argv) > 3 else os.environ.get('PROVISIONING_PROFILE_NAME', '')
    build_num_arg = sys.argv[4] if len(sys.argv) > 4 else os.environ.get('BUILD_NUMBER', '')
    profile_uuid_arg = sys.argv[5] if len(sys.argv) > 5 else os.environ.get('PROVISIONING_PROFILE_UUID', '')

    patch_pbxproj(
        pbxproj_path=pbxproj_arg,
        team_id=team_arg,
        profile_name=profile_name_arg,
        build_number=build_num_arg,
        profile_uuid=profile_uuid_arg,
    )
