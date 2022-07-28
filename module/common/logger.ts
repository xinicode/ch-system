/* eslint-disable prefer-spread */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { webApplication } from '../application';
import _ from 'lodash';

export enum LoggerLevel {
  OFF = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  LOG = 5
}

/** 日志控制台必须提供的方法定义 */
export interface ILoggerConsole {
  log: (...arg) => any;
  debug?: (...arg) => any;
  info?: (...arg) => any;
  warn: (...arg) => any;
  error: (...arg) => any;
}

export class Logger {
  /** 所有的自定义日志打印控制台 */
  static loggerConsoles: { [consoleId: string]: ILoggerConsole } = {};
  /** 级别 */
  static level: LoggerLevel = webApplication.NODE_ENV == 'development' ? LoggerLevel.LOG : LoggerLevel.WARN;
  /** 往所有的日志控制台写日志数据 */
  private static logToConsoles(logMethodName: string, args) {
    _.forIn(Logger.loggerConsoles, (loggerConsole) => {
      if (loggerConsole[logMethodName]) {
        loggerConsole[logMethodName](...args);
      } else {
        loggerConsole.log && loggerConsole.log(...args);
      }
    });
  }
  /** 添加自定义日志输出控制台 */
  static appendConsole(consoleId: string, loggerConsole: ILoggerConsole) {
    if (consoleId && !Logger.loggerConsoles[consoleId]) {
      Logger.loggerConsoles[consoleId] = loggerConsole;
    }
  }
  /** 移除自定义日志输出控制台 */
  static removeConsole(consoleId: string) {
    if (consoleId && Logger.loggerConsoles[consoleId]) {
      delete Logger.loggerConsoles[consoleId];
    }
  }

  static error(message?: any, ...optionalParams: any[]) {
    Logger.isErrorEnabled && console.error.apply(console, arguments);
    Logger.isErrorEnabled && Logger.logToConsoles('error', arguments);
  }

  static warn(message?: any, ...optionalParams: any[]) {
    Logger.isWarnEnabled && console.warn.apply(console, arguments);
    Logger.isWarnEnabled && Logger.logToConsoles('warn', arguments);
  }

  static info(message?: any, ...optionalParams: any[]) {
    Logger.isInfoEnabled && console.info.apply(console, arguments);
    Logger.isInfoEnabled && Logger.logToConsoles('info', arguments);
  }

  static log(message?: any, ...optionalParams: any[]) {
    Logger.isLogEnabled && console.log.apply(console, arguments);
    Logger.isLogEnabled && Logger.logToConsoles('log', arguments);
  }

  static debug(message?: any, ...optionalParams: any[]) {
    Logger.isDebugEnabled && console.warn.apply(console, arguments);
    Logger.isDebugEnabled && Logger.logToConsoles('debug', arguments);
  }

  static debugger() {
    if (Logger.isDebugEnabled) debugger;
  }

  static get isErrorEnabled(): boolean {
    return Logger.level >= LoggerLevel.ERROR;
  }
  static get isWarnEnabled(): boolean {
    return Logger.level >= LoggerLevel.WARN;
  }
  static get isInfoEnabled(): boolean {
    return Logger.level >= LoggerLevel.INFO;
  }
  static get isDebugEnabled(): boolean {
    return Logger.level >= LoggerLevel.DEBUG;
  }
  static get isLogEnabled(): boolean {
    return Logger.level >= LoggerLevel.LOG;
  }

  /**
   * 设置为开发log级别
   */
  static setDevLoggerLevel() {
    Logger.level = LoggerLevel.LOG;
  }

  /**
   * 设置为生产log级别
   */
  static setProdLoggerLevel() {
    Logger.level = LoggerLevel.WARN;
  }
}

//发布到window全局
window['Logger'] = Logger;
