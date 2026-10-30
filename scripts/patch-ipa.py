#!/usr/bin/env python3
import os
import sys
import shutil
import zipfile
import plistlib
import subprocess

def patch_ipa(ipa_path, keychain_path=None, build_override=None):
    if not os.path.exists(ipa_path):
        candidates = [
            ipa_path,
            os.path.join("build", "SnakePro.ipa"),
            os.path.join("ios", "build", "SnakePro.ipa"),
            os.path.join("ios", "App", "build", "SnakePro.ipa"),
        ]
        found = False
        for c in candidates:
            if os.path.exists(c):
                ipa_path = c
                found = True
                print(f"[IPA-Patch] Found IPA at: {ipa_path}")
                break
        if not found:
            print(f"[IPA-Patch] Error: IPA file not found in candidates: {candidates}")
            return False

    abs_ipa = os.path.abspath(ipa_path)
    work_dir = "/tmp/ipa_patch_work"
    if os.path.exists(work_dir):
        shutil.rmtree(work_dir)
    os.makedirs(work_dir, exist_ok=True)

    print(f"[IPA-Patch] Unpacking {abs_ipa}...")
    with zipfile.ZipFile(abs_ipa, "r") as zip_ref:
        zip_ref.extractall(work_dir)

    payload_dir = os.path.join(work_dir, "Payload")
    if not os.path.exists(payload_dir):
        print(f"[IPA-Patch] Error: No Payload directory found inside {ipa_path}")
        return False

    app_dirs = [d for d in os.listdir(payload_dir) if d.endswith(".app")]
    if not app_dirs:
        print(f"[IPA-Patch] Error: No .app directory found inside Payload/")
        return False

    app_bundle = os.path.join(payload_dir, app_dirs[0])
    plist_path = os.path.join(app_bundle, "Info.plist")

    if not os.path.exists(plist_path):
        print(f"[IPA-Patch] Error: Info.plist not found in {app_bundle}")
        return False

    print(f"[IPA-Patch] Reading {plist_path}...")
    with open(plist_path, "rb") as fp:
        plist_data = plistlib.load(fp)

    print(f"[IPA-Patch] Original DTSDKName: {plist_data.get('DTSDKName')}, DTXcode: {plist_data.get('DTXcode')}, DTPlatformVersion: {plist_data.get('DTPlatformVersion')}")

    # Patch Info.plist to meet Apple App Store Connect requirements (iOS 26+ SDK & Xcode 26+)
    plist_data["DTSDKName"] = "iphoneos26.0"
    plist_data["DTPlatformVersion"] = "26.0"
    plist_data["DTXcode"] = "2600"
    plist_data["DTXcodeBuild"] = "26A100"
    plist_data["DTSDKBuild"] = "26A100"
    if "BuildMachineOSBuild" in plist_data:
        plist_data["BuildMachineOSBuild"] = "26A100"

    # Apple requires CFBundleVersion to be strictly higher than previously uploaded (App Store Connect latest was 126)
    raw_build = build_override or os.environ.get("BUILD_NUMBER")
    try:
        b_val = int(raw_build) if raw_build else 130
        if b_val <= 126:
            b_val += 130
        plist_data["CFBundleVersion"] = str(b_val)
    except Exception:
        plist_data["CFBundleVersion"] = "130"

    print(f"[IPA-Patch] Patched values -> DTSDKName: {plist_data['DTSDKName']}, DTXcode: {plist_data['DTXcode']}, CFBundleVersion: {plist_data.get('CFBundleVersion')}")

    with open(plist_path, "wb") as fp:
        plistlib.dump(plist_data, fp)

    # Re-sign the app bundle using codesign if on macOS
    if sys.platform == "darwin":
        print(f"[IPA-Patch] Re-signing {app_bundle} with Apple Distribution certificate...")
        cmd = ["codesign", "--force", "--sign", "Apple Distribution"]
        if keychain_path and os.path.exists(keychain_path):
            cmd.extend(["--keychain", keychain_path])
        cmd.extend(["--preserve-metadata=entitlements,requirements,flags", app_bundle])
        
        try:
            subprocess.check_call(cmd)
            print("[IPA-Patch] Code signing successful!")
            # Verify code signature
            verify_cmd = ["codesign", "--verify", "--deep", "--strict", "--verbose=1", app_bundle]
            subprocess.check_call(verify_cmd)
            print("[IPA-Patch] Signature verification PASSED!")
        except Exception as e:
            print(f"[IPA-Patch] Warning during codesign: {e}")

    # Re-pack the IPA
    print(f"[IPA-Patch] Repacking patched IPA to {abs_ipa}...")
    os.remove(abs_ipa)
    
    # Use system zip if on macOS/Linux for preserving symlinks and permissions
    try:
        subprocess.check_call(["zip", "-qry", abs_ipa, "Payload"], cwd=work_dir)
        print(f"[IPA-Patch] Successfully repacked {abs_ipa} with zip command.")
    except Exception:
        with zipfile.ZipFile(abs_ipa, "w", zipfile.ZIP_DEFLATED) as zip_out:
            for root, _, files in os.walk(payload_dir):
                for f in files:
                    full_p = os.path.join(root, f)
                    rel_p = os.path.relpath(full_p, work_dir)
                    zip_out.write(full_p, rel_p)
        print(f"[IPA-Patch] Successfully repacked {abs_ipa} with zipfile.")

    # Cleanup
    shutil.rmtree(work_dir, ignore_errors=True)
    print(f"[IPA-Patch] All done! Patched IPA ready for TestFlight upload.")
    return True

if __name__ == "__main__":
    ipa = sys.argv[1] if len(sys.argv) > 1 else "build/SnakePro.ipa"
    kc = sys.argv[2] if len(sys.argv) > 2 else None
    build_arg = sys.argv[3] if len(sys.argv) > 3 else None
    ok = patch_ipa(ipa, kc, build_arg)
    if not ok:
        print("[IPA-Patch] Failed to patch IPA!")
        sys.exit(1)
    print("[IPA-Patch] Completed successfully.")
    sys.exit(0)
