'use strict';

const DATE = 'YYYY-MM-DD';
const TIME = 'HH:MI:SS.FFF';
const ZONE = '[+|-]TH:TM';
const YEAR_TO_MONTH = '[+|-]YEARS-MM';
const DAY_TO_SEC = '[+|-]DAYS HH:MI:SS.FFF';
const DATE_RX = /(\d{4})-(\d{1,2})-(\d{1,2})/;
const TIME_RX = /(\d{2}):(\d{2}):(\d{2})\.(\d{3})/;
const ZONE_RX = /([+-])(\d{1,2}):(\d{1,2})/;
const YEAR_TO_MONTH_RX = /([+-]\d{1,4})-(\d{1,2})/;
const DAY_TO_SEC_RX = /([+-]\d{1,7})/;

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
   * (i.e. `YYYY-MM-DD`; see {@link MomentDB} for notation details) or when a formatted Date string is provided, a Date is returned.
   * @param {(Date | String)} date The date to extract the __date__ from or a formatted date string to convert _back_ into a Date
   * @returns {(String | Date)} The formatted output when a Date was passed or a Date when a formatted date string was passed
   */
  static date(date) {
    if (date instanceof Date) {
      return format(DATE, date);
    }
    return unformat([DATE_RX], date);
  }

  /**
   * Formats the specified date into an ANSI compatible __time__ (with or w/o a timezone) that is suitable for database consumption
   * (i.e. `HH:MI:SS.FFF [+|-]TH:TM` or `HH:MI:SS.FFF` w/o a timezone; see {@link MomentDB} for notation details) or when a
   * formatted date string is provided, a Date is returned.
   * @param {(Date | String)} date The date to extract the __time__ from or a formatted __time__ string to convert _back_ into a Date
   * @param {Boolean} [excludeTimezone] Truthy to exclude the timezone in the output
   * @returns {(String | Date)} The formatted output when a Date was passed or a Date when a formatted date string was passed
   */
  static time(date, excludeTimezone) {
    if (date instanceof Date) {
      return format(excludeTimezone ? TIME : `${TIME} ${ZONE}`, date);
    }
    return unformat(excludeTimezone ? [TIME_RX] : [TIME_RX, ZONE_RX], date);
  }

  /**
   * Formats the specified date into an ANSI compatible __timestamp__ (with or w/o a timezone) that is suitable for database consumption
   * (i.e. `YYYY-MM-DD HH:MI:SS.FFF [+|-]TH:TM` or `YYYY-MM-DD HH:MI:SS.FFF` w/o a timezone; see {@link MomentDB} for notation details).
   * @param {(Date | String)} date The date to extract the __timestamp__ from or a formatted __timestamp__ string to convert _back_ into
   * a Date
   * @param {Boolean} [excludeTimezone] Truthy to exclude the timezone in the output
   * @returns {(String | Date)} The formatted output when a Date was passed or a Date when a formatted date string was passed
   */
  static timestamp(date, excludeTimezone) {
    if (date instanceof Date) {
      return format(`${DATE} ${TIME}${excludeTimezone ? '' : ` ${ZONE}`}`, date);
    }
    return unformat(excludeTimezone ? [DATE_RX, TIME_RX] : [DATE_RX, TIME_RX, ZONE_RX], date);
  }

  /**
   * Calulates the number of __years__ from the specified `startDate` and `endDate` along with the extracted/formatted __month__
   * from the `monthDate`. The output is rendered in an ANSI compatible format that is suitable for database consumption
   * (i.e. `[+|-]YEARS-MM`; see {@link MomentDB} for notation details). When an interval-year-to-month formatted string is passed
   * as the `startDate`, a Date will be created based upon the number of years and the UTC month within the formatted string.
   * @param {(Date | String]} startDate The starting date (can be _after_ `endDate` for negative formatting) when generating a 
   * formatted string _OR_ an interval-year-to-month formatted string to generate a Date from.
   * @param {Date} [endDate] The ending date (can be _before_ `startDate` for negative formatting). __Required when `startDate`
   * is an actual Date__. Optional reference Date when converting an interval-year-to-month formatted string to a Date (default
   * `new Date()` in this case).
   * @param {Date} [monthDate] The date to extract the __month__ from. __Required when `startDate` is an actual Date (ignored
   * otherwise)__.
   * @returns {(String | Date)} The interval-day-to-second formatted string when a Date was passed as `startDate` _OR_ a Date when an
   * interval-year-to-month formatted string was passed as the `startDate`.
   */
  static intervalYearToMonth(startDate, endDate, monthDate) {
    if (startDate instanceof Date && endDate instanceof Date && monthDate instanceof Date) {
      return format(YEAR_TO_MONTH, startDate, endDate, monthDate);
    }
    return unformat([YEAR_TO_MONTH_RX], startDate, endDate);
  }

  /**
   * Calulates the number of __days__ from the specified `startDate` and `endDate` along with the extracted/formatted __time__
   * from the `timestamp`. The output is rendered in an ANSI compatible format that is suitable for database consumption
   * (i.e. `[+|-]DAYS HH:MI:SS.FFF`; see {@link MomentDB} for notation details). When an interval-day-to-second formatted string is
   * passed as the `startDate`, a Date will be created based upon the number of days and the UTC time within the formatted string.
   * @param {(Date | String)} startDate he starting date (can be _after_ `endDate` for negative formatting) when generating a 
   * formatted string _OR_ an interval-day-to-second formatted string to generate a Date from.
   * @param {Date} [endDate] The ending date (can be _before_ `startDate` for negative formatting). __Required when `startDate`
   * is an actual Date__. Optional reference Date when converting an interval-day-to-second formatted string to a Date (default
   * `new Date()` in this case).
   * @param {Date} [timestamp] The date to extract the __time__ from. __Required when `startDate` is an actual Date (ignored
   * otherwise)__.
   * @returns {(String | Date)} The interval-day-to-second formatted string when a Date was passed as `startDate` _OR_ a Date when an
   * interval-day-to-second formatted string was passed as the `startDate`.
   */
  static intervalDayToSecond(startDate, endDate, timestamp) {
    if (startDate instanceof Date && endDate instanceof Date && timestamp instanceof Date) {
      return format(DAY_TO_SEC, startDate, endDate, timestamp);
    }
    return unformat([DAY_TO_SEC_RX, TIME_RX], startDate, endDate);
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
  const useZone = frmt.indexOf(ZONE) >= 0;
  const dts = dates[0].toISOString().split('T');

  const date = frmt.indexOf(DATE) >= 0 ? dts[0] : '';
  let time = frmt.indexOf(TIME) >= 0 ? useZone ? `${
    ('00' + dates[0].getHours()).slice(-2)}:${
      ('00' + dates[0].getMinutes()).slice(-2)}:${
        ('00' + dates[0].getSeconds()).slice(-2)}.${
          ('000' + dates[0].getMilliseconds()).slice(-3)}` : 
    dts[1].replace('Z', '') : '';
  const zone = useZone ? timezone(dates[0]) : '';
  const intvl = frmt.indexOf(YEAR_TO_MONTH) >= 0 ? interval(false, dates) : 
    frmt.indexOf(DAY_TO_SEC) >= 0 && !(time = '') ? interval(true, dates) : '';

  return `${date}${date && time ? ' ' : ''}${time}${(date || time) && zone ? ' ' : ''}${zone}${
    (date || time || zone) && intvl ? ' ' : ''}${intvl}`;
}

/**
 * Converts a previously formatted date/time from {@link format} into a Date.
 * @param {RegExp[]} rxs The regular expressions that will indicate how the Date will be set (should match one or more of the
 * global regular expressions)
 * @param {String} formatted The formatted date, time, timestamp, etc.
 * @param {Date} [refDate] A reference date to use when calculating __interval-year-to-month__ or __interval-day-to-second__
 * (otherwise, ignored)
 * @returns {Date} A Date set to the proper date/time/zone indicated by the specified regular expressions
 */
function unformat(rxs, formatted, refDate) {
  const dte = rxs.includes(DATE_RX) && formatted.match(DATE_RX);
  const tms = rxs.includes(TIME_RX) && formatted.match(TIME_RX);
  const zns = rxs.includes(ZONE_RX) && formatted.match(ZONE_RX);
  const ytm = rxs.includes(YEAR_TO_MONTH_RX) && formatted.match(YEAR_TO_MONTH_RX);
  const dts = rxs.includes(DAY_TO_SEC_RX) && formatted.match(DAY_TO_SEC_RX);

  let date, time, yyyy, mm, dd, hh, mi, ss, fff;
  if (ytm) {
    const years = parseInt(ytm[1]);
    date = new Date((refDate instanceof Date ? refDate : new Date()).getTime() + years * 3.1556952e+10);
    mm = parseInt(ytm[2]) - 1;
    dd = 1;
    hh = mi = ss = fff = 0;
  }
  if (dts) {
    const days = parseInt(dts[1]);
    time = (refDate instanceof Date ? refDate : new Date()).getTime() + days * 8.64e+7;
    date = new Date(time);
  }
  if (dte) {
    yyyy = parseInt(dte[1]);
    mm = parseInt(dte[2]) - 1;
    dd = parseInt(dte[3]);
    hh = mi = ss = fff = 0;
  } else if (tms && !date) {
    yyyy = 0;
    mm = 0;
    dd = 1;
  }
  if (tms) {
    hh = parseInt(tms[1]);
    mi = parseInt(tms[2]);
    ss = parseInt(tms[3]);
    fff = parseInt(tms[4]);
  }
  const type = zns ? '' : 'UTC';
  if (zns) {
    if (!time) time = 0;
    if (hh !== undefined) time += hh * 3.6e+6;
    if (mi !== undefined) time += mi * 60000;
    if (ss !== undefined) time += ss * 1000;
    if (fff !== undefined) time += fff;
    const offset = (zns[1] === '-' ? -1 : 1) * (parseInt(zns[2]) * 3.6e+6 + parseInt(zns[3]) * 60000);
    if (time) time -= offset;
    else time = offset;
    if (date) date.setTime(time);
    else date = new Date(time);
    hh = mi = ss = fff = undefined;
  } else if (!date) date = new Date();
  if (yyyy !== undefined) date[`set${type}FullYear`](yyyy);
  if (mm !== undefined) date[`set${type}Month`](mm);
  if (dd !== undefined) date[`set${type}Date`](dd);
  if (hh !== undefined) date[`set${type}Hours`](hh);
  if (mi !== undefined) date[`set${type}Minutes`](mi);
  if (ss !== undefined) date[`set${type}Seconds`](ss);
  if (fff !== undefined) date[`set${type}Milliseconds`](fff);
  return date;
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
    throw new TypeError(`Interval ${isDayToSec ? 'day-to-second' : 'year-to-month'} requires a starting Date`);
  }
  if (!(dates[1] instanceof Date)) {
    throw new TypeError(`Interval ${isDayToSec ? 'day-to-second' : 'year-to-month'} requires an ending Date`);
  }
  if (!(dates[2] instanceof Date)) {
    throw new TypeError(`Interval ${isDayToSec ? 'day-to-second' : 'year-to-month'} requires an extraction Date for the ${
      (isDayToSec && 'time') || 'month'}`);
  }
  const utc1 = Date.UTC(dates[0].getFullYear(), dates[0].getMonth(), dates[0].getDate());
  const utc2 = Date.UTC(dates[1].getFullYear(), dates[1].getMonth(), dates[1].getDate());
  const to = isDayToSec ? dates[2].toISOString().split('T')[1].replace('Z', '') : ('00' + (dates[2].getMonth() + 1)).slice(-2);
  const num = Math.floor((Math.max(utc1, utc2) - Math.min(utc1, utc2)) / (isDayToSec ? 8.6401e+7 : 3.1536e+10));
  return (utc1 < utc2 ? '-' : '+') + (isDayToSec ? ('0000000' + Math.abs(num)).slice(-7) : ('0000' + Math.abs(num)).slice(-4)) + (isDayToSec ? ' ' : '-') + to;
}