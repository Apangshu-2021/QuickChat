import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearChatMessages,
  getMessagesOfChat,
  sendMessage,
} from '../API/messages'
import { hideLoader, showLoader } from '../redux/loaderSlice'
import { toast } from 'react-toastify'
import moment from 'moment'
import { setAllChats } from '../redux/userSlice'
import store from '../redux/store'
import EmojiPicker from 'emoji-picker-react'
import { v4 as uuidv4 } from 'uuid'

const ChatArea = ({ socket }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const dispatch = useDispatch()
  const [isRecipentTyping, setIsRecipentTyping] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const { selectedChat, user, allChats } = useSelector(
    (state) => state.userReducer
  )
  const recipentUser = selectedChat.members.find((mem) => mem.id !== user.id)
  const [messages, setMessages] = useState([])
  const messagesEndRef = useRef(null)

  const toastOptions = {
    position: 'bottom-right',
    autoClose: 5000,
    pauseOnHover: true,
    draggable: true,
    theme: 'dark',
  }

  const sendNewMessage = async (image = '') => {
    try {
      if (image === '' && newMessage.trim() === '') {
        return
      }

      const message = {
        chat: selectedChat.id,
        sender: user.id,
        text: newMessage,
        image,
      }

      // 1. Send message to server to save in DB FIRST
      const response = await sendMessage(message)

      if (response.status) {
        setNewMessage('')
        setShowEmojiPicker(false)

        const savedMsg = response.savedMessage

        // Immediately update sender's own message list
        setMessages((prev) => {
          const msgId = savedMsg.id
          if (msgId && prev.some((m) => m.id === msgId)) {
            return prev
          }
          return [...prev, savedMsg]
        })

        // 2. Broadcast the persisted message to all members via WebSocket
        socket.emit('send-message', {
          ...savedMsg,
          id: savedMsg.id,
          chat: selectedChat.id,
          sender: user.id,
          members: selectedChat.members.map((mem) => mem.id),
        })
      } else {
        toast.error(response.message, toastOptions)
      }
    } catch (error) {
      toast.error(error.message, toastOptions)
    }
  }

  const getMessages = async (chatId) => {
    try {
      dispatch(showLoader())
      const response = await getMessagesOfChat(chatId)
      dispatch(hideLoader())

      if (response.status) {
        setMessages(response.messages || [])
      } else {
        toast.error(response.message, toastOptions)
      }
    } catch (error) {
      dispatch(hideLoader())
      toast.error(error.message, toastOptions)
    }
  }

  const clearUnreadMessages = async () => {
    try {
      socket.emit('clear-unread-messages', {
        chat: selectedChat.id,
        members: selectedChat.members.map((mem) => mem.id),
      })

      const response = await clearChatMessages(selectedChat.id)
      if (response.status) {
        // Read fresh allChats from store rather than stale closure to preserve recent lastMessage
        const tempAllChats = store.getState().userReducer.allChats
        const updatedChats = tempAllChats.map((chat) => {
          if (chat.id === selectedChat.id) {
            return {
              ...chat,
              unreadMessages: 0,
            }
          }
          return chat
        })
        dispatch(setAllChats(updatedChats))
      }
    } catch (error) {
      toast.error(error.message, toastOptions)
    }
  }

  const onFileSelect = async (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      if (file.size > 25 * 1024 * 1024) {
        toast.error('Image size must be under 25MB', toastOptions)
        e.target.value = ''
        return
      }
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = async () => {
        sendNewMessage(reader.result)
      }
    } else {
      toast.error('Please select an image', toastOptions)
    }
    e.target.value = ''
  }

  useEffect(() => {
    if (selectedChat) {
      getMessages(selectedChat.id)
      clearUnreadMessages()
    }

    // 1. Handler for incoming real-time messages (/topic/user/{id}/receive-message)
    const handleReceiveMessage = (data) => {
      const tempSelectedChat = store.getState().userReducer.selectedChat
      const activeChatId = tempSelectedChat?.id
      const incomingChatId = typeof data.chat === 'object' ? data.chat.id : data.chat

      // If the received message belongs to the active conversation, append to current messages
      if (activeChatId && incomingChatId && activeChatId === incomingChatId) {
        setMessages((prev) => {
          const msgId = data.id || data.uuid
          if (msgId) {
            const exists = prev.some((m) => (m.id || m.uuid) === msgId)
            if (exists) return prev
          }
          return [...prev, data]
        })

        // If the message is from the recipient and this chat is actively open, mark it read immediately!
        if (data.sender !== user.id) {
          clearUnreadMessages()
        }
      }
    }

    // 2. Handler for unread messages cleared event
    const handleUnreadCleared = (data) => {
      const tempSelectedChat = store.getState().userReducer.selectedChat
      const activeChatId = tempSelectedChat?.id
      const incomingChatId = typeof data.chat === 'object' ? data.chat.id : data.chat

      if (activeChatId && incomingChatId && activeChatId === incomingChatId) {
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            read: true,
          }))
        )
      }
    }

    // 3. Handler for live typing indicator
    const handleStartedTyping = (data) => {
      const tempSelectedChat = store.getState().userReducer.selectedChat
      const activeChatId = tempSelectedChat?.id
      const incomingChatId = typeof data.chat === 'object' ? data.chat.id : data.chat

      if (activeChatId && incomingChatId && activeChatId === incomingChatId && data.sender !== user.id) {
        setIsRecipentTyping(true)
      }

      setTimeout(() => {
        setIsRecipentTyping(false)
      }, 2000)
    }

    // Register event listeners
    socket.on('receive-message', handleReceiveMessage)
    socket.on('unread-messages-cleared', handleUnreadCleared)
    socket.on('started-typing', handleStartedTyping)

    // Cleanup: Unregister listeners when switching chats or unmounting to prevent duplicate execution
    return () => {
      socket.off('receive-message', handleReceiveMessage)
      socket.off('unread-messages-cleared', handleUnreadCleared)
      socket.off('started-typing', handleStartedTyping)
    }
  }, [selectedChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isRecipentTyping])

  return (
    <div className='bg-white h-[82vh] border border-gray-200 rounded-2xl flex flex-col justify-between shadow-sm overflow-hidden'>
      {/* 1. Header with Recipient Details */}
      <div className='p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50'>
        <div className='flex items-center gap-3'>
          {recipentUser?.profilePic ? (
            <img
              src={recipentUser.profilePic}
              alt={recipentUser.name}
              className='w-10 h-10 rounded-full object-cover border border-gray-200'
            />
          ) : (
            <div className='w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold'>
              {recipentUser?.name ? recipentUser.name[0].toUpperCase() : 'U'}
            </div>
          )}
          <div>
            <h2 className='font-semibold text-gray-800 text-base'>
              {recipentUser?.name}
            </h2>
            <p className='text-xs text-gray-400'>{recipentUser?.email}</p>
          </div>
        </div>
      </div>

      {/* 2. Messages Scroll Area */}
      <div className='flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30' id='messages'>
        {messages.map((message, index) => {
          const isCurrentUserSender = message.sender === user.id
          return (
            <div
              key={message.id || message.uuid || index}
              className={`flex ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex flex-col max-w-[70%] sm:max-w-[50%] ${
                  isCurrentUserSender ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-sm shadow-sm break-words ${
                    isCurrentUserSender
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}
                >
                  {message.text ? (
                    <p className='whitespace-pre-wrap leading-relaxed'>{message.text}</p>
                  ) : (
                    <img
                      src={message.image}
                      alt='sent-attachment'
                      className='max-h-60 rounded-xl object-contain'
                    />
                  )}
                </div>

                <div className='flex items-center gap-1 mt-1 text-[10px] text-gray-400 px-1'>
                  <span>{moment(message.createdAt).format('hh:mm A')}</span>
                  {isCurrentUserSender && (
                    <i
                      className={`ri-check-double-line text-xs ${
                        message.read ? 'text-emerald-500 font-bold' : 'text-gray-400'
                      }`}
                    ></i>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {isRecipentTyping && (
          <div className='flex items-center gap-2 text-xs text-primary bg-indigo-50 px-3 py-1.5 rounded-full w-fit animate-pulse'>
            <i className='ri-pencil-line'></i>
            <span>{recipentUser?.name} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Message Input Controls */}
      <div className='p-3 border-t border-gray-100 bg-white relative'>
        {showEmojiPicker && (
          <div className='absolute bottom-16 left-4 z-50 shadow-2xl rounded-2xl'>
            <EmojiPicker
              onEmojiClick={(e) => {
                setNewMessage((prev) => prev + e.emoji)
                setShowEmojiPicker(false)
              }}
            />
          </div>
        )}

        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className='p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors'
          >
            <i className='ri-emotion-line text-xl'></i>
          </button>

          <label
            htmlFor='image-upload'
            className='p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full cursor-pointer transition-colors'
          >
            <i className='ri-image-line text-xl'></i>
            <input
              type='file'
              id='image-upload'
              accept='image/*'
              className='hidden'
              onChange={onFileSelect}
            />
          </label>

          <input
            type='text'
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value)
              socket.emit('typing', {
                chat: selectedChat._id,
                sender: user._id,
                members: selectedChat.members.map((mem) => mem._id),
              })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                sendNewMessage()
              }
            }}
            placeholder='Type a message...'
            className='flex-1 h-11 border border-gray-200 rounded-xl px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary'
          />

          <button
            onClick={() => sendNewMessage()}
            disabled={!newMessage.trim()}
            className='h-11 px-5 bg-primary text-white rounded-xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20'
          >
            <i className='ri-send-plane-fill text-lg'></i>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatArea
