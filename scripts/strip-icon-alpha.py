#!/usr/bin/env python3
import os
import sys
import subprocess

def strip_icon_alpha():
    target_dir = "ios/App/App/Assets.xcassets/AppIcon.appiconset"
    if not os.path.exists(target_dir):
        print(f"[Icon-Fix] Directory {target_dir} not found, searching ios/...")
        target_dir = "ios"

    # Ensure Pillow is available
    try:
        from PIL import Image
    except ImportError:
        print("[Icon-Fix] Installing Pillow...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "--quiet"])
        from PIL import Image

    processed = 0
    for root, _, files in os.walk(target_dir):
        for f in files:
            if f.lower().endswith(".png"):
                file_path = os.path.join(root, f)
                try:
                    with Image.open(file_path) as img:
                        print(f"[Icon-Fix] Inspecting {file_path} (mode={img.mode}, size={img.size})")
                        bg = Image.new("RGB", img.size, (15, 23, 42)) # Dark solid background
                        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                            rgba = img.convert("RGBA")
                            bg.paste(rgba, (0, 0), rgba)
                            bg.save(file_path, "PNG", optimize=True)
                            print(f"[Icon-Fix] Successfully flattened alpha channel for {file_path}")
                        else:
                            bg.paste(img.convert("RGB"), (0, 0))
                            bg.save(file_path, "PNG", optimize=True)
                            print(f"[Icon-Fix] Re-saved {file_path} as pure 24-bit RGB (no alpha)")
                        processed += 1
                except Exception as e:
                    print(f"[Icon-Fix] Failed {file_path}: {e}")

    print(f"[Icon-Fix] Completed. {processed} icon(s) converted to strictly opaque RGB (no alpha).")

if __name__ == "__main__":
    strip_icon_alpha()
