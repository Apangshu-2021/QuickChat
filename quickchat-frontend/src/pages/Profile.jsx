import moment from 'moment'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { hideLoader, showLoader } from '../redux/loaderSlice'
import { updateProfilePicture } from '../API/users'
import { setUser } from '../redux/userSlice'

const Profile = () => {
  const user = useSelector((state) => state.userReducer.user)
  const [image, setImage] = useState(user?.profilePic || '')
  const dispatch = useDispatch()

  const toastOptions = {
    position: 'bottom-right',
    autoClose: 5000,
    pauseOnHover: true,
    draggable: true,
    theme: 'dark',
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
        setImage(reader.result)
      }
    } else {
      toast.error('Please select an image file', toastOptions)
    }
    e.target.value = ''
  }

  const updateProfilePic = async () => {
    try {
      if (!image) {
        toast.error('No image selected', toastOptions)
        return
      }

      dispatch(showLoader())
      const response = await updateProfilePicture(image)
      dispatch(hideLoader())

      if (response.status) {
        toast.success('Profile picture updated successfully', toastOptions)
        dispatch(setUser(response.user))
      } else {
        toast.error(response.message || 'Update failed', toastOptions)
      }
    } catch (error) {
      dispatch(hideLoader())
      toast.error(error.message || 'Error updating profile', toastOptions)
    }
  }

  return (
    <div className='flex items-center justify-center min-h-[75vh]'>
      <div className='bg-white rounded-3xl border border-gray-200 shadow-sm p-8 w-full max-w-lg flex flex-col items-center text-center'>
        {/* Profile Avatar */}
        <div className='relative mb-6'>
          {image ? (
            <img
              src={image}
              alt='profile'
              className='w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg ring-4 ring-primary/20'
            />
          ) : (
            <div className='w-32 h-32 rounded-full bg-primary/10 text-primary flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg'>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          )}
        </div>

        {/* User Info */}
        <h2 className='text-2xl font-bold text-gray-900 mb-1'>{user?.name}</h2>
        <p className='text-gray-500 text-sm mb-4'>{user?.email}</p>

        <div className='w-full bg-gray-50 rounded-2xl p-4 mb-6 text-left border border-gray-100'>
          <div className='flex justify-between items-center text-xs text-gray-500 py-1 border-b border-gray-200/60'>
            <span className='font-medium'>Account Created</span>
            <span>
              {user?.createdAt
                ? moment(user.createdAt).format('MMMM Do YYYY')
                : 'Recently'}
            </span>
          </div>
          <div className='flex justify-between items-center text-xs text-gray-500 py-1 mt-1'>
            <span className='font-medium'>User ID</span>
            <span className='font-mono text-[11px] truncate max-w-[200px]'>
              {user?.id}
            </span>
          </div>
        </div>

        {/* Photo Upload Actions */}
        <div className='w-full flex flex-col gap-3'>
          <label
            htmlFor='file-input'
            className='outlined-btn flex items-center justify-center gap-2 cursor-pointer'
          >
            <i className='ri-camera-switch-line text-lg'></i>
            <span>Choose New Photo</span>
          </label>
          <input
            type='file'
            accept='image/*'
            onChange={onFileSelect}
            className='hidden'
            id='file-input'
          />

          <button
            className='contained-btn flex items-center justify-center gap-2'
            onClick={updateProfilePic}
          >
            <i className='ri-save-line text-lg'></i>
            <span>Save Profile Picture</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
