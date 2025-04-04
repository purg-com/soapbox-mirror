import xIcon from '@tabler/icons/outline/x.svg';
import { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { patchMe } from 'soapbox/actions/me.ts';
import { HTTPError } from 'soapbox/api/HTTPError.ts';
import Button from 'soapbox/components/ui/button.tsx';
import FormGroup from 'soapbox/components/ui/form-group.tsx';
import IconButton from 'soapbox/components/ui/icon-button.tsx';
import Stack from 'soapbox/components/ui/stack.tsx';
import Text from 'soapbox/components/ui/text.tsx';
import Textarea from 'soapbox/components/ui/textarea.tsx';
import { useAppDispatch } from 'soapbox/hooks/useAppDispatch.ts';
import { useOwnAccount } from 'soapbox/hooks/useOwnAccount.ts';
import toast from 'soapbox/toast.tsx';

const messages = defineMessages({
  bioPlaceholder: { id: 'onboarding.bio.placeholder', defaultMessage: 'Tell the world a little about yourself…' },
  error: { id: 'onboarding.error', defaultMessage: 'An unexpected error occurred. Please try again or skip this step.' },
});

const closeIcon = xIcon;

interface IBioStep {
  onClose(): void;
  onNext: () => void;
}

const BioStep: React.FC<IBioStep> = ({ onClose, onNext }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const { account } = useOwnAccount();
  const [value, setValue] = useState<string>(account?.source?.note ?? '');
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    setSubmitting(true);

    const credentials = dispatch(patchMe({ note: value }));

    Promise.all([credentials])
      .then(() => {
        setSubmitting(false);
        onNext();
      }).catch(async (error) => {
        setSubmitting(false);

        if (error instanceof HTTPError && error.response.status === 422) {
          const data = await error.response.error();
          if (data) {
            setErrors([data.error]);
          }
        } else {
          toast.error(messages.error);
        }
      });
  };

  return (

    <Stack space={2} justifyContent='center' alignItems='center' className='relative w-full rounded-3xl bg-white px-4 py-8 text-gray-900 shadow-lg black:bg-black dark:bg-primary-900 dark:text-gray-100 dark:shadow-none sm:p-10'>

      <div className='relative w-full'>
        <IconButton src={closeIcon} onClick={onClose} className='absolute -right-2 -top-6 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 rtl:rotate-180' />
        <Stack space={2} justifyContent='center' alignItems='center' className='-mx-4 mb-4 border-b border-solid pb-4 dark:border-gray-800 sm:-mx-10 sm:pb-10'>
          <Text size='2xl' align='center' weight='bold'>
            <FormattedMessage id='onboarding.note.title' defaultMessage='Write a short bio' />
          </Text>
          <Text theme='muted' align='center'>
            <FormattedMessage id='onboarding.note.subtitle' defaultMessage='You can always edit this later.' />
          </Text>
        </Stack>
      </div>

      <div className='mx-auto w-full sm:w-2/3'>
        <FormGroup
          hintText={<FormattedMessage id='onboarding.bio.hint' defaultMessage='Max 500 characters' />}
          labelText={<FormattedMessage id='edit_profile.fields.bio_label' defaultMessage='Bio' />}
          errors={errors}
        >
          <Textarea
            onChange={(event) => setValue(event.target.value)}
            placeholder={intl.formatMessage(messages.bioPlaceholder)}
            value={value}
            maxLength={500}
          />
        </FormGroup>
      </div>

      <Stack justifyContent='center' space={2} className='w-full sm:w-2/3'>
        <Button block theme='primary' type='button' onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <FormattedMessage id='onboarding.saving' defaultMessage='Saving…' />
          ) : (
            <FormattedMessage id='onboarding.next' defaultMessage='Next' />
          )}
        </Button>

        <Button block theme='tertiary' type='button' onClick={onNext}>
          <FormattedMessage id='onboarding.skip' defaultMessage='Skip for now' />
        </Button>
      </Stack>
    </Stack>
  );
};

export default BioStep;