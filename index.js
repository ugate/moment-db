'use strict';

const DATE = 'YYYY-MM-DD';
const TIME = 'HH:MI:SS.FFF';
const ZONE = '[+|-]TH:TM';
const YEAR_TO_MONTH = '[+|-]YEARS-MM';
const DAYS_TO_SEC = '[+|-]DAYS HH:MI:SS.FFF';

/**
 * Moment implementation for formatting Dates into ANSI compatible strings suitable for database consumption.
 * The following illustrates the notions used for formatting dates:
 * | <u>Notation</u>       | <u>Format</u>                         | <u></u>
 * | :---                  | :---                                  | :---
 * | YYYY                  | 4-digit year                          |
 * | MM                    | 2-digit month (01 to 12)              |
 * | DD                    | 2-digit day (01 to 31)                |
 * | HH                    | 2-digit hour (00 to 23)               |
 * | MI                    | 2-digit minute (00 to 59)             |
 * | SS                    | 2-digit second (00 to 59)             |
 * | FFF                   | Fraction of a second (1 to 9 digits)  |
 * | TH                    | 2-digit hour offset (-12 to 14)       |
 * | TM                    | 2-digit minute offset (00 to 59)      |
 * | YEARS                 | Number of years (max of 9999)         |
 * | DAYS                  | Number of days (max of 3652047)       |
 */
export default class MomentDB {

  /**
   * Formats the specified date into an ANSI compatible __date__ that is suitable for database consumption
   * (i.e. `YYYY-MM-DD`; see {@link MomentDB} for notation details).
   * @param {Date} date The date to extract the __date__ from
   * @returns {String} The formatted output
   */
  static toDate(date) {
    return format(DATE, date);
  }

  /**
   * Formats the specified date into an ANSI compatible __time__ (with or w/o a timezone) that is suitable for database consumption
   * (i.e. `HH:MI:SS.FFF [+|-]TH:TM` or `HH:MI:SS.FFF` w/o a timezone; see {@link MomentDB} for notation details).
   * @param {Date} date The date to extract the __time__ from
   * @param {Boolean} [excludeTimezone] Truthy to exclude the timezone in the output
   * @returns {String} The formatted output
   */
  static toTime(date, excludeTimezone) {
    return format(excludeTimezone ? TIME : `${TIME} ${ZONE}`, date);
  }

  /**
   * Formats the specified date into an ANSI compatible __timestamp__ (with or w/o a timezone) that is suitable for database consumption
   * (i.e. `YYYY-MM-DD HH:MI:SS.FFF [+|-]TH:TM` or `YYYY-MM-DD HH:MI:SS.FFF` w/o a timezone; see {@link MomentDB} for notation details).
   * @param {Date} date The date to extract the __timestamp__ from
   * @param {Boolean} [excludeTimezone] Truthy to exclude the timezone in the output
   * @returns {String} The formatted output
   */
  static toTimestamp(date, excludeTimezone) {
    return format(`${DATE} ${TIME}${excludeTimezone ? '' : ` ${ZONE}`}`, date);
  }

  /**
   * Calulates the number of __years__ from the specified `startDate` and `endDate` along with the extracted/formatted __month__
   * from the `monthDate`. The output is rendered in an ANSI compatible format that is suitable for database consumption
   * (i.e. `[+|-]YEARS-MM`; see {@link MomentDB} for notation details).
   * @param {Date} startDate The starting date (can be _after_ `endDate` for negative formatting)
   * @param {Date} endDate The ending date (can be _before_ `startDate` for negative formatting)
   * @param {Date} monthDate The date to extract the __month__ from
   * @returns {String} The formatted output
   */
  static toIntervalYearToMonth(startDate, endDate, monthDate) {
    return format(YEAR_TO_MONTH, startDate, endDate, monthDate);
  }

  /**
   * Calulates the number of __days__ from the specified `startDate` and `endDate` along with the extracted/formatted __time__
   * from the `timestamp`. The output is rendered in an ANSI compatible format that is suitable for database consumption
   * (i.e. `[+|-]DAYS HH:MI:SS.FFF`; see {@link MomentDB} for notation details).
   * @param {Date} startDate The starting date (can be _after_ `endDate` for negative formatting)
   * @param {Date} endDate The ending date (can be _before_ `startDate` for negative formatting)
   * @param {Date} timestamp The date to extract the __time__ from
   * @returns {String} The formatted output
   */
  static toIntervalDayToSecond(startDate, endDate, timestamp) {
    return format(DAYS_TO_SEC, startDate, endDate, timestamp);
  }
}

/**
 * Formats dates/times into an ANSI compatible string.
 * @private
 * @param {String} format The format described in {@link MomentDB}
 * @param  {...any} dates Either a single date that will be formatted OR
 * a __start__ date, __end__ date and __extraction__ date (see {@link interval} for more details)
 * @returns {String} The formatted output
 */
function format(format, ...dates) {
  for (let date of dates) {
    if (!(date instanceof Date)) {
      throw new Error('Specified date must be an instance of Date');
    }
  }
  const frmt = format.toUpperCase();
  const dts = dates[0].toISOString().split('T');

  const date = frmt.indexOf(DATE) >= 0 ? dts[0] : '';
  const time = frmt.indexOf(TIME) >= 0 ? dts[1].replace('Z', '') : '';
  const zone = frmt.indexOf(ZONE) >= 0 ? timezone(dt) : '';
  const intvl = frmt.indexOf(YEAR_TO_MONTH) >= 0 ? interval(false, dates) : 
    frmt.indexOf(DAYS_TO_SEC) >= 0 ? interval(true, dates) : '';

  return `${date}${date && time ? ' ' : ''}${time}${(date || time) && zone ? ' ' : ''}${zone}${
    (date || time || zone) && intvl ? ' ' : ''}${intvl}`;
}

/**
 * Extracts/formats a timezone from a given date that is suitable for database consumption.
 * @private
 * @param {Date} date The date to extract the timezone from
 * @returns {String} The timezone in the format `[+|-]TH:TM`
 */
function timezone(date) {
  const offset = date.getTimezoneOffset(), off = Math.abs(offset);
  return (offset < 0 ? '+' : '-') + ('00' + Math.floor(off / 60)).slice(-2) + ':' + ('00' + (off % 60)).slice(-2);
}

/**
 * Calculates/formats an interval to either a _year to month_ or a _day to second_ that is suitable for database
 * consumption.
 * @private
 * @param {Boolean} isDayToSec Truthy to indicate that the interval is _day to second_, falsy to indicate the interval
 * is _year to month_ (extracts the value from `dates[2]`).
 * @param {Date[]} dates The __starting__ date, __ending__ date and __extractionDate__: The date to extract either the
 * time from (`isDayToSec` is truthy) or the date to extract the month from (`isDayToSec` is falsy, _year to month_).
 * @returns {String} The formatted interval in the format `[+|-]YEARS-MM` (_year to month_) or `[+|-]DAYS HH:MI:SS.FFF` 
 */
function interval(isDayToSec, dates) {
  if (!(dates[0] instanceof Date)) {
    throw new Error(`Interval ${isDayToSec ? 'day-to-second' : 'year-to-month'} requires a starting Date`);
  }
  if (!(dates[1] instanceof Date)) {
    throw new Error(`Interval ${isDayToSec ? 'day-to-second' : 'year-to-month'} requires an ending Date`);
  }
  if (!(dates[2] instanceof Date)) {
    throw new Error(`Interval ${isDayToSec ? 'day-to-second' : 'year-to-month'} requires an extraction Date for the ${
      (isDayToSec && 'time') || 'month'}`);
  }
  const utc1 = Date.UTC(dates[0].getFullYear(), dates[0].getMonth(), dates[0].getDate());
  const utc2 = Date.UTC(dates[1].getFullYear(), dates[1].getMonth(), dates[1].getDate());
  const to = isDayToSec ? dates[2].toISOString().split('T')[1].replace('Z', '') : ('00' + (dates[2].getMonth() + 1)).slice(-2);
  const num = Math.floor((Math.max(utc1, utc2) - Math.min(utc1, utc2)) / (isDayToSec ? 8.6401e+7 : 3.1536e+10));
  return (utc1 > utc2 ? '-' : '+') + Math.abs(num) + (isDayToSec ? ' ' : '-') + to;
}