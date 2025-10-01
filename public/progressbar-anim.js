document.addEventListener("DOMContentLoaded", () => {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.ld-progress-ring').forEach(progressRing => {
        observer.observe(progressRing);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                let progressBar = entry.target.querySelector('.progress-bar');
                let progressValue = parseInt(entry.target.getAttribute('data-progress')) || 0; 
                progressValue = Math.min(progressValue, 100);
                let width = 0;
                let interval = setInterval(() => {
                    if (width >= progressValue) {
                        clearInterval(interval);
                    } else {
                        width++;
                        progressBar.style.width = width + '%';
                    }
                }, 15);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.8 });

    document.querySelectorAll('.ld-progress').forEach(progress => {
        observer.observe(progress);
    });
});
