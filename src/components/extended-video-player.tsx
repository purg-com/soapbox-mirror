import { useEffect, useRef } from 'react';

import { isIOS } from 'soapbox/is-mobile.ts';

interface IExtendedVideoPlayer {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  time?: number;
  controls?: boolean;
  muted?: boolean;
  onClick?: () =>  void;
}

const ExtendedVideoPlayer: React.FC<IExtendedVideoPlayer> = ({ src, alt, time, controls, muted, onClick }) => {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleLoadedData = () => {
      if (time) {
        video.current!.currentTime = time;
      }
    };

    video.current?.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.current?.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [video.current]);

  const handleClick: React.MouseEventHandler<HTMLVideoElement> = e => {
    e.stopPropagation();
    const handler = onClick;
    if (handler) handler();
  };

  const conditionalAttributes: React.VideoHTMLAttributes<HTMLVideoElement> = {};
  if (isIOS()) {
    conditionalAttributes.playsInline = true;
  }

  return (
    <div className='flex size-full items-center justify-center'>
      <video
        ref={video}
        src={src}
        className='max-h-[80%] max-w-full'
        autoPlay
        role='button'
        tabIndex={0}
        aria-label={alt}
        title={alt}
        muted={muted}
        controls={controls}
        loop={!controls}
        onClick={handleClick}
        {...conditionalAttributes}
      />
    </div>
  );
};

export default ExtendedVideoPlayer;
