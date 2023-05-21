import React, { useEffect, useState } from 'react'
import ChatArea from '../components/ChatArea'
import UserSearch from '../components/UserSearch'
import UsersList from '../components/UsersList'
import { useSelector } from 'react-redux'
import { io } from 'socket.io-client'
// The reson why we're making socket a global variable is because in the useEffect socket is not getting called. We're initilaising the socket in Home.js because we'll send it as a prop to ChatArea.js and UserList.js.
const socket = io('http://localhost:5000')

const Home = () => {
  const [searchKey, setSearchKey] = useState('')
  const { selectedChat, user } = useSelector((state) => state.userReducer)
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    if (user) {
      socket.emit('join-room', user._id)
      socket.emit('came-online', user._id)

      socket.on('online-users', (users) => {
        setOnlineUsers(users)
      })
    }
  }, [user])

  return (
    <div className='md:grid grid-cols-3 gap-5'>
      {/* 1st part user search, userlist/chatlist */}
      <div className='md:col-span-1'>
        <UserSearch searchKey={searchKey} setSearchKey={setSearchKey} />
        <UsersList
          searchKey={searchKey}
          socket={socket}
          onlineUsers={onlineUsers}
          setSearchKey={setSearchKey}
        />
      </div>
      {/* 2nd part chatbox */}
      {selectedChat && (
        <div className='md:col-span-2 md:mt-0 mt-5 w-full'>
          <ChatArea socket={socket} />
        </div>
      )}
      {!selectedChat && (
        <div className='md:col-span-2 flex h-[80vh] items-center justify-center md:mt-0 mt-5 w-full bg-white flex-col'>
          <img
            src='https://freepngimg.com/thumb/chat/12-2-chat-png.png'
            alt='chat-app'
            className='w-96 h-96'
          />
          <h1 className='text-2xl font-semibold text-gray-500'>
            Select a user to chat
          </h1>
        </div>
      )}
    </div>
  )
}

export default Home
