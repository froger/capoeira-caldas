const modal = document.getElementById('lightbox-modal') as HTMLDialogElement | null;
const titleEl = document.getElementById('lightbox-title');
const contentEl = document.getElementById('lightbox-content');

document.querySelectorAll('.gallery-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!modal || !titleEl || !contentEl) return;
    const type = btn.getAttribute('data-type');
    const src = btn.getAttribute('data-src') ?? '';
    const youtube = btn.getAttribute('data-youtube') ?? '';
    const title = btn.getAttribute('data-title') ?? '';
    titleEl.textContent = title;
    if (type === 'video' && youtube) {
      contentEl.innerHTML = `<iframe class="w-full aspect-video map-embed" src="https://www.youtube.com/embed/${youtube}" allowfullscreen></iframe>`;
    } else {
      contentEl.innerHTML = `<img src="${src}" alt="${title}" class="w-full rounded-lg" />`;
    }
    modal.showModal();
  });
});
