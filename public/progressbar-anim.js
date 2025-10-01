// progressbar-anim.js
// Animatie voor Style 1 progressbars (groen)
// ✅ Fix: progressbar loopt nu verder vanaf huidige breedte i.p.v. elke keer vanaf 0

function animateProgressBar(bar) {
  if (!bar) return;
  const progressBar = bar.querySelector('.progress-bar');
  const targetValue = parseInt(bar.getAttribute('data-progress')) || 0;
  const label = bar.parentElement.querySelector('.progress-value');

  // ✅ Start vanaf huidige breedte
  let width = parseInt(progressBar.style.width) || 0;

  // Als huidige breedte al gelijk of groter is, direct updaten en klaar
  if (width >= targetValue) {
    if (label) label.textContent = targetValue + '%';
    progressBar.style.width = targetValue + '%';
    return;
  }

  const interval = setInterval(() => {
    if (width >= targetValue) {
      clearInterval(interval);
    } else {
      width++;
      progressBar.style.width = width + '%';
      if (label) label.textContent = width + '%';
    }
  }, 15);
}

document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateProgressBar(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.ld-progress').forEach(progress => {
    observer.observe(progress);
  });
});

// ✅ Exporteer naar global zodat coregRenderer ook kan aanroepen
window.animateProgressBar = animateProgressBar;
