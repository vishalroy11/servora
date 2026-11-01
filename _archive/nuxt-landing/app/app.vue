<template>
  <div class="app-shell">
    <AppHeader />
    <main>
      <NuxtPage />
    </main>
    <AppFooter />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@600;700;800&display=swap');

:root {
  --ink: #0c1a14;
  --ink-soft: #1a2e24;
  --moss: #1f6b4a;
  --leaf: #2d9a68;
  --mint: #a8e6c5;
  --sun: #f0b429;
  --cream: #f7f3eb;
  --paper: #fffdf8;
  --muted: #5c6b63;
  --line: rgba(12, 26, 20, 0.12);
  --shadow: 0 18px 50px rgba(12, 26, 20, 0.12);
  --radius: 18px;
  --font-display: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: var(--font-body);
  color: var(--ink);
  background: var(--cream);
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  display: block;
}

button {
  font: inherit;
  cursor: pointer;
}

.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.container {
  width: min(1120px, calc(100% - 2.5rem));
  margin-inline: auto;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9rem 1.45rem;
  border-radius: 999px;
  border: 1.5px solid transparent;
  font-weight: 600;
  letter-spacing: 0.01em;
  transition: transform 0.35s var(--ease), background 0.35s var(--ease), color 0.35s var(--ease), border-color 0.35s var(--ease), box-shadow 0.35s var(--ease);
}

.btn:hover {
  transform: translateY(-2px);
}

.btn-primary {
  background: var(--sun);
  color: var(--ink);
  box-shadow: 0 10px 28px rgba(240, 180, 41, 0.35);
}

.btn-primary:hover {
  background: #ffc94a;
  box-shadow: 0 14px 34px rgba(240, 180, 41, 0.45);
}

.btn-ghost {
  background: transparent;
  border-color: rgba(255, 253, 248, 0.45);
  color: var(--paper);
}

.btn-ghost:hover {
  background: rgba(255, 253, 248, 0.1);
  border-color: var(--paper);
}

.btn-outline {
  background: transparent;
  border-color: var(--ink);
  color: var(--ink);
}

.btn-outline:hover {
  background: var(--ink);
  color: var(--paper);
}

.section {
  padding: 5.5rem 0;
}

.section-head {
  max-width: 38rem;
  margin-bottom: 2.75rem;
}

.section-head h2 {
  font-family: var(--font-display);
  font-size: clamp(1.85rem, 3.5vw, 2.75rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0 0 0.75rem;
}

.section-head p {
  margin: 0;
  color: var(--muted);
  font-size: 1.05rem;
}

@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(28px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes drift {
  0%, 100% { transform: scale(1.05) translate(0, 0); }
  50% { transform: scale(1.1) translate(-1.5%, 1%); }
}
</style>
