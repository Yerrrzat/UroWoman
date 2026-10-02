/**
 * UroWoman Kazakhstan — приём анонимных ответов анкеты в Google Таблицу.
 *
 * Скрипт привязан к таблице (Расширения → Apps Script) и опубликован как веб-приложение.
 * Сайт отправляет сюда ответы только тех посетительниц, которые отметили согласие.
 * Имя, email и IP-адрес не передаются и не записываются.
 */

const SHEET_NAME = 'Ответы';

const HEADERS = [
  'Дата и время', 'Язык', 'Возраст', 'Образование', 'Занятость', 'Семейное положение',
  'Частота (0–5)', 'Количество (0–6)', 'Влияние на жизнь (0–10)', 'Сумма ICIQ-SF (0–21)', 'Степень',
  'Не успевает до туалета', 'При кашле/чихании', 'Во сне', 'При физической активности',
  'После мочеиспускания', 'Без причины', 'Постоянно',
];

const LANGS = { ru: 'Русский', kk: 'Казахский', en: 'Английский' };
const EDUCATION = {
  secondary: 'Среднее', vocational: 'Среднее специальное', incomplete_higher: 'Незаконченное высшее',
  higher: 'Высшее', postgraduate: 'Послевузовское',
};
const EMPLOYMENT = {
  employed: 'Работает', unemployed: 'Не работает', homemaker: 'Домохозяйка',
  maternity_leave: 'В декретном отпуске', student: 'Студентка', retired: 'На пенсии',
};
const MARITAL = {
  married: 'Замужем', cohabiting: 'В незарегистрированном браке', single: 'Не замужем',
  divorced: 'Разведена', widowed: 'Вдова',
};
const SITUATIONS = ['before_toilet', 'cough_sneeze', 'asleep', 'active', 'after_urinating', 'no_reason', 'all_the_time'];
const SEVERITY = ['Нет недержания', 'Лёгкая', 'Умеренная', 'Тяжёлая', 'Очень тяжёлая'];

function isInt(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function reply(text) {
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.TEXT);
}

function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function doPost(e) {
  // Всё, что не похоже на ответ анкеты, молча отбрасывается.
  if (!e || !e.postData || !e.postData.contents || e.postData.contents.length > 2000) return reply('ignored');

  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply('ignored');
  }

  const valid =
    LANGS[d.lang] && EDUCATION[d.education] && EMPLOYMENT[d.employment] && MARITAL[d.marital] &&
    isInt(d.age, 18, 100) && isInt(d.frequency, 0, 5) && [0, 2, 4, 6].includes(d.amount) && isInt(d.impact, 0, 10) &&
    Array.isArray(d.situations) && d.situations.every(function (s) { return SITUATIONS.includes(s); });
  if (!valid) return reply('ignored');

  // Сумма и степень считаются здесь заново, а не берутся из запроса.
  const score = d.frequency + d.amount + d.impact;
  const band = score === 0 ? 0 : score <= 5 ? 1 : score <= 12 ? 2 : score <= 18 ? 3 : 4;

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet().appendRow([
      new Date(), LANGS[d.lang], d.age, EDUCATION[d.education], EMPLOYMENT[d.employment], MARITAL[d.marital],
      d.frequency, d.amount, d.impact, score, SEVERITY[band],
    ].concat(SITUATIONS.map(function (s) { return d.situations.includes(s) ? 1 : 0; })));
  } finally {
    lock.releaseLock();
  }
  return reply('ok');
}

/** Открыв адрес веб-приложения в браузере, можно убедиться, что оно опубликовано. */
function doGet() {
  return reply('UroWoman survey endpoint is running.');
}

/** Запустите один раз вручную (кнопка «Выполнить»), чтобы создать лист с заголовками и выдать разрешения. */
function setup() {
  getSheet();
}
