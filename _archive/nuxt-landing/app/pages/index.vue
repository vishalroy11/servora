<template>
  <div class="home">
    <!-- Hero: brand + one headline + one line + CTAs + full-bleed image -->
    <section class="hero">
      <div class="hero-media" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=2000&q=80"
          alt=""
          class="hero-img"
        >
        <div class="hero-veil" />
      </div>

      <div class="container hero-content">
        <p class="brand-signal">Servora</p>
        <h1>Every service you need — one checkout.</h1>
        <p class="hero-lead">
          Shop cleaning, repairs, design, wellness, and more from verified providers in a single ecommerce storefront.
        </p>
        <div class="hero-cta">
          <a href="#marketplace" class="btn btn-primary">Browse marketplace</a>
          <a href="#services" class="btn btn-ghost">Explore categories</a>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section id="services" class="section categories">
      <div class="container">
        <div class="section-head">
          <h2>Shop by service</h2>
          <p>Pick a category and book or buy in minutes — multi-service shopping without leaving the site.</p>
        </div>

        <div class="category-grid">
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            class="category-tile"
            :style="{ '--accent': cat.accent }"
            @click="activeCategory = cat.id"
          >
            <span class="cat-icon" aria-hidden="true">{{ cat.icon }}</span>
            <span class="cat-copy">
              <strong>{{ cat.name }}</strong>
              <span>{{ cat.count }} listings</span>
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- Marketplace / ecommerce listings -->
    <section id="marketplace" class="section marketplace">
      <div class="container">
        <div class="section-head market-head">
          <div>
            <h2>Featured services</h2>
            <p>Ready-to-book packages with transparent pricing — add to cart like any online store.</p>
          </div>
          <div class="filter-pills" role="tablist" aria-label="Filter services">
            <button
              type="button"
              role="tab"
              :aria-selected="activeCategory === 'all'"
              :class="{ active: activeCategory === 'all' }"
              @click="activeCategory = 'all'"
            >
              All
            </button>
            <button
              v-for="cat in categories"
              :key="`filter-${cat.id}`"
              type="button"
              role="tab"
              :aria-selected="activeCategory === cat.id"
              :class="{ active: activeCategory === cat.id }"
              @click="activeCategory = cat.id"
            >
              {{ cat.name }}
            </button>
          </div>
        </div>

        <div class="product-grid">
          <article
            v-for="(item, index) in filteredServices"
            :key="item.id"
            class="product"
            :style="{ animationDelay: `${index * 60}ms` }"
          >
            <div class="product-media">
              <img :src="item.image" :alt="item.title" loading="lazy">
              <span v-if="item.badge" class="badge">{{ item.badge }}</span>
            </div>
            <div class="product-body">
              <p class="product-meta">{{ item.category }} · {{ item.duration }}</p>
              <h3>{{ item.title }}</h3>
              <p class="product-desc">{{ item.description }}</p>
              <div class="product-foot">
                <div class="price">
                  <span class="amount">₹{{ item.price.toLocaleString('en-IN') }}</span>
                  <span class="unit">/ {{ item.unit }}</span>
                </div>
                <button type="button" class="btn btn-outline add-btn" @click="addToCart(item)">
                  Add to cart
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="section how">
      <div class="container">
        <div class="section-head">
          <h2>From browse to booked</h2>
          <p>One flow for every service type — no separate apps or providers to chase.</p>
        </div>

        <ol class="steps">
          <li v-for="(step, i) in steps" :key="step.title">
            <span class="step-num">0{{ i + 1 }}</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Trust strip -->
    <section class="trust">
      <div class="container trust-inner">
        <p class="trust-lead">Built like ecommerce. Delivered like local service.</p>
        <ul>
          <li><strong>2,400+</strong> verified providers</li>
          <li><strong>48h</strong> average booking window</li>
          <li><strong>4.9★</strong> average service rating</li>
        </ul>
      </div>
    </section>

    <!-- FAQ -->
    <section id="faq" class="section faq">
      <div class="container faq-layout">
        <div class="section-head">
          <h2>Questions, answered</h2>
          <p>How Servora works as a multi-service store.</p>
        </div>
        <div class="faq-list">
          <details v-for="item in faqs" :key="item.q" class="faq-item">
            <summary>{{ item.q }}</summary>
            <p>{{ item.a }}</p>
          </details>
        </div>
      </div>
    </section>

    <!-- Closing CTA -->
    <section class="closing">
      <div class="container closing-inner">
        <h2>Ready to stock your cart with services?</h2>
        <p>Start with a category, pick a package, and checkout once for everything.</p>
        <a href="#marketplace" class="btn btn-primary">Open marketplace</a>
      </div>
    </section>
  </div>
</template>

<script setup>
useHead({
  title: 'Servora — Multi-service marketplace',
  meta: [
    {
      name: 'description',
      content: 'Shop cleaning, repairs, design, wellness, and more from one ecommerce storefront. Book and pay in a single checkout.',
    },
  ],
})

const cartCount = useState('cartCount', () => 0)
const cart = useState('cart', () => [])
const activeCategory = ref('all')

const categories = [
  { id: 'home', name: 'Home care', count: 186, icon: '⌂', accent: '#2d9a68' },
  { id: 'tech', name: 'Tech & repair', count: 94, icon: '⚙', accent: '#1f6b4a' },
  { id: 'creative', name: 'Creative', count: 128, icon: '✦', accent: '#c47a1a' },
  { id: 'wellness', name: 'Wellness', count: 77, icon: '◎', accent: '#3d7a6a' },
  { id: 'learning', name: 'Learning', count: 112, icon: '◈', accent: '#8a6a2a' },
  { id: 'business', name: 'Business', count: 65, icon: '▣', accent: '#245c48' },
]

const services = [
  {
    id: 1,
    categoryId: 'home',
    category: 'Home care',
    title: 'Deep clean apartment package',
    description: 'Kitchen, baths, floors, and dusting — scheduled around your day.',
    price: 2499,
    unit: 'visit',
    duration: '3–4 hrs',
    badge: 'Popular',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 2,
    categoryId: 'tech',
    category: 'Tech & repair',
    title: 'Laptop diagnostics + tune-up',
    description: 'Speed, battery health, malware scan, and on-site fixes when needed.',
    price: 999,
    unit: 'session',
    duration: '90 min',
    badge: 'Same-day',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 3,
    categoryId: 'creative',
    category: 'Creative',
    title: 'Brand kit starter (logo + palette)',
    description: 'Two concepts, final files, and a simple style guide for your store.',
    price: 8999,
    unit: 'project',
    duration: '5 days',
    badge: null,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 4,
    categoryId: 'wellness',
    category: 'Wellness',
    title: 'In-home yoga for beginners',
    description: 'Private session with mats provided — morning or evening slots.',
    price: 1299,
    unit: 'class',
    duration: '60 min',
    badge: null,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 5,
    categoryId: 'learning',
    category: 'Learning',
    title: 'Math tutoring (class 8–12)',
    description: '1:1 video or in-person help with weekly progress notes.',
    price: 799,
    unit: 'hour',
    duration: '1 hr',
    badge: 'Best value',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 6,
    categoryId: 'business',
    category: 'Business',
    title: 'GST filing assist (monthly)',
    description: 'Document checklist, filing, and confirmation shared in your Servora account.',
    price: 1999,
    unit: 'month',
    duration: '48 hrs',
    badge: null,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
  },
]

const steps = [
  {
    title: 'Browse like a store',
    text: 'Filter categories, compare packages, and read ratings the way you shop products.',
  },
  {
    title: 'Add services to cart',
    text: 'Mix home, tech, and creative packages in one cart — pay once at checkout.',
  },
  {
    title: 'Get it delivered',
    text: 'Providers confirm slots; you track status and receipts from a single dashboard.',
  },
]

const faqs = [
  {
    q: 'Is Servora a product store or a service marketplace?',
    a: 'Both patterns in one site: you browse and purchase services with ecommerce-style carts, pricing, and checkout — fulfillment is booking and on-site or remote delivery.',
  },
  {
    q: 'Can I book different service types together?',
    a: 'Yes. Add cleaning, repair, and creative packages to the same cart and checkout once. Each line item schedules with its own provider.',
  },
  {
    q: 'How do payments and refunds work?',
    a: 'You pay through Servora. Funds are released after service confirmation. Cancel within the listed window for a full refund to your original method.',
  },
  {
    q: 'Who can sell on Servora?',
    a: 'Verified local and remote providers. Identity, skill checks, and rating history are required before listings go live.',
  },
]

const filteredServices = computed(() => {
  if (activeCategory.value === 'all') return services
  return services.filter((s) => s.categoryId === activeCategory.value)
})

function addToCart(item) {
  cart.value = [...cart.value, item]
  cartCount.value = cart.value.length
}
</script>

<style scoped>
.hero {
  position: relative;
  min-height: min(92vh, 820px);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  color: var(--paper);
}

.hero-media {
  position: absolute;
  inset: 0;
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: drift 22s ease-in-out infinite;
}

.hero-veil {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(12, 26, 20, 0.35) 0%, rgba(12, 26, 20, 0.55) 40%, rgba(12, 26, 20, 0.88) 100%),
    linear-gradient(90deg, rgba(12, 26, 20, 0.55) 0%, rgba(12, 26, 20, 0.15) 55%, transparent 100%);
}

.hero-content {
  position: relative;
  z-index: 1;
  padding-bottom: clamp(3.5rem, 8vw, 5.5rem);
  padding-top: 8rem;
  max-width: 40rem;
  margin-left: max(calc((100% - 1120px) / 2), 1.25rem);
  margin-right: auto;
  width: min(40rem, calc(100% - 2.5rem));
  animation: rise-in 0.9s var(--ease) both;
}

.brand-signal {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: clamp(2rem, 5vw, 3.25rem);
  letter-spacing: -0.05em;
  margin: 0 0 0.85rem;
  color: var(--sun);
  animation: fade-in 1s var(--ease) 0.15s both;
}

.hero h1 {
  font-family: var(--font-display);
  font-size: clamp(1.85rem, 4.2vw, 3rem);
  font-weight: 700;
  line-height: 1.08;
  letter-spacing: -0.035em;
  margin: 0 0 1rem;
  max-width: 14ch;
}

.hero-lead {
  margin: 0 0 1.75rem;
  font-size: 1.08rem;
  color: rgba(255, 253, 248, 0.82);
  max-width: 34rem;
}

.hero-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.categories {
  background:
    radial-gradient(circle at 10% 20%, rgba(168, 230, 197, 0.35), transparent 40%),
    radial-gradient(circle at 90% 0%, rgba(240, 180, 41, 0.18), transparent 35%),
    var(--cream);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.category-tile {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
  padding: 1.15rem 1.25rem;
  border: 1.5px solid var(--line);
  border-radius: var(--radius);
  background: var(--paper);
  transition: transform 0.35s var(--ease), border-color 0.35s var(--ease), box-shadow 0.35s var(--ease);
}

.category-tile:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  box-shadow: var(--shadow);
}

.cat-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.85rem;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--accent) 18%, white);
  color: var(--accent);
  font-size: 1.2rem;
}

.cat-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.cat-copy strong {
  font-family: var(--font-display);
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.cat-copy span {
  color: var(--muted);
  font-size: 0.88rem;
}

.marketplace {
  background: var(--paper);
}

.market-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1.5rem;
  max-width: none;
}

.market-head .section-head,
.market-head > div:first-child {
  max-width: 38rem;
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  justify-content: flex-end;
  max-width: 28rem;
}

.filter-pills button {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--muted);
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-size: 0.85rem;
  font-weight: 500;
  transition: background 0.25s var(--ease), color 0.25s var(--ease), border-color 0.25s var(--ease);
}

.filter-pills button.active,
.filter-pills button:hover {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--paper);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.35rem;
}

.product {
  display: flex;
  flex-direction: column;
  border: 1.5px solid var(--line);
  border-radius: calc(var(--radius) + 4px);
  overflow: hidden;
  background: var(--cream);
  animation: rise-in 0.7s var(--ease) both;
  transition: transform 0.4s var(--ease), box-shadow 0.4s var(--ease);
}

.product:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow);
}

.product-media {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.product-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.7s var(--ease);
}

.product:hover .product-media img {
  transform: scale(1.06);
}

.badge {
  position: absolute;
  top: 0.85rem;
  left: 0.85rem;
  background: var(--sun);
  color: var(--ink);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
}

.product-body {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1.2rem 1.25rem 1.35rem;
  flex: 1;
}

.product-meta {
  margin: 0;
  font-size: 0.8rem;
  color: var(--moss);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.product-body h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.2rem;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.product-desc {
  margin: 0;
  color: var(--muted);
  font-size: 0.95rem;
  flex: 1;
}

.product-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.price .amount {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: -0.02em;
}

.price .unit {
  color: var(--muted);
  font-size: 0.85rem;
}

.add-btn {
  padding: 0.55rem 0.95rem;
  font-size: 0.88rem;
}

.how {
  background:
    linear-gradient(180deg, var(--cream), #eaf4ee);
}

.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.steps li {
  padding: 1.75rem 1.5rem;
  border-top: 3px solid var(--moss);
}

.step-num {
  display: block;
  font-family: var(--font-display);
  font-weight: 800;
  color: var(--leaf);
  margin-bottom: 0.85rem;
  letter-spacing: -0.03em;
}

.steps h3 {
  margin: 0 0 0.55rem;
  font-family: var(--font-display);
  font-size: 1.3rem;
  letter-spacing: -0.02em;
}

.steps p {
  margin: 0;
  color: var(--muted);
}

.trust {
  background: var(--ink);
  color: var(--paper);
  padding: 2.75rem 0;
}

.trust-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.trust-lead {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 2.5vw, 1.85rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  max-width: 16ch;
}

.trust ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 2rem 2.75rem;
}

.trust li {
  color: rgba(255, 253, 248, 0.7);
  font-size: 0.95rem;
}

.trust strong {
  display: block;
  color: var(--sun);
  font-family: var(--font-display);
  font-size: 1.65rem;
  letter-spacing: -0.03em;
  margin-bottom: 0.2rem;
}

.faq {
  background: var(--paper);
}

.faq-layout {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 3rem;
  align-items: start;
}

.faq-layout .section-head {
  margin-bottom: 0;
  position: sticky;
  top: 6rem;
}

.faq-item {
  border-bottom: 1px solid var(--line);
  padding: 1.1rem 0;
}

.faq-item summary {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.08rem;
  letter-spacing: -0.02em;
  cursor: pointer;
  list-style: none;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item summary::after {
  content: '+';
  font-weight: 500;
  color: var(--moss);
}

.faq-item[open] summary::after {
  content: '–';
}

.faq-item p {
  margin: 0.75rem 0 0.25rem;
  color: var(--muted);
  max-width: 42rem;
}

.closing {
  padding: 5rem 0 6rem;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(45, 154, 104, 0.22), transparent 55%),
    var(--cream);
  text-align: center;
}

.closing-inner {
  max-width: 36rem;
}

.closing h2 {
  font-family: var(--font-display);
  font-size: clamp(1.85rem, 3.5vw, 2.6rem);
  letter-spacing: -0.035em;
  margin: 0 0 0.75rem;
  line-height: 1.12;
}

.closing p {
  margin: 0 0 1.5rem;
  color: var(--muted);
  font-size: 1.05rem;
}

@media (max-width: 960px) {
  .category-grid,
  .product-grid,
  .steps,
  .faq-layout {
    grid-template-columns: 1fr 1fr;
  }

  .faq-layout .section-head {
    position: static;
  }

  .market-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .filter-pills {
    justify-content: flex-start;
    max-width: none;
  }
}

@media (max-width: 640px) {
  .category-grid,
  .product-grid,
  .steps,
  .faq-layout {
    grid-template-columns: 1fr;
  }

  .hero-content {
    margin-left: 1.25rem;
  }

  .product-foot {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
