import React, { useEffect, useState } from 'react'
import ChatArea from '../components/ChatArea'
import UserSearch from '../components/UserSearch'
import UsersList from '../components/UsersList'
import { useSelector, useDispatch } from 'react-redux'
import socket from '../utils/socketAdapter'
import { setAllChats } from '../redux/userSlice'
import { getAllChatsAPI } from '../API/chats'
import store from '../redux/store'

const Home = () => {
  const [searchKey, setSearchKey] = useState('')
  const { selectedChat, user } = useSelector((state) => state.userReducer)
  const [onlineUsers, setOnlineUsers] = useState([])
  const dispatch = useDispatch()

  useEffect(() => {
    if (user) {
      const handleOnlineUsers = (users) => {
        setOnlineUsers(users || [])
      }

      const handleReceiveMessageGlobal = (data) => {
        const tempSelectedChat = store.getState().userReducer.selectedChat
        const tempAllChats = store.getState().userReducer.allChats
        const activeChatId = tempSelectedChat?.id
        const incomingChatId = typeof data.chat === 'object' ? data.chat.id : data.chat
        const isCurrentActiveChat = activeChatId && incomingChatId && activeChatId === incomingChatId

        let chatFound = false
        const updatedChats = tempAllChats.map((chat) => {
          if (chat.id === incomingChatId) {
            chatFound = true
            return {
              ...chat,
              unreadMessages: isCurrentActiveChat
                ? 0
                : (chat.unreadMessages || 0) + 1,
              lastMessage: data,
            }
          }
          return chat
        })

        if (!chatFound) {
          getAllChatsAPI().then((res) => {
            if (res.status && res.chats) {
              dispatch(setAllChats(res.chats))
            }
          })
        } else {
          // Sort chat with newest message to the top of the sidebar
          updatedChats.sort((a, b) => {
            const dateA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0
            const dateB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0
            return dateB - dateA
          })
          dispatch(setAllChats(updatedChats))
        }
      }

      const handleUnreadClearedGlobal = (data) => {
        const tempAllChats = store.getState().userReducer.allChats
        const incomingChatId = typeof data.chat === 'object' ? data.chat.id : data.chat
        const updatedChats = tempAllChats.map((chat) => {
          if (chat.id === incomingChatId) {
            return {
              ...chat,
              unreadMessages: 0,
            }
          }
          return chat
        })
        dispatch(setAllChats(updatedChats))
      }

      socket.on('online-users', handleOnlineUsers)
      socket.on('receive-message', handleReceiveMessageGlobal)
      socket.on('unread-messages-cleared', handleUnreadClearedGlobal)
      socket.emit('join-room', user.id)
      socket.emit('came-online', user.id)

      return () => {
        socket.off('online-users', handleOnlineUsers)
        socket.off('receive-message', handleReceiveMessageGlobal)
        socket.off('unread-messages-cleared', handleUnreadClearedGlobal)
      }
    }
  }, [user])

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      {/* Left Column: Search & Users/Chats List */}
      <div className='md:col-span-1 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[82vh]'>
        <UserSearch searchKey={searchKey} setSearchKey={setSearchKey} />
        <div className='flex-1 overflow-y-auto'>
          <UsersList
            searchKey={searchKey}
            socket={socket}
            onlineUsers={onlineUsers}
            setSearchKey={setSearchKey}
          />
        </div>
      </div>

      {/* Right Column: ChatArea or Welcome Screen */}
      <div className='md:col-span-2'>
        {selectedChat ? (
          <ChatArea socket={socket} />
        ) : (
          <div className='bg-white h-[82vh] rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center p-8 text-center'>
            <div className='w-24 h-24 rounded-3xl bg-primary/10 text-primary flex items-center justify-center text-5xl mb-6 shadow-inner'>
              <i className='ri-chat-smile-3-line'></i>
            </div>
            <h2 className='text-2xl font-bold text-gray-800 mb-2'>
              Welcome to QuickChat
            </h2>
            <p className='text-gray-500 max-w-sm text-sm leading-relaxed'>
              Select a conversation from the sidebar or search for a user to start messaging in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
