const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL = LOG_LEVELS.DEBUG;

const timestamp = () => new Date().toISOString();

const format = (level, category, ...args) =>
  [`[${timestamp()}] [${level}] [${category}]`, ...args];

export const logger = {
  debug: (category, ...args) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.DEBUG)
      console.debug(...format('DEBUG', category, ...args));
  },
  info: (category, ...args) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.INFO)
      console.info(...format('INFO', category, ...args));
  },
  warn: (category, ...args) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.WARN)
      console.warn(...format('WARN', category, ...args));
  },
  error: (category, ...args) => {
    if (CURRENT_LEVEL <= LOG_LEVELS.ERROR)
      console.error(...format('ERROR', category, ...args));
  },
  api: (type, method, url) => {
    console.log(`%c[API] ${type} ${method} ${url}`, 'color:#7c6aff;font-weight:500');
  },
  action: (action, payload) => {
    console.log(`%c[ACTION] ${action}`, 'color:#0ea5e9;font-weight:500', payload ?? '');
  },
};
