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
      whaleWalletsCount: 'WHALE_WALLETS',
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
      volumeLabel: 'VOLUME',
      lastActive: 'Last Active',
      ofWallets: 'wallets',
      whaleAnalyticsDashboard: '🐋 WHALE_ANALYTICS_DASHBOARD',
      volume24h: '24H_VOLUME',
      txs: 'TXS',
      whales: 'WHALES',
      avg: 'AVG',
      buyPressure: 'BUY_PRESSURE',
      sellPressure: 'SELL_PRESSURE',
      yesOutcome: 'YES_OUTCOME',
      noOutcome: 'NO_OUTCOME',
      largestBuy: 'LARGEST_BUY',
      largestSell: 'LARGEST_SELL',
      addressCopied: 'Address copied!',
      transparencyHistory: 'Transparency / History',
      
      // Whale Detail Modal
      totalVolume: 'TOTAL_VOLUME',
      tradeCount: 'TRADE_COUNT',
      avgTrade: 'AVG_TRADE',
      tradingBehaviorAnalysis: 'TRADING_BEHAVIOR_ANALYSIS',
      buyVsSell: 'Buy vs Sell',
      yesVsNo: 'YES vs NO',
      firstActive: 'First Active',
      preferredMarkets: 'PREFERRED_MARKETS',
      top: 'Top',
      trades: 'trades',
      avgLabel: 'Avg',
      recentTransactions: 'RECENT_TRANSACTIONS',
      noTradingRecords: 'No trading records',
      unableToLoadData: 'Unable to load data',
      
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
      comingSoon: 'Coming Soon',
      
      // Plugin Card
      enabled: 'Enabled',
      on: 'ON',
      tools: 'tools',
      mcpEndpoint: 'MCP Endpoint',
      configuration: 'Configuration',
      availableTools: 'Available Tools',
      
      // Plugin Titles & Descriptions
      pluginCryptoPrices: 'Crypto Prices',
      pluginCryptoPricesDesc: 'Real-time cryptocurrency price data from major exchanges. Get current prices, 24h changes, market cap, and volume for thousands of cryptocurrencies.',
      pluginCryptoPricesPricing: 'Free tier available',
      
      pluginTimeTimezone: 'Time & Timezone',
      pluginTimeTimezoneDesc: 'Get current time, convert between timezones, and perform date calculations. Perfect for scheduling and time-aware agents.',
      pluginTimeTimezonePricing: 'Free to use',
      
      pluginElizaOSPlatform: 'ElizaOS Platform',
      pluginElizaOSPlatformDesc: 'Access ElizaOS platform features: credits, usage, generations, conversations, and agent management via MCP.',
      pluginElizaOSPlatformPricing: 'Uses your credit balance (requires authentication)',
      
      pluginPolymarket: 'Polymarket',
      pluginPolymarketDesc: 'Full Polymarket prediction market integration. Access markets, order books, price history, trade events, and place orders via CLOB API.',
      pluginPolymarketPricing: 'Requires CLOB_API_URL environment variable',
      
      // Header & Links
      polymarket: 'POLYMARKET',
      viewOnPolymarket: 'View on Polymarket',
      
      pluginWeatherData: 'Weather Data',
      pluginWeatherDataDesc: 'Current weather conditions and forecasts for locations worldwide. Temperature, humidity, wind, and more.',
      pluginWeatherDataPricing: 'Free to use',
      
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
      
      // Markets Explorer
      marketsExplorer: 'Markets Explorer',
      marketsExplorerDesc: 'Browse all Polymarket prediction markets in real-time',
      marketsExplorerShort: 'Prediction Markets',
      searchMarkets: 'Search markets...',
      totalMarkets: 'Total Markets',
      activeMarkets: 'Active Markets',
      loadingMarkets: 'Loading markets...',
      noMarketsFound: 'No markets found',
      refresh: 'Refresh',
      all: 'All',
      active: 'Active',
      closed: 'Closed',
      status: 'Status',
      endDate: 'End Date',
      minOrderSize: 'Min Order Size',
      description: 'Description',
      back: 'Back',
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
      whaleWalletsCount: '巨鲸钱包',
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
      volumeLabel: '交易量',
      lastActive: '最后活跃',
      ofWallets: '个钱包',
      whaleAnalyticsDashboard: '🐋 巨鲸分析仪表盘',
      volume24h: '24小时交易量',
      txs: '交易数',
      whales: '巨鲸数',
      avg: '平均值',
      buyPressure: '买入压力',
      sellPressure: '卖出压力',
      yesOutcome: 'YES结果',
      noOutcome: 'NO结果',
      largestBuy: '最大买入',
      largestSell: '最大卖出',
      addressCopied: '地址已复制！',
      transparencyHistory: '透明度 / 历史',
      
      // Whale Detail Modal
      totalVolume: '总交易量',
      tradeCount: '交易次数',
      avgTrade: '平均交易',
      tradingBehaviorAnalysis: '交易行为分析',
      buyVsSell: '买入 vs 卖出',
      yesVsNo: 'YES vs NO',
      firstActive: '首次活跃',
      preferredMarkets: '常用市场',
      top: '前',
      trades: '笔交易',
      avgLabel: '平均',
      recentTransactions: '最近交易',
      noTradingRecords: '暂无交易记录',
      unableToLoadData: '无法加载数据',
      
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
      comingSoon: '即将推出',
      
      // Plugin Card
      enabled: '已启用',
      on: '开',
      tools: '个工具',
      mcpEndpoint: 'MCP 端点',
      configuration: '配置',
      availableTools: '可用工具',
      
      // Plugin Titles & Descriptions
      pluginCryptoPrices: '加密货币价格',
      pluginCryptoPricesDesc: '来自主要交易所的实时加密货币价格数据。获取数千种加密货币的当前价格、24小时变化、市值和交易量。',
      pluginCryptoPricesPricing: '免费版可用',
      
      pluginTimeTimezone: '时间与时区',
      pluginTimeTimezoneDesc: '获取当前时间、在时区之间转换以及执行日期计算。非常适合调度和时间感知代理。',
      pluginTimeTimezonePricing: '免费使用',
      
      pluginElizaOSPlatform: 'ElizaOS 平台',
      pluginElizaOSPlatformDesc: '访问 ElizaOS 平台功能：积分、使用量、生成、对话和代理管理通过 MCP。',
      pluginElizaOSPlatformPricing: '使用您的积分余额（需要认证）',
      
      pluginPolymarket: '预测市场',
      pluginPolymarketDesc: '完整的 Polymarket 预测市场集成。通过 CLOB API 访问市场、订单簿、价格历史、交易事件和下单。',
      pluginPolymarketPricing: '需要 CLOB_API_URL 环境变量',
      
      // Header & Links
      polymarket: '预测市场',
      viewOnPolymarket: '在预测市场查看',
      
      pluginWeatherData: '天气数据',
      pluginWeatherDataDesc: '全球各地的当前天气状况和预报。温度、湿度、风力等。',
      pluginWeatherDataPricing: '免费使用',
      
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
      
      // Markets Explorer
      marketsExplorer: '市场浏览器',
      marketsExplorerDesc: '实时浏览所有 Polymarket 预测市场',
      marketsExplorerShort: '预测市场',
      searchMarkets: '搜索市场...',
      totalMarkets: '市场总数',
      activeMarkets: '活跃市场',
      loadingMarkets: '加载市场中...',
      noMarketsFound: '未找到市场',
      refresh: '刷新',
      all: '全部',
      active: '活跃',
      closed: '已结束',
      status: '状态',
      endDate: '结束日期',
      minOrderSize: '最小订单',
      description: '描述',
      back: '返回',
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
      whaleWalletsCount: 'VÍ_CÁ_VOI',
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
      volumeLabel: 'KHỐI_LƯỢNG',
      lastActive: 'Hoạt động lần cuối',
      ofWallets: 'ví',
      whaleAnalyticsDashboard: '🐋 BẢNG_PHÂN_TÍCH_CÁ_VOI',
      volume24h: 'KHỐI_LƯỢNG_24H',
      txs: 'GD',
      whales: 'CÁ_VOI',
      avg: 'TB',
      buyPressure: 'ÁP_LỰC_MUA',
      sellPressure: 'ÁP_LỰC_BÁN',
      yesOutcome: 'KẾT_QUẢ_CÓ',
      noOutcome: 'KẾT_QUẢ_KHÔNG',
      largestBuy: 'MUA_LỚN_NHẤT',
      largestSell: 'BÁN_LỚN_NHẤT',
      addressCopied: 'Đã sao chép địa chỉ!',
      transparencyHistory: 'Minh bạch / Lịch sử',
      
      // Whale Detail Modal
      totalVolume: 'TỔNG_KHỐI_LƯỢNG',
      tradeCount: 'SỐ_GIAO_DỊCH',
      avgTrade: 'GIAO_DỊCH_TB',
      tradingBehaviorAnalysis: 'PHÂN_TÍCH_HÀNH_VI_GIAO_DỊCH',
      buyVsSell: 'Mua vs Bán',
      yesVsNo: 'CÓ vs KHÔNG',
      firstActive: 'Hoạt động đầu tiên',
      preferredMarkets: 'THỊ_TRƯỜNG_ƯA_THÍCH',
      top: 'Top',
      trades: 'giao dịch',
      avgLabel: 'TB',
      recentTransactions: 'GIAO_DỊCH_GẦN_ĐÂY',
      noTradingRecords: 'Không có bản ghi giao dịch',
      unableToLoadData: 'Không thể tải dữ liệu',
      
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
      comingSoon: 'Sắp ra mắt',
      
      // Plugin Card
      enabled: 'Đã bật',
      on: 'BẬT',
      tools: 'công cụ',
      mcpEndpoint: 'Điểm cuối MCP',
      configuration: 'Cấu hình',
      availableTools: 'Công cụ có sẵn',
      
      // Plugin Titles & Descriptions
      pluginCryptoPrices: 'Giá Tiền Điện Tử',
      pluginCryptoPricesDesc: 'Dữ liệu giá tiền điện tử thời gian thực từ các sàn giao dịch lớn. Lấy giá hiện tại, thay đổi 24h, vốn hóa thị trường và khối lượng cho hàng nghìn loại tiền điện tử.',
      pluginCryptoPricesPricing: 'Có bản miễn phí',
      
      pluginTimeTimezone: 'Thời Gian & Múi Giờ',
      pluginTimeTimezoneDesc: 'Lấy thời gian hiện tại, chuyển đổi giữa các múi giờ và thực hiện tính toán ngày. Hoàn hảo cho lên lịch và các agent nhận biết thời gian.',
      pluginTimeTimezonePricing: 'Miễn phí sử dụng',
      
      pluginElizaOSPlatform: 'Nền Tảng ElizaOS',
      pluginElizaOSPlatformDesc: 'Truy cập các tính năng nền tảng ElizaOS: tín dụng, sử dụng, tạo nội dung, hội thoại và quản lý agent qua MCP.',
      pluginElizaOSPlatformPricing: 'Sử dụng số dư tín dụng của bạn (yêu cầu xác thực)',
      
      pluginPolymarket: 'Thị Trường Dự Đoán',
      pluginPolymarketDesc: 'Tích hợp đầy đủ thị trường dự đoán Polymarket. Truy cập thị trường, sổ lệnh, lịch sử giá, sự kiện giao dịch và đặt lệnh qua CLOB API.',
      pluginPolymarketPricing: 'Yêu cầu biến môi trường CLOB_API_URL',
      
      // Header & Links
      polymarket: 'THỊ TRƯỜNG DỰ ĐOÁN',
      viewOnPolymarket: 'Xem trên Polymarket',
      
      pluginWeatherData: 'Dữ Liệu Thời Tiết',
      pluginWeatherDataDesc: 'Điều kiện thời tiết hiện tại và dự báo cho các địa điểm trên toàn thế giới. Nhiệt độ, độ ẩm, gió và nhiều hơn nữa.',
      pluginWeatherDataPricing: 'Miễn phí sử dụng',
      
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
      
      // Markets Explorer
      marketsExplorer: 'Khám Phá Thị Trường',
      marketsExplorerDesc: 'Duyệt tất cả thị trường dự đoán Polymarket theo thời gian thực',
      marketsExplorerShort: 'Thị Trường Dự Đoán',
      searchMarkets: 'Tìm kiếm thị trường...',
      totalMarkets: 'Tổng Thị Trường',
      activeMarkets: 'Thị Trường Hoạt Động',
      loadingMarkets: 'Đang tải thị trường...',
      noMarketsFound: 'Không tìm thấy thị trường',
      refresh: 'Làm mới',
      all: 'Tất cả',
      active: 'Hoạt động',
      closed: 'Đã đóng',
      status: 'Trạng thái',
      endDate: 'Ngày kết thúc',
      minOrderSize: 'Đơn hàng tối thiểu',
      description: 'Mô tả',
      back: 'Quay lại',
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
      whaleWalletsCount: 'กระเป๋า_ปลาวาฬ',
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
      volumeLabel: 'ปริมาณ',
      lastActive: 'ใช้งานล่าสุด',
      ofWallets: 'กระเป๋า',
      whaleAnalyticsDashboard: '🐋 แดชบอร์ดวิเคราะห์ปลาวาฬ',
      volume24h: 'ปริมาณ_24ชม',
      txs: 'ธุรกรรม',
      whales: 'ปลาวาฬ',
      avg: 'เฉลี่ย',
      buyPressure: 'แรงซื้อ',
      sellPressure: 'แรงขาย',
      yesOutcome: 'ผลลัพธ์_ใช่',
      noOutcome: 'ผลลัพธ์_ไม่',
      largestBuy: 'การซื้อใหญ่สุด',
      largestSell: 'การขายใหญ่สุด',
      addressCopied: 'คัดลอกที่อยู่แล้ว!',
      transparencyHistory: 'ความโปร่งใส / ประวัติ',
      
      // Whale Detail Modal
      totalVolume: 'ปริมาณรวม',
      tradeCount: 'จำนวนการซื้อขาย',
      avgTrade: 'การซื้อขายเฉลี่ย',
      tradingBehaviorAnalysis: 'การวิเคราะห์พฤติกรรมการซื้อขาย',
      buyVsSell: 'ซื้อ vs ขาย',
      yesVsNo: 'ใช่ vs ไม่',
      firstActive: 'เปิดใช้งานครั้งแรก',
      preferredMarkets: 'ตลาดที่ชื่นชอบ',
      top: 'ท็อป',
      trades: 'การซื้อขาย',
      avgLabel: 'เฉลี่ย',
      recentTransactions: 'การทำธุรกรรมล่าสุด',
      noTradingRecords: 'ไม่มีบันทึกการซื้อขาย',
      unableToLoadData: 'ไม่สามารถโหลดข้อมูลได้',
      
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
      comingSoon: 'เร็วๆ นี้',
      
      // Plugin Card
      enabled: 'เปิดใช้งาน',
      on: 'เปิด',
      tools: 'เครื่องมือ',
      mcpEndpoint: 'จุดปลาย MCP',
      configuration: 'การกำหนดค่า',
      availableTools: 'เครื่องมือที่มี',
      
      // Plugin Titles & Descriptions
      pluginCryptoPrices: 'ราคาคริปโต',
      pluginCryptoPricesDesc: 'ข้อมูลราคาคริปโตเรียลไทม์จากตลาดหลัก รับราคาปัจจุบัน การเปลี่ยนแปลง 24 ชม. มูลค่าตลาด และปริมาณสำหรับคริปโตหลายพันสกุล',
      pluginCryptoPricesPricing: 'มีแพ็คเกจฟรี',
      
      pluginTimeTimezone: 'เวลา & โซนเวลา',
      pluginTimeTimezoneDesc: 'รับเวลาปัจจุบัน แปลงระหว่างโซนเวลา และคำนวณวันที่ เหมาะสำหรับการตั้งเวลาและ agent ที่รับรู้เวลา',
      pluginTimeTimezonePricing: 'ใช้ฟรี',
      
      pluginElizaOSPlatform: 'แพลตฟอร์ม ElizaOS',
      pluginElizaOSPlatformDesc: 'เข้าถึงฟีเจอร์แพลตฟอร์ม ElizaOS: เครดิต การใช้งาน การสร้าง การสนทนา และจัดการ agent ผ่าน MCP',
      pluginElizaOSPlatformPricing: 'ใช้ยอดเครดิตของคุณ (ต้องยืนยันตัวตน)',
      
      pluginPolymarket: 'ตลาดพยากรณ์',
      pluginPolymarketDesc: 'การผสานรวมตลาดพยากรณ์ Polymarket แบบเต็ม เข้าถึงตลาด สมุดคำสั่ง ประวัติราคา เหตุการณ์การซื้อขาย และวางคำสั่งผ่าน CLOB API',
      pluginPolymarketPricing: 'ต้องการตัวแปร CLOB_API_URL',
      
      // Header & Links
      polymarket: 'ตลาดพยากรณ์',
      viewOnPolymarket: 'ดูบน Polymarket',
      
      pluginWeatherData: 'ข้อมูลสภาพอากาศ',
      pluginWeatherDataDesc: 'สภาพอากาศปัจจุบันและพยากรณ์สำหรับสถานที่ทั่วโลก อุณหภูมิ ความชื้น ลม และอื่นๆ',
      pluginWeatherDataPricing: 'ใช้ฟรี',
      
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
      
      // Markets Explorer
      marketsExplorer: 'สำรวจตลาด',
      marketsExplorerDesc: 'เรียกดูตลาดพยากรณ์ Polymarket ทั้งหมดแบบเรียลไทม์',
      marketsExplorerShort: 'ตลาดพยากรณ์',
      searchMarkets: 'ค้นหาตลาด...',
      totalMarkets: 'ตลาดทั้งหมด',
      activeMarkets: 'ตลาดที่ใช้งาน',
      loadingMarkets: 'กำลังโหลดตลาด...',
      noMarketsFound: 'ไม่พบตลาด',
      refresh: 'รีเฟรช',
      all: 'ทั้งหมด',
      active: 'ใช้งาน',
      closed: 'ปิด',
      status: 'สถานะ',
      endDate: 'วันสิ้นสุด',
      minOrderSize: 'ขนาดคำสั่งขั้นต่ำ',
      description: 'คำอธิบาย',
      back: 'กลับ',
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
