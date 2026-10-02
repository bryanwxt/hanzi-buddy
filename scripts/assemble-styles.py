import pathlib, re
p = pathlib.Path('src/styles.css')
s = p.read_text()
dragon = s[s.index('.dragon__all, .dragon__sway'):s.index('/* Scenes */')]
scenes = s[s.index('/* Scenes */'):s.index('/* Session header & progress */')]
head = pathlib.Path('scripts/styles-head.css').read_text()
tail = pathlib.Path('scripts/styles-tail.css').read_text()
p.write_text(head + '\n/* Dragon */\n.dragon { display: block; overflow: visible; }\n' + dragon + scenes + tail)
print('assembled', len(p.read_text().splitlines()), 'lines')
