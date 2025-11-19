import os
import re

BASE_DIR = "backend"  # adjust this to your project root
UNUSED_IMPORT_RE = re.compile(
    r"^from .* import .*|^import .*"
)  # naive, will filter later


def remove_unused_imports(file_path):
    with open(file_path, "r") as f:
        lines = f.readlines()
    new_lines = []
    for line in lines:
        if "# noqa: F401" in line:  # ignore explicit noqa
            new_lines.append(line)
            continue
        if re.search(UNUSED_IMPORT_RE, line) and "unused" in line.lower():
            continue
        new_lines.append(line)
    with open(file_path, "w") as f:
        f.writelines(new_lines)


def remove_unused_variables(file_path):
    with open(file_path, "r") as f:
        code = f.read()
    # remove variables like "var = something  # unused"
    code = re.sub(r"\s+\w+\s*=\s*.*?#\s*unused", "", code)
    with open(file_path, "w") as f:
        f.write(code)


def fix_bare_except(file_path):
    with open(file_path, "r") as f:
        code = f.read()
    code = re.sub(r"except:\s*", "except Exception: ", code)
    with open(file_path, "w") as f:
        f.write(code)


def move_imports_to_top(file_path):
    with open(file_path, "r") as f:
        lines = f.readlines()
    imports = [
        line for line in lines if line.startswith("import") or line.startswith("from")
    ]
    other = [
        line
        for line in lines
        if not (line.startswith("import") or line.startswith("from"))
    ]
    with open(file_path, "w") as f:
        f.writelines(imports + ["\n"] + other)


def process_file(file_path):
    remove_unused_imports(file_path)
    remove_unused_variables(file_path)
    fix_bare_except(file_path)
    move_imports_to_top(file_path)
    # format code with black to fix long lines
    os.system(f"black {file_path} --line-length 88")


for root, dirs, files in os.walk(BASE_DIR):
    for file in files:
        if file.endswith(".py"):
            process_file(os.path.join(root, file))
