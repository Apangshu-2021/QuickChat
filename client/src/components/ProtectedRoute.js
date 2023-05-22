import React, { useEffect } from 'react'
import { currentUser, getAllUsers } from '../API/users'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { hideLoader, showLoader } from '../redux/loaderSlice'
import {
  setAllChats,
  setAllUsers,
  setSelectedChat,
  setUser,
} from '../redux/userSlice'
import { getAllChatsAPI } from '../API/chats'
import { io } from 'socket.io-client'

const socket = io('https://quickchat7231.onrender.com')
const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.userReducer)

  const navigate = useNavigate()
  const toastOptions = {
    position: 'bottom-right',
    autoClose: 5000,
    pauseOnHover: true,
    draggable: true,
    theme: 'dark',
  }

  const getCurrentUser = async () => {
    try {
      dispatch(showLoader())
      const response = await currentUser()
      const allUsersResponse = await getAllUsers()
      const allChatsResponse = await getAllChatsAPI()
      dispatch(hideLoader())

      if (response.status) {
        dispatch(setUser(response.user))
      } else {
        navigate('/login')
        toast.error(response.message, toastOptions)
      }

      if (allUsersResponse.status) {
        dispatch(setAllUsers(allUsersResponse.allUsers))
      } else {
        toast.error(allUsersResponse.message, toastOptions)
      }

      if (allChatsResponse.status) {
        dispatch(setAllChats(allChatsResponse.chats))
      } else {
        toast.error(allChatsResponse.message, toastOptions)
      }
    } catch (error) {
      dispatch(hideLoader())
      navigate('/login')
      toast.error(error.message, toastOptions)
    }
  }

  // We want it to run only once, so we pass an empty array as the second argument
  useEffect(() => {
    if (localStorage.getItem('quickChat-user')) {
      getCurrentUser()
    } else {
      navigate('/login')
    }
  }, [])

  return (
    <div className='h-screen w-screen bg-gray-100 p-2'>
      {/* header */}
      <div className='flex sm:justify-between sm:flex-row flex-col items-center justify-center p-5'>
        <div className='flex items-center gap-1'>
          <i className='ri-message-2-line text-2xl'></i>
          <h1
            className='text-primary text-2xl uppercase cursor-pointer'
            onClick={() => {
              navigate('/')
            }}
          >
            QUICKCHAT
          </h1>
        </div>

        <div className='flex items-center gap-1 text-xl bg-white p-2 rounded-xl shadow'>
          {user?.profilePic ? (
            <img
              src={user?.profilePic}
              alt='profile'
              className='h-8 w-8 rounded-full object-cover'
            />
          ) : (
            <i className='ri-shield-user-line'></i>
          )}

          <h1
            className='capitalize cursor-pointer no-underline'
            onClick={() => {
              navigate('/profile')
            }}
          >
            {user?.name}
          </h1>
          <i
            className='ri-logout-circle-r-line ml-5 text-xl cursor-pointer'
            onClick={() => {
              localStorage.removeItem('quickChat-user')
              dispatch(setUser(null))
              dispatch(setAllUsers([]))
              dispatch(setAllChats([]))
              dispatch(setSelectedChat(null))
              socket.emit('went-offline', user?._id)
              navigate('/login')
            }}
          ></i>
        </div>
      </div>
      <hr className='shadow-xl border-2' />
      {/* content (pages) */}
      <div className='p-5'>{children}</div>
    </div>
  )
}

export default ProtectedRoute
