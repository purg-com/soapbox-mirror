import HStack from 'soapbox/components/ui/hstack.tsx';
import Stack from 'soapbox/components/ui/stack.tsx';

import { randomIntFromInterval, generateText } from '../utils.ts';

export default ({ limit }: { limit: number }) => {
  const length = randomIntFromInterval(15, 3);
  const acctLength = randomIntFromInterval(15, 3);

  return (
    <>
      {new Array(limit).fill(undefined).map((_, idx) => (
        <HStack key={idx} alignItems='center' space={2} className='animate-pulse'>
          <Stack space={3} className='text-center'>
            <div
              className='mx-auto block size-9 rounded-full bg-primary-200 dark:bg-primary-700'
            />
          </Stack>

          <Stack className='text-primary-200 dark:text-primary-700'>
            <p>{generateText(length)}</p>
            <p>{generateText(acctLength)}</p>
          </Stack>
        </HStack>
      ))}
    </>
  );
};