import React, { useEffect, useState } from 'react'
// eslint-disable-next-line
import styles from '../index.css'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { registerApi } from '../API/users'
import { useDispatch } from 'react-redux'
import { hideLoader, showLoader } from '../redux/loaderSlice'

const Register = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState({ name: '', email: '', password: '' })
  const dispatch = useDispatch()

  useEffect(() => {
    const user = localStorage.getItem('quickChat-user')
    if (user) {
      navigate('/')
    }
  }, [])

  const register = async (e) => {
    e.preventDefault()

    if (handleValidation()) {
      try {
        dispatch(showLoader())
        const data = await registerApi(user)
        dispatch(hideLoader())

        if (data.status) {
          localStorage.setItem('quickChat-user', JSON.stringify(data.user))
          navigate('/')
          toast.success('Registration successful', toastOptions)
        } else {
          toast.error(data.message, toastOptions)
        }
      } catch (error) {
        dispatch(hideLoader())
        toast.error(error.message, toastOptions)
      }
    }
    setUser({ name: '', email: '', password: '' })
  }

  const toastOptions = {
    position: 'bottom-right',
    autoClose: 5000,
    pauseOnHover: true,
    draggable: true,
    theme: 'dark',
  }

  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/
    return re.test(email)
  }

  const handleValidation = () => {
    const { name, email, password } = user

    if (name.length < 3) {
      toast.error('Name must be at least 3 characters long', toastOptions)
      return false
    } else if (!validateEmail(email)) {
      toast.error('Email is not valid', toastOptions)
      return false
    } else if (password.length < 6) {
      toast.error('Password must be at least 6 characters long', toastOptions)
      return false
    } else {
      return true
    }
  }

  return (
    <>
      <div className='h-screen bg-primary flex justify-center items-center'>
        <form
          onSubmit={(e) => {
            register(e)
          }}
          className='m-6 w-96'
        >
          <div className='bg-white shadow-md p-5 flex flex-col gap-5 w-full'>
            <div className='flex gap-2'>
              <i className='ri-message-2-line text-2xl text-primary'></i>
              <h1 className='text-2xl uppercase text-center font-semibold'>
                QuickChat Register
              </h1>
            </div>
            <input
              type='text'
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              placeholder='Enter your name'
            />
            <input
              type='email'
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              placeholder='Enter your email'
            />
            <input
              type='password'
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              placeholder='Enter your password'
            />
            <button className='contained-btn' type='submit'>
              Register
            </button>
            <span>
              Already have an account?{' '}
              <Link className='text-blue-500 underline' to='/login'>
                Login
              </Link>
            </span>
          </div>
        </form>
      </div>
    </>
  )
}

export default Register
