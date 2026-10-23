import os
import zipfile

zip_path = 'public/snake_project.zip'
if os.path.exists(zip_path):
    os.remove(zip_path)

exclude_prefixes = (
    'node_modules',
    'dist',
    '.aistudio',
    '.git',
    os.path.join('ios', 'App', 'App', 'public'),
    os.path.join('ios', 'App', 'build'),
    os.path.join('public', 'assets', 'aistudio'),
    os.path.join('public', 'screenshots'),
    'build',
)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        rel_root = os.path.relpath(root, '.')
        if any(rel_root == p or rel_root.startswith(p + os.sep) for p in exclude_prefixes):
            continue
        for file in files:
            if file.endswith('.zip'):
                continue
            file_path = os.path.join(root, file)
            rel_path = os.path.relpath(file_path, '.')
            if any(rel_path.startswith(p + os.sep) for p in exclude_prefixes):
                continue
            zipf.write(file_path, rel_path)

print(f'Project zip created successfully at {zip_path}: {os.path.getsize(zip_path)} bytes')
