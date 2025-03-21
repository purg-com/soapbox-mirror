import clsx from 'clsx';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import ReactSwipeableViews from 'react-swipeable-views';

import { useAnnouncements } from 'soapbox/api/hooks/announcements/index.ts';
import { Card } from 'soapbox/components/ui/card.tsx';
import HStack from 'soapbox/components/ui/hstack.tsx';
import Widget from 'soapbox/components/ui/widget.tsx';

import Announcement from './announcement.tsx';

const AnnouncementsPanel = () => {
  const [index, setIndex] = useState(0);
  const { data: announcements } = useAnnouncements();

  if (!announcements || announcements.length === 0) return null;

  const handleChangeIndex = (index: number) => {
    setIndex(index % announcements.length);
  };

  return (
    <Widget title={<FormattedMessage id='announcements.title' defaultMessage='Announcements' />}>
      <Card className='relative black:rounded-xl black:border black:border-gray-800' size='md'>
        <ReactSwipeableViews animateHeight index={index} onChangeIndex={handleChangeIndex}>
          {announcements!.map((announcement) => (
            <Announcement
              key={announcement.id}
              announcement={announcement}
            />
          )).reverse()}
        </ReactSwipeableViews>
        {announcements.length > 1 && (
          <HStack space={2} alignItems='center' justifyContent='center' className='relative'>
            {announcements.map((_, i) => (
              <button
                key={i}
                tabIndex={0}
                onClick={() => setIndex(i)}
                className={clsx({
                  'w-2 h-2 rounded-full focus:ring-primary-600 focus:ring-2 focus:ring-offset-2': true,
                  'bg-gray-200 hover:bg-gray-300': i !== index,
                  'bg-primary-600': i === index,
                })}
              />
            ))}
          </HStack>
        )}
      </Card>
    </Widget>
  );
};

export default AnnouncementsPanel;
