import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Header
      signIn: 'SIGN IN',
      signUp: 'SIGN UP',
      signOut: 'SIGN OUT',
      settings: 'SETTINGS',
      twitter: 'TWITTER',
      
      // Auth
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      loginToAccount: 'Login to your account',
      createAccount: 'Create a new account',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
      
      // Chat
      typeMessage: 'Type a message...',
      send: 'Send',
      online: 'Online',
      meetElizaBAO: 'meet ElizaBAO',
      
      // Navigation
      analytics: 'Analytics',
      wallets: 'Wallets',
      account: 'Account',
      
      // Whale Tracker
      whaleTracker: 'Whale Tracker',
      topWallets: 'Top Wallets',
      recentActivity: 'Recent Activity',
      volume7d: '7D Volume',
      winRate: 'Win Rate',
      pnl: 'PnL',
      
      // Settings
      settingsTitle: 'Settings',
      appearance: 'Appearance',
      language: 'Language',
      theme: 'Theme',
      dark: 'Dark',
      light: 'Light',
      
      // Credits
      credits: 'Credits',
      yourCredits: 'Your Credits',
      
      // Footer
      transparency: 'Transparency',
      
      // Misc
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
    }
  },
  zh: {
    translation: {
      // Header
      signIn: '登录',
      signUp: '注册',
      signOut: '登出',
      settings: '设置',
      twitter: '推特',
      
      // Auth
      login: '登录',
      register: '注册',
      email: '邮箱',
      password: '密码',
      loginToAccount: '登录您的账户',
      createAccount: '创建新账户',
      noAccount: '还没有账户？',
      haveAccount: '已有账户？',
      
      // Chat
      typeMessage: '输入消息...',
      send: '发送',
      online: '在线',
      meetElizaBAO: '认识 ElizaBAO',
      
      // Navigation
      analytics: '分析',
      wallets: '钱包',
      account: '账户',
      
      // Whale Tracker
      whaleTracker: '巨鲸追踪',
      topWallets: '顶级钱包',
      recentActivity: '最近活动',
      volume7d: '7天交易量',
      winRate: '胜率',
      pnl: '盈亏',
      
      // Settings
      settingsTitle: '设置',
      appearance: '外观',
      language: '语言',
      theme: '主题',
      dark: '深色',
      light: '浅色',
      
      // Credits
      credits: '积分',
      yourCredits: '您的积分',
      
      // Footer
      transparency: '透明度',
      
      // Misc
      loading: '加载中...',
      error: '错误',
      retry: '重试',
    }
  },
  vi: {
    translation: {
      // Header
      signIn: 'ĐĂNG NHẬP',
      signUp: 'ĐĂNG KÝ',
      signOut: 'ĐĂNG XUẤT',
      settings: 'CÀI ĐẶT',
      twitter: 'TWITTER',
      
      // Auth
      login: 'Đăng nhập',
      register: 'Đăng ký',
      email: 'Email',
      password: 'Mật khẩu',
      loginToAccount: 'Đăng nhập vào tài khoản',
      createAccount: 'Tạo tài khoản mới',
      noAccount: 'Chưa có tài khoản?',
      haveAccount: 'Đã có tài khoản?',
      
      // Chat
      typeMessage: 'Nhập tin nhắn...',
      send: 'Gửi',
      online: 'Trực tuyến',
      meetElizaBAO: 'gặp ElizaBAO',
      
      // Navigation
      analytics: 'Phân tích',
      wallets: 'Ví',
      account: 'Tài khoản',
      
      // Whale Tracker
      whaleTracker: 'Theo dõi Cá Voi',
      topWallets: 'Ví Hàng Đầu',
      recentActivity: 'Hoạt Động Gần Đây',
      volume7d: 'Khối Lượng 7 Ngày',
      winRate: 'Tỷ Lệ Thắng',
      pnl: 'Lãi/Lỗ',
      
      // Settings
      settingsTitle: 'Cài đặt',
      appearance: 'Giao diện',
      language: 'Ngôn ngữ',
      theme: 'Chủ đề',
      dark: 'Tối',
      light: 'Sáng',
      
      // Credits
      credits: 'Điểm',
      yourCredits: 'Điểm của bạn',
      
      // Footer
      transparency: 'Minh bạch',
      
      // Misc
      loading: 'Đang tải...',
      error: 'Lỗi',
      retry: 'Thử lại',
    }
  },
  th: {
    translation: {
      // Header
      signIn: 'เข้าสู่ระบบ',
      signUp: 'สมัครสมาชิก',
      signOut: 'ออกจากระบบ',
      settings: 'ตั้งค่า',
      twitter: 'ทวิตเตอร์',
      
      // Auth
      login: 'เข้าสู่ระบบ',
      register: 'สมัครสมาชิก',
      email: 'อีเมล',
      password: 'รหัสผ่าน',
      loginToAccount: 'เข้าสู่ระบบบัญชีของคุณ',
      createAccount: 'สร้างบัญชีใหม่',
      noAccount: 'ยังไม่มีบัญชี?',
      haveAccount: 'มีบัญชีแล้ว?',
      
      // Chat
      typeMessage: 'พิมพ์ข้อความ...',
      send: 'ส่ง',
      online: 'ออนไลน์',
      meetElizaBAO: 'พบ ElizaBAO',
      
      // Navigation
      analytics: 'การวิเคราะห์',
      wallets: 'กระเป๋า',
      account: 'บัญชี',
      
      // Whale Tracker
      whaleTracker: 'ติดตามปลาวาฬ',
      topWallets: 'กระเป๋าชั้นนำ',
      recentActivity: 'กิจกรรมล่าสุด',
      volume7d: 'ปริมาณ 7 วัน',
      winRate: 'อัตราชนะ',
      pnl: 'กำไร/ขาดทุน',
      
      // Settings
      settingsTitle: 'การตั้งค่า',
      appearance: 'รูปลักษณ์',
      language: 'ภาษา',
      theme: 'ธีม',
      dark: 'มืด',
      light: 'สว่าง',
      
      // Credits
      credits: 'เครดิต',
      yourCredits: 'เครดิตของคุณ',
      
      // Footer
      transparency: 'ความโปร่งใส',
      
      // Misc
      loading: 'กำลังโหลด...',
      error: 'ข้อผิดพลาด',
      retry: 'ลองอีกครั้ง',
    }
  }
};

// Get saved language or default to 'en'
const savedLanguage = typeof window !== 'undefined' 
  ? localStorage.getItem('language') || 'en' 
  : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
