with open('/Users/mac/Desktop/WeldT/frontend/src/components/Galaxy.jsx', 'r') as f:
    text = f.read()

import re
fixed = re.sub(r'STAR_CO\nLOR_CUTOFF', 'STAR_COLOR_CUTOFF', text)
fixed = re.sub(r'uS\naturation', 'uSaturation', fixed)
fixed = fixed.replace('+ 0.5\n;', '+ 0.5;')
fixed = fixed.replace('38.\n0 +', '38.0 +')
fixed = fixed.replace('centerD\nist', 'centerDist')
fixed = fixed.replace('mouseDi\nst', 'mouseDist')
fixed = fixed.replace('sin(autoRotAngle), \ncos(autoRotAngle)', 'sin(autoRotAngle), cos(autoRotAngle)')

with open('/Users/mac/Desktop/WeldT/frontend/src/components/Galaxy.jsx', 'w') as f:
    f.write(fixed)
