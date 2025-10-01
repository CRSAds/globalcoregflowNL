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
                let progressValue = parseInt(entry.target.getAttribute('data-progress')) || 0; // Default 0 hoga

                // Ensure max limit is 100%
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


// Function to get scroll percentage
function getScrollPercentage() {
    const scrollTop = window.scrollY; // Amount of page scrolled vertically
    const scrollHeight = document.documentElement.scrollHeight; // Total height of the document
    const clientHeight = document.documentElement.clientHeight; // Visible height of the viewport
    const scrollableHeight = scrollHeight - clientHeight; // Total scrollable height

    return (scrollTop / scrollableHeight) * 100;
}

// Function to update progress bar
function pageProgressBar() {
    const progressBar = document.getElementById('ldPageProgress');
    
    // Check if progress bar exists to avoid errors
    if (!progressBar) return;

    // Get scroll percentage and update progress bar width
    progressBar.style.width = `${getScrollPercentage()}%`;
}

// Function to update progress bar Vertical
function pageProgressBarVertical() {
    const progressBars = document.querySelectorAll("#ldPageProgressVertical .inner-bar");

    // Check if progress bars exist to avoid errors
    if (!progressBars) return;

    // Get scroll percentage
    const scrollPercentage = getScrollPercentage();

    // Loop through all elements and update height
    progressBars.forEach(bar => {
        bar.style.height = `${scrollPercentage}%`;
    });
}

// Back To Top Progress Bar Function
function backtopProgress() {
    const progressPath = document.querySelector(".backtop-progress path");

    // Check if element exists before using `.getTotalLength()`
    if (!progressPath) return;

    const pathLength = progressPath.getTotalLength();

    progressPath.style.strokeDasharray = pathLength;
    progressPath.style.strokeDashoffset = pathLength;

    function updateProgress() {
        let scrollTop = window.scrollY;
        let docHeight = document.documentElement.scrollHeight - window.innerHeight;
        let scrollPercentage = (scrollTop / docHeight) * 100;

        let drawLength = (pathLength * scrollPercentage) / 100;
        progressPath.style.strokeDashoffset = pathLength - drawLength;
    }

    // Ensure the event listener is only added once
    window.addEventListener("scroll", updateProgress);
}

window.addEventListener('scroll', () => {
    pageProgressBar();
    backtopProgress();
    pageProgressBarVertical();
});