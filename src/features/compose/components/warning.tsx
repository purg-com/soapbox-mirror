import { spring } from 'react-motion';

import Motion from '../../ui/util/optional-motion.tsx';

interface IWarning {
  message: React.ReactNode;
}

/** Warning message displayed in ComposeForm. */
const Warning: React.FC<IWarning> = ({ message }) => (
  <Motion defaultStyle={{ opacity: 0, scaleX: 0.85, scaleY: 0.75 }} style={{ opacity: spring(1, { damping: 35, stiffness: 400 }), scaleX: spring(1, { damping: 35, stiffness: 400 }), scaleY: spring(1, { damping: 35, stiffness: 400 }) }}>
    {({ opacity, scaleX, scaleY }) => (
      <div className='compose-form-warning mb-2.5 rounded bg-accent-300 px-2.5 py-2 text-xs text-white shadow-md' style={{ opacity: opacity, transform: `scale(${scaleX}, ${scaleY})` }}>
        {message}
      </div>
    )}
  </Motion>
);

export default Warning;
