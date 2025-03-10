import arrowLeftIcon from '@tabler/icons/outline/arrow-left.svg';
import editIcon from '@tabler/icons/outline/edit.svg';
import infoCircleIcon from '@tabler/icons/outline/info-circle.svg';
import { useRef } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import Avatar from 'soapbox/components/ui/avatar.tsx';
import HStack from 'soapbox/components/ui/hstack.tsx';
import Icon from 'soapbox/components/ui/icon.tsx';
import Stack from 'soapbox/components/ui/stack.tsx';
import Text from 'soapbox/components/ui/text.tsx';
import Tooltip from 'soapbox/components/ui/tooltip.tsx';
import VerificationBadge from 'soapbox/components/verification-badge.tsx';
import { ChatWidgetScreens, useChatContext } from 'soapbox/contexts/chat-context.tsx';
import { secondsToDays } from 'soapbox/utils/numbers.tsx';

import Chat from '../chat.tsx';

import ChatPaneHeader from './chat-pane-header.tsx';
import ChatSettings from './chat-settings.tsx';

const messages = defineMessages({
  autoDeleteMessage: { id: 'chat_window.auto_delete_label', defaultMessage: 'Auto-delete after {day, plural, one {# day} other {# days}}' },
  autoDeleteMessageTooltip: { id: 'chat_window.auto_delete_tooltip', defaultMessage: 'Chat messages are set to auto-delete after {day, plural, one {# day} other {# days}} upon sending.' },
});

const LinkWrapper = ({ enabled, to, children }: { enabled: boolean; to: string; children: React.ReactNode }): JSX.Element => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Link to={to}>
      {children}
    </Link>
  );
};

/** Floating desktop chat window. */
const ChatWindow = () => {
  const intl = useIntl();

  const { chat, currentChatId, screen, changeScreen, isOpen, needsAcceptance, toggleChatPane } = useChatContext();

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const closeChat = () => {
    changeScreen(ChatWidgetScreens.INBOX);
  };

  const openSearch = () => {
    toggleChatPane();
    changeScreen(ChatWidgetScreens.SEARCH);
  };

  const openChatSettings = () => {
    changeScreen(ChatWidgetScreens.CHAT_SETTINGS, currentChatId);
  };

  const secondaryAction = () => {
    if (needsAcceptance) {
      return undefined;
    }

    return isOpen ? openChatSettings : openSearch;
  };

  if (!chat) return null;

  if (screen === ChatWidgetScreens.CHAT_SETTINGS) {
    return <ChatSettings />;
  }

  return (
    <>
      <ChatPaneHeader
        title={
          <HStack alignItems='center' space={2}>
            {isOpen && (
              <button onClick={closeChat}>
                <Icon
                  src={arrowLeftIcon}
                  className='size-6 text-gray-600 dark:text-gray-400 rtl:rotate-180'
                />
              </button>
            )}

            <HStack alignItems='center' space={3}>
              {isOpen && (
                <Link to={`/@${chat.account.acct}`}>
                  <Avatar src={chat.account.avatar} size={40} />
                </Link>
              )}

              <Stack alignItems='start'>
                <LinkWrapper enabled={isOpen} to={`/@${chat.account.acct}`}>
                  <div className='flex grow items-center space-x-1'>
                    <Text size='sm' weight='bold' truncate>{chat.account.display_name || `@${chat.account.acct}`}</Text> {/* eslint-disable-line formatjs/no-literal-string-in-jsx */}
                    {chat.account.verified && <VerificationBadge />}
                  </div>
                </LinkWrapper>

                {chat.message_expiration && (
                  <Tooltip
                    text={intl.formatMessage(messages.autoDeleteMessageTooltip, { day: secondsToDays(chat.message_expiration) })}
                  >
                    <Text size='sm' weight='medium' theme='primary' truncate className='cursor-help'>
                      {intl.formatMessage(messages.autoDeleteMessage, { day: secondsToDays(chat.message_expiration) })}
                    </Text>
                  </Tooltip>
                )}
              </Stack>
            </HStack>
          </HStack>
        }
        secondaryAction={secondaryAction()}
        secondaryActionIcon={isOpen ? infoCircleIcon : editIcon}
        isToggleable={!isOpen}
        isOpen={isOpen}
        onToggle={toggleChatPane}
      />

      <Stack className='h-full grow overflow-hidden' space={2}>
        <Chat chat={chat} inputRef={inputRef} />
      </Stack>
    </>
  );
};

export default ChatWindow;
