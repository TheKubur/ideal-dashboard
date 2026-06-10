import re

with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

blocks = []
current_block = None

for i, line in enumerate(lines):
    match = re.match(r'^(function\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+|document\.addEventListener|//\s*======)', line)
    if match:
        blocks.append({"line": i + 1, "name": line.strip()})

for b in blocks:
    print(f"{b['line']}: {b['name'][:50]}")
