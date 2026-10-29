import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import mongoose, { Model, Types } from 'mongoose';
import { CurrencyCode, PricingType } from '../common/domain';
import {
  Category,
  CategoryDocument,
  CategorySchema,
  Service,
  ServiceDocument,
  ServiceSchema,
} from '../database/schemas';

export interface CanonicalCategorySeed {
  slug: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  iconName: string;
  displayOrder: number;
}

export interface CanonicalServiceSeed {
  categorySlug: string;
  slug: string;
  title: { ar: string; en: string };
  description: { ar: string; en: string };
  pricingPolicy?: {
    pricingType: PricingType;
    indicativeAmountFils: number;
  };
  defaultDurationMinutes: number;
}

export const CANONICAL_CATEGORIES: CanonicalCategorySeed[] = [
  {
    slug: 'plumbing',
    name: { ar: 'السباكة وتمديدات المياه', en: 'Plumbing & Water Systems' },
    description: {
      ar: 'إصلاح التسربات، صيانة سخانات المياه، وتركيب الأدوات الصحية في المنازل والشقق.',
      en: 'Leak repairs, water heater maintenance, pipe fitting, and residential fixture installation.',
    },
    iconName: 'wrench',
    displayOrder: 1,
  },
  {
    slug: 'electrical-repairs',
    name: { ar: 'الأعطال الكهربائية', en: 'Electrical Repairs' },
    description: {
      ar: 'فحص لوحات القواطع، تبديل المفاتيح والمقابس، وتركيب وحدات الإنارة الداخلية والخارجية.',
      en: 'Breaker diagnostics, outlet and switch replacements, and residential lighting installation.',
    },
    iconName: 'bolt',
    displayOrder: 2,
  },
  {
    slug: 'ac-maintenance',
    name: { ar: 'صيانة التكييف والتبريد', en: 'AC Maintenance & HVAC' },
    description: {
      ar: 'تنظيف وحدات التكييف (سبليت)، فحص غاز التبريد، والصيانة الموسمية للصيف والشتاء.',
      en: 'Split-unit cleaning, refrigerant inspection, and seasonal HVAC servicing.',
    },
    iconName: 'snowflake',
    displayOrder: 3,
  },
  {
    slug: 'cleaning',
    name: { ar: 'التنظيف المنزلي العميق', en: 'Deep Home Cleaning' },
    description: {
      ar: 'تنظيف شامل للمنازل والشقق، تعقيم المطابخ والحمامات، وتنظيف خزانات المياه.',
      en: 'Full apartment and villa cleaning, kitchen sanitization, and water tank cleaning.',
    },
    iconName: 'sparkles',
    displayOrder: 4,
  },
  {
    slug: 'painting',
    name: { ar: 'الدهان ومعالجة الجدران', en: 'Painting & Wall Treatment' },
    description: {
      ar: 'دهان داخلي، معالجة الرطوبة والتشققات، والتشطيبات الديكورية الاحترافية.',
      en: 'Interior painting, dampness and crack treatment, and decorative wall finishes.',
    },
    iconName: 'paint-roller',
    displayOrder: 5,
  },
  {
    slug: 'carpentry',
    name: { ar: 'النجارة وصيانة الأبواب', en: 'Carpentry & Door Repairs' },
    description: {
      ar: 'معايرة الأبواب والأقفال، إصلاح خزائن المطبخ، وتركيب الأثاث الخشبي.',
      en: 'Door alignment, lock replacement, cabinet hinge repair, and custom woodwork.',
    },
    iconName: 'hammer',
    displayOrder: 6,
  },
];

export const CANONICAL_SERVICES: CanonicalServiceSeed[] = [
  {
    categorySlug: 'plumbing',
    slug: 'water-leak-detection-repair',
    title: {
      ar: 'كشف وإصلاح تسربات المياه المنزلية',
      en: 'Residential Water Leak Detection & Repair',
    },
    description: {
      ar: 'فحص شامل لتمديدات المطابخ والحمامات وإصلاح التسربات الظاهرة وتبديل الوصلات التالفة.',
      en: 'Complete inspection of kitchen and bathroom plumbing lines with visible leak repair and fitting replacement.',
    },
    pricingPolicy: {
      pricingType: PricingType.STARTING_AT,
      indicativeAmountFils: 15000,
    },
    defaultDurationMinutes: 60,
  },
  {
    categorySlug: 'plumbing',
    slug: 'electric-water-heater-maintenance',
    title: {
      ar: 'صيانة وتنظيف سخان المياه الكهربائي (الكيزر)',
      en: 'Electric Water Heater (Geyser) Servicing',
    },
    description: {
      ar: 'تنظيف الكلس، فحص أو تبديل الهيتر والثيرموستات وصمام الأمان لضمان كفاءة التسخين.',
      en: 'Descaling, thermostat and heating element inspection, and safety valve check.',
    },
    pricingPolicy: {
      pricingType: PricingType.FIXED,
      indicativeAmountFils: 20000,
    },
    defaultDurationMinutes: 90,
  },
  {
    categorySlug: 'electrical-repairs',
    slug: 'circuit-breaker-panel-inspection',
    title: {
      ar: 'فحص وصيانة لوحة القواطع الكهربائية',
      en: 'Circuit Breaker Panel Diagnostics & Repair',
    },
    description: {
      ar: 'تشخيص أسباب فصل القواطع المتكرر، موازنة الأحمال، وتبديل القواطع التالفة بأمان.',
      en: 'Diagnose frequent breaker trips, balance residential loads, and replace faulty circuit breakers.',
    },
    pricingPolicy: {
      pricingType: PricingType.INSPECTION_ONLY,
      indicativeAmountFils: 10000,
    },
    defaultDurationMinutes: 60,
  },
  {
    categorySlug: 'electrical-repairs',
    slug: 'lighting-and-socket-installation',
    title: {
      ar: 'تركيب وحدات الإنارة والمفاتيح والمقابس',
      en: 'Lighting Fixtures & Wall Socket Installation',
    },
    description: {
      ar: 'تركيب الثريات، كشافات LED، وتبديل الأباريز والمفاتيح الكهربائية مع فحص التأريض.',
      en: 'Install chandeliers, LED spotlights, and replace wall outlets and switches with grounding verification.',
    },
    pricingPolicy: {
      pricingType: PricingType.STARTING_AT,
      indicativeAmountFils: 12000,
    },
    defaultDurationMinutes: 60,
  },
  {
    categorySlug: 'ac-maintenance',
    slug: 'split-ac-deep-cleaning-service',
    title: {
      ar: 'تنظيف وصيانة مكيف سبليت (وحدة داخلية وخارجية)',
      en: 'Split AC Unit Deep Cleaning & Seasonal Service',
    },
    description: {
      ar: 'غسيل الفلاتر والمبخر ومجرى التصريف وفحص ضغط الغاز والأداء العام للوحدة.',
      en: 'Wash filters, evaporator coil, drainage line, and inspect refrigerant pressure and cooling output.',
    },
    pricingPolicy: {
      pricingType: PricingType.FIXED,
      indicativeAmountFils: 18000,
    },
    defaultDurationMinutes: 90,
  },
  {
    categorySlug: 'ac-maintenance',
    slug: 'ac-cooling-diagnostics-recharge',
    title: {
      ar: 'فحص ضعف التبريد ومعايرة غاز المكيف',
      en: 'AC Cooling Diagnostics & Refrigerant Check',
    },
    description: {
      ar: 'فحص شامل لدورة التبريد والضاغط وتحديد سبب ضعف التبريد أو التسريب.',
      en: 'Comprehensive compressor and cooling cycle diagnostics to resolve weak cooling performance.',
    },
    pricingPolicy: {
      pricingType: PricingType.STARTING_AT,
      indicativeAmountFils: 15000,
    },
    defaultDurationMinutes: 60,
  },
  {
    categorySlug: 'cleaning',
    slug: 'apartment-deep-cleaning',
    title: {
      ar: 'تنظيف عميق للشقق والمنازل',
      en: 'Comprehensive Apartment Deep Cleaning',
    },
    description: {
      ar: 'تنظيف الأرضيات، النوافذ، تعقيم المطابخ والحمامات، وإزالة الدهون والغبار المتراكم.',
      en: 'Deep floor scrubbing, window cleaning, kitchen degreasing, and bathroom sanitization.',
    },
    pricingPolicy: {
      pricingType: PricingType.STARTING_AT,
      indicativeAmountFils: 45000,
    },
    defaultDurationMinutes: 240,
  },
  {
    categorySlug: 'cleaning',
    slug: 'roof-water-tank-sanitization',
    title: {
      ar: 'تنظيف وتعقيم خزانات المياه المنزلية',
      en: 'Residential Water Tank Cleaning & Sanitization',
    },
    description: {
      ar: 'تفريغ وتنظيف خزانات المياه العلوية أو الأرضية من الرواسب وتعقيمها بمواد آمنة.',
      en: 'Drain, scrub, remove sediment, and sanitize rooftop or ground residential water tanks.',
    },
    pricingPolicy: {
      pricingType: PricingType.FIXED,
      indicativeAmountFils: 25000,
    },
    defaultDurationMinutes: 120,
  },
  {
    categorySlug: 'painting',
    slug: 'single-room-interior-painting',
    title: {
      ar: 'دهان غرفة داخلية مع معالجة التشققات',
      en: 'Single Room Interior Painting & Crack Filling',
    },
    description: {
      ar: 'تجهيز الجدران، معجون للشقوق البسيطة، ووجهين دهان عالي الجودة مع حماية الأرضيات.',
      en: 'Surface preparation, minor crack putty repair, and two coats of interior paint with floor protection.',
    },
    pricingPolicy: {
      pricingType: PricingType.STARTING_AT,
      indicativeAmountFils: 55000,
    },
    defaultDurationMinutes: 300,
  },
  {
    categorySlug: 'painting',
    slug: 'dampness-and-mold-wall-treatment',
    title: {
      ar: 'معالجة رطوبة وتقشر الجدران والأسقف',
      en: 'Wall Dampness & Peeling Paint Treatment',
    },
    description: {
      ar: 'قشط الدهان المتضرر، تطبيق مواد عزل الرطوبة، وإعادة التشطيب والدهان.',
      en: 'Scrape damaged plaster, apply anti-dampness sealer, and restore smooth wall finish.',
    },
    pricingPolicy: {
      pricingType: PricingType.STARTING_AT,
      indicativeAmountFils: 30000,
    },
    defaultDurationMinutes: 180,
  },
  {
    categorySlug: 'carpentry',
    slug: 'wooden-door-and-lock-repair',
    title: {
      ar: 'معايرة الأبواب الخشبية وتبديل الأقفال والمفصلات',
      en: 'Wooden Door Alignment & Lock/Hinge Replacement',
    },
    description: {
      ar: 'إصلاح احتكاك الأبواب، تبديل الكوالين والمقابض، وتثبيت المفصلات المرتخية.',
      en: 'Fix sticking doors, replace cylinder locks and handles, and tighten or replace hinges.',
    },
    pricingPolicy: {
      pricingType: PricingType.FIXED,
      indicativeAmountFils: 15000,
    },
    defaultDurationMinutes: 60,
  },
  {
    categorySlug: 'carpentry',
    slug: 'kitchen-cabinet-hinge-and-drawer-repair',
    title: {
      ar: 'صيانة خزائن المطبخ وسكك الأدراج',
      en: 'Kitchen Cabinet Hinge & Drawer Track Repair',
    },
    description: {
      ar: 'تبديل مفصلات خزائن المطبخ الهيدروليكية وإصلاح مسارات الأدراج المتعطلة.',
      en: 'Replace soft-close cabinet hinges and repair sticking or broken kitchen drawer slides.',
    },
    pricingPolicy: {
      pricingType: PricingType.STARTING_AT,
      indicativeAmountFils: 15000,
    },
    defaultDurationMinutes: 90,
  },
];

// Retained legacy services: featured-card replacements must not repurpose their IDs.
CANONICAL_SERVICES.push(
  {categorySlug:'moving',slug:'piano-moving',title:{en:'Piano Moving',ar:'نقل البيانو'},description:{en:'Specialist piano moving; agree scope, access and a quote with an available professional.',ar:'نقل البيانو بواسطة مختص؛ اتفق على نطاق العمل وترتيبات الوصول وعرض السعر مع المزود المتاح.'},defaultDurationMinutes:60},
  {categorySlug:'ac-maintenance',slug:'heating-system-maintenance',title:{en:'Heating System Repair or Maintenance',ar:'إصلاح وصيانة أنظمة التدفئة'},description:{en:'Heating system repair and maintenance; agree the scope and quote with an available professional.',ar:'إصلاح وصيانة أنظمة التدفئة؛ اتفق على نطاق العمل وعرض السعر مع المزود المتاح.'},defaultDurationMinutes:60},
);

// One manifest drives the homepage, navigation and additive seed. Existing slugs/IDs win.
const discovery = JSON.parse(
  readFileSync(
    resolve(__dirname, '../../../frontend/public/catalog/discovery-taxonomy.json'),
    'utf8',
  ),
) as {
  slug: string;
  label: { en: string; ar: string };
  services: { slug: string; title: { en: string; ar: string }; description?: {en:string;ar:string} }[];
}[];
for (const [index, category] of discovery.entries()) {
  if (!CANONICAL_CATEGORIES.some((c) => c.slug === category.slug)) {
    CANONICAL_CATEGORIES.push({
      slug: category.slug,
      name: category.label,
      description: {
        en: `Explore ${category.label.en.toLowerCase()} services in Jordan. Provider availability varies by area.`,
        ar: `استكشف ${category.label.ar} في الأردن. يختلف توفر المزودين حسب المنطقة.`,
      },
      iconName: category.slug,
      displayOrder: index + 10,
    });
  }
  for (const service of category.services) {
    if (!CANONICAL_SERVICES.some((s) => s.slug === service.slug)) {
      CANONICAL_SERVICES.push({
        categorySlug: category.slug,
        slug: service.slug,
        title: service.title,
        description: service.description || {
          en: `${service.title.en} for your home. Compare the scope with an available professional and agree a quote before booking. Catalog inclusion does not guarantee local availability.`,
          ar: `${service.title.ar} لمنزلك. ناقش نطاق العمل مع المزود المتاح واتفق على عرض السعر قبل الحجز. إدراج الخدمة لا يضمن توفر مزود في منطقتك.`,
        },
        defaultDurationMinutes: 60,
      });
    }
  }
}

/**
 * Idempotent catalog seeder using `$setOnInsert` so re-running never creates
 * duplicates or overwrites admin edits (`isActive`, custom titles, or prices).
 */
export async function seedCanonicalCatalog(
  categoryModel: Model<CategoryDocument>,
  serviceModel: Model<ServiceDocument>,
): Promise<{
  categoriesInserted: number;
  categoriesTotal: number;
  servicesInserted: number;
  servicesTotal: number;
}> {
  let categoriesInserted = 0;
  const slugToCategoryId = new Map<string, Types.ObjectId>();

  for (const cat of CANONICAL_CATEGORIES) {
    const res = await categoryModel
      .updateOne(
        { slug: cat.slug },
        {
          $setOnInsert: {
            slug: cat.slug,
            name: cat.name,
            description: cat.description,
            iconName: cat.iconName,
            displayOrder: cat.displayOrder,
            isActive: true,
          },
        },
        { upsert: true },
      )
      .exec();

    if (res.upsertedCount && res.upsertedCount > 0) {
      categoriesInserted += 1;
    }

    const doc = await categoryModel.findOne({ slug: cat.slug }).exec();
    if (doc) {
      slugToCategoryId.set(cat.slug, doc._id);
    }
  }

  let servicesInserted = 0;
  for (const svc of CANONICAL_SERVICES) {
    const categoryId = slugToCategoryId.get(svc.categorySlug);
    if (!categoryId) {
      continue;
    }

    const res = await serviceModel
      .updateOne(
        { slug: svc.slug },
        {
          $addToSet: {
            discoveryCategorySlugs: {
              $each: discovery
                .filter((c) => c.services.some((s) => s.slug === svc.slug))
                .map((c) => c.slug),
            },
          },
          $setOnInsert: {
            categoryId,
            slug: svc.slug,
            title: svc.title,
            description: svc.description,
            ...(svc.pricingPolicy
              ? {
                  pricingPolicy: {
                    pricingType: svc.pricingPolicy.pricingType,
                    indicativeAmountFils: svc.pricingPolicy.indicativeAmountFils,
                    currency: CurrencyCode.JOD,
                  },
                }
              : {}),
            defaultDurationMinutes: svc.defaultDurationMinutes,
            isActive: true,
          },
        },
        { upsert: true },
      )
      .exec();

    if (res.upsertedCount && res.upsertedCount > 0) {
      servicesInserted += 1;
    }
  }

  const [categoriesTotal, servicesTotal] = await Promise.all([
    categoryModel.countDocuments().exec(),
    serviceModel.countDocuments().exec(),
  ]);

  return {
    categoriesInserted,
    categoriesTotal,
    servicesInserted,
    servicesTotal,
  };
}

async function runCli(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fixmate';
  await mongoose.connect(mongoUri);
  try {
    const categoryModel =
      (mongoose.models[Category.name] as Model<CategoryDocument>) ||
      (mongoose.model(Category.name, CategorySchema) as unknown as Model<CategoryDocument>);
    const serviceModel =
      (mongoose.models[Service.name] as Model<ServiceDocument>) ||
      (mongoose.model(Service.name, ServiceSchema) as unknown as Model<ServiceDocument>);

    const summary = await seedCanonicalCatalog(categoryModel, serviceModel);
    process.stdout.write(
      `[FixMate Catalog Seed] Completed idempotently: categories (+${summary.categoriesInserted}, total=${summary.categoriesTotal}), services (+${summary.servicesInserted}, total=${summary.servicesTotal})\n`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  runCli().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[FixMate Catalog Seed Error] ${message}\n`);
    process.exit(1);
  });
}
