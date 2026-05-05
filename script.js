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
  const escapeHtml = (value) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const cleanSnippet = (text, maxLength = 140) => {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLength) {
      return normalized;
    }

    return `${normalized.slice(0, maxLength).trim()}…`;
  };

  const listWords = (items) => {
    if (!items.length) {
      return '';
    }

    if (items.length === 1) {
      return items[0];
    }

    if (items.length === 2) {
      return `${items[0]} and ${items[1]}`;
    }

    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
  };

  const splitSentences = (text) =>
    text
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

  const extractTopKeywords = (text, limit = 5) => {
    const stopWords = new Set([
      'about',
      'after',
      'again',
      'against',
      'along',
      'also',
      'because',
      'being',
      'build',
      'built',
      'cover',
      'could',
      'draft',
      'experience',
      'have',
      'into',
      'internship',
      'letter',
      'more',
      'most',
      'role',
      'resume',
      'skills',
      'strong',
      'student',
      'team',
      'that',
      'this',
      'with',
      'work',
      'worked',
      'would',
      'your',
    ]);

    const counts = new Map();
    const words = text.toLowerCase().match(/[a-z][a-z-]{2,}/g) || [];

    words.forEach((word) => {
      if (stopWords.has(word)) {
        return;
      }

      counts.set(word, (counts.get(word) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([word]) => word);
  };

  const detectMetrics = (text) => /\d|%|percent|users?|projects?|months?|years?|gpa|score|increase|reduced|improved/i.test(text);
  const detectActionVerb = (text) => /\b(built|created|led|organized|designed|developed|improved|launched|managed|analyzed|supported|collaborated)\b/i.test(text);
  const detectOutcome = (text) => /\b(result|impact|improved|increased|reduced|helped|delivered|achieved|grew|saved)\b/i.test(text);
  const detectContext = (text) => /\b(using|with|for|through|across|by|serving|supporting|leading|managing)\b/i.test(text);

  const strengthenResumeOpening = (text) => {
    const replacements = [
      { pattern: /^i\s+/i, replacement: '' },
      { pattern: /^helped\b/i, replacement: 'Supported' },
      { pattern: /^worked on\b/i, replacement: 'Contributed to' },
      { pattern: /^responsible for\b/i, replacement: 'Managed' },
      { pattern: /^assisted with\b/i, replacement: 'Supported' },
      { pattern: /^participated in\b/i, replacement: 'Contributed to' },
      { pattern: /^did\b/i, replacement: 'Completed' },
    ];

    let updated = text.trim();

    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(updated)) {
        updated = updated.replace(pattern, replacement);
      }
    });

    return updated.charAt(0).toUpperCase() + updated.slice(1);
  };

  const renderDemoCard = ({
    title,
    summary,
    explanation,
    rewriteTitle,
    rewrite,
    firstListTitle,
    firstListItems,
    secondListTitle,
    secondListItems,
  }) => {
    demoOutput.innerHTML = `
      <div class="demo-result">
        <p class="demo-result-label">${escapeHtml(title)}</p>
        <p class="demo-result-summary">${escapeHtml(summary)}</p>
        <div class="demo-result-section">
          <h4>Plain-language explanation</h4>
          <p>${escapeHtml(explanation)}</p>
        </div>
        <div class="demo-result-section">
          <h4>${escapeHtml(rewriteTitle)}</h4>
          <div class="demo-result-rewrite">${escapeHtml(rewrite)}</div>
        </div>
        <div class="demo-result-section">
          <h4>${escapeHtml(firstListTitle)}</h4>
          <ul class="list-check demo-result-list">
            ${firstListItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
        <div class="demo-result-section">
          <h4>${escapeHtml(secondListTitle)}</h4>
          <ul class="list-check demo-result-list">
            ${secondListItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
  };

  const normalizeFeedbackPayload = (payload, tool) => {
    const fallbackTitles = {
      resume: 'Resume Feedback · Live review',
      job: 'Job Translator · Live review',
      'cover-letter': 'Cover Letter Feedback · Live review',
    };

    return {
      title: payload.title || fallbackTitles[tool] || 'AI Feedback',
      summary: payload.summary || 'Feedback generated from your input.',
      explanation: payload.explanation || 'The system reviewed your input and returned structured guidance.',
      rewriteTitle: payload.rewriteTitle || 'Suggested revision',
      rewrite: payload.rewrite || cleanSnippet(payload.input || '', 220),
      firstListTitle: payload.firstListTitle || 'What is working',
      firstListItems: Array.isArray(payload.firstListItems) && payload.firstListItems.length
        ? payload.firstListItems
        : ['The response identified at least one useful strength to keep.'],
      secondListTitle: payload.secondListTitle || 'What to improve next',
      secondListItems: Array.isArray(payload.secondListItems) && payload.secondListItems.length
        ? payload.secondListItems
        : ['The response identified at least one practical next improvement.'],
    };
  };

  const requestLiveFeedback = async (tool, inputText) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tool, input: inputText }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Feedback API returned ${response.status}`);
      }

      const payload = await response.json();

      if (!payload || typeof payload !== 'object') {
        throw new Error('Feedback API returned an invalid payload.');
      }

      return payload;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const buildResumeDemo = (inputText) => {
    const normalized = cleanSnippet(inputText, 240);
    const hasMetric = detectMetrics(inputText);
    const hasVerb = detectActionVerb(inputText);
    const hasOutcome = detectOutcome(inputText);
    const hasContext = detectContext(inputText);
    const hasWeakOpening = /^(helped|worked on|responsible for|assisted with|participated in)\b/i.test(inputText.trim());
    const isTooLong = cleanSnippet(inputText, 999).length > 145;
    const score = 4.9 + (hasVerb ? 1 : 0) + (hasMetric ? 1.2 : 0) + (hasOutcome ? 0.9 : 0) + (hasContext ? 0.7 : 0) - (hasWeakOpening ? 0.5 : 0);
    const rewrittenCore = strengthenResumeOpening(normalized).replace(/[.\s]+$/, '');
    const rewriteNotes = [];

    if (!hasMetric) {
      rewriteNotes.push('add a measurable result if available');
    }

    if (!hasOutcome) {
      rewriteNotes.push('end with the impact or result');
    }

    const improvedBullet = `${rewrittenCore}${rewriteNotes.length ? ` [${rewriteNotes.join('; ')}]` : ''}.`;
    const workingItems = [];
    const improvementItems = [];

    if (hasVerb) {
      workingItems.push('The bullet already includes action, which makes your role easier to understand quickly.');
    }

    if (hasContext) {
      workingItems.push('It gives some context about the work, so the reader is not left guessing what the task involved.');
    }

    if (hasMetric) {
      workingItems.push('There is measurable proof in the line, which makes the achievement more believable.');
    }

    if (!workingItems.length) {
      workingItems.push('The bullet points to a real responsibility or experience, so there is something useful to build on.');
    }

    if (!hasVerb) {
      improvementItems.push('Start with a stronger action verb so the bullet sounds owned rather than passive.');
    }

    if (!hasMetric) {
      improvementItems.push('Add one number, time frame, or scale marker so the reader can judge scope or impact.');
    }

    if (!hasOutcome) {
      improvementItems.push('Show what changed because of your work, not just what you were assigned to do.');
    }

    if (isTooLong) {
      improvementItems.push('Trim filler words so the strongest action and result are visible in the first scan.');
    }

    if (!improvementItems.length) {
      improvementItems.push('Tailor the wording to the internship by matching one or two keywords from the target role.');
    }

    renderDemoCard({
      title: `Resume Feedback · ${Math.min(9.4, score).toFixed(1)}/10 readiness score`,
      summary: hasMetric && hasOutcome
        ? 'This bullet has a solid base, but the wording can still become sharper and easier to scan.'
        : 'This bullet shows experience, but it still needs stronger proof and clearer impact to stand out.',
      explanation: `The feedback is checking for four things: action, context, evidence, and outcome. In your current line, ${hasVerb ? 'the action is visible' : 'the action is still too soft'}, ${hasContext ? 'the reader gets some context' : 'the context is still thin'}, ${hasMetric ? 'there is measurable proof' : 'there is no concrete measurement yet'}, and ${hasOutcome ? 'the result is fairly clear' : 'the result is not obvious yet'}. Good resume bullets help a recruiter understand contribution and impact in one quick read.`,
      rewriteTitle: 'Improved resume bullet',
      rewrite: improvedBullet,
      firstListTitle: 'What is already working',
      firstListItems: workingItems,
      secondListTitle: 'What to improve next',
      secondListItems: improvementItems,
    });
  };

  const buildJobDemo = (inputText) => {
    const normalized = inputText.toLowerCase();
    const keywordGroups = {
      communication: ['communicate', 'communication', 'present', 'collaborate', 'cross-functional', 'stakeholder'],
      execution: ['build', 'ship', 'execute', 'deliver', 'own', 'manage', 'coordinate'],
      analysis: ['analyze', 'analysis', 'data', 'metrics', 'research', 'insights', 'reporting'],
      technical: ['python', 'react', 'sql', 'excel', 'api', 'ai', 'machine learning', 'tableau'],
    };
    const responsibilities = ['support', 'create', 'develop', 'maintain', 'design', 'lead', 'improve', 'prepare'];
    const matchedGroups = Object.entries(keywordGroups)
      .filter(([, words]) => words.some((word) => normalized.includes(word)))
      .map(([group]) => group);
    const matchedResponsibilities = responsibilities.filter((word) => normalized.includes(word));
    const topKeywords = extractTopKeywords(inputText, 4);
    const yearsMatch = inputText.match(/(\d+)\+?\s*(years?|yrs?)/i);
    const skillSignals = [];
    const responseSteps = [];

    if (matchedGroups.includes('technical')) {
      skillSignals.push('There is a clear technical expectation, so your application should show tools, systems, or projects you have actually used.');
    }

    if (matchedGroups.includes('analysis')) {
      skillSignals.push('The posting emphasizes analysis, which means the employer likely cares about how you interpret information, not just that you can collect it.');
    }

    if (matchedGroups.includes('communication')) {
      skillSignals.push('Communication is part of the role, so you should show examples of presenting, collaborating, or explaining work clearly.');
    }

    if (matchedResponsibilities.length) {
      skillSignals.push(`The verbs in the posting suggest ownership around ${listWords(matchedResponsibilities.slice(0, 3))}, so the company is likely hiring for execution, not just interest.`);
    }

    if (!skillSignals.length) {
      skillSignals.push('The posting reads like a mix of skills, execution, and communication, so the strongest response will connect your experience to each of those signals directly.');
    }

    responseSteps.push(`Mirror the strongest requirements in your own words, especially around ${listWords((topKeywords.length ? topKeywords : ['problem-solving', 'communication', 'execution']).slice(0, 3))}.`);
    responseSteps.push('Choose 2 or 3 experiences that prove fit, rather than trying to answer every line in the posting equally.');

    if (yearsMatch) {
      responseSteps.push(`If the role asks for ${yearsMatch[1]} ${yearsMatch[2]}, show adjacent proof such as projects, leadership, coursework, or internships that reduce the perceived experience gap.`);
    } else {
      responseSteps.push('If you do not meet every requirement, focus on transferable proof and explain how quickly you can contribute.');
    }

    const plainLanguageBreakdown = [];

    if (matchedGroups.includes('technical')) {
      plainLanguageBreakdown.push('use relevant tools confidently');
    }

    if (matchedGroups.includes('analysis')) {
      plainLanguageBreakdown.push('turn information into useful decisions');
    }

    if (matchedGroups.includes('communication')) {
      plainLanguageBreakdown.push('communicate clearly with other people');
    }

    if (matchedGroups.includes('execution')) {
      plainLanguageBreakdown.push('follow through on work with ownership');
    }

    const friendlySummary = plainLanguageBreakdown.length
      ? `In plain language, this role expects someone who can ${listWords(plainLanguageBreakdown)}.`
      : 'In plain language, this role expects someone who can learn quickly, execute reliably, and explain their work clearly.';

    renderDemoCard({
      title: 'Job Translator · Plain-language breakdown',
      summary: 'This feedback turns the posting into priorities: what matters most, what proof is expected, and how a student should respond.',
      explanation: `${friendlySummary} Instead of treating the job description like a list of reasons to self-reject, the feedback breaks it into signals: the skills being tested, the kind of examples the employer probably wants to see, and where you should focus tailoring effort first.`,
      rewriteTitle: 'What this job is really asking for',
      rewrite: `${friendlySummary} The strongest application will not repeat the posting word-for-word; it will prove fit with one or two clear examples that match the employer's priorities.`,
      firstListTitle: 'What this role emphasizes',
      firstListItems: skillSignals,
      secondListTitle: 'How to respond to it',
      secondListItems: responseSteps,
    });
  };

  const buildCoverLetterDemo = (inputText) => {
    const normalized = cleanSnippet(inputText, 280);
    const sentences = splitSentences(normalized);
    const genericPatterns = [
      /hard\s*worker/i,
      /passionate/i,
      /eager to learn/i,
      /excited about/i,
      /great fit/i,
      /believe i am/i,
      /fast learner/i,
    ];
    const genericHits = genericPatterns.filter((pattern) => pattern.test(inputText));
    const hasRoleConnection = /\b(role|position|internship|team|company|organization|mission)\b/i.test(inputText);
    const hasEvidence = detectMetrics(inputText) || detectActionVerb(inputText) || /\b(project|experience|research|team|lead|manage|build|develop)\b/i.test(inputText);
    const evidenceSentence =
      sentences.find((sentence) => detectMetrics(sentence) || detectActionVerb(sentence) || /\b(project|research|team|experience|lead|manage|build|develop)\b/i.test(sentence)) ||
      sentences[0] ||
      normalized;

    const roleSentence =
      sentences.find((sentence) => /\b(role|position|internship|team|company|organization|mission)\b/i.test(sentence)) ||
      sentences[0] ||
      normalized;

    const cleanedRoleSentence = roleSentence
      .replace(/\bI am excited about\b/gi, 'I am interested in')
      .replace(/\bI believe I am\b/gi, 'I believe my experience is')
      .replace(/\bI want\b/gi, 'I am applying');

    const strongerResponse = hasEvidence
      ? `${cleanSnippet(cleanedRoleSentence, 140)} ${cleanSnippet(evidenceSentence, 140)} Together, they show a more credible reason that you fit the role.`
      : `${cleanSnippet(cleanedRoleSentence, 140)} I would strengthen this paragraph by adding one specific example from a project, internship, leadership role, or class assignment to prove why you fit.`;

    const workingItems = [];
    const improvementItems = [];

    if (hasRoleConnection) {
      workingItems.push('The draft already points toward the role or opportunity, so it has a direction to build on.');
    }

    if (hasEvidence) {
      workingItems.push('There is at least one detail that can be turned into a credible example, which is the strongest part of a cover letter.');
    }

    if (!workingItems.length) {
      workingItems.push('The draft shows interest, which is a useful starting point, but it still needs more proof to feel persuasive.');
    }

    if (genericHits.length) {
      improvementItems.push('Replace generic phrases like “hard worker” or “eager to learn” with evidence from a real experience.');
    }

    if (!hasEvidence) {
      improvementItems.push('Add one concrete example so the letter proves fit instead of only claiming it.');
    }

    if (!hasRoleConnection) {
      improvementItems.push('Make the connection to the role, team, or company more explicit so the letter does not feel reusable.');
    }

    improvementItems.push('Keep the tone professional, but make sure the paragraph still sounds like a person and not a template.');

    renderDemoCard({
      title: 'Cover Letter Feedback · Stronger draft',
      summary: 'This feedback is trying to make the paragraph more credible by connecting your interest to actual evidence and clearer role fit.',
      explanation: `Strong cover letter feedback checks for three things: whether the paragraph sounds tailored, whether it includes proof, and whether the tone feels confident without becoming generic. In your draft, ${hasRoleConnection ? 'the role connection is present' : 'the role connection is still too vague'}, ${hasEvidence ? 'there is at least one usable example' : 'there is not enough concrete evidence yet'}, and ${genericHits.length ? 'some phrases still sound generic' : 'the wording is mostly specific enough to build on'}.`,
      rewriteTitle: 'Improved cover letter paragraph',
      rewrite: strongerResponse,
      firstListTitle: 'What is already helping',
      firstListItems: workingItems,
      secondListTitle: 'What to strengthen next',
      secondListItems: improvementItems,
    });
  };

  const runDemo = async () => {
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

    try {
      const payload = await requestLiveFeedback(tool, inputText);
      renderDemoCard(normalizeFeedbackPayload(payload, tool));

      if (demoStatus) {
        demoStatus.textContent = 'Live AI feedback generated from the API.';
      }
    } catch (error) {
      if (tool === 'resume') {
        buildResumeDemo(inputText);
        if (demoStatus) {
          demoStatus.textContent = 'Using built-in resume feedback. Connect the API for live AI reviews.';
        }
      } else if (tool === 'job') {
        buildJobDemo(inputText);
        if (demoStatus) {
          demoStatus.textContent = 'Using built-in job translation. Connect the API for live AI reviews.';
        }
      } else {
        buildCoverLetterDemo(inputText);
        if (demoStatus) {
          demoStatus.textContent = 'Using built-in cover letter feedback. Connect the API for live AI reviews.';
        }
      }

      console.warn('Falling back to local demo feedback:', error);
    } finally {
      runDemoButton.classList.remove('is-running');
    }
  };

  demoTool.addEventListener('change', () => {
    if (demoTool.value === 'resume') {
      demoInput.placeholder = 'Paste 1-3 resume bullets or a short experience line like: Helped organize 4 campus events for 50 students...';
      return;
    }

    if (demoTool.value === 'job') {
      demoInput.placeholder = 'Paste a job requirement or short job description like: Strong communication skills and experience working with data...';
      return;
    }

    demoInput.placeholder = 'Paste 2-4 cover letter sentences like: I am interested in this internship because...';
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

// Portfolio chatbot (homepage)
const chatForm = document.querySelector('#chatForm');
const chatInput = document.querySelector('#chatInput');
const chatMessages = document.querySelector('#chatMessages');
const chatStatus = document.querySelector('#chatStatus');
const sendChatButton = document.querySelector('#sendChat');
const chatSuggestionButtons = document.querySelectorAll('[data-chat-suggestion]');

if (chatForm && chatInput && chatMessages && chatStatus && sendChatButton) {
  const chatHistory = [];

  const escapeChatHtml = (value) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const renderChatMessage = (role, content) => {
    const article = document.createElement('article');
    article.className = `chat-message ${role === 'assistant' ? 'chat-message-assistant' : 'chat-message-user'}`;
    article.innerHTML = `
      <p class="chat-role">${role === 'assistant' ? 'Portfolio Assistant' : 'You'}</p>
      <p>${escapeChatHtml(content)}</p>
    `;
    chatMessages.append(article);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  const renderSuggestedQuestions = (questions) => {
    if (!Array.isArray(questions) || !questions.length) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-followups';
    wrapper.innerHTML = `
      <p class="chat-followups-label">Suggested follow-up questions</p>
      <div class="chat-followups-list">
        ${questions
          .map(
            (question) =>
              `<button class="chat-followup" type="button" data-chat-followup="${escapeChatHtml(question)}">${escapeChatHtml(question)}</button>`,
          )
          .join('')}
      </div>
    `;

    chatMessages.append(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    wrapper.querySelectorAll('[data-chat-followup]').forEach((button) => {
      button.addEventListener('click', () => {
        chatInput.value = button.getAttribute('data-chat-followup') || '';
        chatInput.focus();
      });
    });
  };

  const requestChatReply = async (message) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          messages: chatHistory.slice(-6),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Chat API returned ${response.status}`);
      }

      const payload = await response.json();

      if (!payload || typeof payload.answer !== 'string') {
        throw new Error('Chat API returned an invalid payload.');
      }

      return payload;
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const setChatLoading = (isLoading) => {
    sendChatButton.classList.toggle('is-running', isLoading);
    sendChatButton.disabled = isLoading;
    chatInput.disabled = isLoading;
  };

  const submitChat = async (message) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      chatStatus.textContent = 'Type a question before sending.';
      return;
    }

    renderChatMessage('user', trimmedMessage);
    chatHistory.push({ role: 'user', content: trimmedMessage });
    chatInput.value = '';
    chatStatus.textContent = 'Thinking...';
    setChatLoading(true);

    try {
      const payload = await requestChatReply(trimmedMessage);
      renderChatMessage('assistant', payload.answer);
      chatHistory.push({ role: 'assistant', content: payload.answer });
      renderSuggestedQuestions(payload.suggestedQuestions);
      chatStatus.textContent = 'Reply generated.';
    } catch (error) {
      const fallbackAnswer = 'The live portfolio chatbot is unavailable right now. Once the Vercel API route is active, I can answer questions about Guna’s projects, workflow, and portfolio direction.';
      renderChatMessage('assistant', fallbackAnswer);
      chatHistory.push({ role: 'assistant', content: fallbackAnswer });
      chatStatus.textContent = 'Chat API unavailable. Showing fallback assistant message.';
      console.warn('Portfolio chat fallback:', error);
    } finally {
      setChatLoading(false);
      chatInput.focus();
    }
  };

  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    submitChat(chatInput.value);
  });

  chatSuggestionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const prompt = button.getAttribute('data-chat-suggestion') || '';
      chatInput.value = prompt;
      chatInput.focus();
    });
  });
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
const loanBalanceDisplay = document.querySelector('#loanBalanceDisplay');
const calculateLoanButton = document.querySelector('#calculateLoan');
const resetLoanButton = document.querySelector('#resetLoan');
const loanMonthlyPayment = document.querySelector('#loanMonthlyPayment');
const loanPaymentDetail = document.querySelector('#loanPaymentDetail');
const loanYears = document.querySelector('#loanYears');
const loanRangeMatch = document.querySelector('#loanRangeMatch');
const loanAverageCompare = document.querySelector('#loanAverageCompare');
const loanMonthlyPace = document.querySelector('#loanMonthlyPace');
const loanTotalPaid = document.querySelector('#loanTotalPaid');
const loanCostBreakdown = document.querySelector('#loanCostBreakdown');
const loanWindowText = document.querySelector('#loanWindowText');
const loanStatus = document.querySelector('#loanStatus');

if (
  loanBalanceInput &&
  loanRangeInput &&
  loanBalanceDisplay &&
  calculateLoanButton &&
  resetLoanButton &&
  loanMonthlyPayment &&
  loanPaymentDetail &&
  loanYears &&
  loanRangeMatch &&
  loanAverageCompare &&
  loanMonthlyPace &&
  loanTotalPaid &&
  loanCostBreakdown &&
  loanWindowText
) {
  const average2025Balance = 39550;
  const benchmarkApr = 6.53;
  const ranges = [
    { min: 0, max: 9999, years: 7, label: '$0 to $9,999', window: 'Smaller balances can often be cleared on a shorter plan.' },
    { min: 10000, max: 19999, years: 10, label: '$10,000 to $19,999', window: 'This estimate uses a standard-style 10-year repayment window.' },
    { min: 20000, max: 39999, years: 15, label: '$20,000 to $39,999', window: 'This estimate uses a longer plan to keep the monthly payment more manageable.' },
    { min: 40000, max: 59999, years: 20, label: '$40,000 to $59,999', window: 'Balances in this range often require a longer payoff window to reduce monthly strain.' },
    { min: 60000, max: 500000, years: 25, label: '$60,000+', window: 'Larger balances typically need an extended repayment horizon to stay affordable.' },
  ];

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: value >= 100 ? 0 : 2,
    }).format(value);

  const formatMonthYear = (date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date);

  const describeTerm = (months) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (!remainingMonths) {
      return `${years} year${years === 1 ? '' : 's'}`;
    }

    return `${years} year${years === 1 ? '' : 's'} ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
  };

  const updateRangeProgress = (value) => {
    const min = Number(loanRangeInput.min) || 0;
    const max = Number(loanRangeInput.max) || 1;
    const progress = ((value - min) / (max - min)) * 100;
    loanRangeInput.style.background = `linear-gradient(90deg, var(--brand) 0%, var(--brand) ${progress}%, rgba(148, 163, 184, 0.28) ${progress}%, rgba(148, 163, 184, 0.28) 100%)`;
  };

  const calculateAmortizedPayment = (principal, annualRate, months) => {
    if (principal <= 0 || months <= 0) {
      return 0;
    }

    const monthlyRate = annualRate / 100 / 12;

    if (!monthlyRate) {
      return principal / months;
    }

    return principal * (monthlyRate / (1 - (1 + monthlyRate) ** -months));
  };

  const getMatchedRange = (balance) => ranges.find((range) => balance >= range.min && balance <= range.max) || ranges[ranges.length - 1];

  const syncLoanInputs = (value) => {
    const numericValue = Math.min(Number(loanRangeInput.max), Math.max(Number(loanRangeInput.min), Number(value) || 0));
    loanBalanceInput.value = numericValue;
    loanRangeInput.value = numericValue;
    loanBalanceDisplay.textContent = `${formatCurrency(numericValue)} selected`;
    updateRangeProgress(numericValue);
  };

  const updateLoanPreview = () => {
    const balance = Math.max(0, Number(loanBalanceInput.value) || 0);
    syncLoanInputs(balance);
    const matchedRange = getMatchedRange(balance);

    if (loanStatus) {
      loanStatus.textContent = `Selected ${formatCurrency(balance)}. Click Estimate payoff to calculate monthly payment, payoff date, and interest.`;
    }

    loanRangeMatch.textContent = `Preview: ${matchedRange.label}`;
  };

  const estimateLoan = () => {
    const balance = Math.max(0, Number(loanBalanceInput.value) || 0);
    syncLoanInputs(balance);

    const matchedRange = getMatchedRange(balance);
    const months = matchedRange.years * 12;
    const monthlyPayment = calculateAmortizedPayment(balance, benchmarkApr, months);
    const totalPaid = monthlyPayment * months;
    const interestPaid = Math.max(0, totalPaid - balance);
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);

    const averageMonthlyPayment = calculateAmortizedPayment(average2025Balance, benchmarkApr, months);
    const differenceFromAverage = balance - average2025Balance;
    const differencePercent = average2025Balance ? Math.abs(differenceFromAverage / average2025Balance) * 100 : 0;
    const delta = balance - average2025Balance;

    loanMonthlyPayment.textContent = `${formatCurrency(monthlyPayment)}/mo`;
    loanPaymentDetail.textContent = `Assumes a ${benchmarkApr.toFixed(2)}% fixed benchmark APR over ${describeTerm(months)}.`;
    loanYears.textContent = describeTerm(months);
    loanWindowText.textContent = `Estimated payoff date: ${formatMonthYear(payoffDate)}. ${matchedRange.window}`;
    loanTotalPaid.textContent = `${formatCurrency(totalPaid)} total`;
    loanCostBreakdown.textContent = `That includes about ${formatCurrency(interestPaid)} in estimated interest on top of the original ${formatCurrency(balance)} balance.`;
    loanRangeMatch.textContent = `Current estimate uses the ${matchedRange.label} balance band and a ${matchedRange.years}-year repayment window.`;

    if (Math.abs(delta) < 1500) {
      loanAverageCompare.textContent = 'Right at the 2025 average balance';
    } else if (delta > 0) {
      loanAverageCompare.textContent = `${differencePercent.toFixed(0)}% above the 2025 average balance`;
    } else {
      loanAverageCompare.textContent = `${differencePercent.toFixed(0)}% below the 2025 average balance`;
    }

    loanMonthlyPace.textContent = `At the same ${benchmarkApr.toFixed(2)}% benchmark APR and ${matchedRange.years}-year term, the 2025 average balance would cost about ${formatCurrency(averageMonthlyPayment)}/mo.`;

    if (loanStatus) {
      loanStatus.textContent = `Estimated a ${describeTerm(months)} payoff for ${formatCurrency(balance)} with a monthly payment of ${formatCurrency(monthlyPayment)}.`;
    }
  };

  loanBalanceInput.addEventListener('input', updateLoanPreview);
  loanRangeInput.addEventListener('input', () => {
    syncLoanInputs(loanRangeInput.value);
    updateLoanPreview();
  });
  calculateLoanButton.addEventListener('click', estimateLoan);
  resetLoanButton.addEventListener('click', () => {
    syncLoanInputs(39550);
    estimateLoan();
  });

  updateLoanPreview();
  estimateLoan();
}
