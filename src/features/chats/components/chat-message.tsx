import checkIcon from '@tabler/icons/outline/check.svg';
import copyIcon from '@tabler/icons/outline/copy.svg';
import dotsIcon from '@tabler/icons/outline/dots.svg';
import flagIcon from '@tabler/icons/outline/flag.svg';
import moodSmileIcon from '@tabler/icons/outline/mood-smile.svg';
import trashIcon from '@tabler/icons/outline/trash.svg';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { escape } from 'es-toolkit';
import { useMemo, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { openModal } from 'soapbox/actions/modals.ts';
import { initReport, ReportableEntities } from 'soapbox/actions/reports.ts';
import DropdownMenu from 'soapbox/components/dropdown-menu/index.ts';
import HStack from 'soapbox/components/ui/hstack.tsx';
import Icon from 'soapbox/components/ui/icon.tsx';
import Stack from 'soapbox/components/ui/stack.tsx';
import Text from 'soapbox/components/ui/text.tsx';
import { MediaGallery } from 'soapbox/features/ui/util/async-components.ts';
import { useAppDispatch } from 'soapbox/hooks/useAppDispatch.ts';
import { useAppSelector } from 'soapbox/hooks/useAppSelector.ts';
import { useFeatures } from 'soapbox/hooks/useFeatures.ts';
import { ChatKeys, IChat, useChatActions } from 'soapbox/queries/chats.ts';
import { queryClient } from 'soapbox/queries/client.ts';
import { Attachment } from 'soapbox/schemas/index.ts';
import { htmlToPlaintext } from 'soapbox/utils/html.ts';
import { isOnlyEmoji as _isOnlyEmoji } from 'soapbox/utils/only-emoji.ts';

import ChatMessageReactionWrapper from './chat-message-reaction-wrapper/chat-message-reaction-wrapper.tsx';
import ChatMessageReaction from './chat-message-reaction.tsx';

import type { Menu as IMenu } from 'soapbox/components/dropdown-menu/index.ts';
import type { ChatMessage as ChatMessageEntity } from 'soapbox/types/entities.ts';

const messages = defineMessages({
  copy: { id: 'chats.actions.copy', defaultMessage: 'Copy' },
  delete: { id: 'chats.actions.delete', defaultMessage: 'Delete for both' },
  deleteForMe: { id: 'chats.actions.delete_for_me', defaultMessage: 'Delete for me' },
  more: { id: 'chats.actions.more', defaultMessage: 'More' },
  report: { id: 'chats.actions.report', defaultMessage: 'Report' },
});

const parsePendingContent = (content: string) => {
  return escape(content).replace(/(?:\r\n|\r|\n)/g, '<br>');
};

const parseContent = (chatMessage: ChatMessageEntity) => {
  const { content, pending, deleting } = chatMessage;
  return (pending && !deleting) ? parsePendingContent(content) : content;
};

interface IChatMessage {
  chat: IChat;
  chatMessage: ChatMessageEntity;
}

const ChatMessage = (props: IChatMessage) => {
  const { chat, chatMessage } = props;

  const dispatch = useAppDispatch();
  const features = useFeatures();
  const intl = useIntl();

  const me = useAppSelector((state) => state.me);
  const { createReaction, deleteChatMessage, deleteReaction } = useChatActions(chat.id);

  const [isReactionSelectorOpen, setIsReactionSelectorOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const handleDeleteMessage = useMutation({
    mutationFn: (chatMessageId: string) => deleteChatMessage(chatMessageId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ChatKeys.chatMessages(chat.id),
      });
    },
  });

  const content = parseContent(chatMessage);
  const lastReadMessageDateString = chat.latest_read_message_by_account?.find((latest) => latest.id === chat.account.id)?.date;
  const lastReadMessageTimestamp = lastReadMessageDateString ? new Date(lastReadMessageDateString) : null;
  const isMyMessage = chatMessage.account_id === me;

  // did this occur before this time?
  const isRead = isMyMessage
    && lastReadMessageTimestamp
    && lastReadMessageTimestamp >= new Date(chatMessage.created_at);

  const isOnlyEmoji = useMemo(() => _isOnlyEmoji(content, props.chatMessage.emojis.toJS(), 3), [content]);

  const emojiReactionRows = useMemo(() => {
    if (!chatMessage.emoji_reactions) {
      return [];
    }

    return chatMessage.emoji_reactions.reduce((rows: any, key: any, index) => {
      return (index % 4 === 0 ? rows.push([key])
        : rows[rows.length - 1].push(key)) && rows;
    }, []);
  }, [chatMessage.emoji_reactions]);

  const onOpenMedia = (media: any, index: number) => {
    dispatch(openModal('MEDIA', { media, index }));
  };

  const maybeRenderMedia = (chatMessage: ChatMessageEntity) => {
    if (!chatMessage.media_attachments.size) return null;

    return (
      <MediaGallery
        className={clsx({
          'rounded-br-sm': isMyMessage && content,
          'rounded-bl-sm': !isMyMessage && content,
        })}
        media={chatMessage.media_attachments.toJS() as unknown as Attachment[]}
        onOpenMedia={onOpenMedia}
        visible
      />
    );
  };

  const handleCopyText = (chatMessage: ChatMessageEntity) => {
    if (navigator.clipboard) {
      const text = htmlToPlaintext(chatMessage.content);
      navigator.clipboard.writeText(text);
    }
  };
  const setBubbleRef = (c: HTMLDivElement) => {
    if (!c) return;
    const links = c.querySelectorAll('a[rel="ugc"]');

    links.forEach(link => {
      link.classList.add('chat-link');
      link.setAttribute('rel', 'ugc nofollow noopener');
      link.setAttribute('target', '_blank');
    });
  };

  const getFormattedTimestamp = (chatMessage: ChatMessageEntity) => {
    return intl.formatDate(new Date(chatMessage.created_at), {
      hour12: false,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const menu = useMemo(() => {
    const menu: IMenu = [];

    if (navigator.clipboard && chatMessage.content) {
      menu.push({
        text: intl.formatMessage(messages.copy),
        action: () => handleCopyText(chatMessage),
        icon: copyIcon,
      });
    }

    if (isMyMessage) {
      menu.push({
        text: intl.formatMessage(messages.delete),
        action: () => handleDeleteMessage.mutate(chatMessage.id),
        icon: trashIcon,
        destructive: true,
      });
    } else {
      if (features.reportChats) {
        menu.push({
          text: intl.formatMessage(messages.report),
          action: () => dispatch(initReport(ReportableEntities.CHAT_MESSAGE, chat.account, { chatMessage })),
          icon: flagIcon,
        });
      }
      menu.push({
        text: intl.formatMessage(messages.deleteForMe),
        action: () => handleDeleteMessage.mutate(chatMessage.id),
        icon: trashIcon,
        destructive: true,
      });
    }

    return menu;
  }, [chatMessage, chat]);

  return (
    <div
      className={
        clsx({
          'group relative px-4 py-2 hover:bg-gray-200/40 dark:hover:bg-gray-800/40': true,
          'bg-gray-200/40 dark:bg-gray-800/40': isMenuOpen || isReactionSelectorOpen,
        })
      }
      data-testid='chat-message'
    >
      <div
        className={
          clsx({
            'p-1 flex items-center space-x-0.5 z-10 absolute opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 rounded-md shadow-lg bg-white dark:bg-gray-900 dark:ring-2 dark:ring-primary-700': true,
            'top-2 right-2': !isMyMessage,
            'top-2 left-2': isMyMessage,
            '!opacity-100': isMenuOpen || isReactionSelectorOpen,
          })
        }
      >
        {features.chatEmojiReactions && (
          <ChatMessageReactionWrapper
            onOpen={setIsReactionSelectorOpen}
            onSelect={(emoji) => createReaction.mutate({ emoji, messageId: chatMessage.id, chatMessage })}
          >
            <button
              title={intl.formatMessage(messages.more)}
              className={clsx({
                'p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-500 focus:text-gray-700 dark:focus:text-gray-500 focus:ring-0': true,
                '!text-gray-700 dark:!text-gray-500': isReactionSelectorOpen,
              })}
            >
              <Icon
                src={moodSmileIcon}
                className='size-4'
              />
            </button>
          </ChatMessageReactionWrapper>
        )}

        {menu.length > 0 && (
          <DropdownMenu
            items={menu}
            onOpen={() => setIsMenuOpen(true)}
            onClose={() => setIsMenuOpen(false)}
          >
            <button
              title={intl.formatMessage(messages.more)}
              className={clsx({
                'p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md text-gray-600 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-500 focus:text-gray-700 dark:focus:text-gray-500 focus:ring-0': true,
                '!text-gray-700 dark:!text-gray-500': isMenuOpen,
              })}
              data-testid='chat-message-menu'
            >
              <Icon
                src={dotsIcon}
                className='size-4'
              />
            </button>
          </DropdownMenu>
        )}
      </div>

      <Stack
        space={1.5}
        className={clsx({
          'ml-auto': isMyMessage,
        })}
      >
        <HStack
          alignItems='center'
          justifyContent={isMyMessage ? 'end' : 'start'}
          className={clsx({
            'opacity-50': chatMessage.pending,
          })}
        >
          <Stack
            space={0.5}
            className={clsx({
              'max-w-[85%]': true,
              'flex-1': !!chatMessage.media_attachments.size,
              'order-3': isMyMessage,
              'order-1': !isMyMessage,
            })}
            alignItems={isMyMessage ? 'end' : 'start'}
          >
            {maybeRenderMedia(chatMessage)}

            {content && (
              <HStack alignItems='bottom' className='max-w-full'>
                <div
                  title={getFormattedTimestamp(chatMessage)}
                  className={
                    clsx({
                      'text-ellipsis break-words relative rounded-md py-2 px-3 max-w-full space-y-2 [&_.mention]:underline': true,
                      'rounded-tr-sm': (!!chatMessage.media_attachments.size) && isMyMessage,
                      'rounded-tl-sm': (!!chatMessage.media_attachments.size) && !isMyMessage,
                      '[&_.mention]:text-primary-600 dark:[&_.mention]:text-accent-blue': !isMyMessage,
                      '[&_.mention]:text-white dark:[&_.mention]:white': isMyMessage,
                      'bg-primary-500 text-white': isMyMessage,
                      'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100': !isMyMessage,
                      '!bg-transparent !p-0 text-4xl': isOnlyEmoji,
                    })
                  }
                  ref={setBubbleRef}
                  tabIndex={0}
                >
                  <Text
                    size='sm'
                    theme='inherit'
                    className='break-word-nested'
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </HStack>
            )}
          </Stack>
        </HStack>

        {(chatMessage.emoji_reactions?.length) ? (
          <div
            className={clsx({
              'space-y-1': true,
              'ml-auto': isMyMessage,
              'mr-auto': !isMyMessage,
            })}
          >
            {emojiReactionRows?.map((emojiReactionRow: any, idx: number) => (
              <HStack
                key={idx}
                className={
                  clsx({
                    'flex items-center gap-1': true,
                    'flex-row-reverse': isMyMessage,
                  })
                }
              >
                {emojiReactionRow.map((emojiReaction: any, idx: number) => (
                  <ChatMessageReaction
                    key={idx}
                    emojiReaction={emojiReaction}
                    onAddReaction={(emoji) => createReaction.mutate({ emoji, messageId: chatMessage.id, chatMessage })}
                    onRemoveReaction={(emoji) => deleteReaction.mutate({ emoji, messageId: chatMessage.id })}
                  />
                ))}
              </HStack>
            ))}
          </div>
        ) : null}

        <HStack
          alignItems='center'
          space={2}
          className={clsx({
            'ml-auto': isMyMessage,
          })}
        >
          <div
            className={clsx({
              'text-right': isMyMessage,
              'order-2': !isMyMessage,
            })}
          >
            <span className='flex items-center space-x-1.5'>
              <Text theme='muted' size='xs'>
                {intl.formatTime(chatMessage.created_at)}
              </Text>

              {(isMyMessage && features.chatsReadReceipts) ? (
                <>
                  {isRead ? (
                    <span className='flex flex-col items-center justify-center rounded-full border border-solid border-primary-500 bg-primary-500 p-0.5 text-white dark:border-primary-400 dark:bg-primary-400 dark:text-primary-900'>
                      <Icon
                        src={checkIcon}
                        strokeWidth={3}
                        className='size-2.5'
                      />
                    </span>
                  ) : (
                    <span className='flex flex-col items-center justify-center rounded-full border border-solid border-primary-500 bg-transparent p-0.5 text-primary-500 dark:border-primary-400 dark:text-primary-400'>
                      <Icon
                        src={checkIcon}
                        strokeWidth={3}
                        className='size-2.5'
                      />
                    </span>
                  )}
                </>
              ) : null}
            </span>
          </div>
        </HStack>
      </Stack>
    </div>
  );
};

export default ChatMessage;
