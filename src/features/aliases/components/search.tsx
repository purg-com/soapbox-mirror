import backspaceIcon from '@tabler/icons/outline/backspace.svg';
import clsx from 'clsx';
import { defineMessages, useIntl } from 'react-intl';

import { fetchAliasesSuggestions, clearAliasesSuggestions, changeAliasesSuggestions } from 'soapbox/actions/aliases.ts';
import Button from 'soapbox/components/ui/button.tsx';
import SvgIcon from 'soapbox/components/ui/svg-icon.tsx';
import { useAppDispatch } from 'soapbox/hooks/useAppDispatch.ts';
import { useAppSelector } from 'soapbox/hooks/useAppSelector.ts';

const messages = defineMessages({
  search: { id: 'aliases.search', defaultMessage: 'Search your old account' },
  searchTitle: { id: 'tabs_bar.search', defaultMessage: 'Explore' },
});

const Search: React.FC = () => {
  const dispatch = useAppDispatch();
  const intl = useIntl();

  const value = useAppSelector(state => state.aliases.suggestions.value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(changeAliasesSuggestions(e.target.value));
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === 13) {
      dispatch(fetchAliasesSuggestions(value));
    }
  };

  const handleSubmit = () => {
    dispatch(fetchAliasesSuggestions(value));
  };

  const handleClear = () => {
    dispatch(clearAliasesSuggestions());
  };

  const hasValue = value.length > 0;

  return (
    <div className='flex items-center gap-1'>
      <label className='relative grow'>
        <span style={{ display: 'none' }}>{intl.formatMessage(messages.search)}</span>

        <input
          className='block w-full rounded-full focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 sm:text-sm'
          type='text'
          value={value}
          onChange={handleChange}
          onKeyUp={handleKeyUp}
          placeholder={intl.formatMessage(messages.search)}
        />

        <div role='button' tabIndex={hasValue ? 0 : -1} className='search__icon' onClick={handleClear}>
          <SvgIcon src={backspaceIcon} aria-label={intl.formatMessage(messages.search)} className={clsx('pointer-events-none absolute right-4 top-1/2 z-20 inline-block size-4.5 -translate-y-1/2 cursor-default text-[16px] text-gray-400 opacity-0 rtl:left-4 rtl:right-auto', { 'pointer-events-auto opacity-100': hasValue })} />
        </div>
      </label>
      <Button onClick={handleSubmit}>{intl.formatMessage(messages.searchTitle)}</Button>
    </div>
  );
};

export default Search;
