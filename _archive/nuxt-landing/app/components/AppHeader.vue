<template>
  <header class="site-header" :class="{ scrolled: isScrolled }">
    <div class="container header-inner">
      <NuxtLink to="/" class="brand" aria-label="Servora home">
        <span class="brand-mark" aria-hidden="true" />
        <span class="brand-name">Servora</span>
      </NuxtLink>

      <nav class="nav" :class="{ open: menuOpen }" aria-label="Primary">
        <NuxtLink to="/#services" @click="closeMenu">Services</NuxtLink>
        <NuxtLink to="/#marketplace" @click="closeMenu">Marketplace</NuxtLink>
        <NuxtLink to="/#how" @click="closeMenu">How it works</NuxtLink>
        <NuxtLink to="/#faq" @click="closeMenu">FAQ</NuxtLink>
      </nav>

      <div class="header-actions">
        <button class="cart-btn" type="button" aria-label="Open cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6h15l-1.5 9h-12L6 6Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
            <path d="M6 6 5 3H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            <circle cx="9" cy="20" r="1.4" fill="currentColor" />
            <circle cx="18" cy="20" r="1.4" fill="currentColor" />
          </svg>
          <span v-if="cartCount" class="cart-count">{{ cartCount }}</span>
        </button>
        <NuxtLink to="/#marketplace" class="btn btn-primary header-cta" @click="closeMenu">
          Shop services
        </NuxtLink>
        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="menuOpen"
          aria-label="Toggle menu"
          @click="menuOpen = !menuOpen"
        >
          <span />
          <span />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
const menuOpen = ref(false)
const isScrolled = ref(false)
const cartCount = useState('cartCount', () => 0)

function closeMenu() {
  menuOpen.value = false
}

function onScroll() {
  isScrolled.value = window.scrollY > 24
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  transition: background 0.35s var(--ease), box-shadow 0.35s var(--ease), backdrop-filter 0.35s var(--ease);
}

.site-header.scrolled {
  background: rgba(247, 243, 235, 0.88);
  backdrop-filter: blur(14px);
  box-shadow: 0 1px 0 var(--line);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 4.5rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  z-index: 2;
}

.brand-mark {
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 0.4rem;
  background:
    linear-gradient(135deg, var(--leaf) 0%, var(--moss) 55%, var(--sun) 55%, var(--sun) 100%);
  box-shadow: 0 6px 16px rgba(31, 107, 74, 0.35);
}

.brand-name {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.35rem;
  letter-spacing: -0.04em;
}

.nav {
  display: flex;
  align-items: center;
  gap: 1.6rem;
}

.nav a {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--muted);
  transition: color 0.25s var(--ease);
}

.nav a:hover {
  color: var(--ink);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cart-btn {
  position: relative;
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 999px;
  border: 1.5px solid var(--line);
  background: var(--paper);
  color: var(--ink);
  display: grid;
  place-items: center;
  transition: border-color 0.25s var(--ease), transform 0.25s var(--ease);
}

.cart-btn:hover {
  border-color: var(--moss);
  transform: translateY(-1px);
}

.cart-count {
  position: absolute;
  top: -0.2rem;
  right: -0.2rem;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.25rem;
  border-radius: 999px;
  background: var(--sun);
  color: var(--ink);
  font-size: 0.7rem;
  font-weight: 700;
  display: grid;
  place-items: center;
}

.header-cta {
  padding: 0.7rem 1.15rem;
  font-size: 0.92rem;
}

.menu-toggle {
  display: none;
  width: 2.6rem;
  height: 2.6rem;
  border: 0;
  background: transparent;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 0.5rem;
}

.menu-toggle span {
  display: block;
  height: 2px;
  width: 100%;
  background: var(--ink);
  border-radius: 2px;
  transition: transform 0.3s var(--ease);
}

@media (max-width: 860px) {
  .nav {
    position: fixed;
    inset: 0;
    background: var(--cream);
    flex-direction: column;
    justify-content: center;
    gap: 1.75rem;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-8px);
    transition: opacity 0.35s var(--ease), transform 0.35s var(--ease);
  }

  .nav.open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  .nav a {
    font-family: var(--font-display);
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink);
  }

  .header-cta {
    display: none;
  }

  .menu-toggle {
    display: flex;
    z-index: 2;
  }
}
</style>
