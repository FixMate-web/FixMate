# FixMate photography and fonts

Updated 2026-10-30. Photographs are illustrative stock imagery or the AI-generated service scenes documented below, not completed FixMate projects or photographs of listed providers. No Thumbtack assets are used. All displayed homepage images are served locally as WebP. The seven-scene service hero inventory below supersedes the older editorial slideshow uses in the original table.

## Homepage asset provenance

| Local asset under `frontend/public/images/` | Source | Use |
| --- | --- | --- |
| `editorial/exterior-{480,960,1920}.webp`, `editorial/exterior.webp` | [Unsplash residential architecture](https://images.unsplash.com/photo-1600596542815-ffad4c1539a9) | Hero, seasonal project theme |
| `editorial/living.webp` | [Unsplash living room](https://images.unsplash.com/photo-1600210492486-724fe5c67fb0) | Maintenance feature |
| `editorial/kitchen.webp` | [Unsplash kitchen](https://images.unsplash.com/photo-1556912172-45b7abe8b7e1) | Essential services feature, cabinet service |
| `editorial/lights.webp` | [Unsplash light fixture](https://images.unsplash.com/photo-1507473885765-e6ed057f782c) | Lighting service |
| `editorial/garden.webp` | [Unsplash architectural interior](https://images.unsplash.com/photo-1600607687920-4e2a09cf159d) | Remodeling feature, cost guide (filename retained; subject is an interior) |
| `categories/cleaning-{480,960}.webp` | [Liliana Drew / Pexels 9462651](https://www.pexels.com/photo/person-wiping-a-stainless-steel-faucet-with-blue-towel-9462651/) | Cleaning |
| `categories/plumbing-{480,960}.webp` | [Bulat843 / Pexels 32588548](https://www.pexels.com/photo/plumber-repairing-pipe-with-wrench-indoors-32588548/) | Plumbing |
| `categories/ac-maintenance-{480,960}.webp` | [José Andrés Pacheco Cortes / Pexels 5463580](https://www.pexels.com/photo/man-repairing-an-aircon-5463580/) | AC maintenance; replaces unrelated guitar photograph |
| `categories/electrical-repairs-{480,960}.webp` | [Unsplash electrical work](https://images.unsplash.com/photo-1621905251189-08b45d6a269e) | Electrical services |
| `categories/painting-{480,960}.webp` | [Stephanie Ho / Pexels 994164](https://www.pexels.com/photo/person-holding-paint-roller-while-painting-the-wall-994164/) | Painting, maintenance guide |
| `categories/carpentry-{480,960}.webp` | [Antoni Shkraba / Pexels 5466146](https://www.pexels.com/photo/close-up-of-sanding-wood-5466146/) | Carpentry |
| `marketing/craftsman-{480,960}.webp` | [Tima Miroshnichenko / Pexels 6790759](https://www.pexels.com/photo/a-man-doing-a-woodwork-6790759/) | Project guide |

Licenses: [Unsplash License](https://unsplash.com/license), [Pexels License](https://www.pexels.com/license/). Source pages mark these as free photographs; no Unsplash+ assets were selected. Images were downloaded and converted with Pillow, keeping appropriate high-resolution source crops. Hero uses responsive 480/960/1920w variants and high fetch priority; below-fold images load lazily.

Inherited `hero/home-*.webp` and `home-interior.jpg` remain available for existing secondary-page fallbacks. They are not the new homepage hero. The prior inventory incorrectly listed nonexistent `services/` assets and described the AC guitar image as a technician; those claims are superseded by this inventory.

## Fonts

Inter and Noto Sans Arabic are self-hosted WOFF2 files in `frontend/public/fonts/`, weights 400/500/600/700, with `font-display: swap`. Downloaded from Google Fonts and converted with FontTools/Brotli. Their SIL Open Font Licenses are included alongside the files (`Inter-LICENSE.txt`, `NotoSansArabic-LICENSE.txt`). No font CDN is required at runtime.

## Seven service hero scenes — 2026-10-30

These seven **AI-generated illustrative photographs** replace only the four homepage slideshow backgrounds. They are not photographs of real FixMate professionals, customers, homes or completed work. Generated with the built-in OpenAI `image_gen` tool, one independent scene per image; furniture moving received one targeted composition refinement. No third-party stock or competitor imagery was used for this set. No exclusive-rights or stock-license claim is made.

Generation output is natively 1672×941 (approximately 16:9), preserved without artificial upscaling. WebP quality 87, with true 960×540 responsive versions. Full prompts, original-output references, SHA-256 hashes and asset measurements are recorded in [generation provenance](../artifacts/service-heroes/generation-provenance.json).

| Asset under `frontend/public/images/hero/` | Existing category | Native WebP | 960×540 WebP |
| --- | --- | ---: | ---: |
| `hero-cleaning.webp` | Cleaning / خدمات التنظيف | 1672×941, 121.9 KiB | 64.9 KiB |
| `hero-plumbing.webp` | Plumbing / خدمات السباكة | 1672×941, 166.8 KiB | 78.5 KiB |
| `hero-electrical.webp` | Electrical / الخدمات الكهربائية | 1672×941, 90.9 KiB | 45.9 KiB |
| `hero-air-conditioning.webp` | HVAC / التكييف والتدفئة | 1672×941, 96.6 KiB | 45.6 KiB |
| `hero-furniture-moving.webp` | Moving / خدمات النقل | 1672×941, 143.1 KiB | 62.7 KiB |
| `hero-interior-painting.webp` | Painting / الدهان والديكور | 1672×941, 150.1 KiB | 70.3 KiB |
| `hero-garden-maintenance.webp` | Landscaping / تنسيق وصيانة الحدائق | 1672×941, 318.2 KiB | 156.4 KiB |

Each photo is a single scene, not a collage. The foreground interface and existing overlay remain unchanged. The background image alone mirrors in RTL, preserving the scene’s quiet side behind the text; independent CSS `scale` leaves the zoom animation untouched. Per-scene focal positions accommodate desktop and mobile crops. Existing scene captions now describe the actual active service in Arabic and English.

Only the first image has high fetch priority. Upcoming images use matching `srcset`/`sizes` when preloaded and decoded, so viewport/DPR selection matches the displayed image. The seven full-size images are not eagerly fetched. Rotation remains 7000ms, fade 1100ms, zoom to 1.075 over 8200ms. Existing editorial photographs remain available for their other page uses.
