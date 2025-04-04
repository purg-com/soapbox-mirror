import { Component } from 'react';
import { injectIntl, defineMessages, IntlShape, FormatDateOptions } from 'react-intl';

import Text, { IText } from './ui/text.tsx';

const messages = defineMessages({
  just_now: { id: 'relative_time.just_now', defaultMessage: 'now' },
  seconds: { id: 'relative_time.seconds', defaultMessage: '{number}s' },
  minutes: { id: 'relative_time.minutes', defaultMessage: '{number}m' },
  hours: { id: 'relative_time.hours', defaultMessage: '{number}h' },
  days: { id: 'relative_time.days', defaultMessage: '{number}d' },
  moments_remaining: { id: 'time_remaining.moments', defaultMessage: 'Moments remaining' },
  seconds_remaining: { id: 'time_remaining.seconds', defaultMessage: '{number, plural, one {# second} other {# seconds}} left' },
  minutes_remaining: { id: 'time_remaining.minutes', defaultMessage: '{number, plural, one {# minute} other {# minutes}} left' },
  hours_remaining: { id: 'time_remaining.hours', defaultMessage: '{number, plural, one {# hour} other {# hours}} left' },
  days_remaining: { id: 'time_remaining.days', defaultMessage: '{number, plural, one {# day} other {# days}} left' },
});

export const dateFormatOptions: FormatDateOptions = {
  hour12: true,
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: 'numeric',
  minute: '2-digit',
};

const shortDateFormatOptions: FormatDateOptions = {
  month: 'short',
  day: 'numeric',
};

const SECOND = 1000;
const MINUTE = 1000 * 60;
const HOUR = 1000 * 60 * 60;
const DAY = 1000 * 60 * 60 * 24;

const MAX_DELAY = 2147483647;

const selectUnits = (delta: number) => {
  const absDelta = Math.abs(delta);

  if (absDelta < MINUTE) {
    return 'second';
  } else if (absDelta < HOUR) {
    return 'minute';
  } else if (absDelta < DAY) {
    return 'hour';
  }

  return 'day';
};

const getUnitDelay = (units: string) => {
  switch (units) {
    case 'second':
      return SECOND;
    case 'minute':
      return MINUTE;
    case 'hour':
      return HOUR;
    case 'day':
      return DAY;
    default:
      return MAX_DELAY;
  }
};

export const timeAgoString = (intl: IntlShape, date: Date, now: number, year: number) => {
  const delta = now - date.getTime();

  let relativeTime;

  if (delta < 10 * SECOND) {
    relativeTime = intl.formatMessage(messages.just_now);
  } else if (delta < 7 * DAY) {
    if (delta < MINUTE) {
      relativeTime = intl.formatMessage(messages.seconds, { number: Math.floor(delta / SECOND) });
    } else if (delta < HOUR) {
      relativeTime = intl.formatMessage(messages.minutes, { number: Math.floor(delta / MINUTE) });
    } else if (delta < DAY) {
      relativeTime = intl.formatMessage(messages.hours, { number: Math.floor(delta / HOUR) });
    } else {
      relativeTime = intl.formatMessage(messages.days, { number: Math.floor(delta / DAY) });
    }
  } else if (date.getFullYear() === year) {
    relativeTime = intl.formatDate(date, shortDateFormatOptions);
  } else {
    relativeTime = intl.formatDate(date, { ...shortDateFormatOptions, year: 'numeric' });
  }

  return relativeTime;
};

const timeRemainingString = (intl: IntlShape, date: Date, now: number) => {
  const delta = date.getTime() - now;

  let relativeTime;

  if (delta < 10 * SECOND) {
    relativeTime = intl.formatMessage(messages.moments_remaining);
  } else if (delta < MINUTE) {
    relativeTime = intl.formatMessage(messages.seconds_remaining, { number: Math.floor(delta / SECOND) });
  } else if (delta < HOUR) {
    relativeTime = intl.formatMessage(messages.minutes_remaining, { number: Math.floor(delta / MINUTE) });
  } else if (delta < DAY) {
    relativeTime = intl.formatMessage(messages.hours_remaining, { number: Math.floor(delta / HOUR) });
  } else {
    relativeTime = intl.formatMessage(messages.days_remaining, { number: Math.floor(delta / DAY) });
  }

  return relativeTime;
};

interface RelativeTimestampProps extends IText {
  intl: IntlShape;
  timestamp: string;
  year?: number;
  futureDate?: boolean;
}

interface RelativeTimestampState {
  now: number;
}

/** Displays a timestamp compared to the current time, eg "1m" for one minute ago. */
class RelativeTimestamp extends Component<RelativeTimestampProps, RelativeTimestampState> {

  _timer: NodeJS.Timeout | undefined;

  state = {
    now: Date.now(),
  };

  static defaultProps = {
    year: (new Date()).getFullYear(),
    theme: 'inherit' as const,
  };

  shouldComponentUpdate(nextProps: RelativeTimestampProps, nextState: RelativeTimestampState) {
    // As of right now the locale doesn't change without a new page load,
    // but we might as well check in case that ever changes.
    return this.props.timestamp !== nextProps.timestamp ||
      this.props.intl.locale !== nextProps.intl.locale ||
      this.state.now !== nextState.now;
  }

  UNSAFE_componentWillReceiveProps(prevProps: RelativeTimestampProps) {
    if (this.props.timestamp !== prevProps.timestamp) {
      this.setState({ now: Date.now() });
    }
  }

  componentDidMount() {
    this._scheduleNextUpdate();
  }

  UNSAFE_componentWillUpdate() {
    this._scheduleNextUpdate();
  }

  componentWillUnmount() {
    if (this._timer) {
      clearTimeout(this._timer);
    }
  }

  _scheduleNextUpdate() {
    if (this._timer) {
      clearTimeout(this._timer);
    }

    const { timestamp } = this.props;
    const delta = (new Date(timestamp)).getTime() - this.state.now;
    const unitDelay = getUnitDelay(selectUnits(delta));
    const unitRemainder = Math.abs(delta % unitDelay);
    const updateInterval = 1000 * 10;
    const delay = delta < 0 ? Math.max(updateInterval, unitDelay - unitRemainder) : Math.max(updateInterval, unitRemainder);

    this._timer = setTimeout(() => {
      this.setState({ now: Date.now() });
    }, delay);
  }

  render() {
    const { timestamp, intl, year, futureDate, theme, ...textProps } = this.props;

    const date = new Date(timestamp);
    const relativeTime = futureDate ? timeRemainingString(intl, date, this.state.now) : timeAgoString(intl, date, this.state.now, year!);

    return (
      <Text {...textProps} theme={theme} tag='time' title={intl.formatDate(date, dateFormatOptions)}>
        {relativeTime}
      </Text>
    );
  }

}

export default injectIntl(RelativeTimestamp);
