const modal = document.getElementById('lightbox-modal') as HTMLDialogElement | null;
const titleEl = document.getElementById('lightbox-title');
const priceEl = document.getElementById('lightbox-price');
const contentEl = document.getElementById('lightbox-content');
const prevBtn = document.getElementById('lightbox-prev');
const nextBtn = document.getElementById('lightbox-next');

let images: string[] = [];
let index = 0;
let title = '';

function render() {
  if (!contentEl) return;
  const src = images[index] ?? '';
  contentEl.innerHTML = `<img src="${src}" alt="${title}" class="w-full max-h-[60vh] object-contain rounded-lg bg-base-200" />
    <p class="text-center text-base text-base-content/80">${index + 1} / ${images.length}</p>`;
}

function openFrom(btn: Element) {
  if (!modal || !titleEl || !priceEl) return;
  title = btn.getAttribute('data-title') ?? '';
  const price = btn.getAttribute('data-price') ?? '';
  try {
    images = JSON.parse(btn.getAttribute('data-images') ?? '[]') as string[];
  } catch {
    images = [];
  }
  if (!images.length) return;
  index = 0;
  titleEl.textContent = title;
  priceEl.textContent = price;
  render();
  modal.showModal();
}

document.querySelectorAll('.gallery-item').forEach((btn) => {
  btn.addEventListener('click', () => openFrom(btn));
});

prevBtn?.addEventListener('click', () => {
  if (!images.length) return;
  index = (index - 1 + images.length) % images.length;
  render();
});

nextBtn?.addEventListener('click', () => {
  if (!images.length) return;
  index = (index + 1) % images.length;
  render();
});
