const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// The line we want to replace has encoding issues, so we use regex
const regex = /compSel\.innerHTML \= \'\<option value=\"\"\>-- Kurum Se\S+ --\<\/option\>\' \+ allCompanies\.map\(c \=\> \`\<option value\=\"\$\{c\}\"\>\$\{c\}\<\/option\>\`\)\.join\(\'\'\);/g;

const replacement = `compSel.innerHTML = '<option value="">-- Kurum Seç --</option>' + allCompanies.map(c => \`<option value="\${c}">\${c}</option>\`).join('') + '<option value="__yeni__" style="font-weight:bold;color:var(--accent)">+ Yeni Kurum Ekle...</option>';
  const customInput = document.getElementById('dealCompanyCustom');
  if (customInput) { customInput.classList.add('hidden'); customInput.value = ''; }`;

code = code.replace(regex, replacement);
fs.writeFileSync('app.js', code);
console.log('Fixed app.js');
