const config = require('./config.json');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const transport = new DailyRotateFile({
 filename: config.logfile,
 datePattern: 'YYYY-MM-DD',
 zippedArchive: false,
 maxSize: '10m',
 maxFiles: '14d',
 prepend: true,
level: 'info',
});


const logger = winston.createLogger({
	format: winston.format.combine(
	            winston.format.timestamp(),
	            winston.format.json()
	        ),
	transports: [transport]
});

module.exports = logger;