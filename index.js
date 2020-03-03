'use strict';

const DATE = 'YYYY-MM-DD';
const TIME = 'HH:MI:SS.FFF';
const ZONE = '[+|-]TH:TM';
const YEAR_TO_MONTH = '[+|-]YEARS-MM';
const DAY_TO_SEC = '[+|-]DAYS HH:MI:SS.FFF';
const DATE_RX = /(\d{4})-(\d{2})-(\d{2})/;
const TIME_RX = /(\d{2}):(\d{2}):(\d{2})\.(\d{3})/;
const ZONE_RX = /([+-])(\d{2}):(\d{2})/;
const YEAR_TO_MONTH_RX = /([+-])(\d{4}):(\d{2})/;
const DAY_TO_SEC_RX = /([+-])(\d{7})/;

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
  static date(date) {
    return format(DATE, date);
  }

  /**
   * Formats the specified date into an ANSI compatible __time__ (with or w/o a timezone) that is suitable for database consumption
   * (i.e. `HH:MI:SS.FFF [+|-]TH:TM` or `HH:MI:SS.FFF` w/o a timezone; see {@link MomentDB} for notation details).
   * @param {Date} date The date to extract the __time__ from
   * @param {Boolean} [excludeTimezone] Truthy to exclude the timezone in the output
   * @returns {String} The formatted output
   */
  static time(date, excludeTimezone) {
    return format(excludeTimezone ? TIME : `${TIME} ${ZONE}`, date);
  }

  /**
   * Formats the specified date into an ANSI compatible __timestamp__ (with or w/o a timezone) that is suitable for database consumption
   * (i.e. `YYYY-MM-DD HH:MI:SS.FFF [+|-]TH:TM` or `YYYY-MM-DD HH:MI:SS.FFF` w/o a timezone; see {@link MomentDB} for notation details).
   * @param {Date} date The date to extract the __timestamp__ from
   * @param {Boolean} [excludeTimezone] Truthy to exclude the timezone in the output
   * @returns {String} The formatted output
   */
  static timestamp(date, excludeTimezone) {
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
  static intervalYearToMonth(startDate, endDate, monthDate) {
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
  static intervalDayToSecond(startDate, endDate, timestamp) {
    return format(DAY_TO_SEC, startDate, endDate, timestamp);
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

function unformat(formatted) {
  /*const DATE = 'YYYY-MM-DD';
  const TIME = 'HH:MI:SS.FFF';
  const ZONE = '[+|-]TH:TM';
  const YEAR_TO_MONTH = '[+|-]YEARS-MM';
  const DAY_TO_SEC = '[+|-]DAYS HH:MI:SS.FFF';*/
  const DATE_RX = /(\d{4})-(\d{1,2})-(\d{1,2})/;
  const TIME_RX = /(\d{2}):(\d{2}):(\d{2})\.(\d{3})/;
  const ZONE_RX = /([+-])(\d{1,2}):(\d{1,2})/;
  const YEAR_TO_MONTH_RX = /([+-]\d{1,4})-(\d{1,2})/;
  const DAY_TO_SEC_RX = /([+-]\d{1,7})/;

  const dte = formatted.match(DATE_RX);
  const tms = formatted.match(TIME_RX);
  const zns = dte || tms ? formatted.match(ZONE_RX) : null;
  const ytm = !tms && !zns ? formatted.match(YEAR_TO_MONTH_RX) : null;
  const dts = tms && !zns && !ytm ? formatted.match(DAY_TO_SEC_RX) : null;

  let date, yyyy, mm, dd, hh, mi, ss, fff;
  if (ytm) {
    const years = parseInt(ytm[1]);
    date = new Date(new Date().getTime() + years * 3.1556952e+10);
    mm = parseInt(ytm[2]) - 1;
  } else if (dts || tms) {
    hh = parseInt(tms[1]);
    mi = parseInt(tms[2]);
    ss = parseInt(tms[3]);
    fff = parseInt(tms[4]);
    if (dts) {
      const days = parseInt(dts[1]);
      date = new Date(new Date().getTime() + days * 8.64e+7);
    } else {
      date = new Date();
    }
  }
  if (date) {
    if (yyyy !== undefined) date.setUTCFullYear(yyyy);
    if (mm !== undefined) date.setUTCMonth(mm);
    if (dd !== undefined) date.setUTCDate(dd);
    if (hh !== undefined) date.setUTCHours(hh);
    if (mi !== undefined) date.setUTCMinutes(mi);
    if (ss !== undefined) date.setUTCSeconds(ss);
    if (fff !== undefined) date.setUTCMilliseconds(fff);
  } else if (dte) {
    yyyy = parseInt(dte[1]);
    mm = parseInt(dte[2]);
    dd = parseInt(dte[3]);
    date = new Date(`${yyyy}-${mm}-${dd}${tms ? `T${hh}:${mi}:${ss}.${fff}${zns ? `${zns[1]}${zns[2]}:${zns[3]}` : ''}` : ''}`);
  }
  return date;

  const offset = zns ? parseInt(zns[1]) * 3.6e+6 + parseInt(zns[2]) * 60000 : null;
}

function humanise(dayCount) {
  const now = new Date(), then = new Date(now.getTime() + dayCount * 8.64e+7);
  const years = then.getUTCFullYear() - now.getUTCFullYear();
  const months = then.getUTCMonth() - now.getUTCMonth();
  const days = then.getUTCDate() - now.getUTCDate();
  return `${years}-${months}-${days}`;

  const cal = [31, (then.getUTCFullYear()%4?29:28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var date_string = "";
    while(true)
    {
        date_string = "";
        date_string += (years>0?years + "Y":"");

        if(months<0){
          years -= 1; months += 12; continue;
        }
        date_string += (months>0?months + "M":"");

        if(days<0){
          months -= 1; days += cal[((11+then.getUTCMonth())%12)]; continue;
        }
        date_string += (days>0?days + "D":"");
        break;
    }
    console.log(date_string);
    return date_string;
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