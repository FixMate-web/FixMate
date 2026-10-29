export type AppLanguage = 'ar' | 'en';
export type TextDirection = 'rtl' | 'ltr';

export interface UiDictionary {
  brandName: string;
  brandTagline: string;
  skipToContent: string;
  languageSwitchLabel: string;
  languageCurrentName: string;
  directionBadge: string;
  nav: {
    home: string;
    services: string;
    providers: string;
    about: string;
    faq: string;
    contact: string;
    uiShowcase: string;
    login: string;
    register: string;
    dashboard: string;
    myProfile: string;
    logout: string;
    menuToggle: string;
  };
  apiStatus: {
    label: string;
    checking: string;
    connected: string;
    degraded: string;
    offline: string;
    refresh: string;
    offlineHint: string;
  };
  home: {
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    searchButton: string;
    exploreServicesCta: string;
    browseProvidersCta: string;
    becomeProviderCta: string;
    viewDashboardsCta: string;
    phase1NoticeTitle: string;
    phase1NoticeBody: string;
    howItWorksTitle: string;
    howStep1Title: string;
    howStep1Desc: string;
    howStep2Title: string;
    howStep2Desc: string;
    howStep3Title: string;
    howStep3Desc: string;
    taxonomyTitle: string;
    taxonomySubtitle: string;
    pricingNote: string;
    trustTitle: string;
    trustDesc: string;
    faqPreviewTitle: string;
    faqPreviewLink: string;
    architectureCardTitle: string;
    architectureCardSubtitle: string;
  };
  categories: {
    plumbing: { name: string; desc: string };
    electrical: { name: string; desc: string };
    ac: { name: string; desc: string };
    cleaning: { name: string; desc: string };
    painting: { name: string; desc: string };
    carpentry: { name: string; desc: string };
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    emailLabel: string;
    passwordLabel: string;
    showPassword: string;
    hidePassword: string;
    fullNameLabel: string;
    roleLabel: string;
    roleCustomer: string;
    roleProvider: string;
    phoneLabel: string;
    languagePrefLabel: string;
    loginSubmit: string;
    registerSubmit: string;
    profileTitle: string;
    profileSubtitle: string;
    saveProfile: string;
    profileSaved: string;
    noAccountPrompt: string;
    haveAccountPrompt: string;
    backToPublic: string;
  };
  catalog: {
    servicesTitle: string;
    servicesSubtitle: string;
    searchLabel: string;
    searchPlaceholder: string;
    categoryFilterLabel: string;
    allCategories: string;
    pricingTypeFilterLabel: string;
    allPricingTypes: string;
    sortLabel: string;
    sortDefault: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortTitleAsc: string;
    emptyServicesTitle: string;
    emptyServicesDesc: string;
    viewServiceDetails: string;
    findProvidersForService: string;
    pricingFixed: string;
    pricingStartingAt: string;
    pricingInspectionOnly: string;
    durationMinutesLabel: string;
    phase3BookingNotice: string;
    adminCatalogTitle: string;
    adminCatalogSubtitle: string;
  };
  providers: {
    directoryTitle: string;
    directorySubtitle: string;
    searchLabel: string;
    searchPlaceholder: string;
    serviceFilterLabel: string;
    allServices: string;
    governorateFilterLabel: string;
    allGovernorates: string;
    cityFilterLabel: string;
    sortLabel: string;
    sortNewest: string;
    sortNameAsc: string;
    sortExperienceDesc: string;
    approvedListingBadge: string;
    noReviewsYet: string;
    yearsExperienceLabel: string;
    coverageLabel: string;
    viewProfile: string;
    emptyProvidersTitle: string;
    emptyProvidersDesc: string;
    bookingPhase3DisabledCta: string;
    bookingPhase3Notice: string;
    onboardingTitle: string;
    onboardingSubtitle: string;
    adminApprovalQueueTitle: string;
  };
  pages: {
    aboutTitle: string;
    aboutSubtitle: string;
    faqTitle: string;
    faqSubtitle: string;
    contactTitle: string;
    contactSubtitle: string;
    termsDraftNotice: string;
    notFoundTitle: string;
    notFoundDesc: string;
    returnHome: string;
  };
  shells: {
    notImplementedBadge: string;
    servicesTitle: string;
    servicesDesc: string;
    providersTitle: string;
    providersDesc: string;
    providersEmptyTitle: string;
    providersEmptyDesc: string;
    aboutTitle: string;
    aboutDesc: string;
    authBannerTitle: string;
    authBannerBody: string;
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    emailLabel: string;
    passwordLabel: string;
    fullNameLabel: string;
    roleLabel: string;
    roleCustomer: string;
    roleProvider: string;
    phoneLabel: string;
    submitDisabledPhase2: string;
    backToPublic: string;
    dashboardBannerTitle: string;
    dashboardBannerBody: string;
    customerWorkspace: string;
    providerWorkspace: string;
    adminWorkspace: string;
    dashboardEmptyTitle: string;
    dashboardEmptyDesc: string;
    notFoundTitle: string;
    notFoundDesc: string;
    returnHome: string;
  };
  footer: {
    marketInfo: string;
    copyright: string;
    scopeNote: string;
  };
}

export const TRANSLATIONS: Record<AppLanguage, UiDictionary> = {
  ar: {
    brandName: 'فيكس ميت | FixMate',
    brandTagline: 'منصة خدمات الصيانة المنزلية الموثوقة في الأردن',
    skipToContent: 'تخطي إلى المحتوى الرئيسي',
    languageSwitchLabel: 'English',
    languageCurrentName: 'العربية',
    directionBadge: 'RTL · العربية',
    nav: {
      home: 'الرئيسية',
      services: 'الخدمات',
      providers: 'مزودو الخدمة',
      about: 'عن المنصة',
      faq: 'الأسئلة الشائعة',
      contact: 'تواصل معنا',
      uiShowcase: 'مكونات التصميم',
      login: 'تسجيل الدخول',
      register: 'حساب جديد',
      dashboard: 'لوحة التحكم',
      myProfile: 'حسابي',
      logout: 'تسجيل الخروج',
      menuToggle: 'القائمة',
    },
    apiStatus: {
      label: 'حالة الخادم:',
      checking: 'جارٍ الفحص...',
      connected: 'متصل (API + MongoDB)',
      degraded: 'متصل جزئياً (قاعدة البيانات غير متصلة)',
      offline: 'الخادم غير متصل (وضع الواجهة المستقل)',
      refresh: 'تحديث الحالة',
      offlineHint:
        'الواجهة تعمل بشكل طبيعي حتى في حال عدم تشغيل الخادم الخلفي. شغّل الخادم على المنفذ 3000 للتحقق من نقطة الفحص.',
    },
    home: {
      heroBadge: 'منصة الصيانة المنزلية ثنائية اللغة في الأردن',
      heroTitle: 'صيانة منزلية احترافية بشفافية كاملة في الأردن',
      heroSubtitle:
        'تربط منصة FixMate أصحاب المنازل بفنيين مدرجين ومعتمدين من الإدارة في مجالات السباكة، الكهرباء، التكييف، التنظيف، الدهان، والنجارة — مع تسعير واضح بالدينار الأردني (فلس) وجدولة دقيقة بتوقيت عمّان.',
      searchPlaceholder: 'ابحث عن خدمة صيانة (مثال: سباكة، تكييف، كهرباء)...',
      searchButton: 'بحث في الخدمات',
      exploreServicesCta: 'تصفح جميع الخدمات',
      browseProvidersCta: 'المساعدة المناسبة لبيتك',
      becomeProviderCta: 'انضم كمزود خدمة صيانة',
      viewDashboardsCta: 'لوحة التحكم والحساب',
      phase1NoticeTitle: 'المرحلة ٢ قيد التشغيل — المصادقة والكتالوج ودليل المزودين المعتمدين',
      phase1NoticeBody:
        'تعمل الآن المصادقة الحقيقية وإدارة الكتالوج ومراجعة المزودين. سيتم تفعيل إرسال طلبات الحجز وجدولة المواعيد في المرحلة ٣ (Phase 3).',
      howItWorksTitle: 'كيف تعمل منصة FixMate؟',
      howStep1Title: '١. اختر الخدمة المناسبة',
      howStep1Desc:
        'تصفح كتالوج الخدمات المعتمد واطّلع على سياسة التسعير الاسترشادية بالدينار الأردني (فلس).',
      howStep2Title: '٢. قارن بين المزودين المعتمدين',
      howStep2Desc:
        'يظهر في الدليل العام فقط المزودون الذين راجعتهم الإدارة ووافقت على إدراجهم (APPROVED).',
      howStep3Title: '٣. الحجز والجدولة (المرحلة ٣)',
      howStep3Desc: 'اختر الموعد بتوقيت عمّان؛ لا يتم حجز السعة إلا بعد قبول المزود للطلب رسمياً.',
      taxonomyTitle: 'التصنيفات الأساسية للخدمات',
      taxonomySubtitle: 'ستة قطاعات صيانة منزلية مصممة للسوق الأردني',
      pricingNote: 'يتم تمثيل الأسعار كوحدات صحيحة بالـ فلس (1 دينار أردني = 1000 فلس).',
      trustTitle: 'شفافية التسعير ومراجعة الإدراج',
      trustDesc:
        'لا توجد رسوم خفية أو بوابات دفع إلكتروني إجبارية في الإصدار الأول. يتم الاتفاق والتسوية مباشرة وفق سياسة الخدمة المعلنة.',
      faqPreviewTitle: 'لديك استفسار حول آلية العمل؟',
      faqPreviewLink: 'اقرأ الأسئلة الشائعة كاملة',
      architectureCardTitle: 'حالة الاتصال بالخادم (GET /api/v1/health)',
      architectureCardSubtitle: 'اتصال مباشر عبر Angular HttpClient',
    },
    categories: {
      plumbing: {
        name: 'السباكة وتمديدات المياه',
        desc: 'إصلاح التسربات، صيانة سخانات المياه، وتركيب الأدوات الصحية.',
      },
      electrical: {
        name: 'الأعطال الكهربائية',
        desc: 'فحص القواطع، تبديل المفاتيح والمقابس، وتركيب وحدات الإنارة.',
      },
      ac: {
        name: 'صيانة التكييف والتبريد',
        desc: 'تنظيف وحدات التكييف، فحص غاز التبريد، والصيانة الموسمية.',
      },
      cleaning: {
        name: 'التنظيف المنزلي العميق',
        desc: 'تنظيف شامل للمنازل، تعقيم المطابخ، وتنظيف خزانات المياه.',
      },
      painting: {
        name: 'الدهان ومعالجة الجدران',
        desc: 'دهان داخلي، معالجة الرطوبة والتشققات، والتشطيبات الديكورية.',
      },
      carpentry: {
        name: 'النجارة وصيانة الأبواب',
        desc: 'معايرة الأبواب والأقفال، إصلاح الخزائن، وتركيب الأثاث الخشبي.',
      },
    },
    auth: {
      loginTitle: 'تسجيل الدخول إلى FixMate',
      loginSubtitle: 'أدخل بريدك الإلكتروني وكلمة المرور للوصول إلى حسابك',
      registerTitle: 'إنشاء حساب جديد',
      registerSubtitle: 'سجّل كعميل لطلب خدمات الصيانة أو كمزود خدمة للتقديم في المنصة',
      emailLabel: 'البريد الإلكتروني',
      passwordLabel: 'كلمة المرور',
      showPassword: 'إظهار كلمة المرور',
      hidePassword: 'إخفاء كلمة المرور',
      fullNameLabel: 'الاسم الكامل',
      roleLabel: 'نوع الحساب',
      roleCustomer: 'عميل (صاحب منزل / طالب خدمة)',
      roleProvider: 'مزود خدمة (فني صيانة)',
      phoneLabel: 'رقم الهاتف الأردني',
      languagePrefLabel: 'اللغة المفضلة',
      loginSubmit: 'تسجيل الدخول',
      registerSubmit: 'إنشاء الحساب',
      profileTitle: 'الملف الشخصي وإعدادات الحساب',
      profileSubtitle: 'إدارة بيانات حسابك الأساسية بأمان',
      saveProfile: 'حفظ التعديلات',
      profileSaved: 'تم تحديث بيانات الملف الشخصي بنجاح.',
      noAccountPrompt: 'ليس لديك حساب؟ أنشئ حساباً جديداً',
      haveAccountPrompt: 'لديك حساب بالفعل؟ سجّل الدخول',
      backToPublic: 'العودة إلى الصفحة الرئيسية',
    },
    catalog: {
      servicesTitle: 'خدمات لكل زاوية في بيتك',
      servicesSubtitle: 'استعرض خدمات الصيانة المتاحة وابحث حسب التصنيف أو الكلمات المفتاحية',
      searchLabel: 'البحث في الخدمات',
      searchPlaceholder: 'ابحث باسم الخدمة أو الوصف...',
      categoryFilterLabel: 'التصنيف',
      allCategories: 'جميع التصنيفات',
      pricingTypeFilterLabel: 'نوع التسعير',
      allPricingTypes: 'جميع أنواع التسعير',
      sortLabel: 'الترتيب حسب',
      sortDefault: 'الافتراضي',
      sortPriceAsc: 'السعر: من الأقل إلى الأعلى',
      sortPriceDesc: 'السعر: من الأعلى إلى الأقل',
      sortTitleAsc: 'الاسم (أ - ي)',
      emptyServicesTitle: 'لا توجد خدمات مطابقة للبحث',
      emptyServicesDesc: 'جرّب تغيير معايير التصفية أو مسح كلمة البحث.',
      viewServiceDetails: 'تفاصيل الخدمة',
      findProvidersForService: 'عرض المزودين المعتمدين لهذه الخدمة',
      pricingFixed: 'سعر ثابت',
      pricingStartingAt: 'يبدأ من',
      pricingInspectionOnly: 'رسوم فحص ومعاينة',
      durationMinutesLabel: 'المدة التقديرية (دقيقة)',
      phase3BookingNotice:
        'الحجز الإلكتروني سيتوفر قريباً. يمكنك الآن تصفح الخدمات ومقارنة ملفات مزودي الخدمة.',
      adminCatalogTitle: 'إدارة التصنيفات والخدمات (للمسؤولين)',
      adminCatalogSubtitle: 'إنشاء وتعديل وأرشفة تصنيفات وخدمات المنصة',
    },
    providers: {
      directoryTitle: 'المساعدة المناسبة لبيتك',
      directorySubtitle:
        'تصفح ملفات الفنيين الذين تمت مراجعة طلباتهم والموافقة على إدراجهم في المنصة',
      searchLabel: 'البحث عن مزود خدمة',
      searchPlaceholder: 'ابحث باسم المزود أو التخصص...',
      serviceFilterLabel: 'الخدمة المطلوبة',
      allServices: 'جميع الخدمات',
      governorateFilterLabel: 'المحافظة',
      allGovernorates: 'جميع المحافظات',
      cityFilterLabel: 'المنطقة / الحي',
      sortLabel: 'الترتيب',
      sortNewest: 'الأحدث اعتماداً',
      sortNameAsc: 'الاسم (أ-ي)',
      sortExperienceDesc: 'الأكثر خبرة',
      approvedListingBadge: 'مدرج ومعتمد في المنصة',
      noReviewsYet: 'لا توجد تقييمات بعد',
      yearsExperienceLabel: 'سنوات الخبرة',
      coverageLabel: 'مناطق التغطية',
      viewProfile: 'عرض الملف المهني',
      emptyProvidersTitle: 'لا يوجد مزودو خدمة معتمدون مطابقون للبحث حالياً',
      emptyProvidersDesc:
        'يظهر هنا فقط المزودون النشطون الحاصلون على موافقة الإدارة (APPROVED). جرّب توسيع نطاق التصفية.',
      bookingPhase3DisabledCta: 'الحجز قريباً',
      bookingPhase3Notice: 'يمكنك استكشاف الخدمات ومزوديها الآن. الحجز الإلكتروني غير متاح بعد.',
      onboardingTitle: 'ملفك المهني',
      onboardingSubtitle: 'استكمل بياناتك المهنية وحدد الخدمات ومناطق التغطية وأرسل طلبك للمراجعة',
      adminApprovalQueueTitle: 'مراجعة واعتماد طلبات مزودي الخدمة (Admin)',
    },
    pages: {
      aboutTitle: 'عن منصة FixMate ومعايير السوق',
      aboutSubtitle: 'منصة أردنية ثنائية اللغة لربط أصحاب المنازل بمزودي خدمات الصيانة المنزلية',
      faqTitle: 'الأسئلة الشائعة',
      faqSubtitle: 'إجابات واضحة حول آلية عمل المنصة، التسعير، والفرق بين طلب الخدمة والحجز المؤكد',
      contactTitle: 'معلومات التواصل والدعم',
      contactSubtitle: 'قنوات التواصل الرسمية وإرشادات الاستخدام في المرحلة الحالية',
      termsDraftNotice: 'مسودة قيد المراجعة القانونية — ليست وثيقة شروط إنتاج نهائية',
      notFoundTitle: 'الصفحة غير موجودة (404)',
      notFoundDesc: 'المسار الذي طلبته غير متوفر في تطبيق FixMate.',
      returnHome: 'العودة للرئيسية',
    },
    shells: {
      notImplementedBadge: 'حسابك في فيكس ميت',
      servicesTitle: 'خدمات لكل زاوية في بيتك',
      servicesDesc: 'تصفح الخدمات المعتمدة في قاعدة البيانات.',
      providersTitle: 'مزودو الخدمة المعتمدون',
      providersDesc: 'يظهر في البحث العام فقط المزودون المعتمدون من الإدارة (APPROVED).',
      providersEmptyTitle: 'لا يوجد مزودون مطابقون حالياً',
      providersEmptyDesc: 'لا نعرض أي حسابات أو تقييمات وهمية.',
      aboutTitle: 'عن منصة FixMate ومعايير السوق',
      aboutDesc:
        'منصة ثنائية اللغة مصممة للسوق الأردني مع حفظ الأوقات بصيغة UTC وعرضها بتوقيت عمّان (Asia/Amman).',
      authBannerTitle: 'بوابة الحسابات الآمنة (Phase 2 Auth)',
      authBannerBody:
        'الجلسات محمية عبر رموز وصول قصيرة الأجل في الذاكرة وملفات تعريف ارتباط HttpOnly مع تدوير الجلسات.',
      loginTitle: 'تسجيل الدخول',
      loginSubtitle: 'تسجيل الدخول لحسابات العملاء ومزودي الخدمة والإدارة',
      registerTitle: 'إنشاء حساب جديد',
      registerSubtitle: 'التسجيل كعميل أو كمزود خدمة صيانة',
      emailLabel: 'البريد الإلكتروني',
      passwordLabel: 'كلمة المرور',
      fullNameLabel: 'الاسم الكامل',
      roleLabel: 'نوع الحساب',
      roleCustomer: 'عميل (طالب خدمة)',
      roleProvider: 'مزود خدمة (فني صيانة)',
      phoneLabel: 'رقم الهاتف الأردني',
      submitDisabledPhase2: 'تسجيل الدخول',
      backToPublic: 'العودة إلى الصفحة الرئيسية',
      dashboardBannerTitle: 'مساحة العمل المحمية (Phase 2 Workspace)',
      dashboardBannerBody:
        'تُفرض صلاحيات الأدوار وملكية الموارد في الخادم الخلفي (NestJS) بالإضافة إلى حراس التوجيه.',
      customerWorkspace: 'مساحة العميل (Customer)',
      providerWorkspace: 'مساحة الفني (Provider)',
      adminWorkspace: 'مساحة الإدارة (Admin)',
      dashboardEmptyTitle: 'الحجوزات وتقييمات ما بعد الخدمة مخصصة للمرحلة ٣',
      dashboardEmptyDesc:
        'يمكنك في المرحلة ٢ إدارة ملفك الشخصي، أو التقديم كمزود خدمة، أو إدارة الكتالوج وطلبات الاعتماد.',
      notFoundTitle: 'الصفحة غير موجودة (404)',
      notFoundDesc: 'المسار الذي طلبته غير متوفر في تطبيق FixMate.',
      returnHome: 'العودة للرئيسية',
    },
    footer: {
      marketInfo: 'المنطقة الزمنية للعرض: Asia/Amman · العملة: دينار أردني (JOD / فلس)',
      copyright: '© 2026 FixMate — المرحلة ٢: المنصة الأساسية',
      scopeNote: 'بدون بوابات دفع إلكتروني أو خرائط خارجية في الإصدار الأول (V1).',
    },
  },
  en: {
    brandName: 'FixMate',
    brandTagline: 'Trusted Home-Maintenance Marketplace in Jordan',
    skipToContent: 'Skip to main content',
    languageSwitchLabel: 'العربية',
    languageCurrentName: 'English',
    directionBadge: 'LTR · English',
    nav: {
      home: 'Home',
      services: 'Services',
      providers: 'Providers',
      about: 'About',
      faq: 'FAQ',
      contact: 'Contact',
      uiShowcase: 'UI Showcase',
      login: 'Sign In',
      register: 'Register',
      dashboard: 'Dashboard',
      myProfile: 'My Profile',
      logout: 'Sign Out',
      menuToggle: 'Menu',
    },
    apiStatus: {
      label: 'Backend Status:',
      checking: 'Checking...',
      connected: 'Connected (API + MongoDB)',
      degraded: 'Degraded (Database Disconnected)',
      offline: 'API Unreachable (Graceful Standalone UI Mode)',
      refresh: 'Refresh Status',
      offlineHint: 'We couldn’t connect right now. Please try again in a moment.',
    },
    home: {
      heroBadge: 'Bilingual Home-Maintenance Marketplace in Jordan',
      heroTitle: 'Dependable Home Maintenance with Clear Expectations in Jordan',
      heroSubtitle:
        'FixMate connects residents with admin-approved technicians across plumbing, electrical repairs, AC maintenance, cleaning, painting, and carpentry — with transparent JOD (fils) pricing and Asia/Amman scheduling.',
      searchPlaceholder: 'Search maintenance services (e.g., plumbing, AC, electrical)...',
      searchButton: 'Search Services',
      exploreServicesCta: 'Browse All Services',
      browseProvidersCta: 'Approved Provider Directory',
      becomeProviderCta: 'Apply as a Service Provider',
      viewDashboardsCta: 'Dashboard & Account',
      phase1NoticeTitle: 'Phase 2 Active — Real Auth, Catalog & Approved Provider Directory',
      phase1NoticeBody:
        'Authentication, service catalog management, and provider approval workflows are live. Booking submission and slot scheduling will be unlocked in Phase 3.',
      howItWorksTitle: 'How FixMate Works',
      howStep1Title: '1. Choose the Right Service',
      howStep1Desc:
        'Browse our curated catalog and inspect transparent indicative pricing in JOD (fils).',
      howStep2Title: '2. Compare Admin-Approved Providers',
      howStep2Desc:
        'Only providers reviewed and approved by FixMate administration (APPROVED) appear in public discovery.',
      howStep3Title: '3. Request & Confirm Bookings (Phase 3)',
      howStep3Desc:
        'Select your preferred Asia/Amman window; capacity is locked only when the provider accepts your request.',
      taxonomyTitle: 'Canonical V1 Service Taxonomy',
      taxonomySubtitle: 'Six core residential maintenance categories tailored for Jordan',
      pricingNote:
        'All monetary amounts are persisted as integer minor units in fils (1 JOD = 1,000 fils).',
      trustTitle: 'Transparent Pricing & Reviewed Listings',
      trustDesc:
        'No hidden online gateway fees in V1. Settlement occurs directly between customer and provider based on transparent service pricing policies.',
      faqPreviewTitle: 'Have Questions About How FixMate Operates?',
      faqPreviewLink: 'Read the Full FAQ',
      architectureCardTitle: 'Live Backend Health Check (GET /api/v1/health)',
      architectureCardSubtitle: 'Real Angular HttpClient call with graceful offline fallback',
    },
    categories: {
      plumbing: {
        name: 'Plumbing & Water Systems',
        desc: 'Leak repairs, water heater maintenance, pipe fitting, and fixture installation.',
      },
      electrical: {
        name: 'Electrical Repairs',
        desc: 'Circuit troubleshooting, switches and sockets, and residential lighting installation.',
      },
      ac: {
        name: 'AC & HVAC Maintenance',
        desc: 'Split and central AC cleaning, filter servicing, and seasonal checks.',
      },
      cleaning: {
        name: 'Deep Residential Cleaning',
        desc: 'Post-maintenance cleanup, kitchen/bathroom sanitization, and water tank cleaning.',
      },
      painting: {
        name: 'Painting & Wall Finishing',
        desc: 'Interior wall painting, dampness treatment, crack repair, and touch-ups.',
      },
      carpentry: {
        name: 'Carpentry & Door Alignment',
        desc: 'Door and lock adjustment, cabinet repair, shelving, and wooden furniture assembly.',
      },
    },
    auth: {
      loginTitle: 'Sign In to FixMate',
      loginSubtitle: 'Enter your email and password to access your account',
      registerTitle: 'Create a FixMate Account',
      registerSubtitle: 'Register as a Customer or start onboarding as a Service Provider',
      emailLabel: 'Email Address',
      passwordLabel: 'Password',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      fullNameLabel: 'Full Name',
      roleLabel: 'Account Role',
      roleCustomer: 'Customer (Resident)',
      roleProvider: 'Service Provider (Maintenance Technician)',
      phoneLabel: 'Jordan Contact Phone',
      languagePrefLabel: 'Preferred Language',
      loginSubmit: 'Sign In',
      registerSubmit: 'Create Account',
      profileTitle: 'Your account',
      profileSubtitle: 'Keep your contact details and language preference up to date.',
      saveProfile: 'Save Changes',
      profileSaved: 'Your profile has been updated successfully.',
      noAccountPrompt: "Don't have an account? Register now",
      haveAccountPrompt: 'Already have an account? Sign in',
      backToPublic: 'Back to Public Home',
    },
    catalog: {
      servicesTitle: 'Care for every corner of your home',
      servicesSubtitle:
        'Explore home services, compare indicative prices, and find your next professional.',
      searchLabel: 'Search Services',
      searchPlaceholder: 'Search by service title or description...',
      categoryFilterLabel: 'Category',
      allCategories: 'All Categories',
      pricingTypeFilterLabel: 'Pricing Type',
      allPricingTypes: 'All Pricing Types',
      sortLabel: 'Sort By',
      sortDefault: 'Default Order',
      sortPriceAsc: 'Price: Low to High',
      sortPriceDesc: 'Price: High to Low',
      sortTitleAsc: 'Title (A - Z)',
      emptyServicesTitle: 'Let’s try a different search',
      emptyServicesDesc: 'Try adjusting your category filter or clearing your search keyword.',
      viewServiceDetails: 'View Service Details',
      findProvidersForService: 'Find Approved Providers for This Service',
      pricingFixed: 'Fixed Price',
      pricingStartingAt: 'Starting At',
      pricingInspectionOnly: 'Inspection Fee',
      durationMinutesLabel: 'Estimated Duration (min)',
      phase3BookingNotice:
        'Online booking is coming soon. You can explore services and compare provider profiles today.',
      adminCatalogTitle: 'Service catalog',
      adminCatalogSubtitle: 'Create, update, and archive marketplace categories and services',
    },
    providers: {
      directoryTitle: 'Find your home’s next helping hand',
      directorySubtitle:
        'Explore reviewed listings and compare experience, services, and coverage.',
      searchLabel: 'Search Providers',
      searchPlaceholder: 'Search by provider name or specialization...',
      serviceFilterLabel: 'Offered Service',
      allServices: 'All Services',
      governorateFilterLabel: 'Governorate',
      allGovernorates: 'All Governorates',
      cityFilterLabel: 'Area / District',
      sortLabel: 'Sort By',
      sortNewest: 'Newest Approved',
      sortNameAsc: 'Name (A-Z)',
      sortExperienceDesc: 'Most Experienced',
      approvedListingBadge: 'Admin-Approved Listing',
      noReviewsYet: 'No reviews yet',
      yearsExperienceLabel: 'Years of Experience',
      coverageLabel: 'Coverage Areas',
      viewProfile: 'View Professional Profile',
      emptyProvidersTitle: 'No Approved Providers Match Your Filter',
      emptyProvidersDesc:
        'Try a different service or area, or clear your filters to see more professionals.',
      bookingPhase3DisabledCta: 'Booking coming soon',
      bookingPhase3Notice:
        'Explore services and provider profiles today. Online booking is not available yet.',
      onboardingTitle: 'Build your professional profile',
      onboardingSubtitle:
        'Complete your bio, coverage areas, working hours, and offered services to submit for admin review',
      adminApprovalQueueTitle: 'Provider applications',
    },
    pages: {
      aboutTitle: 'Good care starts with a good connection',
      aboutSubtitle:
        'A bilingual Jordanian home-maintenance marketplace built on transparent pricing and reviewed listings',
      faqTitle: 'Frequently Asked Questions',
      faqSubtitle:
        'Clear answers on how FixMate works, indicative JOD pricing, and the difference between requested and confirmed bookings',
      contactTitle: 'How can we help?',
      contactSubtitle: 'Find guidance for your account, services, and professional profile.',
      termsDraftNotice: 'Draft Requiring Legal Review — Not Final Production Terms',
      notFoundTitle: 'Page Not Found (404)',
      notFoundDesc: 'The route you requested does not exist in FixMate.',
      returnHome: 'Return to Home',
    },
    shells: {
      notImplementedBadge: 'Your FixMate account',
      servicesTitle: 'Service Catalog Directory',
      servicesDesc: 'Browse active maintenance services backed by MongoDB.',
      providersTitle: 'Approved Service Providers',
      providersDesc: 'Only admin-approved (APPROVED) providers appear in public search.',
      providersEmptyTitle: 'No Matching Approved Providers',
      providersEmptyDesc: 'FixMate never displays fabricated provider accounts or fake ratings.',
      aboutTitle: 'Good care starts with a good connection',
      aboutDesc:
        'Built for Jordan with UTC timestamp persistence, Asia/Amman display localization, and integer JOD (fils) pricing.',
      authBannerTitle: 'Welcome home',
      authBannerBody:
        'Sessions use short-lived in-memory access tokens and rotated HttpOnly refresh cookies.',
      loginTitle: 'Sign In to FixMate',
      loginSubtitle: 'Sign in as a Customer, Service Provider, or Administrator',
      registerTitle: 'Create a FixMate Account',
      registerSubtitle: 'Register as a Customer or Service Provider',
      emailLabel: 'Email Address',
      passwordLabel: 'Password',
      fullNameLabel: 'Full Name',
      roleLabel: 'Account Role',
      roleCustomer: 'Customer (Request Maintenance)',
      roleProvider: 'Service Provider (Technician)',
      phoneLabel: 'Jordan Contact Phone',
      submitDisabledPhase2: 'Sign In',
      backToPublic: 'Back to Public Home',
      dashboardBannerTitle: 'Your workspace',
      dashboardBannerBody:
        'All role and ownership permissions are enforced server-side by NestJS guards and services.',
      customerWorkspace: 'Customer Workspace',
      providerWorkspace: 'Provider Workspace',
      adminWorkspace: 'Admin Workspace',
      dashboardEmptyTitle: 'Bookings & Post-Job Reviews Launch in Phase 3',
      dashboardEmptyDesc:
        'Use the navigation menu to manage your account profile, complete provider onboarding, or administer the catalog and provider approvals.',
      notFoundTitle: 'Page Not Found (404)',
      notFoundDesc: 'The route you requested does not exist in FixMate.',
      returnHome: 'Return to Home',
    },
    footer: {
      marketInfo: 'Display Timezone: Asia/Amman · Currency: Jordanian Dinar (JOD / fils)',
      copyright: '© 2026 FixMate — Phase 2: Core Platform',
      scopeNote:
        'V1 operates without online payment gateways or external GPS/mapping integrations.',
    },
  },
};
