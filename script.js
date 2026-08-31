const accordions = document.querySelectorAll('.accordion-button');
const statusMessage = document.getElementById('status');

accordions.forEach(button => {
  button.addEventListener('click', () => {
    const isActive = button.classList.contains('active');
    const panel = button.nextElementSibling;
    accordions.forEach(btn => {
      btn.classList.remove('active');
      btn.nextElementSibling.classList.remove('open');
      btn.nextElementSibling.style.maxHeight = null;
    });
    if (!isActive) {
      button.classList.add('active');
      panel.classList.add('open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  });
});

function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const name = form.name.value.trim();
  const topic = form.topic.value;
  if (statusMessage) {
    statusMessage.textContent = `Демонстрация: ${name || 'гость'}, форма заполнена по теме «${topic}». Данные не отправлены.`;
  }
  form.reset();
}

document.querySelectorAll('.clickable-card[data-href]').forEach(card => {
  const openCard = () => window.location.href = card.dataset.href;
  card.addEventListener('click', openCard);
  card.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCard();
    }
  });
});

const iciqForm = document.getElementById('iciq-form');
const iciqResult = document.getElementById('iciq-result');
if (iciqForm && iciqResult) {
  iciqForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(iciqForm);
    const score = Number(data.get('frequency')) + Number(data.get('amount')) + Number(data.get('impact'));
    const level = score <= 5 ? 'минимальное' : score <= 12 ? 'умеренное' : 'выраженное';
    iciqResult.innerHTML = `<strong>Ориентировочный результат: ${score} баллов.</strong><p>Влияние симптомов оценивается как ${level}. Покажите результат врачу, особенно если симптомы повторяются или усиливаются.</p>`;
    iciqResult.classList.add('visible');
    localStorage.setItem('urowoman-iciq-result', JSON.stringify({ score, date: new Date().toISOString() }));
  });
}

const translations = {
  ru: {
    'nav.home': 'Главная', 'nav.patient': 'Пациенткам', 'nav.doctors': 'Врачам', 'nav.tools': 'Инструменты', 'nav.research': 'Наука',
    'search.placeholder': 'Поиск по сайту', 'search.empty': 'Ничего не найдено'
  },
  kk: {
    'nav.home': 'Басты бет', 'nav.patient': 'Пациенттерге', 'nav.doctors': 'Дәрігерлерге', 'nav.tools': 'Құралдар', 'nav.research': 'Ғылым',
    'search.placeholder': 'Сайттан іздеу', 'search.empty': 'Ештеңе табылмады'
  },
  en: {
    'nav.home': 'Home', 'nav.patient': 'For patients', 'nav.doctors': 'For doctors', 'nav.tools': 'Tools', 'nav.research': 'Research',
    'search.placeholder': 'Search the site', 'search.empty': 'Nothing found'
  }
};

const contentTranslations = {
  kk: {
    'Помощь начинается с понимания симптомов.': 'Көмек белгілерді түсінуден басталады.',
    'Понятные материалы, бережная самопроверка и маршруты к медицинской помощи для женщин Казахстана.': 'Қазақстан әйелдеріне арналған түсінікті материалдар, ұқыпты өзін-өзі бағалау және медициналық көмекке апарар жолдар.',
    'Для пациенток': 'Пациенттерге арналған',
    'Симптомы, лечение и подготовка к приему': 'Белгілер, емдеу және қабылдауға дайындық',
    'Для врачей': 'Дәрігерлерге арналған',
    'Алгоритмы и клинические материалы': 'Алгоритмдер және клиникалық материалдар',
    'Пройти короткий тест': 'Қысқа тесттен өту',
    'Что важно знать': 'Маңызды ақпарат',
    'Вы не обязаны справляться в одиночку': 'Сіз бұл жағдаймен жалғыз күресуге міндетті емессіз',
    'Недержание мочи - распространенное состояние, с которым можно и нужно обращаться за помощью.': 'Зәр ұстамау жиі кездесетін жағдай, онымен медициналық көмекке жүгінуге болады және қажет.',
    'Национальная платформа': 'Ұлттық платформа', 'Пройти онлайн-тест': 'Онлайн тесттен өту', 'Узнать больше': 'Толығырақ білу',
    'Что такое недержание мочи': 'Зәр ұстамау дегеніміз не', 'Почему важно обратиться за помощью': 'Неліктен көмек сұрау маңызды',
    'Онлайн-тест': 'Онлайн тест', 'Алгоритм действий': 'Әрекет алгоритмі', 'Новости': 'Жаңалықтар', 'Последние публикации': 'Соңғы жарияланымдар',
    'Разделы платформы': 'Платформа бөлімдері', 'Для пациенток': 'Пациенттерге', 'Для врачей': 'Дәрігерлерге', 'Научный раздел': 'Ғылыми бөлім',
    'Комплексная помощь женщинам': 'Әйелдерге кешенді көмек', 'Стрессовое недержание': 'Стресстік зәр ұстамау', 'Ургентное недержание': 'Императивті зәр ұстамау',
    'Смешанное недержание': 'Аралас зәр ұстамау', 'Почему важно обратиться за помощью': 'Неліктен көмек сұрау маңызды',
    'Снижение симптомов': 'Симптомдарды азайту', 'Уверенность в себе': 'Өзіне деген сенім', 'Профессиональный контроль': 'Кәсіби бақылау',
    'От первого симптома до помощи': 'Алғашқы белгіден көмекке дейін', 'Практический маршрут': 'Практикалық маршрут',
    'Маршрут пациентки': 'Пациент маршруты', 'Алгоритм врача общей практики': 'Жалпы тәжірибелік дәрігер алгоритмі',
    'Исследование в Казахстане': 'Қазақстандағы зерттеу', 'Контакты': 'Байланыс', 'Важно': 'Маңызды',
    'Дневник мочеиспускания': 'Зәр шығару күнделігі', 'Рассчитать результат': 'Нәтижені есептеу', 'Добавить запись': 'Жазба қосу', 'Очистить дневник': 'Күнделікті тазалау',
    'Информация носит ознакомительный характер и не заменяет консультацию врача, диагностику или назначение лечения.': 'Материалдар ақпараттық сипатта және дәрігер кеңесін, диагнозды немесе ем тағайындауды алмастырмайды.',
    'Ничего не найдено': 'Ештеңе табылмады', 'Выделение мочи при кашле, чихании, смехе или физической нагрузке.': 'Жөтелгенде, түшкіргенде, күлгенде немесе дене жүктемесінде зәрдің бөлінуі.',
    'Резкие позывы к мочеиспусканию с невозможностью удержать мочу до туалета.': 'Дәретханаға жеткенше зәрді ұстай алмаумен қатар жүретін кенет шақырулар.',
    'Комбинация симптомов стрессового и ургентного недержания.': 'Стресстік және императивті зәр ұстамау белгілерінің қосындысы.',
    'Ранняя диагностика и правильное ведение позволяют предотвратить осложнения, повысить качество жизни и восстановить уверенность.': 'Ерте диагностика мен дұрыс бақылау асқынулардың алдын алып, өмір сапасын және сенімділікті арттырады.',
    'Быстрый скрининг состояния по международным шкалам ICIQ и рекомендациям.': 'ICIQ халықаралық шкалалары мен ұсынымдарына негізделген қысқа скрининг.',
    'Запись частоты, объема и обстоятельств для точной диагностики.': 'Дәл диагностика үшін жиілікті, көлемді және жағдайды жазу.',
    'Пришла пациентка': 'Пациент келді', 'Выявление симптомов': 'Белгілерді анықтау', 'Скрининг и осмотр': 'Скрининг және тексеру',
    'Консервативное лечение': 'Консервативті ем', 'Оценка эффективности': 'Тиімділікті бағалау', 'Направление к специалисту': 'Маманға жолдау',
    'Замечены симптомы': 'Белгілер байқалды', 'Онлайн-тест ICIQ-SF': 'ICIQ-SF онлайн тесті', 'Прием и осмотр врача': 'Дәрігер қабылдауы және тексеруі',
    'Индивидуальный план помощи': 'Жеке көмек жоспары', 'Узнайте о симптомах и возможностях лечения.': 'Белгілер мен емдеу мүмкіндіктері туралы біліңіз.'
  },
  en: {
    'Помощь начинается с понимания симптомов.': 'Care begins with understanding your symptoms.',
    'Понятные материалы, бережная самопроверка и маршруты к медицинской помощи для женщин Казахстана.': 'Clear information, a considerate self-check and pathways to medical care for women in Kazakhstan.',
    'Для пациенток': 'For patients',
    'Симптомы, лечение и подготовка к приему': 'Symptoms, treatment and preparing for an appointment',
    'Для врачей': 'For doctors',
    'Алгоритмы и клинические материалы': 'Algorithms and clinical resources',
    'Пройти короткий тест': 'Take a short test',
    'Что важно знать': 'What to know',
    'Вы не обязаны справляться в одиночку': 'You do not have to manage this alone',
    'Недержание мочи - распространенное состояние, с которым можно и нужно обращаться за помощью.': 'Urinary incontinence is common, and it is appropriate to seek medical support.',
    'Национальная платформа': 'National platform', 'Пройти онлайн-тест': 'Take the online test', 'Узнать больше': 'Learn more',
    'Что такое недержание мочи': 'What is urinary incontinence', 'Почему важно обратиться за помощью': 'Why seeking help matters',
    'Онлайн-тест': 'Online test', 'Алгоритм действий': 'Action pathway', 'Новости': 'News', 'Последние публикации': 'Latest publications',
    'Разделы платформы': 'Platform sections', 'Для пациенток': 'For patients', 'Для врачей': 'For doctors', 'Научный раздел': 'Research',
    'Комплексная помощь женщинам': 'Comprehensive support for women', 'Стрессовое недержание': 'Stress incontinence', 'Ургентное недержание': 'Urgency incontinence',
    'Смешанное недержание': 'Mixed incontinence', 'Снижение симптомов': 'Symptom relief', 'Уверенность в себе': 'Confidence', 'Профессиональный контроль': 'Professional follow-up',
    'От первого симптома до помощи': 'From first symptom to care', 'Практический маршрут': 'Practical pathway',
    'Маршрут пациентки': 'Patient pathway', 'Алгоритм врача общей практики': 'General practitioner pathway',
    'Исследование в Казахстане': 'Research in Kazakhstan', 'Контакты': 'Contact', 'Важно': 'Important',
    'Дневник мочеиспускания': 'Voiding diary', 'Рассчитать результат': 'Calculate result', 'Добавить запись': 'Add entry', 'Очистить дневник': 'Clear diary',
    'Информация носит ознакомительный характер и не заменяет консультацию врача, диагностику или назначение лечения.': 'This information is educational and does not replace medical advice, diagnosis or treatment.',
    'Ничего не найдено': 'Nothing found', 'Выделение мочи при кашле, чихании, смехе или физической нагрузке.': 'Urine leakage when coughing, sneezing, laughing or exercising.',
    'Резкие позывы к мочеиспусканию с невозможностью удержать мочу до туалета.': 'A sudden urge to urinate with leakage before reaching the toilet.',
    'Комбинация симптомов стрессового и ургентного недержания.': 'A combination of stress and urgency incontinence symptoms.',
    'Ранняя диагностика и правильное ведение позволяют предотвратить осложнения, повысить качество жизни и восстановить уверенность.': 'Early assessment and appropriate care can prevent complications and improve quality of life.',
    'Быстрый скрининг состояния по международным шкалам ICIQ и рекомендациям.': 'A quick screening based on international ICIQ tools and guidance.',
    'Запись частоты, объема и обстоятельств для точной диагностики.': 'Record frequency, volume and circumstances to support assessment.',
    'Пришла пациентка': 'Patient presents', 'Выявление симптомов': 'Identify symptoms', 'Скрининг и осмотр': 'Screening and examination',
    'Консервативное лечение': 'Conservative care', 'Оценка эффективности': 'Assess effectiveness', 'Направление к специалисту': 'Refer to a specialist',
    'Замечены симптомы': 'Symptoms noticed', 'Онлайн-тест ICIQ-SF': 'ICIQ-SF online test', 'Прием и осмотр врача': 'Medical appointment and examination',
    'Индивидуальный план помощи': 'Individual care plan'
  }
};

const originalText = new WeakMap();

function translatePageContent(language) {
  const dictionary = contentTranslations[language];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach(textNode => {
    if (!originalText.has(textNode)) originalText.set(textNode, textNode.nodeValue);
    const original = originalText.get(textNode);
    const source = original.trim();
    textNode.nodeValue = dictionary && dictionary[source]
      ? original.replace(source, dictionary[source])
      : original;
  });
  document.querySelectorAll('option').forEach(option => {
    if (!option.dataset.originalText) option.dataset.originalText = option.textContent;
    const source = option.dataset.originalText.trim();
    option.textContent = dictionary && dictionary[source] ? dictionary[source] : option.dataset.originalText;
  });
}

const searchCatalog = [
  { title: 'Что такое недержание мочи', keywords: 'недержание мочи incontience зәр ұстамау', href: 'index.html#about' },
  { title: 'Для пациенток', keywords: 'пациентки симптомы причины лечение пациенттер', href: 'patient.html' },
  { title: 'Для врачей', keywords: 'врачи рекомендации алгоритм doctors дәрігер', href: 'doctors.html' },
  { title: 'ICIQ-SF', keywords: 'опросник тест шкала ic i q', href: 'tools.html#iciq-sf' },
  { title: 'Научный раздел', keywords: 'исследование публикации конференции science', href: 'research.html' },
  { title: 'Алгоритм действий', keywords: 'диагностика обследование лечение algorithm', href: 'index.html#algorithm' },
  { title: 'Последние публикации', keywords: 'публикации статьи литература publications', href: 'research.html' }
];

function getLanguage() {
  return localStorage.getItem('urowoman-language') || 'ru';
}

function applyLanguage(language) {
  const dictionary = translations[language] || translations.ru;
  document.documentElement.lang = language === 'kk' ? 'kk' : language;
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const value = dictionary[element.dataset.i18n];
    if (value) element.textContent = value;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const value = dictionary[element.dataset.i18nPlaceholder];
    if (value) element.placeholder = value;
  });
  document.querySelectorAll('.language-switcher').forEach(select => select.value = language);
  translatePageContent(language);
}

document.querySelectorAll('.language-switcher').forEach(select => {
  select.addEventListener('change', () => {
    localStorage.setItem('urowoman-language', select.value);
    applyLanguage(select.value);
  });
});
applyLanguage(getLanguage());

document.querySelectorAll('.site-search').forEach(form => {
  const input = form.querySelector('input');
  const results = document.querySelector('.search-results');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim().toLowerCase();
    if (!results) return;
    if (!query) {
      results.classList.remove('visible');
      results.innerHTML = '';
      return;
    }
    const matches = searchCatalog.filter(item => `${item.title} ${item.keywords}`.toLowerCase().includes(query));
    results.innerHTML = matches.length
      ? matches.map(item => `<a href="${item.href}"><strong>${item.title}</strong><span>${item.keywords.split(' ').slice(0, 5).join(' ')}</span></a>`).join('')
      : `<p>${translations[getLanguage()]['search.empty']}</p>`;
    results.classList.add('visible');
  });
});
