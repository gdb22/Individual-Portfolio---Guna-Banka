const menuButton = document.querySelector('[data-menu-btn]');
const navLinks = document.querySelector('[data-nav]');

if (menuButton && navLinks) {
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('open');
  });
}

const yearSpan = document.querySelector('[data-year]');
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

const pageName = window.location.pathname.split('/').pop() || 'index.html';
const pageKeyMap = {
  'index.html': 'home',
  'projects.html': 'projects',
  'about.html': 'about',
  'student-loans.html': 'student-loans',
};
const activePageKey = pageKeyMap[pageName] || 'home';

document.body.dataset.page = activePageKey;

// Project filters (homepage)
const filterButtons = document.querySelectorAll('[data-filter]');
const projectCards = document.querySelectorAll('.project-card[data-category]');
const filterStatus = document.querySelector('#filterStatus');

if (filterButtons.length && projectCards.length) {
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selected = button.getAttribute('data-filter');

      filterButtons.forEach((b) => b.classList.remove('active'));
      button.classList.add('active');

      projectCards.forEach((card) => {
        const category = card.getAttribute('data-category');
        const visible = selected === 'all' || category === selected;
        card.classList.toggle('is-hidden', !visible);
      });

      if (filterStatus) {
        const visibleCount = Array.from(projectCards).filter((card) => !card.classList.contains('is-hidden')).length;
        const label = selected === 'all' ? 'all' : selected;
        filterStatus.textContent = `Showing ${visibleCount} project${visibleCount === 1 ? '' : 's'} for ${label}.`;
      }
    });
  });
}

// Scroll reveal animation + subtle parallax
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const motionPresets = {
  home: {
    parallax: 24,
    revealY: 28,
    revealX: 34,
    scaleStart: 0.94,
    storyThreshold: 0.28,
  },
  projects: {
    parallax: 30,
    revealY: 34,
    revealX: 42,
    scaleStart: 0.92,
    storyThreshold: 0.22,
  },
  about: {
    parallax: 12,
    revealY: 18,
    revealX: 20,
    scaleStart: 0.975,
    storyThreshold: 0.34,
  },
  'student-loans': {
    parallax: 16,
    revealY: 20,
    revealX: 24,
    scaleStart: 0.965,
    storyThreshold: 0.3,
  },
};

const activeMotionPreset = motionPresets[activePageKey] || motionPresets.home;

document.body.style.setProperty('--reveal-distance-y', `${activeMotionPreset.revealY}px`);
document.body.style.setProperty('--reveal-distance-x', `${activeMotionPreset.revealX}px`);
document.body.style.setProperty('--reveal-scale-start', String(activeMotionPreset.scaleStart));

if (!prefersReducedMotion) {
  const revealGroups = [
    { selector: '.hero-copy, .page-hero .container > div:first-child', effect: 'up', stagger: 0 },
    { selector: '.hero-card, .loan-summary-card', effect: 'right', stagger: 0 },
    { selector: '.hero-meta-item, .featured-item', effect: 'up', stagger: 70 },
    { selector: '.section-head-inline, .project-jump-nav', effect: 'up', stagger: 40 },
    { selector: '.card, .project-card', effect: 'scale', stagger: 55 },
    { selector: '.screenshot', effect: 'up', stagger: 70 },
  ];

  const revealTargets = new Set();

  revealGroups.forEach(({ selector, effect, stagger }) => {
    document.querySelectorAll(selector).forEach((node, index) => {
      if (!node.classList.contains('reveal')) {
        node.classList.add('reveal');
      }

      if (!node.dataset.reveal) {
        node.dataset.reveal = effect;
      }

      if (!node.style.getPropertyValue('--reveal-delay')) {
        node.style.setProperty('--reveal-delay', `${index * stagger}ms`);
      }

      revealTargets.add(node);
    });
  });

  const storySections = Array.from(document.querySelectorAll('main .hero, main .page-hero, main .section'));

  storySections.forEach((section, sectionIndex) => {
    section.classList.add('story-section');

    const storyNodes = section.querySelectorAll('.section-head-inline, .card, .project-card, .screenshot');

    storyNodes.forEach((node, nodeIndex) => {
      if (node.classList.contains('hero-card') || node.classList.contains('loan-summary-card')) {
        return;
      }

      if (node.matches('.loan-result-card')) {
        node.dataset.reveal = 'up';
        return;
      }

      const direction = (sectionIndex + nodeIndex) % 2 === 0 ? 'left' : 'right';
      node.dataset.reveal = direction;
    });
  });

  if ('IntersectionObserver' in window && revealTargets.size) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -10% 0px' },
    );

    revealTargets.forEach((node) => revealObserver.observe(node));
  } else {
    revealTargets.forEach((node) => node.classList.add('visible'));
  }

  if ('IntersectionObserver' in window && storySections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('section-in-view', entry.isIntersecting);
        });
      },
      { threshold: activeMotionPreset.storyThreshold, rootMargin: '-10% 0px -12% 0px' },
    );

    storySections.forEach((section) => sectionObserver.observe(section));
  }

  const parallaxNodes = document.querySelectorAll('.hero-grid, .featured-strip, .page-hero .container');

  if (parallaxNodes.length) {
    let ticking = false;

    const updateParallax = () => {
      const viewportHeight = window.innerHeight || 1;

      parallaxNodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
        const clampedProgress = Math.max(0, Math.min(1, progress));
        const offset = (clampedProgress - 0.5) * activeMotionPreset.parallax;
        node.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
      });

      ticking = false;
    };

    const requestParallaxUpdate = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateParallax);
    };

    parallaxNodes.forEach((node) => node.classList.add('scroll-parallax'));

    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
    window.addEventListener('resize', requestParallaxUpdate);
    requestParallaxUpdate();
  }

  const scrollProgress = document.createElement('div');
  scrollProgress.className = 'scroll-progress';
  scrollProgress.setAttribute('aria-hidden', 'true');
  document.body.append(scrollProgress);

  let progressTicking = false;

  const updateScrollProgress = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    scrollProgress.style.setProperty('--scroll-progress', progress.toString());
    progressTicking = false;
  };

  const requestProgressUpdate = () => {
    if (progressTicking) {
      return;
    }

    progressTicking = true;
    window.requestAnimationFrame(updateScrollProgress);
  };

  window.addEventListener('scroll', requestProgressUpdate, { passive: true });
  window.addEventListener('resize', requestProgressUpdate);
  requestProgressUpdate();

  if (activePageKey === 'home') {
    const heroSection = document.querySelector('.hero');
    const heroCopy = document.querySelector('.hero-copy');
    const heroCard = document.querySelector('.hero-card');
    const profilePhoto = document.querySelector('.profile-photo');

    if (heroSection && heroCopy && heroCard) {
      const heroLayers = [
        ...heroCopy.querySelectorAll('.kicker, .hero-intro, h1, .lead, .hero-meta-item, .pill, .btn-row .btn, .hero-supporting-note'),
        profilePhoto,
        heroCard.querySelector('.hero-identity'),
        heroCard.querySelector('h2'),
        ...heroCard.querySelectorAll('li'),
        heroCard.querySelector('.hero-card-footer'),
      ].filter(Boolean);

      heroSection.classList.add('hero-premium');

      heroLayers.forEach((node, index) => {
        node.classList.add('hero-layer');
        node.style.setProperty('--hero-layer-delay', `${120 + index * 55}ms`);
      });

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          heroSection.classList.add('hero-loaded');
        });
      });

      let heroTicking = false;

      const updateHeroDrift = () => {
        const rect = heroSection.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 1;
        const progress = Math.min(1, Math.max(0, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
        const centered = progress - 0.5;

        heroSection.style.setProperty('--hero-copy-shift', `${(centered * -14).toFixed(2)}px`);
        heroSection.style.setProperty('--hero-card-shift', `${(centered * 18).toFixed(2)}px`);
        heroSection.style.setProperty('--hero-photo-shift', `${(centered * 22).toFixed(2)}px`);
        heroSection.style.setProperty('--hero-photo-rotate', `${(centered * 3.2).toFixed(2)}deg`);

        heroTicking = false;
      };

      const requestHeroDriftUpdate = () => {
        if (heroTicking) {
          return;
        }

        heroTicking = true;
        window.requestAnimationFrame(updateHeroDrift);
      };

      window.addEventListener('scroll', requestHeroDriftUpdate, { passive: true });
      window.addEventListener('resize', requestHeroDriftUpdate);
      requestHeroDriftUpdate();
    }
  }
} else {
  document.querySelectorAll('.card, .project-card, .featured-item, .hero-copy, .hero-card, .screenshot').forEach((node) => {
    node.classList.add('visible');
  });
}

// Scroll-spy for in-page section links
const sectionLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && sectionLinks.length && sections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const id = `#${entry.target.id}`;
        sectionLinks.forEach((link) => {
          if (link.getAttribute('href') === id) {
            link.setAttribute('aria-current', 'page');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      });
    },
    { rootMargin: '-40% 0px -45% 0px', threshold: 0.01 },
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

// Mini AI demo simulator (homepage)
const demoTool = document.querySelector('#demoTool');
const demoInput = document.querySelector('#demoInput');
const runDemoButton = document.querySelector('#runDemo');
const resetDemoButton = document.querySelector('#resetDemo');
const demoOutput = document.querySelector('#demoOutput');
const demoStatus = document.querySelector('#demoStatus');

if (demoTool && demoInput && runDemoButton && demoOutput) {
  const cleanSnippet = (text, maxLength = 140) => {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength).trim()}…`;
  };

  const detectMetrics = (text) => /\d|%|percent|users?|projects?|months?|years?|gpa|score|increase|reduced|improved/i.test(text);
  const detectActionVerb = (text) => /\b(built|created|led|organized|designed|developed|improved|launched|managed|analyzed|supported|collaborated)\b/i.test(text);
  const detectOutcome = (text) => /\b(result|impact|improved|increased|reduced|helped|delivered|achieved|grew|saved)\b/i.test(text);

  const renderDemoCard = ({ title, summary, explanation, rewriteTitle, rewrite, reasons, nextSteps }) => {
    demoOutput.innerHTML = `
      <div class="demo-result">
        <p class="demo-result-label">${title}</p>
        <p class="demo-result-summary">${summary}</p>
        <div class="demo-result-section">
          <h4>Plain-language explanation</h4>
          <p>${explanation}</p>
        </div>
        <div class="demo-result-section">
          <h4>${rewriteTitle}</h4>
          <div class="demo-result-rewrite">${rewrite}</div>
        </div>
        <div class="demo-result-section">
          <h4>Why this helps a student</h4>
          <ul class="list-check demo-result-list">
            ${reasons.map((reason) => `<li>${reason}</li>`).join('')}
          </ul>
        </div>
        <div class="demo-result-section">
          <h4>Next step</h4>
          <ul class="list-check demo-result-list">
            ${nextSteps.map((step) => `<li>${step}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  };

  const buildResumeDemo = (inputText) => {
    const hasMetric = detectMetrics(inputText);
    const hasVerb = detectActionVerb(inputText);
    const hasOutcome = detectOutcome(inputText);
    const score = 5.8 + (hasMetric ? 1.2 : 0) + (hasVerb ? 0.8 : 0) + (hasOutcome ? 0.7 : 0) + (inputText.length > 60 ? 0.5 : 0);
    const improvedBullet = `${hasVerb ? cleanSnippet(inputText, 90) : `Built ${cleanSnippet(inputText.toLowerCase(), 72)}`}${hasMetric ? '' : ', improving clarity and showing stronger evidence of impact'}.`;

    renderDemoCard({
      title: `Resume Feedback · ${Math.min(9.4, score).toFixed(1)}/10 readiness score`,
      summary: 'The demo is checking whether your bullet shows action, context, and proof instead of sounding vague.',
      explanation: `Right now, your bullet ${hasVerb ? 'starts with action' : 'needs a stronger action verb'} and ${hasMetric ? 'includes measurable evidence' : 'would be easier to trust if you added a number, time frame, or result'}. Students often undersell their work, so this tool turns a basic bullet into something that sounds more specific and recruiter-friendly.`,
      rewriteTitle: 'Improved resume bullet',
      rewrite: improvedBullet,
      reasons: [
        'It makes your contribution easier to understand in a few seconds.',
        hasMetric ? 'It keeps the evidence that makes the bullet believable.' : 'It highlights where adding a number would make the bullet stronger.',
        'It uses clearer professional language without making the experience sound fake.',
      ],
      nextSteps: [
        hasMetric ? 'Keep the number, but make sure it is accurate and easy to explain in an interview.' : 'Add one number: users helped, hours saved, events run, or percent improvement.',
        hasOutcome ? 'Keep the outcome at the end of the bullet so the result is easy to scan.' : 'End with the result of your work so the bullet shows impact, not just activity.',
      ],
    });
  };

  const buildJobDemo = (inputText) => {
    const normalized = inputText.toLowerCase();
    const keywordGroups = {
      communication: ['communicate', 'communication', 'present', 'collaborate', 'cross-functional'],
      execution: ['build', 'ship', 'execute', 'deliver', 'own', 'manage'],
      analysis: ['analyze', 'data', 'metrics', 'research', 'insights'],
      technical: ['python', 'react', 'sql', 'api', 'ai', 'machine learning'],
    };

    const matchedGroups = Object.entries(keywordGroups)
      .filter(([, words]) => words.some((word) => normalized.includes(word)))
      .map(([group]) => group);

    const friendlySummary = matchedGroups.length
      ? `This role mainly asks for ${matchedGroups.join(', ')}, which means the company wants someone who can contribute quickly and explain their work clearly.`
      : 'This role is asking for someone who can do the work, communicate clearly, and show evidence that they can learn fast.';

    renderDemoCard({
      title: 'Job Translator · Plain-language breakdown',
      summary: 'The demo is translating recruiter language into something a student can act on right away.',
      explanation: `${friendlySummary} Instead of reading the posting like a checklist you already failed, the tool reframes it into signals: what skills matter most, what proof they want, and what you should mirror in your resume or cover letter.`,
      rewriteTitle: 'What this job is really asking for',
      rewrite: `You should show 2-3 examples where you solved a problem, worked with others, and used relevant tools. Mirror important words from the posting, but explain them in your own simple language so your resume sounds clear instead of copied.`,
      reasons: [
        'It reduces intimidating job-post wording into a few understandable themes.',
        'It shows what evidence matters most instead of making students guess.',
        'It helps students tailor their resume without rewriting everything from scratch.',
      ],
      nextSteps: [
        'Underline 3 keywords in the posting and make sure your resume shows proof for each one.',
        `Turn one experience into evidence using this requirement: “${cleanSnippet(inputText, 80)}”.`,
      ],
    });
  };

  const buildCoverLetterDemo = (inputText) => {
    const strongerResponse = `I’m interested in this role because it matches the way I like to work: solving real problems, learning quickly, and turning ideas into useful results. In my experience, ${cleanSnippet(inputText, 110)}, which shows that I can contribute with both initiative and clear communication.`;

    renderDemoCard({
      title: 'Cover Letter Feedback · Stronger draft',
      summary: 'The demo is turning a rough cover letter draft into a clearer message that sounds more confident and easier for recruiters to trust.',
      explanation: 'Students often write cover letters that are too generic or too informal. This tool rewrites the draft so it connects your experience to the role, keeps the tone professional, and makes your value easier to understand without sounding robotic.',
      rewriteTitle: 'Improved cover letter paragraph',
      rewrite: strongerResponse,
      reasons: [
        'It links your experience to the employer’s needs instead of only talking about interest.',
        'It sounds more specific, which makes the response feel more genuine.',
        'It gives recruiters a clearer reason to keep reading your cover letter.',
      ],
      nextSteps: [
        'Replace one general phrase with a specific example or result from your experience.',
        'Read the paragraph out loud and remove any line that sounds too vague or too formal to be natural.',
      ],
    });
  };

  const runDemo = () => {
    const tool = demoTool.value;
    const inputText = demoInput.value.trim();

    if (!inputText) {
      demoOutput.textContent = 'Add input first, then run the demo.';
      if (demoStatus) {
        demoStatus.textContent = 'Input needed before the system can respond.';
      }
      return;
    }

    if (demoStatus) {
      demoStatus.textContent = 'Running demo...';
    }

    runDemoButton.classList.add('is-running');

    window.setTimeout(() => {
      if (tool === 'resume') {
        buildResumeDemo(inputText);
        if (demoStatus) {
          demoStatus.textContent = 'Resume feedback generated with a clearer explanation and rewrite.';
        }
        runDemoButton.classList.remove('is-running');
        return;
      }

      if (tool === 'job') {
        buildJobDemo(inputText);
        if (demoStatus) {
          demoStatus.textContent = 'Job translation generated in plain language for students.';
        }
        runDemoButton.classList.remove('is-running');
        return;
      }

      buildCoverLetterDemo(inputText);
      if (demoStatus) {
        demoStatus.textContent = 'Cover letter feedback generated with a stronger explanation and revision.';
      }
      runDemoButton.classList.remove('is-running');
    }, 280);
  };

  demoTool.addEventListener('change', () => {
    if (demoTool.value === 'resume') {
      demoInput.placeholder = 'Paste a resume bullet like: Managed club events for 50 students...';
      return;
    }

    if (demoTool.value === 'job') {
      demoInput.placeholder = 'Paste a job requirement like: Strong communication skills and experience working with data...';
      return;
    }

    demoInput.placeholder = 'Paste a cover letter draft like: I want this internship because I am hardworking and eager to learn...';
  });

  runDemoButton.addEventListener('click', runDemo);

  if (resetDemoButton) {
    resetDemoButton.addEventListener('click', () => {
      demoInput.value = '';
      demoOutput.textContent = 'Run the demo to see a plain-language explanation, improved version, and clear next step.';
      runDemoButton.classList.remove('is-running');
      if (demoStatus) {
        demoStatus.textContent = 'Ready for input.';
      }
      demoTool.focus();
    });
  }
}

// Back to top
const backToTopButton = document.querySelector('#backToTop');
if (backToTopButton) {
  const toggleBackToTop = () => {
    backToTopButton.classList.toggle('visible', window.scrollY > 520);
  };

  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();

  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Project demo lightbox
const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightboxImage');
const lightboxClose = document.querySelector('#lightboxClose');
const lightboxTriggers = document.querySelectorAll('.screenshot-trigger');
const lightboxCloseTargets = document.querySelectorAll('[data-lightbox-close]');

if (lightbox && lightboxImage && lightboxTriggers.length) {
  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove('has-modal-open');
    lightboxImage.setAttribute('src', '');
    lightboxImage.setAttribute('alt', '');
  };

  lightboxTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      lightboxImage.setAttribute('src', trigger.getAttribute('data-lightbox-src') || '');
      lightboxImage.setAttribute('alt', trigger.getAttribute('data-lightbox-alt') || 'Expanded project demo image');
      lightbox.hidden = false;
      document.body.classList.add('has-modal-open');
      if (lightboxClose) {
        lightboxClose.focus();
      }
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  lightboxCloseTargets.forEach((node) => node.addEventListener('click', closeLightbox));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) {
      closeLightbox();
    }
  });
}

// Student loan estimator
const loanBalanceInput = document.querySelector('#loanBalance');
const loanRangeInput = document.querySelector('#loanRange');
const calculateLoanButton = document.querySelector('#calculateLoan');
const resetLoanButton = document.querySelector('#resetLoan');
const loanYears = document.querySelector('#loanYears');
const loanRangeMatch = document.querySelector('#loanRangeMatch');
const loanAverageCompare = document.querySelector('#loanAverageCompare');
const loanMonthlyPace = document.querySelector('#loanMonthlyPace');
const loanWindowText = document.querySelector('#loanWindowText');
const loanStatus = document.querySelector('#loanStatus');

if (
  loanBalanceInput &&
  loanRangeInput &&
  calculateLoanButton &&
  resetLoanButton &&
  loanYears &&
  loanRangeMatch &&
  loanAverageCompare &&
  loanMonthlyPace &&
  loanWindowText
) {
  const average2025Balance = 39550;
  const ranges = [
    { min: 0, max: 9999, years: 5, label: '$0 to $9,999', window: 'Short repayment window' },
    { min: 10000, max: 19999, years: 10, label: '$10,000 to $19,999', window: 'Moderate repayment window' },
    { min: 20000, max: 39999, years: 20, label: '$20,000 to $39,999', window: 'Long-term repayment window' },
    { min: 40000, max: 59999, years: 25, label: '$40,000 to $59,999', window: 'Extended repayment window' },
    { min: 60000, max: 500000, years: 30, label: '$60,000+', window: 'Very long repayment window' },
  ];

  const syncLoanInputs = (value) => {
    loanBalanceInput.value = value;
    loanRangeInput.value = value;
  };

  const estimateLoan = () => {
    const balance = Math.max(0, Number(loanBalanceInput.value) || 0);
    syncLoanInputs(balance);

    const matchedRange = ranges.find((range) => balance >= range.min && balance <= range.max) || ranges[ranges.length - 1];
    const monthlyPace = matchedRange.years > 0 ? Math.round(balance / (matchedRange.years * 12)) : 0;
    const delta = balance - average2025Balance;

    loanYears.textContent = `~${matchedRange.years} years`;
    loanRangeMatch.textContent = matchedRange.label;
    loanWindowText.textContent = matchedRange.window;
    loanMonthlyPace.textContent = `Principal-only pace: about $${monthlyPace}/mo over ${matchedRange.years} years.`;

    if (Math.abs(delta) < 1500) {
      loanAverageCompare.textContent = 'Right at the average';
    } else if (delta > 0) {
      loanAverageCompare.textContent = 'Above the 2025 average';
    } else {
      loanAverageCompare.textContent = 'Below the 2025 average';
    }

    if (loanStatus) {
      loanStatus.textContent = `Estimated repayment window updated for $${balance.toLocaleString()}.`;
    }
  };

  loanBalanceInput.addEventListener('input', () => syncLoanInputs(loanBalanceInput.value));
  loanRangeInput.addEventListener('input', () => syncLoanInputs(loanRangeInput.value));
  calculateLoanButton.addEventListener('click', estimateLoan);
  resetLoanButton.addEventListener('click', () => {
    syncLoanInputs(39550);
    estimateLoan();
  });

  estimateLoan();
}
