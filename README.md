# moment-db
Moment implementation for formatting Dates into ANSI compatible strings suitable for database consumption.

`npm install moment-db`

`import MomentDB from 'moment-db.js'`

Assume the date/time notation below.

| <u>Notation</u>           | <u>Description</u>
| :---                      | :---
| YYYY                      | 4-digit year
| MM                        | 2-digit month (01 to 12)
| DD                        | 2-digit day (01 to 31)
| HH                        | 2-digit hour (00 to 23)
| MI                        | 2-digit minute (00 to 59)
| SS                        | 2-digit second (00 to 59)
| FFF                       | Fraction of a second (1 to 9 digits)
| TH                        | 2-digit hour offset (-12 to 14)
| TM                        | 2-digit minute offset (00 to 59)
| YEARS                     | Number of years (max of 9999)
| DAYS                      | Number of days (max of 3652047)

Using the forementioned notation, the following database data types can be used to construct ANSI compliant date/time formats:

| <u>Data Type</u>                                  | <u>Format</u>                           | <u>Example</u>
| :---                                              | :---                                    | :---
| [DATE](#date)                                     | `YYYY-MM-DD`                            | `2030-01-31`
| [TIME (w/o time zone)](#time)                     | `HH:MI:SS.FFF`                          | `12:01:20.903`
| [TIME (with time zone)](#timezone)                | `HH:MI:SS.FFF [+|-]TH:TM`               | `12:01:20.903 -07:00`
| [TIMESTAMP (w/o time zone)](#timestamp)           | `YYYY-MM-DD HH:MI:SS.FFF`               | `2030-01-31 12:01:20.903`
| [TIMESTAMP (with time zone)](#timestampzone)      | `YYYY-MM-DD HH:MI:SS.FFF [+|-]TH:TM`    | `2030-01-31 12:01:20.903 -07:00`
| [INTERVAL YEAR TO MONTH](#intervalyeartomonth)    | `[+|-]YEARS-MM`                         | `+130-01`
| [INTERVAL DAY TO SECONDS](#intervaldaytosecond)   | `[+|-]DAYS HH:MI:SS.FFF`                | `-47482 12:01:20.903`

### DATE<sub id="date"></sub>
```js
const date = MomentDB.toDate(new Date());
// assumming date, the output would be something like:
// 2030-01-31 12:01:20.903 -07:00
```

### TIME (w/o time zone)<sub id="time"></sub>
```js
const time = MomentDB.toTime(new Date(), true);
// assumming date, the output would be something like:
// 12:01:20.903
```

### TIME (with time zone)<sub id="timezone"></sub>
```js
const time = MomentDB.toTime(new Date());
// assumming date/timezone, the output would be something like:
// 12:01:20.903 -07:00
```

### TIMESTAMP (w/o time zone)<sub id="timestamp"></sub>
```js
const ts = MomentDB.toTimestamp(new Date(), true);
// assumming date, the output would be something like:
// 2030-12-31 12:01:20.903
```

### TIMESTAMP (with time zone)<sub id="timestampzone"></sub>
```js
const ts = MomentDB.toTimestamp(new Date());
// assumming date/timezone, the output would be something like:
// 2030-12-31 12:01:20.903 -07:00
```

### INTERVAL (year to month)<sub id="intervalyeartomonth"></sub>
```js
const date1 = new Date(Date.UTC(1900, 00, 01)), date2 = new Date();
const monthDate = new Date();
monthDate.setMonth(0);
const interval = MomentDB.toIntervalYearToMonth(date1, date2, monthDate);
// output (assuming we are in year 2030):
// +130-01
```

### INTERVAL (day to second)<sub id="intervaldaytosecond"></sub>
```js
const date1 = new Date(), date2 = new Date(Date.UTC(1900, 00, 01));
const timeDate = new Date();
const interval = MomentDB.toIntervalDayToSecond(date1, date2, timeDate);
// output (assuming we are in year 2030 and the time is the as indicated in timeDate):
// -47482 12:01:20.903
```
