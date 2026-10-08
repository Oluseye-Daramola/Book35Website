const isProduction = process.env.NODE_ENV === "production";

function timestamp() {
  return new Date().toISOString();
}

function write(level, ...args) {
  const line = `[${timestamp()}] [${level.toUpperCase()}]`;
  if (level === "error") {
    console.error(line, ...args);
  } else if (level === "warn") {
    console.warn(line, ...args);
  } else {
    console.log(line, ...args);
  }
}

const logger = {
  error: (...args) => write("error", ...args),
  warn: (...args) => write("warn", ...args),
  info: (...args) => write("info", ...args),
  debug: (...args) => {
    if (!isProduction) write("debug", ...args);
  },
};

module.exports = logger;