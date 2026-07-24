const counters = document.querySelectorAll<HTMLElement>('.counter');
if (counters.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const target = Number(el.dataset.target ?? 0);
        const duration = 1500;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          el.textContent = String(Math.floor(progress * target));
          if (progress < 1) requestAnimationFrame(animate);
          else el.textContent = String(target);
        };
        requestAnimationFrame(animate);
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 },
  );
  counters.forEach((el) => observer.observe(el));
} else {
  counters.forEach((el) => {
    el.textContent = el.dataset.target ?? '0';
  });
}
