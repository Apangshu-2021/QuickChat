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
import socket from '../utils/socketAdapter'

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

      if (!response.status) {
        dispatch(hideLoader())
        navigate('/login')
        toast.error(response.message, toastOptions)
        return
      }

      dispatch(setUser(response.user))
      socket.emit('came-online', response.user.id)

      try {
        const allUsersResponse = await getAllUsers()
        if (allUsersResponse.status) {
          dispatch(setAllUsers(allUsersResponse.allUsers))
        } else {
          toast.error(allUsersResponse.message, toastOptions)
        }
      } catch (err) {
        console.error('Failed to load users', err)
      }

      try {
        const allChatsResponse = await getAllChatsAPI()
        if (allChatsResponse.status) {
          dispatch(setAllChats(allChatsResponse.chats))
        } else {
          toast.error(allChatsResponse.message, toastOptions)
        }
      } catch (err) {
        console.error('Failed to load chats', err)
      }

      dispatch(hideLoader())
    } catch (error) {
      dispatch(hideLoader())
      navigate('/login')
      toast.error(error.message || 'Authentication failed', toastOptions)
    }
  }

  useEffect(() => {
    if (localStorage.getItem('quickChat-user')) {
      getCurrentUser()
    } else {
      navigate('/login')
    }
  }, [])

  const handleLogout = () => {
    if (user?.id) {
      socket.emit('went-offline', user.id)
    }
    localStorage.removeItem('quickChat-user')
    dispatch(setUser(null))
    dispatch(setAllUsers([]))
    dispatch(setAllChats([]))
    dispatch(setSelectedChat(null))
    navigate('/login')
  }

  return (
    <div className='min-h-screen bg-slate-100 flex flex-col'>
      {/* Top Navbar */}
      <header className='bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex items-center justify-between'>
        <div
          className='flex items-center gap-2 cursor-pointer group'
          onClick={() => navigate('/')}
        >
          <div className='w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md shadow-primary/30 group-hover:scale-105 transition-transform'>
            <i className='ri-chat-smile-2-line text-2xl'></i>
          </div>
          <h1 className='text-2xl font-bold tracking-tight text-primary uppercase'>
            QuickChat
          </h1>
        </div>

        <div className='flex items-center gap-4'>
          <div
            className='flex items-center gap-3 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 cursor-pointer transition-colors'
            onClick={() => navigate('/profile')}
          >
            {user?.profilePic ? (
              <img
                src={user?.profilePic}
                alt='profile'
                className='h-8 w-8 rounded-full object-cover border border-gray-300'
              />
            ) : (
              <div className='h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold'>
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <span className='font-semibold text-gray-800 text-sm hidden sm:inline'>
              {user?.name}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title='Logout'
            className='p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors'
          >
            <i className='ri-logout-box-r-line text-xl'></i>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className='flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto'>
        {children}
      </main>
    </div>
  )
}

export default ProtectedRoute
