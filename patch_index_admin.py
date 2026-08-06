import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add Banner right after <body>
banner_html = """
  <div id="adminNotificationBanner" style="display:none; background:linear-gradient(90deg, #f59e0b, #e63946); color:white; padding:10px; text-align:center; position:fixed; top:0; left:0; width:100%; z-index:9999; font-weight:bold; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
    <span id="adminNotificationText"></span>
    <button onclick="document.getElementById('adminNotificationBanner').style.display='none'" style="margin-left:15px; background:rgba(255,255,255,0.2); border:none; color:white; padding:4px 10px; border-radius:4px; cursor:pointer;">Kapat</button>
  </div>
"""

html = html.replace('<body>', '<body>\n' + banner_html)

# Add Modal
modal_html = """
  <div class="modal-overlay hidden" id="adminNotificationModal">
    <div class="modal">
      <div class="modal-title">Yönetici Bildirimi Yayınla</div>
      <div class="modal-sub">Tüm kullanıcılara üstte görünecek bir bildirim yazın.</div>
      <textarea class="modal-input" id="adminNotificationInput" rows="4" placeholder="Bildirim mesajı..."></textarea>
      <div class="modal-btns">
        <button class="modal-cancel" onclick="document.getElementById('adminNotificationModal').classList.add('hidden')">İptal</button>
        <button class="modal-save" onclick="publishAdminNotification()">Yayınla</button>
      </div>
    </div>
  </div>
"""

html = html.replace('<!-- LOGIN -->', modal_html + '\n  <!-- LOGIN -->')

# Add trigger button next to export dropdown
btn_html = """
          <button id="btnAdminNotification" onclick="document.getElementById('adminNotificationModal').classList.remove('hidden')" style="display:none;align-items:center;gap:0.4rem;background:#e63946;border:none;border-radius:99px;padding:0.28rem 0.9rem;font-family:'Outfit',sans-serif;font-size:0.72rem;font-weight:600;color:white;cursor:pointer">📢 Bildirim</button>
          <div style="position:relative" id="exportDropWrap">
"""

html = html.replace('<div style="position:relative" id="exportDropWrap">', btn_html)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
