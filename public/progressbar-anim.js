// progressbar-anim.js
// Animatie voor Style 1 progressbars (groen)

document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const progressBar = entry.target.querySelector('.progress-bar');
        const progressValue = parseInt(entry.target.getAttribute('data-progress')) || 0;
        const label = entry.target.parentElement.querySelector('.progress-value');

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

        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('.ld-progress').forEach(progress => {
    observer.observe(progress);
  });
});
