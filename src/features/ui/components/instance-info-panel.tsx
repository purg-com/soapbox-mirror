import pinIcon from '@tabler/icons/outline/pin.svg';
import pinnedOffIcon from '@tabler/icons/outline/pinned-off.svg';
import { useIntl, defineMessages } from 'react-intl';

import { pinHost, unpinHost } from 'soapbox/actions/remote-timeline.ts';
import Widget from 'soapbox/components/ui/widget.tsx';
import { useAppDispatch } from 'soapbox/hooks/useAppDispatch.ts';
import { useAppSelector } from 'soapbox/hooks/useAppSelector.ts';
import { useSettings } from 'soapbox/hooks/useSettings.ts';
import { makeGetRemoteInstance } from 'soapbox/selectors/index.ts';

const getRemoteInstance = makeGetRemoteInstance();

const messages = defineMessages({
  pinHost: { id: 'remote_instance.pin_host', defaultMessage: 'Pin {host}' },
  unpinHost: { id: 'remote_instance.unpin_host', defaultMessage: 'Unpin {host}' },
});

interface IInstanceInfoPanel {
  /** Hostname (domain) of the remote instance, eg "gleasonator.com" */
  host: string;
}

/** Widget that displays information about a remote instance to users. */
const InstanceInfoPanel: React.FC<IInstanceInfoPanel> = ({ host }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const settings = useSettings();
  const remoteInstance: any = useAppSelector(state => getRemoteInstance(state, host));
  const pinned = settings.remote_timeline.pinnedHosts.includes(host);

  const handlePinHost = () => {
    if (!pinned) {
      dispatch(pinHost(host));
    } else {
      dispatch(unpinHost(host));
    }
  };

  if (!remoteInstance) return null;

  return (
    <Widget
      title={remoteInstance.host}
      onActionClick={handlePinHost}
      actionIcon={pinned ? pinnedOffIcon : pinIcon}
      actionTitle={intl.formatMessage(pinned ? messages.unpinHost : messages.pinHost, { host })}
    />
  );
};

export default InstanceInfoPanel;
