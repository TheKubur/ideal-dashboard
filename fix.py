import io
import re

with io.open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# We target the line inside openDealModal using a regex that handles encoding variations
pattern = r"compSel\.innerHTML \= '\<option value=\"\"\>-- Kurum Se.*? \-\-\<\/option\>' \+ allCompanies\.map\(c \=\> \`\<option value\=\"\$\{c\}\"\>\$\{c\}\<\/option\>\`\)\.join\(''\);"

replacement = """compSel.innerHTML = '<option value="">-- Kurum Sec --</option>' + 
                      allCompanies.map(c => `<option value="${c}">${c}</option>`).join('') +
                      '<option value="__yeni__" style="font-weight:bold;color:var(--accent)">+ Yeni Kurum Ekle...</option>';
                      
  const customInput = document.getElementById('dealCompanyCustom');
  if (customInput) {
    customInput.classList.add('hidden');
    customInput.value = '';
  }"""

new_content = re.sub(pattern, replacement, content)

with io.open('app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Fixed app.js using Python")
