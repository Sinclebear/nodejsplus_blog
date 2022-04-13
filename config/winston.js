const winston = require('winston'); // 로그 처리 모듈
const winstonDaily = require('winston-daily-rotate-file'); // 로그 일별 처리 모듈
const logDir = '../logs';
const TelegramLogger = require('winston-telegram');

// 로그가 파일로 저장이 안된다.. 이것만 해결되면 적용해볼만 한데.
// morganmiddleware 로그가 남긴 하는데, <= 400 에러만 남게 설정해두었다.

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};
// 개발환경일 경우 남기는 로그 레벨을 debug 이상으로, 아닌 경우 warn 이상만 나오도록 함.
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(colors);
const colorize = winston.format.colorize();
const format = winston.format.combine(
    winston.format.timestamp({ format: ' YYYY-MM-DD HH:MM:SS ' }),
    // winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) =>
            // `[${info.timestamp}] [${info.level}]:${info.message}`
            `${colorize.colorize(
                info.level,
                `[${info.timestamp}] [${info.level.toUpperCase()}] ${
                    info.label ?? '[makeHabit]'
                }:`
            )} ${info.message}`
    )
);

const logger = winston.createLogger({
    format,
    level: level(),
    transports: [
        new winstonDaily({
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir,
            filename: `%DATE%-app.log`,
            zippedArchive: true,
            handleExceptions: true,
            maxFiles: 1000,
            maxsize: 52428800, // 50MB
        }),
        new winstonDaily({
            level: 'warn',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir + '/warn',
            filename: `%DATE%-error.log`,
            zippedArchive: true,
            maxFiles: 1000,
            maxsize: 52428800, // 50MB
        }),
        new winstonDaily({
            level: 'error',
            datePattern: 'YYYY-MM-DD',
            dirname: logDir + '/error',
            filename: `%DATE%-error.log`,
            zippedArchive: true,
            maxFiles: 1000,
            maxsize: 52428800, // 50MB
        }),
        new winston.transports.Console({
            handleExceptions: true,
        }),
        new TelegramLogger({
            token: process.env.TELEGRAM_BOT_TOKEN,
            chatId: process.env.TELEGRAM_MY_CHATID,
            level: 'warn',
            unique: true,
            formatMessage: function (options) {
                let message = options.message;
                if (options.level === 'warn') {
                    message = '[Warning] ' + message;
                }
                return message;
            },
        }),
        new TelegramLogger({
            token: process.env.TELEGRAM_BOT_TOKEN,
            chatId: process.env.TELEGRAM_MY_CHATID,
            level: 'error',
            unique: true,
            formatMessage: function (options) {
                let message = options.message;
                if (options.level === 'error') {
                    message = '[Error] ' + message;
                }
                return message;
            },
        }),
    ],
});

// logger.add();

// logger.add();

// winston.warn('Some warning!!');

module.exports = logger;
