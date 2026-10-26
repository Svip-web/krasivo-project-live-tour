(() => {
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buttonMotionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  const pressTimers = new WeakMap();
  const animateButton = element => {
    if (buttonMotionPreference.matches || element.disabled || element.getAttribute('aria-disabled') === 'true') return;
    clearTimeout(pressTimers.get(element));
    element.classList.remove('is-tapped');
    void element.offsetWidth;
    element.classList.add('is-tapped');
    pressTimers.set(element, setTimeout(() => {
      element.classList.remove('is-tapped');
      pressTimers.delete(element);
    }, 620));
  };
  $$('a.button, .header-register, .mobile-bottom>a, button').forEach(element => {
    element.addEventListener('pointerdown', event => {
      if (event.isPrimary && event.button === 0) animateButton(element);
    }, { passive: true });
    element.addEventListener('pointercancel', () => {
      clearTimeout(pressTimers.get(element));
      pressTimers.delete(element);
      element.classList.remove('is-tapped');
    });
    element.addEventListener('keydown', event => {
      if (!event.repeat && (event.key === 'Enter' || element.tagName === 'BUTTON' && event.key === ' ')) animateButton(element);
    });
  });
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.07 });
    $$('[data-reveal]').forEach(element => observer.observe(element));
  } else $$('[data-reveal]').forEach(element => element.classList.add('is-visible'));

  const heroVideo = $('#hero-video');
  let heroInView = true;
  const playBackground = () => {
    if (heroInView && !reducedMotion && !document.hidden && !document.body.classList.contains('dialog-is-open')) heroVideo.play().catch(() => {});
  };
  if (reducedMotion) { heroVideo.autoplay = false; heroVideo.pause(); }
  else playBackground();
  document.addEventListener('visibilitychange', () => { if (document.hidden) heroVideo.pause(); else playBackground(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { heroInView = entries[0].isIntersecting; if (heroInView) playBackground(); else heroVideo.pause(); }, {threshold:0.05}).observe($('.hero-stage'));
  }

  const programTrack = $('#program-track');
  const chapters = $$('.program-chapter', programTrack);
  let chapterIndex = 0;
  let chapterScrollQueued = false;
  const updateChapters = () => {
    const inset = parseFloat(getComputedStyle(programTrack).paddingLeft);
    const distances = chapters.map(chapter => Math.abs(chapter.offsetLeft - inset - programTrack.scrollLeft));
    chapterIndex = distances.indexOf(Math.min(...distances));
    $('#chapter-current').textContent = String(chapterIndex + 1).padStart(2, '0');
    $('#chapter-prev').disabled = chapterIndex === 0;
    $('#chapter-next').disabled = chapterIndex === chapters.length - 1;
    chapterScrollQueued = false;
  };
  const stepChapter = delta => {
    const targetIndex = Math.max(0, Math.min(chapters.length - 1, chapterIndex + delta));
    const inset = parseFloat(getComputedStyle(programTrack).paddingLeft);
    programTrack.scrollTo({left:chapters[targetIndex].offsetLeft - inset,behavior:reducedMotion?'instant':'smooth'});
  };
  $('#chapter-prev').addEventListener('click', () => stepChapter(-1));
  $('#chapter-next').addEventListener('click', () => stepChapter(1));
  programTrack.addEventListener('scroll', () => {
    if (!chapterScrollQueued) { chapterScrollQueued = true; requestAnimationFrame(updateChapters); }
  }, {passive:true});
  programTrack.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); stepChapter(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  addEventListener('resize', updateChapters);
  updateChapters();

  const progress = $('.scroll-progress');
  const bottomBar = $('.mobile-bottom');
  const inlineCtas = $$('main .button');
  const footer = $('#footer');
  let scrollQueued = false;
  const updateScroll = () => {
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${scrollable > 0 ? Math.min(100, scrollY / scrollable * 100) : 0}%`;
    const registrationRect = $('#registration').getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const heroHeight = $('.hero').getBoundingClientRect().height;
    const inlineCtaVisible = inlineCtas.some(cta => {
      const rect = cta.getBoundingClientRect();
      return rect.height > 0 && rect.top >= 8 && rect.bottom <= innerHeight - 12;
    });
    const registrationVisible = registrationRect.top < innerHeight * 0.65 && registrationRect.bottom > 0;
    bottomBar.classList.toggle('is-hidden', scrollY < heroHeight - 80 || registrationVisible || inlineCtaVisible || footerRect.top < innerHeight);
    scrollQueued = false;
  };
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  addEventListener('resize', updateScroll);
  updateScroll();

  const videoDialog = $('#video-dialog');
  const video = $('#promo-video');
  const galleryDialog = $('#gallery-dialog');
  const galleries = [
    { src: 'assets/salon-lounge.jpg', alt: 'Лаунж-зона Krasivo Project: хромированные столики, мягкие кресла и бордовые шторы', caption: 'KRASIVO PROJECT / ЛАУНЖ-ЗОНА / ВАРШАВА' },
    { src: 'assets/salon-wide.jpg', alt: 'Общий вид салона Krasivo Project', caption: 'KRASIVO PROJECT / ОБЩИЙ ПЛАН / ВАРШАВА' },
    { src: 'assets/salon-entrance.jpg', alt: 'Вход в салон Krasivo Project', caption: 'KRASIVO PROJECT / ВХОД В САЛОН / ВАРШАВА' },
    { src: 'assets/salon-mirrors.jpg', alt: 'Арочные зеркала и рабочие места в Krasivo Project', caption: 'KRASIVO PROJECT / РАБОЧЕЕ ПРОСТРАНСТВО / ВАРШАВА' }
  ];
  let galleryIndex = 0;
  const showGalleryImage = () => { const current = galleries[galleryIndex]; $('#gallery-image').src = current.src; $('#gallery-image').alt = current.alt; $('#gallery-caption').textContent = `${galleryIndex + 1} / ${galleries.length}`; };
  const openDialog = dialog => { heroVideo.pause(); dialog.showModal(); document.body.classList.add('dialog-is-open'); };
  [videoDialog, galleryDialog].forEach(dialog => {
    $('[data-dialog-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { document.body.classList.remove('dialog-is-open'); if (dialog === videoDialog) video.pause(); playBackground(); });
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  });
  $$('[data-video-open]').forEach(button => button.addEventListener('click', () => { openDialog(videoDialog); video.play().catch(() => {}); }));
  $$('[data-gallery-open]').forEach(button => button.addEventListener('click', () => { galleryIndex = Number(button.dataset.galleryOpen); showGalleryImage(); openDialog(galleryDialog); }));
  const stepGallery = delta => { galleryIndex = (galleryIndex + delta + galleries.length) % galleries.length; showGalleryImage(); };
  $('.gallery-prev').addEventListener('click', () => stepGallery(-1));
  $('.gallery-next').addEventListener('click', () => stepGallery(1));
  galleryDialog.addEventListener('keydown', event => { if (event.key === 'ArrowLeft') { event.preventDefault(); stepGallery(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); stepGallery(1); } });

})();
