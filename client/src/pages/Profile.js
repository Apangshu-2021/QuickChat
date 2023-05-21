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
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = async () => {
        setImage(reader.result)
      }
    } else {
      toast.error('Please select an image', toastOptions)
    }
  }

  const updateProfilePic = async () => {
    try {
      dispatch(showLoader())
      const response = await updateProfilePicture(image)
      dispatch(hideLoader())

      if (response.status) {
        toast.success('Profile Pic updated', toastOptions)
        dispatch(setUser(response.user))
      } else {
        toast.error(response.message, toastOptions)
      }
    } catch (error) {
      dispatch(hideLoader())
      toast.error(error.message, toastOptions)
    }
  }

  return (
    // We need to add height and width in order to apply items-center and justify-center with flex
    <div className='flex items-center justify-center h-[80vh]'>
      <div className='text-xl font-semibold uppercase text-gray-500 flex flex-col break-words shadow-md border-gray-300 p-3 md:w-3/5 w-full'>
        <h1>{user?.name}</h1>
        <h1>{user?.email}</h1>
        <h1>
          Created At :{' '}
          {moment(user?.createdAt).format('MMMM Do YYYY, h:mm:ss a')}
        </h1>
        <div className='flex items-center justify-center'>
          {image && (
            <img
              src={image}
              alt='profile pic'
              className='w-32 h-32 rounded-full'
            />
          )}
        </div>
        <div>
          <div className='flex flex-col'>
            <label htmlFor='file-input' className='cursor-pointer'>
              Update profile pic :
            </label>
            <input
              type='file'
              accept='image/*'
              onChange={onFileSelect}
              style={{ border: 'none' }}
              id='file-input'
            />
            <button
              className='contained-btn text-sm max-w-fit'
              onClick={updateProfilePic}
            >
              Update Image
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
