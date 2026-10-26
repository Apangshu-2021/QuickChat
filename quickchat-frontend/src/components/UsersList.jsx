import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setAllChats, setSelectedChat } from '../redux/userSlice'
import { toast } from 'react-toastify'
import { hideLoader, showLoader } from '../redux/loaderSlice'
import { createNewChatAPI } from '../API/chats'
import moment from 'moment'

const UsersList = ({ searchKey, socket, onlineUsers, setSearchKey }) => {
  const dispatch = useDispatch()
  const { user, allUsers, allChats, selectedChat } = useSelector(
    (state) => state.userReducer
  )

  const toastOptions = {
    position: 'bottom-right',
    autoClose: 5000,
    pauseOnHover: true,
    draggable: true,
    theme: 'dark',
  }

  const createNewChat = async (recipentUserId) => {
    // 1. Check if a chat already exists between the users locally
    const existingChat = allChats.find((chat) =>
      chat.members?.some((m) => m.id === recipentUserId)
    )
    if (existingChat) {
      dispatch(setSelectedChat(existingChat))
      setSearchKey('')
      return
    }

    try {
      dispatch(showLoader())
      const response = await createNewChatAPI([user.id, recipentUserId])
      dispatch(hideLoader())

      if (response.status) {
        const chat = response.chat
        const alreadyInList = allChats.some((c) => c.id === chat.id)
        const updatedChats = alreadyInList ? allChats : [...allChats, chat]
        toast.success(response.message, toastOptions)
        dispatch(setAllChats(updatedChats))
        dispatch(setSelectedChat(chat))
        setSearchKey('')
      } else {
        toast.error(response.message, toastOptions)
      }
    } catch (error) {
      dispatch(hideLoader())
      toast.error(error.message, toastOptions)
    }
  }

  const openChat = (recipentUserId) => {
    const chat = allChats.find(
      (chat) =>
        chat.members.some((mem) => mem.id === recipentUserId) &&
        chat.members.some((mem) => mem.id === user.id)
    )

    if (chat) {
      dispatch(setSelectedChat(chat))
    }
  }

  const getData = () => {
    if (searchKey === '') {
      return allChats
    }

    return allUsers.filter((u) =>
      u.name.toLowerCase().includes(searchKey.toLowerCase())
    )
  }

  const getSelectedChatOrNot = (userObj) => {
    if (selectedChat) {
      return selectedChat.members.map((mem) => mem.id).includes(userObj.id)
    }
    return false
  }

  const getLastMsg = (userObj) => {
    const chat = allChats.find((chat) =>
      chat.members.map((mem) => mem.id).includes(userObj.id)
    )

    if (!chat || !chat.lastMessage) return ''

    const isYou = chat.lastMessage.sender === user.id ? 'You: ' : ''
    const msgText = chat.lastMessage.text ? (
      chat.lastMessage.text
    ) : (
      <span><i className='ri-image-line'></i> Image</span>
    )

    const dateFormatted = moment(chat.lastMessage.createdAt).format('hh:mm A')

    return (
      <div className='flex justify-between items-center w-full mt-1 text-xs text-gray-500'>
        <p className='truncate max-w-[150px]'>
          <span className='font-medium text-gray-700'>{isYou}</span>
          {msgText}
        </p>
        <span className='text-[10px] text-gray-400'>{dateFormatted}</span>
      </div>
    )
  }

  const getUnreadMsgCount = (userObj) => {
    const chat = allChats.find((chat) =>
      chat.members.map((mem) => mem.id).includes(userObj.id)
    )

    if (
      chat &&
      chat.unreadMessages > 0 &&
      chat.lastMessage?.sender !== user.id
    ) {
      return (
        <span className='bg-primary text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow'>
          {chat.unreadMessages}
        </span>
      )
    }
    return null
  }

  return (
    <div className='flex flex-col gap-2 max-h-[72vh] overflow-y-auto pr-1'>
      {getData().map((item, index) => {
        let userObj = item
        if (item.members) {
          userObj = item.members.find((mem) => mem.id !== user.id)
        }

        if (!userObj) return null

        const targetId = userObj.id
        const isOnline = onlineUsers.includes(targetId)
        const isSelected = getSelectedChatOrNot(userObj)
        const alreadyHasChat = allChats.some((chat) =>
          chat.members?.some((mem) => mem.id === targetId)
        )

        return (
          <div
            key={targetId || index}
            onClick={() => {
              alreadyHasChat ? openChat(targetId) : createNewChat(targetId)
            }}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border ${
              isSelected
                ? 'bg-primary/10 border-primary shadow-sm'
                : 'bg-white hover:bg-gray-50 border-gray-100 shadow-sm'
            }`}
          >
            {/* User Avatar with Online Dot */}
            <div className='relative shrink-0'>
              {userObj.profilePic ? (
                <img
                  src={userObj.profilePic}
                  alt={userObj.name}
                  className='w-12 h-12 rounded-full object-cover border border-gray-200'
                />
              ) : (
                <div className='w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-lg font-bold'>
                  {userObj.name ? userObj.name[0].toUpperCase() : 'U'}
                </div>
              )}
              {isOnline && (
                <span className='absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full'></span>
              )}
            </div>

            {/* User Details */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center justify-between'>
                <h2 className='text-sm font-semibold text-gray-900 truncate'>
                  {userObj.name}
                </h2>
                {getUnreadMsgCount(userObj)}
              </div>
              {searchKey === '' ? (
                getLastMsg(userObj)
              ) : (
                <p className='text-xs text-gray-400 truncate mt-0.5'>
                  {userObj.email}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default UsersList
