<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand">
        <div class="brand-row">
          <span class="brand-mark" aria-hidden="true" />
          <strong>Servora</strong>
        </div>
        <p>One marketplace for every service you need — book, pay, and manage in a single checkout.</p>
      </div>

      <div>
        <h3>Explore</h3>
        <NuxtLink to="/#services">Service categories</NuxtLink>
        <NuxtLink to="/#marketplace">Featured deals</NuxtLink>
        <NuxtLink to="/#how">How it works</NuxtLink>
      </div>

      <div>
        <h3>Support</h3>
        <a href="mailto:hello@servora.example">Contact</a>
        <NuxtLink to="/#faq">FAQ</NuxtLink>
        <a href="#">Provider signup</a>
      </div>

      <div>
        <h3>Stay in the loop</h3>
        <p class="note">New services and weekly drops, straight to your inbox.</p>
        <form class="subscribe" @submit.prevent>
          <label class="sr-only" for="email">Email</label>
          <input id="email" type="email" placeholder="you@email.com" required>
          <button class="btn btn-primary" type="submit">Join</button>
        </form>
      </div>
    </div>

    <div class="container footer-bottom">
      <span>© {{ year }} Servora. All services, one storefront.</span>
      <span>Built for multi-service ecommerce.</span>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.site-footer {
  background: var(--ink);
  color: rgba(255, 253, 248, 0.88);
  padding: 4rem 0 1.5rem;
  margin-top: auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(3, 1fr);
  gap: 2.5rem;
  padding-bottom: 3rem;
  border-bottom: 1px solid rgba(255, 253, 248, 0.12);
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.85rem;
}

.brand-row strong {
  font-family: var(--font-display);
  font-size: 1.25rem;
  letter-spacing: -0.03em;
}

.brand-mark {
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 0.35rem;
  background: linear-gradient(135deg, var(--leaf), var(--sun));
}

.footer-brand p,
.note {
  margin: 0;
  color: rgba(255, 253, 248, 0.62);
  max-width: 26rem;
}

.footer-grid h3 {
  margin: 0 0 1rem;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--mint);
}

.footer-grid a {
  display: block;
  margin-bottom: 0.65rem;
  color: rgba(255, 253, 248, 0.72);
  transition: color 0.25s var(--ease);
}

.footer-grid a:hover {
  color: var(--paper);
}

.subscribe {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.85rem;
}

.subscribe input {
  flex: 1;
  min-width: 0;
  border: 1px solid rgba(255, 253, 248, 0.18);
  background: rgba(255, 253, 248, 0.06);
  color: var(--paper);
  border-radius: 999px;
  padding: 0.8rem 1rem;
  outline: none;
}

.subscribe input::placeholder {
  color: rgba(255, 253, 248, 0.4);
}

.subscribe .btn {
  padding: 0.8rem 1.1rem;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 1.35rem;
  font-size: 0.88rem;
  color: rgba(255, 253, 248, 0.45);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 900px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 560px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
