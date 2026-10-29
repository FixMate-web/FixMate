# FixMate photography and fonts

Updated 2026-10-29 during the visual fidelity recovery. Photographs are illustrative stock imagery, not completed FixMate projects or photographs of listed providers. No Thumbtack assets are used. All displayed homepage images are served locally as WebP.

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
