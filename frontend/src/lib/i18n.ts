import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      'landing.hero.headline': 'Swipe right on your next collaborator.',
      'landing.hero.subcopy':
        'Alivv matches your brief with verified builders so you can move from spark to ship faster.',
      'landing.hero.primaryCta': 'Start swiping collaborators',
      'landing.hero.secondaryCta': 'Have a crew already?',
      'landing.hero.secondaryCtaAction': 'Log in',
    },
  },
  id: {
    translation: {
      'landing.hero.headline': 'Swipe kanan untuk kolaborator berikutnya.',
      'landing.hero.subcopy':
        'Alivv membaca kebutuhanmu, memverifikasi talent, dan mengantar kamu langsung ke ruang kerja.',
      'landing.hero.primaryCta': 'Mulai swipe kolaborator',
      'landing.hero.secondaryCta': 'Sudah punya kru?',
      'landing.hero.secondaryCtaAction': 'Masuk sekarang',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
// Multi-language support system
interface Translations {
  [key: string]: {
    [lang: string]: string;
  };
}

const translations: Translations = {
  // Common
  'common.welcome': {
    en: 'Welcome',
    id: 'Selamat Datang',
    es: 'Bienvenido',
    fr: 'Bienvenue',
    de: 'Willkommen',
    pt: 'Bem-vindo',
    ja: 'ようこそ',
    ko: '환영합니다',
    zh: '欢迎',
    ar: 'مرحبا',
    ru: 'Добро пожаловать',
    hi: 'स्वागत है'
  },
  'common.continue': {
    en: 'Continue',
    id: 'Lanjut',
    es: 'Continuar',
    fr: 'Continuer',
    de: 'Fortfahren',
    pt: 'Continuar',
    ja: '続ける',
    ko: '계속',
    zh: '继续',
    ar: 'استمر',
    ru: 'Продолжить',
    hi: 'जारी रखें'
  },
  'common.back': {
    en: 'Back',
    id: 'Kembali',
    es: 'Atrás',
    fr: 'Retour',
    de: 'Zurück',
    pt: 'Voltar',
    ja: '戻る',
    ko: '뒤로',
    zh: '返回',
    ar: 'رجوع',
    ru: 'Назад',
    hi: 'वापस'
  },
  'common.save': {
    en: 'Save',
    id: 'Simpan',
    es: 'Guardar',
    fr: 'Enregistrer',
    de: 'Speichern',
    pt: 'Salvar',
    ja: '保存',
    ko: '저장',
    zh: '保存',
    ar: 'حفظ',
    ru: 'Сохранить',
    hi: 'सहेजें'
  },
  'common.cancel': {
    en: 'Cancel',
    id: 'Batal',
    es: 'Cancelar',
    fr: 'Annuler',
    de: 'Abbrechen',
    pt: 'Cancelar',
    ja: 'キャンセル',
    ko: '취소',
    zh: '取消',
    ar: 'إلغاء',
    ru: 'Отмена',
    hi: 'रद्द करें'
  },

  // Auth
  'auth.login': {
    en: 'Log In',
    id: 'Masuk',
    es: 'Iniciar Sesión',
    fr: 'Se Connecter',
    de: 'Anmelden',
    pt: 'Entrar',
    ja: 'ログイン',
    ko: '로그인',
    zh: '登录',
    ar: 'تسجيل الدخول',
    ru: 'Войти',
    hi: 'लॉग इन करें'
  },
  'auth.signup': {
    en: 'Sign Up',
    id: 'Daftar',
    es: 'Registrarse',
    fr: "S'inscrire",
    de: 'Registrieren',
    pt: 'Cadastrar',
    ja: '登録',
    ko: '가입',
    zh: '注册',
    ar: 'التسجيل',
    ru: 'Регистрация',
    hi: 'साइन अप करें'
  },
  'auth.logout': {
    en: 'Log Out',
    id: 'Keluar',
    es: 'Cerrar Sesión',
    fr: 'Se Déconnecter',
    de: 'Abmelden',
    pt: 'Sair',
    ja: 'ログアウト',
    ko: '로그아웃',
    zh: '登出',
    ar: 'تسجيل الخروج',
    ru: 'Выйти',
    hi: 'लॉग आउट'
  },

  // Navigation
  'nav.discover': {
    en: 'Discover',
    id: 'Jelajah',
    es: 'Descubrir',
    fr: 'Découvrir',
    de: 'Entdecken',
    pt: 'Descobrir',
    ja: '発見',
    ko: '발견',
    zh: '发现',
    ar: 'اكتشف',
    ru: 'Откройте',
    hi: 'खोजें'
  },
  'nav.chat': {
    en: 'Chat',
    id: 'Obrolan',
    es: 'Chat',
    fr: 'Chat',
    de: 'Chat',
    pt: 'Chat',
    ja: 'チャット',
    ko: '채팅',
    zh: '聊天',
    ar: 'دردشة',
    ru: 'Чат',
    hi: 'चैट'
  },
  'nav.projects': {
    en: 'Projects',
    id: 'Proyek',
    es: 'Proyectos',
    fr: 'Projets',
    de: 'Projekte',
    pt: 'Projetos',
    ja: 'プロジェクト',
    ko: '프로젝트',
    zh: '项目',
    ar: 'المشاريع',
    ru: 'Проекты',
    hi: 'परियोजनाएं'
  },
  'nav.events': {
    en: 'Events',
    id: 'Acara',
    es: 'Eventos',
    fr: 'Événements',
    de: 'Veranstaltungen',
    pt: 'Eventos',
    ja: 'イベント',
    ko: '이벤트',
    zh: '活动',
    ar: 'الأحداث',
    ru: 'События',
    hi: 'कार्यक्रम'
  },
  'nav.profile': {
    en: 'Profile',
    id: 'Profil',
    es: 'Perfil',
    fr: 'Profil',
    de: 'Profil',
    pt: 'Perfil',
    ja: 'プロフィール',
    ko: '프로필',
    zh: '个人资料',
    ar: 'الملف الشخصي',
    ru: 'Профиль',
    hi: 'प्रोफ़ाइल'
  },

  // Discover
  'discover.title': {
    en: 'Find your perfect collaborator',
    id: 'Temukan kolaborator sempurnamu',
    es: 'Encuentra tu colaborador perfecto',
    fr: 'Trouvez votre collaborateur idéal',
    de: 'Finden Sie Ihren perfekten Mitarbeiter',
    pt: 'Encontre seu colaborador perfeito',
    ja: '完璧なコラボレーターを見つける',
    ko: '완벽한 협력자를 찾으세요',
    zh: '找到你的完美合作伙伴',
    ar: 'ابحث عن المتعاون المثالي',
    ru: 'Найдите идеального партнера',
    hi: 'अपना सही सहयोगी खोजें'
  },
  'discover.noOneNearby': {
    en: 'No one nearby yet',
    id: 'Belum ada orang terdekat',
    es: 'Nadie cerca todavía',
    fr: 'Personne à proximité pour le moment',
    de: 'Noch niemand in der Nähe',
    pt: 'Ninguém por perto ainda',
    ja: 'まだ近くに誰もいません',
    ko: '아직 근처에 아무도 없습니다',
    zh: '附近还没有人',
    ar: 'لا أحد قريب بعد',
    ru: 'Пока никого рядом',
    hi: 'अभी तक कोई पास नहीं'
  },
  
  // Projects
  'projects.create': {
    en: 'Create Project',
    id: 'Buat Proyek',
    es: 'Crear Proyecto',
    fr: 'Créer un Projet',
    de: 'Projekt Erstellen',
    pt: 'Criar Projeto',
    ja: 'プロジェクトを作成',
    ko: '프로젝트 만들기',
    zh: '创建项目',
    ar: 'إنشاء مشروع',
    ru: 'Создать проект',
    hi: 'प्रोजेक्ट बनाएं'
  },
  'projects.apply': {
    en: 'Apply to Collaborate',
    id: 'Lamar untuk Berkolaborasi',
    es: 'Aplicar para Colaborar',
    fr: 'Postuler pour Collaborer',
    de: 'Bewerben Sie sich für die Zusammenarbeit',
    pt: 'Candidatar-se para Colaborar',
    ja: 'コラボレーションに応募',
    ko: '협업 신청',
    zh: '申请合作',
    ar: 'التقدم للتعاون',
    ru: 'Подать заявку на сотрудничество',
    hi: 'सहयोग के लिए आवेदन करें'
  },

  // Profile
  'profile.edit': {
    en: 'Edit Profile',
    id: 'Edit Profil',
    es: 'Editar Perfil',
    fr: 'Modifier le Profil',
    de: 'Profil Bearbeiten',
    pt: 'Editar Perfil',
    ja: 'プロフィールを編集',
    ko: '프로필 편집',
    zh: '编辑资料',
    ar: 'تعديل الملف الشخصي',
    ru: 'Редактировать профиль',
    hi: 'प्रोफ़ाइल संपादित करें'
  },
  'profile.skills': {
    en: 'Skills',
    id: 'Keahlian',
    es: 'Habilidades',
    fr: 'Compétences',
    de: 'Fähigkeiten',
    pt: 'Habilidades',
    ja: 'スキル',
    ko: '기술',
    zh: '技能',
    ar: 'المهارات',
    ru: 'Навыки',
    hi: 'कौशल'
  },
  'profile.interests': {
    en: 'Interests',
    id: 'Minat',
    es: 'Intereses',
    fr: 'Intérêts',
    de: 'Interessen',
    pt: 'Interesses',
    ja: '興味',
    ko: '관심사',
    zh: '兴趣',
    ar: 'الاهتمامات',
    ru: 'Интересы',
    hi: 'रुचियां'
  }
};

// Available languages
export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
];

// Get current language from localStorage or browser
export const getCurrentLanguage = (): string => {
  const stored = localStorage.getItem('language');
  if (stored) return stored;
  
  const browserLang = navigator.language.split('-')[0];
  const supported = languages.find(lang => lang.code === browserLang);
  return supported ? browserLang : 'en';
};

// Set language
export const setLanguage = (lang: string) => {
  localStorage.setItem('language', lang);
  window.location.reload(); // Simple reload for now
};

// Translation function
export const t = (key: string, lang?: string): string => {
  const currentLang = lang || getCurrentLanguage();
  const translation = translations[key];
  
  if (!translation) {
    console.warn(`Translation missing for key: ${key}`);
    return key;
  }
  
  return translation[currentLang] || translation['en'] || key;
};

// Hook for React components
import { useState, useEffect } from 'react';

export const useTranslation = () => {
  const [language, setLang] = useState(getCurrentLanguage());
  
  useEffect(() => {
    const handleStorageChange = () => {
      setLang(getCurrentLanguage());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  return {
    t: (key: string) => t(key, language),
    language,
    setLanguage,
    languages
  };
};
