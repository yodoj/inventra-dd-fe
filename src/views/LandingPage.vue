<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  ChevronDown, 
  ChevronUp,
  Menu, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  Facebook, 
  Instagram, 
  Twitter,
  ChevronRight,
  GraduationCap
} from 'lucide-vue-next';
import axios from 'axios';

const stats = ref<Record<string, string>>({
  totalAsetSekolah: '1,254',
  unitTerintegrasi: '4',
  peminjamanAktif: '156'
});

interface FAQ {
  category: string;
  question: string;
  answer: string;
}

const faqs = ref<FAQ[]>([]);
const activeFaq = ref<number | null>(0); // Default open the first one to show design

const fetchHomeData = async () => {
  try {
    const response = await axios.get('http://localhost:8080/api/home');
    const responseData = response.data.data;
    if (responseData.stats) stats.value = responseData.stats;
    if (responseData.faqs) faqs.value = responseData.faqs;
  } catch (error) {
    console.error('Error fetching home data:', error);
    // Fallback data
    faqs.value = [
      { category: 'Manajemen Aset', question: 'Apa saja kategori aset yang tersedia?', answer: 'INVENTRA DD memiliki 4 kategori aset: \n- Barang Habis Pakai\n- Barang Tidak Habis Pakai\n- Ruang Kelas\n- Ruangan Non Kelas' },
      { category: 'Manajemen Aset', question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', answer: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.' },
      { category: 'Peminjaman Aset', question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', answer: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' },
      { category: 'Pengadaan Barang', question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', answer: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' },
      { category: 'Pengadaan Barang', question: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.', answer: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.' }
    ];
  }
};

onMounted(() => {
  fetchHomeData();
});

const toggleFaq = (index: number) => {
  activeFaq.value = activeFaq.value === index ? null : index;
};
</script>

<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <header class="hero">
      <div class="container hero-content">
        <div class="hero-badge fade-in">
          <GraduationCap class="icon-xs" /> Portal Internal Sekolah Yayasan Dian Didaktika
        </div>
        
        <div class="hero-main-text fade-in">
          <h1 class="h1-headline">Welcome to</h1>
          <h1 class="h1-headline">Inventory & Resource Asset System</h1>
          <h1 class="h1-headline">Sekolah Dian Didaktika</h1>
        </div>

        <!-- Stats Overlaying Hero -->
        <div class="hero-stats fade-in">
          <div class="stat-item">
            <h3 class="h3-headline">{{ stats.totalAsetSekolah }}</h3>
            <p class="b4-body">Total Aset Sekolah</p>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <h3 class="h3-headline">{{ stats.unitTerintegrasi }}</h3>
            <p class="b4-body">Unit Terintegrasi</p>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <h3 class="h3-headline">{{ stats.peminjamanAktif }}</h3>
            <p class="b4-body">Peminjaman Aktif</p>
          </div>
        </div>
      </div>
    </header>

    <!-- FAQ Section (High-Fidelity) -->
    <section class="section-faq">
      <div class="container">
        <h2 class="h2-headline text-center mb-16 gradient-text">Frequently Asked Questions</h2>
        <p class="b4-body text-center mb-60 description-text">
          Frequently Asked Questions (FAQ) ini disediakan sebagai panduan bagi pengguna dalam memahami fitur, alur kerja, dan kebijakan pengelolaan aset pada sistem Inventory & Resource Asset System (INVENTRA) Sekolah Dian Didaktika.
        </p>

        <div class="faq-list">
          <div v-for="(faq, index) in faqs" :key="index" class="faq-card fade-in" :class="{ active: activeFaq === index }">
            <div class="faq-header" @click="toggleFaq(index)">
              <div class="faq-tag-wrapper">
                <span class="faq-tag">{{ faq.category }}</span>
              </div>
              <div class="faq-toggle-icon">
                <ChevronUp v-if="activeFaq === index" class="icon-md" />
                <ChevronDown v-else class="icon-md" />
              </div>
            </div>
            
            <div class="faq-content-area" @click="toggleFaq(index)">
              <h4 class="faq-question-text">{{ faq.question }}</h4>
              
              <div class="faq-answer-wrapper" v-if="activeFaq === index">
                <div class="faq-answer-content b3-body">
                  <p v-for="(line, lIdx) in faq.answer.split('\n')" :key="lIdx">
                    {{ line }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <div class="brand-identity">
            <div class="logo-large">
              <img src="@/assets/logo-dd.png" alt="Dian Didaktika Logo" />
            </div>
            <div class="brand-text-block">
              <h3 class="h3-headline">INVENTRA</h3>
              <h2 class="h3-headline">Sekolah Islam Dian Didaktika</h2>
            </div>
          </div>
          <p class="b4-body footer-desc">
            Mendidik generasi <strong>cerdas, berakhlak, dan berdaya saing tinggi</strong> dengan pendidikan unggulan Islami di Depok.
          </p>
          <p class="c1-caption copyright">© 2026 Sekolah Dian Didaktika</p>
        </div>

        <div class="footer-contact">
          <h4 class="s1-subtitle">Kontak Kami</h4>
          <ul class="contact-list b4-body">
            <li>humas@diandidaktika.sch.id</li>
            <li>0822-4653-6989 [KB-TK]</li>
            <li>0852-8900-0269 [SD]</li>
            <li>0852-8373-8788 [SMP]</li>
            <li>0813-8723-6707 [SMA]</li>
          </ul>
        </div>

        <div class="footer-address">
          <h4 class="s1-subtitle">Alamat</h4>
          <p class="b4-body">
            Jl. Rajawali Blok F No. 10 & 16, Cinere, Depok, Jawa Barat 16512
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  background: var(--white);
}

/* Hero Section */
.hero {
  min-height: 500px;
  background-image: url('@/assets/background-landing.png');
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  color: var(--white);
  padding: 80px 0;
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
  padding: 8px 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 40px;
  font-size: 14px;
  font-weight: 600;
  width: fit-content;
}

.hero-main-text h1 {
  margin: 0;
  color: var(--white);
}

/* Stats Item */
.hero-stats {
  display: flex;
  align-items: center;
  gap: 40px;
  margin-top: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item h3 {
  color: var(--white);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
}

/* FAQ Section */
.section-faq {
  padding: 80px 0 120px;
  background: var(--white);
}

.text-center { text-align: center; }
.mb-16 { margin-bottom: 16px; }
.mb-40 { margin-bottom: 40px; }
.mb-60 { margin-bottom: 60px; }

.gradient-text {
  background: linear-gradient(to right, #00365B, #0695EE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
}

.description-text {
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  color: var(--text-primary);
  line-height: 1.6;
}

.faq-list {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.faq-card {
  background: var(--white);
  border-radius: 12px;
  padding: 24px 32px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid transparent;
  cursor: pointer;
}

.faq-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.faq-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.faq-tag {
  background: linear-gradient(to right, #00365B, #0695EE);
  color: var(--white);
  padding: 6px 20px;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 700;
  display: inline-block;
}

.faq-toggle-icon {
  color: var(--text-primary);
}

.faq-content-area {
  display: flex;
  flex-direction: column;
}

.faq-question-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0;
  transition: color 0.3s;
}

.active .faq-question-text {
  margin-bottom: 12px;
}

.faq-answer-wrapper {
  margin-top: 4px;
}

.faq-answer-content {
  color: var(--text-primary);
  line-height: 1.6;
}

.faq-answer-content p {
  margin-bottom: 8px;
}

.faq-answer-content p:last-child {
  margin-bottom: 0;
}

.icon-md { width: 24px; height: 24px; }
.icon-sm { width: 18px; height: 18px; }
.icon-xs { width: 14px; height: 14px; }

/* Footer */
.footer {
  background: #00365B;
  padding: 80px 0 60px;
  color: var(--white);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 60px;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.brand-identity {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-large img {
  height: 80px;
}

.brand-text-block h3 { margin: 0; font-size: 24px; color: var(--white); }
.brand-text-block h2 { margin: 0; font-size: 24px; color: var(--white); }

.footer-desc {
  max-width: 450px;
  line-height: 1.6;
  color: var(--white);
}

.footer-desc strong {
  font-weight: 700;
}

.copyright {
  margin-top: 20px;
  opacity: 0.8;
  color: var(--white);
}

.socials {
  display: flex;
  gap: 16px;
  color: var(--text-secondary);
}

.footer-contact, .footer-address {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.footer-contact h4, .footer-address h4 {
  color: var(--white);
  font-weight: 700;
}

.contact-list {
  list-style-type: disc;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-list li {
  color: var(--white);
}

.footer-address p {
  color: var(--white);
  line-height: 1.6;
}

@media (max-width: 1024px) {
  .footer-grid { grid-template-columns: 1fr; gap: 40px; }
  .footer-desc { max-width: 100%; }
}

@media (max-width: 900px) {
  .hero { text-align: center; padding: 60px 20px; }
  .hero-badge { margin: 0 auto; }
  .hero-stats { flex-direction: column; gap: 24px; }
  .stat-divider { display: none; }
  .faq-card { padding: 20px; }
}
</style>
```
