const db = firebase.firestore();
const auth = firebase.auth();

const COMPANIES = [
  'ACAR MENKUL DEĞERLER A.Ş.',
  'AHLATCI YATIRIM MENKUL DEĞERLER A.Ş.',
  'AK YATIRIM MENKUL DEĞERLER A.Ş.',
  'ALTERNATİF MENKUL DEĞERLER A.Ş.',
  'ALLBATROS PORTFÖY YÖNETİMİ A.Ş.',
  'ALLBATROSS YATIRIM',
  'ALNUS YATIRIM MENKUL DEĞERLER A.Ş.',
  'ANADOLU AJANSI T.A.Ş.',
  'ANADOLU YATIRIM MENKUL KIYMETLERİ A.Ş.',
  'ATA YATIRIM MENKUL DEĞERLER A.Ş.',
  'Atlas Portföy Yönetimi A.Ş.',
  'AVOD KURUTULMUŞ GIDA VE TARIM ÜRÜNLERİ SAN TİC A.Ş.',
  'A1 CAPİTAL MENKUL DEĞERLER A.Ş.',
  'BAŞKENT MENKUL DEĞERLER VE YATIRIM A.Ş.',
  'BİTUSTA BİLİŞİM TEKNOLOJİLERİ A.Ş.',
  'BİZİM MENKUL DEĞERLER A.Ş.',
  'BULLS YATIRIM',
  'BURGAN YATIRIM MENKUL DEĞERLER A.Ş.',
  'Colendi Menkul Değerler A.Ş.',
  'DENİZ YATIRIM MENKUL KIYMETLER A.Ş.',
  'DESTEK YATIRIM',
  'DİNAMİK YATIRIM MENKUL DEĞERLER A.Ş.',
  'F-TECH LABS - MAHMUT GÜNEŞ',
  'Finar Kurumsal İletişim Çözümleri Ltd Şti',
  'GARNATİ YATIRIM MENKUL KIYMETLERİ A.Ş.',
  'GCM YATIRIM MENKUL DEĞERLER A.Ş.',
  'Geneks Yazılım A.Ş.',
  'GLOBAL MARKET ACESS HOLDİNG LTD.',
  'GLOBAL MENKUL DEĞERLER A.Ş.',
  'HANGİSİ İNTERNET VE BİLGİ HİZMETLERİ A.Ş.',
  'HALK YATIRIM MENKUL DEĞERLER A.Ş.',
  'HEDEF GİRİŞİM SERMAYESİ YAT.ORT.',
  'HEDEF PORTFÖY YÖNETİMİ A.Ş.',
  'HEDEF YATIRIM BANKASI',
  'HSBC BANK A.Ş.',
  'HSBC YATIRIM MENKUL DEGERLER A.Ş.',
  'ICBC TURKEY YATIRIM MENKUL DEĞERLER A.Ş.',
  'IKON MENKUL DEĞERLER A.Ş.',
  'İNFO YATIRIM MENKUL DEĞERLER A.Ş.',
  'İNTEGRAL YATIRIM MENKUL DEĞERLER A.Ş.',
  'İŞ YATIRIM MENKUL DEĞERLER A.Ş.',
  'INVESTAz YATIRIM MENKUL DEĞERLER A.Ş.',
  'Kuveyt Türk Yatırım Menkul Değerler Anonim Şirketi',
  'MARBAJ MENKUL DEĞERLER A.Ş.',
  'MARMARA CAPİTAL PORTFÖY YÖNETİMİ A.Ş.',
  'MEKSA YATIRIM MENKUL DEĞERLER A.Ş.',
  'MİDAS MENKUL DEĞERLER A.Ş.',
  'NCM Investment Menkul Değerler A.Ş.',
  'OSMANLII MENKUL DEĞERLER A.Ş.',
  'OYAK YATIRIM MENKUL DEĞERLER A.Ş.',
  'PENTA TEKNOLOJİ ÜRÜNLERİ DAĞITIM TİCARET A.Ş.',
  'PHILLIP CAPİTAL MENKUL DEĞERLER A.Ş.',
  'PORTFÖY FİNANSAL TEKNOLOJİLER VE YAZILIM A.Ş.',
  'PUSULA MENKUL DEĞERLER A.Ş.',
  'QNB INVEST',
  'SEYİTLER KİMYA SANAYİ A.Ş.',
  'STRATEJİ MENKUL DEĞERLER A.Ş.',
  'TACİRLER YATIRIM MENKUL DEĞERLER A.Ş.',
  'T.GARANTİ BANKASI A.Ş.',
  'TEB YATIRIM MENKUL DEĞERLER A.Ş.',
  'TERA MENKUL DEĞERLER A.Ş.',
  'TRİVE YATIRIM MENKUL DEĞERLER A.Ş.',
  'TURKISH YATIRIM MENKUL DEĞERLER A.Ş.',
  'VAKIF YATIRIM MENKUL DEĞERLER A.Ş.',
  'YAPI KREDİ YATIRIM VE MENKUL DEĞERLER A.Ş.',
  'YATIRIM FİNANSMAN MENKUL DEĞERLER A.Ş.',
  'ÜNLÜ MENKUL DEĞERLER A.Ş.',
  'ZEPHLEX BİLGİ VE TEKNOLOJİLERİ EĞİTİM VE DANIŞMANLIK A.Ş.',
].sort();

// Kullanıcı bilgileri — şifre YOK, Firebase Auth yönetiyor
const USER_MAP = {
  'huseyin.kubur@idealdata.com.tr': { role: 'admin', memberId: 'admin', name: 'Hüseyin Kubur', initials: 'HK', color: '#0f172a' },
  'esmao@idealdata.com.tr': { role: 'member', memberId: 'esma', name: 'Esma Özkan', initials: 'EÖ', color: '#e63946' },
  'dilan.kaya@idealdata.com.tr': { role: 'member', memberId: 'dilan', name: 'Dilan Kaya', initials: 'DK', color: '#8b5cf6' },
  'meleks@idealdata.com.tr': { role: 'member', memberId: 'melek', name: 'Melek Şiran', initials: 'MŞ', color: '#f59e0b' },
  'elifc@idealdata.com.tr': { role: 'member', memberId: 'elif', name: 'Elif Çankaya', initials: 'EÇ', color: '#457b9d' },
  'izleyici@idealdata.com.tr': { role: 'viewer', memberId: null, name: 'SEZAİ KILIÇ', initials: 'SK', color: '#9090b0' },
};

const TEAM_DEF = [
  {
    id: 'elif', name: 'Elif Çankaya', dept: 'Dijital Pazarlama', title: 'Kıdemli Dijital Pazarlama Uzmanı', deptColor: '#457b9d', avatarBg: '#ddeaf5', initials: 'EÇ', photo: 'https://i.imgur.com/BuFXTwR.jpg',
    fields: [
      { key: 'youtube', label: 'YouTube', emoji: '▶️', hasTarget: true },
      { key: 'twitter', label: 'Twitter/X', emoji: '🐦', hasTarget: true },
      { key: 'linkedin', label: 'LinkedIn', emoji: '💼', hasTarget: true },
      { key: 'instagram', label: 'Instagram', emoji: '📸', hasTarget: true },
      { key: 'haber', label: 'Haber', emoji: '📰', hasTarget: true },
      { key: 'diger', label: 'Diğer', emoji: '📌', hasTarget: false }
    ]
  },
  {
    id: 'esma', name: 'Esma Özkan', dept: 'Satış', title: 'Kıdemli Satış Uzmanı', deptColor: '#e63946', avatarBg: '#fce8ea', initials: 'EÖ', photo: 'https://i.imgur.com/ORTr93i.jpg',
    fields: [
      { key: 'musteri', label: 'Yeni Müşteri', emoji: '🤝', hasTarget: true },
      { key: 'temas', label: 'Toplam Temas', emoji: '📞', hasTarget: true },
      { key: 'teklif', label: 'Gönderilen Teklif', emoji: '📄', hasTarget: false },
      { key: 'randevu', label: 'Randevu', emoji: '📅', hasTarget: true },
      { key: 'diger', label: 'Diğer', emoji: '📌', hasTarget: false }
    ]
  },
  {
    id: 'dilan', name: 'Dilan Kaya', dept: 'Satış', title: 'Satış Uzmanı Yardımcısı', deptColor: '#8b5cf6', avatarBg: '#ede9fe', initials: 'DK', photo: 'https://i.imgur.com/IOiHkp6.jpg',
    fields: [
      { key: 'musteri', label: 'Yeni Müşteri', emoji: '🤝', hasTarget: true },
      { key: 'temas', label: 'Toplam Temas', emoji: '📞', hasTarget: true },
      { key: 'teklif', label: 'Gönderilen Teklif', emoji: '📄', hasTarget: false },
      { key: 'randevu', label: 'Randevu', emoji: '📅', hasTarget: true },
      { key: 'diger', label: 'Diğer', emoji: '📌', hasTarget: false }
    ]
  },
  {
    id: 'melek', name: 'Melek Şiran', dept: 'Satış', title: 'Satış Uzmanı Yardımcısı', deptColor: '#f59e0b', avatarBg: '#fef3c7', initials: 'MŞ', photo: 'https://i.imgur.com/bPLoW39.jpg',
    fields: [
      { key: 'musteri', label: 'Yeni Müşteri', emoji: '🤝', hasTarget: true },
      { key: 'temas', label: 'Toplam Temas', emoji: '📞', hasTarget: true },
      { key: 'teklif', label: 'Gönderilen Teklif', emoji: '📄', hasTarget: false },
      { key: 'randevu', label: 'Randevu', emoji: '📅', hasTarget: true },
      { key: 'diger', label: 'Diğer', emoji: '📌', hasTarget: false }
    ]
  },
];

