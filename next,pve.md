1. Onboarding (Dari Welcome Sampai Summary)
Tujuan: Proses cepat (3-5 tap), welcoming seperti onboarding Duolingo—progress bar tipis biru di atas layar (misalnya "Langkah 1/7", fill gradasi biru).
Welcome Page: Logo "Alliv" besar di tengah (ukuran 4rem, efek glow putih-biru dengan text-shadow lembut). Di bawahnya, teks subtitle putih opacity 0.8: "AI-powered collaboration. Temuin teman buat project abrengmu." Tombol utama "Buat Akun" (full-width, background biru solid, hover scale 1.05) dan "Login" (outline putih tipis). Footer kecil: "Powered by xAI" dengan link subtle. Animasi: Logo muncul dengan pulse lembut (scale 1 ke 1.05, loop 1 detik), latar belakang tambah partikel halus (5-10 titik biru bergerak pelan seperti bintang, pakai CSS canvas sederhana).
House Rules: Modal full-screen (backdrop blur 20px agar konten di baliknya samar). Daftar 4 poin aturan (misalnya "Be real: Pakai foto asli & skill jujur") dengan ikon centang hijau (ukuran 2rem, rounded). Teks bold untuk judul poin, body kecil di bawah. Checkbox "Saya setuju" di bawah. Animasi: Setiap poin fade-in bergantian (delay 0.3 detik), ikon centang slide dari kanan. Tombol "Setuju" bentuk pil biru, hover tambah glow.
Create Account: Layout dua kolom (kiri: Form input dengan label floating ala Material Design—nama, email, password, tanggal lahir opsional, lokasi via autocomplete). Kanan: 6 slot upload foto bulat (200px diameter, border putus-putus putih, teks "Drag foto portofoliomu di sini"). Validasi: Garis merah di bawah input error + toast notif singkat. Animasi: Saat fokus input, tambah shadow biru dalam (inset 0 0 3px #00BFFF). Upload: Lingkaran progress berputar + preview foto fade-up dari bawah.
Basic Info, Skills, & Interests: Grid masonry (kartu 300x200px, bayangan sedang). Setiap kartu punya thumbnail gambar nyata (misalnya ikon kode untuk developer, kamera untuk photographer), overlay teks putih bold. Pilihan skills/interests jadi chip biru saat dipilih (max 5-7, dengan counter "Sudah pilih 3/5"). Placeholder bio: "Dev Python, cari tim buat app AI abreng." Animasi: Kartu slide-up saat load (dari y:50px ke 0), hover: Angkat 4px + glow biru. Kalau over limit, chip shake ringan.
Summary & Confirm: Tampilan vertikal scroll: Karusel foto di atas (panah navigasi kecil, dots indikator biru bawah), kartu bio navy gelap, deretan chip skills horizontal (scrollable), tag interests dengan gradient overlay. Tambah textarea goals kolaborasi. Ikon edit pensil kecil di setiap section. Animasi: Section-section fade-in bergantian dari atas ke bawah, latar belakang bergeser gradasi (hitam ke biru radial, 0.5 detik). Tombol "Selesai" hijau full-width.
2. Discover & Matching
Tujuan: Imersif seperti Tinder, tapi tambah snippet project (misalnya "Buka kolab: Build e-commerce abreng") biar terasa produktif. Navbar atas tipis: Ikon Discover (default), Events, Chat, Profile (dengan badge notif merah kecil).
Swipe Cards: Tumpukan 3 kartu (kartu atas dominan: Foto full-bleed rounded 20px, overlay nama 1.5rem bold, badge profesi biru kecil, chip skills di kiri bawah, snippet goals teks abu-abu kecil). Di bawah kartu: Tombol horizontal ❌ (outline merah, ikon X), 💡 (kuning, ikon bohlam untuk share ide), 🤝 (hijau solid, ikon tangan jabat). Filter di sidebar kiri (slide-in dari samping: Toggle switch untuk jarak/skills/vibes seperti Casual/Serious). Animasi: Swipe drag (kiri/kanan terbang 500px dengan ease), tilt 3D saat hover (rotateY ±10 derajat). Latar belakang parallax halus saat drag.
Explore Tab: Karusel horizontal "Rekomendasi Project" (kartu 250x150px, overlay gradient hitam 30% untuk teks). Bar pencarian lengket di atas (placeholder "Cari kolab tech di Jakarta"). Animasi: Scroll tak terbatas smooth, kartu hover scale 1.05 + bayangan besar.
Quiz Matching: Popup modal: 5 kartu pertanyaan MCQ (radio button dengan ikon lucu, misalnya remote icon untuk "Collab online/offline?"). Progress bar biru di atas. Animasi: Kartu flip saat jawab, confetti kecil biru saat selesai.
3. Chat & Interaksi
Tujuan: Mirip iMessage, tapi tambah elemen kolab seperti preview file (thumbnail PDF/repo GitHub).
Chat Interface: Gelembung obrolan (kiri: Abu-abu rounded kiri, kanan: Putih rounded kanan, avatar 40px bulat di samping). Input bawah: Composer dengan ikon emoji + attach (dropdown: Foto, file, voice). Indikator typing: Tiga titik bounce. Icebreaker AI muncul sebagai bubble khusus biru. Animasi: Gelembung slide dari bawah, efek typing wave (huruf muncul bergantian). Untuk group chat: Header dengan avatar kecil multiple + tombol + add member.
File Sharing & Video Call: Thumbnail inline untuk file (misalnya preview kode GitHub 100x100px). Tombol call: Ikon kamera biru, popup konfirmasi. Animasi: File upload progress bar hijau, video call fade-in dengan efek blur awal.
4. Profile & Safety
Tujuan: Showcase seperti Behance—fokus portofolio, bukan foto pribadi.
Profile Page: Header foto grid masonry (overlay nama/bio), di bawah grid vertikal: Chip skills horizontal, tag interests dengan ikon kecil, section goals expandable accordion (panah biru). Portofolio: Kartu link eksternal (misalnya "GitHub Repo: App Abreng" dengan thumbnail repo). Tombol: Edit (modal biru), Share (QR code popup), Logout (dialog konfirmasi merah). Badge verifikasi: Bintang emas kecil di pojok foto. Animasi: Fade transition saat buka (opacity 0 ke 1 + scale 0.95), accordion expand dengan slide-down.
Safety Features: Di settings (gear icon navbar): Toggle privacy (switch biru untuk hide lokasi), tombol report dengan modal form sederhana (dropdown alasan + teks). Trust score: Bar progress hijau (0-100, teks "Kredibilitas tinggi!"). Animasi: Switch flip dengan ripple effect.
5. Fitur Tambahan (Events, Project Board, dll.)
Events & Groups: Tab terpisah: Daftar vertikal event (kartu dengan foto event, tanggal badge biru, RSVP tombol hijau). Buat event: Modal form stacked (judul, deskripsi, skills dibutuhkan). Animasi: RSVP tombol pulse hijau saat available.
Project Board: View kanban sederhana (kolom: Open, In Progress, Done—drag-drop kartu project). Setiap kartu: Judul bold, tag skills, tombol apply. Animasi: Drag smooth dengan shadow follow.
AI Recommendations: Feed harian di home (carousel kartu: "Rekom: 3 dev deketmu buat project AI"). Animasi: Auto-slide 5 detik, tap pause.
Tips Umum Implementasi:
Responsif: Mobile-first (swipe prioritas di <768px), desktop tambah hover effects.
Aksesibilitas: Alt text untuk gambar, keyboard nav untuk swipe (arrow keys), kontras minimal 4.5:1.
Testing: Pakai Figma prototype gratis buat mockup, lalu Framer Motion untuk animasi (import { motion } from 'framer-motion').
Customisasi: Tambah tema user (e.g., switch ke light mode via toggle), atau AI-generated avatar kalau nggak upload foto.  1. Onboarding & Setup Profil (MVP Core – User Acquisition)

Welcome Screen (Core): Halaman hitam dengan logo Alliv glow, teks "AI-powered collab: Find project buddies!", tombol Create/Login. Tech: Next.js page, particles.js subtle.
House Rules Modal (Core): Full-blur panel: 4 rules tegas (be real, platonic only, respect privacy, report fast) + checkbox agree. Tech: Framer Motion stagger fade, Zustand state.
Account Creation (Core): Form: Nama/email/password/location (autocomplete), birthday/gender opsional. Validasi real-time. Tech: Supabase auth, React Hook Form.
Photo Upload (Core): 6 slots drag-drop, compress auto (1MB max), preview + delete. Fokus portfolio, bukan selfie. Tech: browser-image-compression, /api/upload ke Supabase Storage.
Basic Info (Core): Pilih 1 category (Dev/Photo/Music/dll. + thumbnail), bio 200 chars + goals ("Cari tim abreng app"). Tech: Grid cards, dynamic load via API.
Skills Selector (Core): Up to 5 skills dynamic (e.g., Python/JS buat dev; Drone/Lightroom buat photo), icon real + hover glow. Tech: Infinite scroll, search bar.
Interests Grid (Core): Up to 7 picks (Tech/Music/Design/dll. + thumbnail gradient), AI suggest berdasarkan skills. Tech: Masonry layout, chips toggle.
Profile Summary (Core): Preview full (photos/bio/skills/interests/goals), edit quick + finish button. Auto-save progress. Tech: Vertical scroll, gradient shift anim.

2. Discover & Matching (MVP Core – Engagement Hook)

Swipe Deck (Core): Tinder-style cards: Photo + name/profession/skills/goals, buttons ❌ Skip | 💡 Idea | 🤝 Connect. Infinite load 10 cards. Tech: Framer Motion drag, 3D tilt hover.
Smart AI Matching (Core): Rekomendasi berdasarkan skills/interests/location (score >70% = high match badge). Tech: xAI embed vector search, Supabase query.
Filters Panel (Core): Toggle distance (1-100km), skills, vibes (Casual/Serious), Explore tab buat event lokal. Tech: Sidebar, Zustand filter state.
Super Connect (Core): Highlight match top (gratis 3x/minggu), burst anim + priority deck. Tech: API flag, particles effect.
Project Boost (Advanced): Bayar $0.99 buat visibility +1 jam (non-subs). Tech: Stripe IAP, timer countdown.
Rewind Action (Core): Undo 3 swipes terakhir (cooldown 1 menit). Tech: Local stack array, shake anim error.
Personality Quiz (Advanced): 5 MCQ on first use (e.g., "Collab: Remote/Offline?") buat refine matches. Tech: Modal pop-up, score integration.

3. Chat & Interaksi (MVP Core – Retention Driver)

Chat UI (Core): iMessage bubbles (gray left/white right), avatars, typing "..." + AI icebreaker ("Diskusi Python project?"). Tech: Realtime Supabase subscribe, glassmorphism CSS.
File/Portfolio Share (Core): Upload image/pdf/zip (10MB max) inline preview. Tech: Supabase Storage, drag-drop zone.
Voice Notes (Advanced): Record/send 30s audio buat quick ideas. Tech: Web Audio API, waveform visual.
Video Call (Advanced): 1-tap call post-match (AR filters netral, max 30 menit). Tech: Twilio SDK, permission prompt.
Group Chat (Core): Auto buat grup max 10 orang buat tim project. Tech: Supabase channels, + member button.
Flirt Detector (Core): AI scan chat, warn + suggest platonic ("Tanya progress shoot-nya?"). Tech: Grok API sentiment, inline toast.
Matches Dashboard (Core): List mutual connects + compatibility badge, unread count. Tech: Tab nav, infinite scroll.

4. Profile & Showcase (MVP Core – Trust Builder)

Full Profile View (Core): Hero photos + grid (bio/skills/interests/goals/portfolio links). Tech: Masonry grid, fade transition.
Edit Mode (Core): Modal form per section, save instant. Tech: React forms, optimistic update.
Profile Share (Core): Generate QR/link buat external invite. Tech: QRCode lib, copy button.
Portfolio Auto-Pull (Advanced): Fetch 5 items dari GitHub/Behance (repos/projects). Tech: OAuth API, card display.
Verification Badge (Core): Upload proof (code snippet/photo sample), AI check buat "Verified". Tech: Vision API (Grok), progress bar.

5. Kolaborasi & Community (Advanced – Growth Engine)

Events Creator (Advanced): Buat/join event (virtual hackathon/offline walk), RSVP + auto-group. Tech: Calendar picker, Supabase events table.
Project Board (Advanced): Post "Open Collab" (tags skills, deadline), apply swipe/message. Tech: Kanban drag-drop, notifications.
AI Daily Recs (Core): 3 saran harian ("Photographers deket buat abreng shoot"). Tech: Cron job Vercel, push notif.
Trust Score (Core): 0-100 berdasarkan collabs/reports, tampil di cards. Tech: Supabase computed field, progress bar.
Offline Cache (Advanced): Simpan 20 cards/chats buat no-net, sync auto. Tech: PouchDB, service worker.

6. Safety, Monetisasi & Utils (Core/Support – Sustainability)

Advanced Reporting (Core): Report/block + AI review, consent guide pop-up. Tech: Supabase logs, modal confirm.
Privacy Toggles (Core): Hide location/gender, incognito mode, platonic badge. Tech: User settings table, toggle switches.
IAP Boosts (Core): $0.99 connect pack, $1.99 event priority (non-subs). Tech: Stripe checkout, wallet balance.
Ads Subtle (Advanced): Banner sponsored tools (opt-out), rewarded video extra swipes. Tech: AdMob SDK, non-intrusive placement.
Affiliate Links (Advanced): Komisi dari GitHub/Canva clicks di portfolio. Tech: Tracking pixels, dashboard earnings.
Notifications Hub (Core): Push/email buat matches/events/applies. Tech: Supabase realtime + FCM.
Personal Analytics (Advanced): Track connects/completed projects (survey post-collab). Tech: Mixpanel free, dashboard chart. periksa apakah fitur nya sudah ada jika belum ada maka buat dan lakukan dan juga untuk di bagian nearby aku ingin kita bisa melihat tampilan mapsya  dan setelah menambah fitur tersebut intergasikan langusng dengan bakcend serta fix semua error yang ada  