import React, { useEffect, useState } from 'react'
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

// send messages in realtime (without refresh)
// client(person A) ---> server ---> client(person A, person B),
// client(person B) ---> server ---> client(person A, person B)

const ChatArea = ({ socket }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const dispatch = useDispatch()
  const [isRecipentTyping, setIsRecipentTyping] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const { selectedChat, user, allChats } = useSelector(
    (state) => state.userReducer
  )
  const recipentUser = selectedChat.members.find((mem) => mem._id !== user._id)
  const [messages, setMessages] = useState([])

  const toastOptions = {
    position: 'bottom-right',
    autoClose: 5000,
    pauseOnHover: true,
    draggable: true,
    theme: 'dark',
  }

  const sendNewMessage = async (image) => {
    try {
      if (image === '' && newMessage === '') {
        return
      }

      const message = {
        chat: selectedChat._id,
        sender: user._id,
        text: newMessage,
        image,
      }

      // Send message to server using socket
      socket.emit('send-message', {
        ...message,
        members: selectedChat.members.map((mem) => mem._id),
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss'),
        read: false,
      })

      // Send message to server to save in db
      const response = await sendMessage(message)

      if (response.status) {
        setNewMessage('')
        setShowEmojiPicker(false)
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
        setMessages([])
        setMessages(response.messages)
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
        chat: selectedChat._id,
        members: selectedChat.members.map((mem) => mem._id),
      })

      const response = await clearChatMessages(selectedChat._id)

      if (response.status) {
        const updatedChats = allChats.map((chat) => {
          if (chat._id === selectedChat._id) {
            return response.chat
          } else {
            return chat
          }
        })
        dispatch(setAllChats(updatedChats))
      } else {
        toast.error(response.message, toastOptions)
      }
    } catch (error) {
      toast.error(error.message, toastOptions)
    }
  }

  const getDateInRegularFormat = (date) => {
    let result = ''

    // If date is today return time in hh:mm AM/PM format
    if (moment(date).isSame(moment(), 'day')) {
      result = moment(date).format('hh:mm A')
    }

    // If date is yesterday return yesterday and time in hh:mm AM/PM format
    else if (moment(date).isSame(moment().subtract(1, 'days'), 'day')) {
      result = 'Yesterday ' + moment(date).format('hh:mm A')
    }

    // else return date in MMM DD YYYY hh:mm AM/PM format
    else {
      result = moment(date).format('MMM DD YYYY hh:mm A')
    }

    return result
  }

  const onUploadImageClick = async (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = async () => {
        sendNewMessage(reader.result)
      }
    }
  }

  useEffect(() => {
    getMessages(selectedChat._id)

    if (
      selectedChat &&
      selectedChat.lastMessage &&
      selectedChat.unreadMessages &&
      selectedChat.lastMessage.sender !== user._id &&
      selectedChat.unreadMessages > 0
    ) {
      clearUnreadMessages()
    }

    // receive message from server using socket
    socket.on('receive-message', (message) => {
      const tempSelectedChat = store.getState().userReducer.selectedChat

      // This if condition checks whether the chat area for the message which is sent through socket is open or not.
      if (tempSelectedChat._id === message.chat) {
        setMessages((messages) => [...messages, message])
      }

      // This if condition checks whether the chat area for the message which is sent through socket is open or not and also checks whether the chat area of the recipent is opened, then only 'clear-unread-messages' will be emitted to both sender and recipent(as members) as a result unread count will be 0, read will be true for all the messages(for both sender and receiver) and also green tick will be shown to the sender message.
      if (
        tempSelectedChat._id === message.chat &&
        message.sender !== user._id
      ) {
        clearUnreadMessages()
      }
    })

    socket.on('unread-messages-cleared', (data) => {
      const tempSelectedChat = store.getState().userReducer.selectedChat
      const tempAllChats = store.getState().userReducer.allChats

      if (tempSelectedChat._id === data.chat) {
        const updatedChats = tempAllChats.map((chat) => {
          if (chat._id === data._id) {
            return {
              ...chat,
              unreadMessages: 0,
            }
          }

          return chat
        })

        dispatch(setAllChats(updatedChats))

        // prevmessages will contain all the messages of the chat area which is open
        setMessages((prevMessages) => {
          return prevMessages.map((message) => {
            return {
              ...message,
              read: true,
            }
          })
        })
      }
    })

    socket.on('started-typing', (data) => {
      const tempSelectedChat = store.getState().userReducer.selectedChat

      // We will get the typing animation only if the recipent user is typing not the current user
      if (tempSelectedChat._id === data.chat && data.sender !== user._id) {
        setIsRecipentTyping(true)
      }

      setTimeout(() => {
        setIsRecipentTyping(false)
      }, 1500)
    })
  }, [selectedChat])

  useEffect(() => {
    // always scroll to bottom of messages container
    const messagesContainer = document.getElementById('messages')
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }, [messages, isRecipentTyping])

  return (
    <div className='bg-white h-[82vh] border rounded-2xl w-full flex flex-col justify-between p-5'>
      {/* 1st part recipent user */}
      <div>
        <div className='flex items-center gap-4 mb-2'>
          {recipentUser.profilePic ? (
            <img
              src={recipentUser.profilePic}
              alt='profile pic'
              className='w-10 h-10 rounded-full'
            />
          ) : (
            <div className='bg-gray-500 rounded-full h-10 w-10 flex items-center justify-center'>
              <h1 className='uppercase text-xl font-semibold text-white'>
                {recipentUser.name[0]}
              </h1>
            </div>
          )}
          <h1>{recipentUser.name}</h1>
        </div>
        <hr />
      </div>

      {/* 2nd part chatbox/chat messages */}
      <div className='h-[55vh] overflow-y-auto p-4' id='messages'>
        <div className='flex flex-col gap-2'>
          {messages.map((message, index) => {
            const isCurrentUserSender = message.sender === user._id
            return (
              <div
                className={`flex ${isCurrentUserSender && 'justify-end'}`}
                key={index}
              >
                <div className='flex flex-col gap-1 max-w-[30vw] break-all'>
                  <h1
                    className={`${
                      isCurrentUserSender
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-gray-300 text-primary rounded-bl-none'
                    } p-2 rounded-2xl shadow-md flex items-center justify-center`}
                  >
                    {message.text ? (
                      message.text
                    ) : (
                      <img
                        src={message.image}
                        alt='message-image'
                        className='h-24 w-24 rounded-xl'
                      ></img>
                    )}
                  </h1>
                  <h1 className='text-gray-500'>
                    {getDateInRegularFormat(message.createdAt)}
                  </h1>
                </div>
                {isCurrentUserSender && (
                  <i
                    className={`ri-check-double-line p-1 ${
                      message.read ? 'text-green-400' : 'text-gray-400'
                    }`}
                  ></i>
                )}
              </div>
            )
          })}
          {isRecipentTyping && (
            <h1 className='text-primary bg-blue-100 w-max p-2 rounded-xl'>
              Typing...
            </h1>
          )}
        </div>
      </div>

      {/* 3rd part chat input */}
      <div
        className='h-14 shadow-md flex justify-between p-2 items-center rounded-xl relative'
        style={{ border: '1px solid gray' }}
      >
        {showEmojiPicker && (
          <div className='absolute left-0' style={{ top: '-22rem' }}>
            <EmojiPicker
              height={350}
              emojiStyle='apple'
              onEmojiClick={(e) => setNewMessage(newMessage + e.emoji)}
            />
          </div>
        )}
        <div className='flex gap-2 text-xl'>
          <label htmlFor='file'>
            <i
              className='ri-links-line cursor-pointer text-xl'
              typeof='file'
            ></i>
            <input
              type='file'
              id='file'
              style={{
                display: 'none',
              }}
              accept='image/jpeg,image/jpg,image/png'
              onChange={onUploadImageClick}
            />
          </label>
          <i
            className='ri-emotion-line cursor-pointer text-xl'
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          ></i>
        </div>
        <input
          type='text'
          placeholder='Type a message'
          className='w-[90%] border-0 h-full rounded-xl focus:border-none'
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value)
            socket.emit('typing', {
              chat: selectedChat._id,
              sender: user._id,
              members: selectedChat.members.map((mem) => mem._id),
            })
          }}
        />
        <button
          className='bg-primary text-white py-1 px-5 rounded h-max'
          onClick={() => {
            sendNewMessage('')
          }}
        >
          <i className='ri-send-plane-2-line text-white'></i>
        </button>
      </div>
    </div>
  )
}

export default ChatArea
