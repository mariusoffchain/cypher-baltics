from pathlib import Path
root = Path(__file__).resolve().parent / 'identity'
(root / 'matrix.html').write_text((root / 'matrix.template.html').read_text())
