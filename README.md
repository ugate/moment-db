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

## Converting ES Dates<sub id="datetostring"></sub>

Each _static_ `MomentDB` function accepts a `Date` that can be formatted into an ANSI compliant date/time format suitible for database consumption.

### DATE<sub id="date"></sub>
```js
const date = MomentDB.date(new Date());
// assumming date, the output would be something like:
// 2030-01-31
```

### TIME (w/o time zone)<sub id="time"></sub>
```js
const time = MomentDB.time(new Date(), true);
// assumming date, the output would be something like:
// 12:01:20.903
```

### TIME (with time zone)<sub id="timezone"></sub>
```js
const time = MomentDB.time(new Date());
// assumming date/timezone, the output would be something like:
// 12:01:20.903 -07:00
```

### TIMESTAMP (w/o time zone)<sub id="timestamp"></sub>
```js
const ts = MomentDB.timestamp(new Date(), true);
// assumming date, the output would be something like:
// 2030-01-31 12:01:20.903
```

### TIMESTAMP (with time zone)<sub id="timestampzone"></sub>
```js
const ts = MomentDB.timestamp(new Date());
// assumming date/timezone, the output would be something like:
// 2030-01-31 12:01:20.903 -07:00
```

### INTERVAL (year to month)<sub id="intervalyeartomonth"></sub>
```js
const date1 = new Date(Date.UTC(1900, 00, 01)), date2 = new Date();
const monthDate = new Date();
monthDate.setMonth(0);
const interval = MomentDB.intervalYearToMonth(date1, date2, monthDate);
// output (assuming we are in year 2030):
// +130-01
```

### INTERVAL (day to second)<sub id="intervaldaytosecond"></sub>
```js
const date1 = new Date(), date2 = new Date(Date.UTC(1900, 00, 01));
const timeDate = new Date();
const interval = MomentDB.intervalDayToSecond(date1, date2, timeDate);
// output (assuming we are in year 2030 and the time is the as indicated in timeDate):
// -47482 12:01:20.903
```

## Converting formatted dates/times into ES Dates<sub id="stringtodate"></sub>

Each _static_ `MomentDB` function accepts a string returned from prior call to one of the [string conversion functions](#datetostring) that will be converted back into a `Date`.

### DATE<sub id="date2"></sub>
```js
const date = MomentDB.date('2030-01-31');
const iso = date.toISOString();
// outputs a Date with the date set as UTC
// 2030-01-31T00:00:00.000Z
```

### TIME (w/o time zone)<sub id="time2"></sub>
```js
const time = MomentDB.time('12:01:20.903');
const iso = time.toISOString();
// outputs a Date with the time set as UTC
// iso output (date defaults to 0000-01-01):
// 0000-01-01T12:01:20.903Z

// can also remove the timezone, if needed:
const time2 = MomentDB.time('12:01:20.903 -07:00', true);
const iso2 = time2.toISOString();
// outputs a Date with the time set as UTC (no timezone)
// iso2 output (date defaults to 0000-01-01):
// 0000-01-01T12:01:20.903Z
```

### TIME (with time zone)<sub id="timezone2"></sub>
```js
const time = MomentDB.time('12:01:20.903 -07:00');
const iso = time.toISOString();
// outputs a Date with the time set with the indicated zone
// iso output (date defaults to 0000-01-01):
// 0000-01-01T19:29:38.903Z
```

### TIMESTAMP (w/o time zone)<sub id="timestamp2"></sub>
```js
const ts = MomentDB.timestamp('2030-01-31 12:01:20.903');
const iso = ts.toISOString();
// outputs a Date with the date/time set as UTC
// iso output:
// 2030-01-31T12:01:20.903Z

// can also remove the timezone, if needed:
const ts2 = MomentDB.timestamp('2030-01-31 12:01:20.903 -07:00', true);
const iso2 = ts2.toISOString();
// outputs a Date with the date/time set as UTC (no timezone)
// iso2 output:
// 2030-01-31T12:01:20.903Z
```

### TIMESTAMP (with time zone)<sub id="timestampzone2"></sub>
```js
const ts = MomentDB.timestamp('2030-01-31 12:01:20.903 -07:00');
const iso = ts.toISOString();
// iso output:
// 2030-01-31T19:01:20.903Z
```

### INTERVAL (year to month)<sub id="intervalyeartomonth2"></sub>
```js
const date = MomentDB.intervalYearToMonth('+130-02');
const iso = date.toISOString();
// iso output (assuming the current year is 2030):
// 2160-02-01T00:00:00.000Z

// can also pass a reference date for the year instead of the default current date
const date2 = MomentDB.intervalYearToMonth('+130-02', new Date(Date.UTC(2030)));
const iso = date.toISOString();
// iso output (assuming today is 2030-02-03 and time in UTC is as indicated):
// 2160-02-01T00:00:00.000Z
```

### INTERVAL (day to second)<sub id="intervaldaytosecond2"></sub>
```js
const date = MomentDB.intervalDayToSecond('-47482 12:01:20.903');
const iso = date.toISOString();
// iso output (assuming today is 2030-02-03 and time in UTC is as indicated):
// 1900-02-03T12:01:20.903Z

// can also pass a reference date to use instead of the default current date
const date2 = MomentDB.intervalDayToSecond('-47482 12:01:20.903', new Date(Date.UTC(2030, 1, 3)));
const iso = date.toISOString();
// iso output (assuming today is 2030-02-03 and time in UTC is as indicated):
// 1900-02-03T12:01:20.903Z
```