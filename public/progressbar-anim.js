// progressbar-anim.js
// Animatie voor Style 1 progressbars (groen)

function animateProgressBar(bar) {
  if (!bar) return;
  const progressBar = bar.querySelector('.progress-bar');
  const progressValue = parseInt(bar.getAttribute('data-progress')) || 0;
  const label = bar.parentElement.querySelector('.progress-value');

  let width = 0;
  const interval = setInterval(() => {
    if (width >= progressValue) {
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

// Exporteer naar global zodat coregRenderer ook kan aanroepen
window.animateProgressBar = animateProgressBar;
