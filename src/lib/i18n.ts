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
      messageElizaBAO: 'Message ElizaBAO...',
      send: 'Send',
      online: 'Online',
      meetElizaBAO: 'meet ElizaBAO',
      poweredBy: 'Powered by ElizaOS',
      startConversation: 'Start a conversation',
      askAbout: 'Ask about crypto, prediction markets, weather, or generate media',
      generateImage: 'Generate Image',
      generateVideo: 'Generate Video',
      thinking: 'Thinking...',
      generatingImage: 'Generating image...',
      generatingVideo: 'Generating video...',
      recording: 'Recording... Click again to stop',
      voiceRecognized: 'Voice recognized!',
      voiceRecognitionFailed: 'Voice recognition failed',
      microphoneAccessDenied: 'Microphone access denied',
      imageGenerationFailed: 'Image generation failed',
      videoGenerationFailed: 'Video generation failed',
      videoGenerationTime: 'Video generation may take 30-60 seconds...',
      failedToGenerate: 'Failed to generate. Please try again.',
      generatedImageFor: 'Generated image for',
      generatedVideoFor: 'Generated video for',
      connectionFailed: 'Connection failed',
      failedToGetResponse: 'Failed to get response',
      
      // Navigation
      analytics: 'Analytics',
      wallets: 'Wallets',
      account: 'Account',
      
      // Whale Tracker
      whaleTracker: 'Whale Tracker',
      polymarketWhaleTracker: 'POLYMARKET WHALE TRACKER',
      realTimeMonitoring: 'Real-time monitoring of large trades on Polymarket',
      topWallets: 'Top Wallets',
      recentActivity: 'Recent Activity',
      volume7d: '7D Volume',
      winRate: 'Win Rate',
      pnl: 'PnL',
      whaleLive: 'WHALE_LIVE',
      whaleTransactionFeed: 'WHALE_TRANSACTION_FEED',
      transactions: 'TRANSACTIONS',
      liveFeed: 'LIVE FEED',
      whaleWallets: 'WHALE WALLETS',
      noWhaleWallets: 'No whale wallets tracked yet.',
      noWhaleTransactions: 'No whale transactions. Click SYNC to fetch data.',
      loadingWhaleData: 'Loading whale data...',
      syncData: 'SYNC DATA',
      sync: 'SYNC',
      syncing: 'SYNCING...',
      syncSuccess: 'Data synced successfully!',
      syncFailed: 'Failed to sync data',
      syncingPolymarket: 'Syncing Polymarket data...',
      syncedFound: 'Synced! Found',
      whaleTrades: 'whale trades',
      lastSync: 'Last sync',
      autoEvery: 'Auto: every 2min',
      volume: 'Volume',
      lastActive: 'Last Active',
      ofWallets: 'wallets',
      
      // Diagnostics Panel
      elizaOSCloudDeploy: 'ElizaOSCloud Deploy',
      plugins: 'Plugins',
      freq: 'FREQ',
      entropy: 'ENTROPY',
      realtime: 'REALTIME',
      connected: 'CONNECTED',
      offline: 'OFFLINE',
      
      // Main Terminal
      pluginsMcpEnabled: 'Plugins MCP Enabled',
      
      // Plugin Card
      enabled: 'Enabled',
      on: 'ON',
      tools: 'tools',
      mcpEndpoint: 'MCP Endpoint',
      configuration: 'Configuration',
      availableTools: 'Available Tools',
      
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
      buy: 'BUY',
      sell: 'SELL',
      yes: 'YES',
      no: 'NO',
      unknown: 'Unknown',
      nA: 'N/A',
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
      messageElizaBAO: '给 ElizaBAO 发消息...',
      send: '发送',
      online: '在线',
      meetElizaBAO: '认识 ElizaBAO',
      poweredBy: '由 ElizaOS 驱动',
      startConversation: '开始对话',
      askAbout: '询问加密货币、预测市场、天气或生成媒体',
      generateImage: '生成图片',
      generateVideo: '生成视频',
      thinking: '思考中...',
      generatingImage: '生成图片中...',
      generatingVideo: '生成视频中...',
      recording: '录音中... 再次点击停止',
      voiceRecognized: '语音识别成功！',
      voiceRecognitionFailed: '语音识别失败',
      microphoneAccessDenied: '麦克风访问被拒绝',
      imageGenerationFailed: '图片生成失败',
      videoGenerationFailed: '视频生成失败',
      videoGenerationTime: '视频生成可能需要30-60秒...',
      failedToGenerate: '生成失败，请重试。',
      generatedImageFor: '已生成图片：',
      generatedVideoFor: '已生成视频：',
      connectionFailed: '连接失败',
      failedToGetResponse: '获取响应失败',
      
      // Navigation
      analytics: '分析',
      wallets: '钱包',
      account: '账户',
      
      // Whale Tracker
      whaleTracker: '巨鲸追踪',
      polymarketWhaleTracker: 'POLYMARKET 巨鲸追踪',
      realTimeMonitoring: '实时监控 Polymarket 大额交易',
      topWallets: '顶级钱包',
      recentActivity: '最近活动',
      volume7d: '7天交易量',
      winRate: '胜率',
      pnl: '盈亏',
      whaleLive: '巨鲸动态',
      whaleTransactionFeed: '巨鲸交易流',
      transactions: '笔交易',
      liveFeed: '实时动态',
      whaleWallets: '巨鲸钱包',
      noWhaleWallets: '暂无追踪的巨鲸钱包',
      noWhaleTransactions: '暂无巨鲸交易。点击同步获取数据。',
      loadingWhaleData: '加载巨鲸数据中...',
      syncData: '同步数据',
      sync: '同步',
      syncing: '同步中...',
      syncSuccess: '数据同步成功！',
      syncFailed: '同步数据失败',
      syncingPolymarket: '正在同步 Polymarket 数据...',
      syncedFound: '同步成功！发现',
      whaleTrades: '笔巨鲸交易',
      lastSync: '上次同步',
      autoEvery: '自动：每2分钟',
      volume: '交易量',
      lastActive: '最后活跃',
      ofWallets: '个钱包',
      
      // Diagnostics Panel
      elizaOSCloudDeploy: 'ElizaOS云部署',
      plugins: '插件',
      freq: '频率',
      entropy: '熵值',
      realtime: '实时',
      connected: '已连接',
      offline: '离线',
      
      // Main Terminal
      pluginsMcpEnabled: '已启用 MCP 插件',
      
      // Plugin Card
      enabled: '已启用',
      on: '开',
      tools: '个工具',
      mcpEndpoint: 'MCP 端点',
      configuration: '配置',
      availableTools: '可用工具',
      
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
      buy: '买入',
      sell: '卖出',
      yes: '是',
      no: '否',
      unknown: '未知',
      nA: '暂无',
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
      messageElizaBAO: 'Nhắn tin cho ElizaBAO...',
      send: 'Gửi',
      online: 'Trực tuyến',
      meetElizaBAO: 'gặp ElizaBAO',
      poweredBy: 'Được hỗ trợ bởi ElizaOS',
      startConversation: 'Bắt đầu cuộc trò chuyện',
      askAbout: 'Hỏi về tiền điện tử, thị trường dự đoán, thời tiết hoặc tạo media',
      generateImage: 'Tạo Hình Ảnh',
      generateVideo: 'Tạo Video',
      thinking: 'Đang suy nghĩ...',
      generatingImage: 'Đang tạo hình ảnh...',
      generatingVideo: 'Đang tạo video...',
      recording: 'Đang ghi âm... Nhấn lại để dừng',
      voiceRecognized: 'Nhận dạng giọng nói thành công!',
      voiceRecognitionFailed: 'Nhận dạng giọng nói thất bại',
      microphoneAccessDenied: 'Quyền truy cập micro bị từ chối',
      imageGenerationFailed: 'Tạo hình ảnh thất bại',
      videoGenerationFailed: 'Tạo video thất bại',
      videoGenerationTime: 'Tạo video có thể mất 30-60 giây...',
      failedToGenerate: 'Tạo thất bại. Vui lòng thử lại.',
      generatedImageFor: 'Đã tạo hình ảnh cho',
      generatedVideoFor: 'Đã tạo video cho',
      connectionFailed: 'Kết nối thất bại',
      failedToGetResponse: 'Không thể nhận phản hồi',
      
      // Navigation
      analytics: 'Phân tích',
      wallets: 'Ví',
      account: 'Tài khoản',
      
      // Whale Tracker
      whaleTracker: 'Theo dõi Cá Voi',
      polymarketWhaleTracker: 'THEO DÕI CÁ VOI POLYMARKET',
      realTimeMonitoring: 'Giám sát thời gian thực các giao dịch lớn trên Polymarket',
      topWallets: 'Ví Hàng Đầu',
      recentActivity: 'Hoạt Động Gần Đây',
      volume7d: 'Khối Lượng 7 Ngày',
      winRate: 'Tỷ Lệ Thắng',
      pnl: 'Lãi/Lỗ',
      whaleLive: 'CÁ_VOI_TRỰC_TIẾP',
      whaleTransactionFeed: 'NGUỒN_GIAO_DỊCH_CÁ_VOI',
      transactions: 'GIAO DỊCH',
      liveFeed: 'NGUỒN TRỰC TIẾP',
      whaleWallets: 'VÍ CÁ VOI',
      noWhaleWallets: 'Chưa theo dõi ví cá voi nào.',
      noWhaleTransactions: 'Không có giao dịch cá voi. Nhấn ĐỒNG BỘ để lấy dữ liệu.',
      loadingWhaleData: 'Đang tải dữ liệu cá voi...',
      syncData: 'ĐỒNG BỘ DỮ LIỆU',
      sync: 'ĐỒNG BỘ',
      syncing: 'ĐANG ĐỒNG BỘ...',
      syncSuccess: 'Đồng bộ dữ liệu thành công!',
      syncFailed: 'Đồng bộ dữ liệu thất bại',
      syncingPolymarket: 'Đang đồng bộ dữ liệu Polymarket...',
      syncedFound: 'Đã đồng bộ! Tìm thấy',
      whaleTrades: 'giao dịch cá voi',
      lastSync: 'Đồng bộ lần cuối',
      autoEvery: 'Tự động: mỗi 2 phút',
      volume: 'Khối lượng',
      lastActive: 'Hoạt động lần cuối',
      ofWallets: 'ví',
      
      // Diagnostics Panel
      elizaOSCloudDeploy: 'Triển khai ElizaOS Cloud',
      plugins: 'Plugin',
      freq: 'TẦN SỐ',
      entropy: 'ENTROPY',
      realtime: 'THỜI GIAN THỰC',
      connected: 'ĐÃ KẾT NỐI',
      offline: 'NGOẠI TUYẾN',
      
      // Main Terminal
      pluginsMcpEnabled: 'Plugin MCP Đã Bật',
      
      // Plugin Card
      enabled: 'Đã bật',
      on: 'BẬT',
      tools: 'công cụ',
      mcpEndpoint: 'Điểm cuối MCP',
      configuration: 'Cấu hình',
      availableTools: 'Công cụ có sẵn',
      
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
      buy: 'MUA',
      sell: 'BÁN',
      yes: 'CÓ',
      no: 'KHÔNG',
      unknown: 'Không rõ',
      nA: 'N/A',
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
      messageElizaBAO: 'ส่งข้อความถึง ElizaBAO...',
      send: 'ส่ง',
      online: 'ออนไลน์',
      meetElizaBAO: 'พบ ElizaBAO',
      poweredBy: 'ขับเคลื่อนโดย ElizaOS',
      startConversation: 'เริ่มการสนทนา',
      askAbout: 'ถามเกี่ยวกับคริปโต ตลาดพยากรณ์ สภาพอากาศ หรือสร้างสื่อ',
      generateImage: 'สร้างรูปภาพ',
      generateVideo: 'สร้างวิดีโอ',
      thinking: 'กำลังคิด...',
      generatingImage: 'กำลังสร้างรูปภาพ...',
      generatingVideo: 'กำลังสร้างวิดีโอ...',
      recording: 'กำลังบันทึก... คลิกอีกครั้งเพื่อหยุด',
      voiceRecognized: 'รู้จำเสียงสำเร็จ!',
      voiceRecognitionFailed: 'รู้จำเสียงล้มเหลว',
      microphoneAccessDenied: 'การเข้าถึงไมโครโฟนถูกปฏิเสธ',
      imageGenerationFailed: 'สร้างรูปภาพล้มเหลว',
      videoGenerationFailed: 'สร้างวิดีโอล้มเหลว',
      videoGenerationTime: 'การสร้างวิดีโออาจใช้เวลา 30-60 วินาที...',
      failedToGenerate: 'สร้างล้มเหลว กรุณาลองอีกครั้ง',
      generatedImageFor: 'สร้างรูปภาพสำหรับ',
      generatedVideoFor: 'สร้างวิดีโอสำหรับ',
      connectionFailed: 'การเชื่อมต่อล้มเหลว',
      failedToGetResponse: 'ไม่สามารถรับการตอบสนอง',
      
      // Navigation
      analytics: 'การวิเคราะห์',
      wallets: 'กระเป๋า',
      account: 'บัญชี',
      
      // Whale Tracker
      whaleTracker: 'ติดตามปลาวาฬ',
      polymarketWhaleTracker: 'ติดตามปลาวาฬ POLYMARKET',
      realTimeMonitoring: 'ตรวจสอบการซื้อขายขนาดใหญ่บน Polymarket แบบเรียลไทม์',
      topWallets: 'กระเป๋าชั้นนำ',
      recentActivity: 'กิจกรรมล่าสุด',
      volume7d: 'ปริมาณ 7 วัน',
      winRate: 'อัตราชนะ',
      pnl: 'กำไร/ขาดทุน',
      whaleLive: 'ปลาวาฬ_สด',
      whaleTransactionFeed: 'ฟีด_ธุรกรรม_ปลาวาฬ',
      transactions: 'ธุรกรรม',
      liveFeed: 'ฟีดสด',
      whaleWallets: 'กระเป๋าปลาวาฬ',
      noWhaleWallets: 'ยังไม่มีกระเป๋าปลาวาฬที่ติดตาม',
      noWhaleTransactions: 'ไม่มีธุรกรรมปลาวาฬ คลิก ซิงค์ เพื่อดึงข้อมูล',
      loadingWhaleData: 'กำลังโหลดข้อมูลปลาวาฬ...',
      syncData: 'ซิงค์ข้อมูล',
      sync: 'ซิงค์',
      syncing: 'กำลังซิงค์...',
      syncSuccess: 'ซิงค์ข้อมูลสำเร็จ!',
      syncFailed: 'ซิงค์ข้อมูลล้มเหลว',
      syncingPolymarket: 'กำลังซิงค์ข้อมูล Polymarket...',
      syncedFound: 'ซิงค์แล้ว! พบ',
      whaleTrades: 'การซื้อขายปลาวาฬ',
      lastSync: 'ซิงค์ล่าสุด',
      autoEvery: 'อัตโนมัติ: ทุก 2 นาที',
      volume: 'ปริมาณ',
      lastActive: 'ใช้งานล่าสุด',
      ofWallets: 'กระเป๋า',
      
      // Diagnostics Panel
      elizaOSCloudDeploy: 'การปรับใช้ ElizaOS Cloud',
      plugins: 'ปลั๊กอิน',
      freq: 'ความถี่',
      entropy: 'เอนโทรปี',
      realtime: 'เรียลไทม์',
      connected: 'เชื่อมต่อแล้ว',
      offline: 'ออฟไลน์',
      
      // Main Terminal
      pluginsMcpEnabled: 'เปิดใช้งานปลั๊กอิน MCP',
      
      // Plugin Card
      enabled: 'เปิดใช้งาน',
      on: 'เปิด',
      tools: 'เครื่องมือ',
      mcpEndpoint: 'จุดปลาย MCP',
      configuration: 'การกำหนดค่า',
      availableTools: 'เครื่องมือที่มี',
      
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
      buy: 'ซื้อ',
      sell: 'ขาย',
      yes: 'ใช่',
      no: 'ไม่',
      unknown: 'ไม่ทราบ',
      nA: 'ไม่มี',
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
