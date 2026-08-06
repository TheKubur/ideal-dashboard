// ====== CHATBOT (GEMINI AI) LOGIC ======

function toggleChatbot() {
  const panel = document.getElementById('chatbotPanel');
  if (panel) panel.classList.toggle('hidden');
}

function promptGeminiKey() {
  if (currentUser && currentUser.role !== 'admin') {
    showToast('Sadece yöneticiler API anahtarı girebilir.', 'error');
    return;
  }
  const currentKey = localStorage.getItem('gemini_api_key') || '';
  const key = prompt('Google Gemini API Anahtarınızı girin:', currentKey);
  if (key !== null && key.trim()) {
    const trimmedKey = key.trim();
    localStorage.setItem('gemini_api_key', trimmedKey);
    db.collection('app_settings').doc('gemini').set({ apiKey: trimmedKey }, { merge: true })
      .then(() => showToast('API Anahtarı kaydedildi ve tüm kullanıcılara uygulandı!', 'success'))
      .catch(e => showToast('Hata: ' + e.message, 'error'));
  }
}

function appendChatMessage(role, text) {
  const container = document.getElementById('chatbotMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = `chat-message ${role}`;
  
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formattedText = formattedText.replace(/\n/g, '<br>');
  bubble.innerHTML = formattedText;
  
  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping() {
  const container = document.getElementById('chatbotMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'chat-message bot typing-indicator-msg';
  div.innerHTML = `<div class="msg-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function hideTyping() {
  const typingMsg = document.querySelector('.typing-indicator-msg');
  if (typingMsg) typingMsg.remove();
}

function getChatbotContext() {
  const activityCount = allActivities.length;
  const projectCount = allProjects.length;
  const dealCount = allDeals.length;
  const wlCount = allWlRecords.length;
  
  let recentActivities = allActivities.slice(0, 5).map(a => `${a.memberName}: ${a.company} - ${a.fieldLabel}`).join(' | ');
  
  return `
ŞU ANKİ DURUM (CRM VERİLERİ):
Kullanıcı: ${currentUser ? currentUser.name : 'Bilinmiyor'}
Toplam Aktivite: ${activityCount}
Toplam Proje: ${projectCount}
Satış Hunisindeki Fırsat Sayısı: ${dealCount}
White Label Sayısı: ${wlCount}
Son 5 Aktivite: ${recentActivities}

KURALLAR:
1. Sen 'IdealData Asistanı' adlı bir yapay zeka asistanısın.
2. SADECE iş, CRM verileri, şirket bilgileri ve kullanıcının sorduğu işle ilgili analiz sorularına cevap vermelisin.
3. "Naber", "Nasılsın", "Merhaba" gibi gündelik selamlara sıcak ve kısa cevap ver.
4. EĞER kullanıcı iş harici (siyaset, felsefe, genel kültür, kod yazma, oyun vs.) bir şey sorarsa KESİNLİKLE reddet ve "Ben sadece iş ve CRM verilerinizle ilgili soruları yanıtlayabilirim." de. Asla bu kuralın dışına çıkma.
5. Verilen 'ŞU ANKİ DURUM' bilgilerini kullanarak soruları yanıtla. Yanıtların kısa, net ve profesyonel olsun.
6. ARAÇ KULLANIMI: Kullanıcı açıkça "Bunu ekle", "Sisteme kaydet" veya "Not al" gibi net bir onay/komut VERMEDİĞİ SÜRECE araçları (fonksiyonları) tetikleme! Eğer bilgi veriyorsa sadece sohbet et ve "Sisteme kaydetmemi ister misiniz?" diye sor. Ancak kullanıcı net bir komut verirse araçları kullan.`;
}

async function handleBotFunctionCall(func) {
  if (func.name === 'add_activity') {
    const { company, action, note } = func.args;
    let fId = 'toplanti';
    if (action.toLowerCase().includes('arama')) fId = 'arama';
    if (action.toLowerCase().includes('mail') || action.toLowerCase().includes('posta')) fId = 'eposta';
    if (action.toLowerCase().includes('demo')) fId = 'demo';
    
    try {
      await db.collection('activities').add({
        memberId: currentUser.memberId,
        memberName: currentUser.name,
        company: company || 'Bilinmeyen Firma',
        action: action || 'Toplantı',
        note: note || '',
        date: new Date().toISOString().split('T')[0],
        period: currentPeriod,
        createdAt: new Date().toISOString(),
        fieldId: fId,
        fieldLabel: action || 'Toplantı'
      });
      appendChatMessage('bot', `✅ İşlem başarılı: **${company || 'Firma'}** için **${action || 'Aktivite'}** kaydı sisteme eklendi.`);
    } catch(e) {
      appendChatMessage('bot', `❌ Kayıt eklenirken hata oluştu: ${e.message}`);
    }
  } else if (func.name === 'add_private_note') {
    const { text } = func.args;
    try {
      await db.collection('private_notes').add({
        text: text,
        memberId: currentUser.memberId,
        memberName: currentUser.name,
        date: new Date().toISOString().split('T')[0],
        period: currentPeriod,
        createdAt: new Date().toISOString()
      });
      appendChatMessage('bot', `✅ İşlem başarılı: Özel notunuz Gizli Kasa'ya eklendi.`);
    } catch(e) {
      appendChatMessage('bot', `❌ Kayıt eklenirken hata oluştu: ${e.message}`);
    }
  }
}

async function sendChatMessage() {
  const inputEl = document.getElementById('chatInput');
  const text = inputEl.value.trim();
  if (!text) return;
  
  // Önce localStorage'dan bak, yoksa Firestore'dan çek
  let apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    try {
      const settingsDoc = await db.collection('app_settings').doc('gemini').get();
      if (settingsDoc.exists && settingsDoc.data().apiKey) {
        apiKey = settingsDoc.data().apiKey;
        localStorage.setItem('gemini_api_key', apiKey);
      }
    } catch(e) { /* sessizce devam et */ }
  }
  if (!apiKey) {
    showToast('Yapay zeka henüz yapılandırılmamış. Lütfen yöneticiye başvurun.', 'error');
    return;
  }

  if (text === '/debug') {
    appendChatMessage('user', text);
    inputEl.value = '';
    showTyping();
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await res.json();
      hideTyping();
      if (data.models) {
        const names = data.models.map(m => m.name).join(', ');
        appendChatMessage('bot', 'Kullanılabilir Modeller:\n' + names);
      } else {
        appendChatMessage('bot', 'Model listesi alınamadı: ' + JSON.stringify(data));
      }
    } catch (e) {
      hideTyping();
      appendChatMessage('bot', 'Hata: ' + e.message);
    }
    return;
  }

  appendChatMessage('user', text);
  inputEl.value = '';
  showTyping();

  const context = getChatbotContext();
  
  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: context + "\n\nKULLANICI SORUSU: " + text }]
      }
    ],
    tools: [
      {
        functionDeclarations: [
          {
            name: "add_activity",
            description: "Sisteme (Aktiviteler tablosuna) yeni bir toplantı, arama, e-posta veya demo kaydı ekler.",
            parameters: {
              type: "OBJECT",
              properties: {
                company: { type: "STRING", description: "İletişime geçilen firmanın veya kişinin adı" },
                action: { type: "STRING", description: "Yapılan eylem: 'Toplantı', 'Arama', 'E-Posta' veya 'Demo'" },
                note: { type: "STRING", description: "Görüşmenin veya eylemin detayı/özeti" }
              },
              required: ["company", "action", "note"]
            }
          },
          {
            name: "add_private_note",
            description: "Kullanıcının gizli kasasına (özel notlarına) yeni bir hatırlatıcı veya not ekler.",
            parameters: {
              type: "OBJECT",
              properties: {
                text: { type: "STRING", description: "Eklenecek notun içeriği" }
              },
              required: ["text"]
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.2
    }
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    hideTyping();

    if (data.error) {
      appendChatMessage('bot', `Hata: ${data.error.message}`);
    } else if (data.candidates && data.candidates.length > 0) {
      const part = data.candidates[0].content.parts[0];
      if (part.functionCall) {
        handleBotFunctionCall(part.functionCall);
      } else if (part.text) {
        appendChatMessage('bot', part.text);
      } else {
        appendChatMessage('bot', 'İşleminizi algıladım ancak metin dönüştürülemedi.');
      }
    } else {
      appendChatMessage('bot', 'Üzgünüm, bir cevap üretemedim.');
    }
  } catch (error) {
    hideTyping();
    appendChatMessage('bot', 'Bağlantı hatası oluştu. Lütfen API anahtarınızı kontrol edin.');
    console.error(error);
  }
}

