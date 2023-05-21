import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setAllChats, setSelectedChat } from '../redux/userSlice'
import { toast } from 'react-toastify'
import { hideLoader, showLoader } from '../redux/loaderSlice'
import { createNewChatAPI } from '../API/chats'
import moment from 'moment'
import store from '../redux/store'

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
    try {
      dispatch(showLoader())
      const response = await createNewChatAPI([user._id, recipentUserId])
      dispatch(hideLoader())

      if (response.status) {
        const newChat = response.chat
        const updatedChats = [...allChats, newChat]
        toast.success(response.message, toastOptions)
        dispatch(setAllChats(updatedChats))
        dispatch(setSelectedChat(newChat))
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
    // chat.members.map((mem) => mem._id) function will return the ids of the members of each chat.

    const chat = allChats.find(
      (chat) =>
        chat.members.map((mem) => mem._id).includes(recipentUserId) &&
        chat.members.map((mem) => mem._id).includes(user._id)
    )

    if (chat) {
      dispatch(setSelectedChat(chat))
    }
  }

  const getData = () => {
    if (searchKey === '') {
      return allChats
    }

    return allUsers.filter((user) =>
      user.name.toLowerCase().includes(searchKey.toLowerCase())
    )
  }

  const getSelectedChatOrNot = (userObj) => {
    if (selectedChat) {
      return selectedChat.members.map((mem) => mem._id).includes(userObj._id)
    }

    return false
  }

  const getLastMsg = (userObj) => {
    const chat = allChats.find((chat) =>
      chat.members.map((mem) => mem._id).includes(userObj._id)
    )

    if (!chat || !chat.lastMessage) return ''
    else {
      const lastMsgPerson = chat.lastMessage.sender === user._id ? 'You : ' : ''

      return (
        <div className='flex justify-between w-full'>
          <h1 className='truncated text-gray-500 text-sm'>
            {lastMsgPerson}{' '}
            {chat.lastMessage.text ? (
              chat.lastMessage.text
            ) : (
              <i className='ri-image-line'> Image</i>
            )}
          </h1>

          <h1 className='text-gray-500 text-sm ml-2'>
            {getDateInRegularFormat(chat.lastMessage.createdAt)}
          </h1>
        </div>
      )
    }
  }

  const getUnreadMessages = (userObj) => {
    const chat = allChats.find((chat) =>
      chat.members.map((mem) => mem._id).includes(userObj._id)
    )

    if (
      chat &&
      chat.unreadMessages > 0 &&
      chat.lastMessage &&
      chat.lastMessage.sender !== user._id
    ) {
      return (
        <div className='bg-blue-500 text-white text-sm rounded-full h-5 w-5 flex items-center justify-center'>
          {chat.unreadMessages}
        </div>
      )
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
      result = moment(date).format('MMM DD YYYY')
    }

    return result
  }

  useEffect(() => {
    socket.on('receive-message', (message) => {
      // If the chatarea opened is not equal to the chat in message then update the unreadMessages count by 1 and update last message.
      const tempSelectedChat = store.getState().userReducer.selectedChat
      let tempAllChats = store.getState().userReducer.allChats

      if (tempSelectedChat?._id !== message.chat) {
        const updatedAllChats = tempAllChats.map((chat) => {
          if (chat._id === message.chat) {
            return {
              ...chat,
              lastMessage: message,
              unreadMessages: (chat?.unreadMessages || 0) + 1,
            }
          }
          return chat
        })
        tempAllChats = updatedAllChats
      } else if (tempSelectedChat?._id === message.chat) {
        const updatedAllChats = tempAllChats.map((chat) => {
          if (chat._id === message.chat) {
            return {
              ...chat,
              lastMessage: message,
            }
          }
          return chat
        })
        tempAllChats = updatedAllChats
      }

      // always the latest chat will be at the top.
      const latestChat = tempAllChats.find((chat) => chat._id === message.chat)
      const otherChats = tempAllChats.filter(
        (chat) => chat._id !== message.chat
      )
      tempAllChats = [latestChat, ...otherChats]

      dispatch(setAllChats(tempAllChats))
    })
  }, [])

  return (
    <div className='flex flex-col mt-5 gap-3'>
      {/* If searchKey is empty then filter() and map() will not be executed as a result no users will be displayed */}
      {getData().map((ChatObjOrUserObj) => {
        let userObj = ChatObjOrUserObj

        if (ChatObjOrUserObj.members) {
          userObj = ChatObjOrUserObj.members.find((mem) => mem._id !== user._id)
        }

        return (
          <div
            className={`shadow-sm border p-3 rounded-xl bg-white flex justify-between items-center cursor-pointer ${
              getSelectedChatOrNot(userObj) && 'border-primary border-2'
            }`}
            key={userObj._id}
            onClick={() => openChat(userObj._id)}
          >
            <div className='flex items-center w-full gap-5'>
              {userObj.profilePic ? (
                <div className='relative'>
                  <img
                    src={userObj.profilePic}
                    alt='profile pic'
                    className='w-10 h-10 rounded-full'
                  />
                  {onlineUsers.includes(userObj._id) && (
                    <div>
                      <div className='bg-green-700 w-3 h-3 rounded-full absolute bottom-[2px] right-1'></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='bg-gray-400 rounded-full h-10 w-10 flex items-center justify-center p-3 relative'>
                  <h1 className='uppercase text-xl font-semibold text-white'>
                    {userObj.name[0]}
                  </h1>
                  {onlineUsers.includes(userObj._id) && (
                    <div>
                      <div className='bg-green-700 w-3 h-3 rounded-full absolute bottom-[2px] right-1'></div>
                    </div>
                  )}
                </div>
              )}
              <div className='flex flex-col gap-1 w-full'>
                <div className='flex gap-1'>
                  <h1>{userObj.name}</h1>
                  {getUnreadMessages(userObj)}
                </div>
                {getLastMsg(userObj)}
              </div>
            </div>
            <div>
              {!allChats.find((chat) =>
                chat.members.map((mem) => mem._id).includes(userObj._id)
              ) && (
                <button
                  className='border-primary text-primary bg-white p-1 border rounded ml-4'
                  onClick={() => createNewChat(userObj._id)}
                >
                  Create Chat
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default UsersList
