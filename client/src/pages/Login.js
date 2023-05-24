import React, { useEffect, useState } from 'react'
// eslint-disable-next-line
import styles from '../index.css'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { loginApi } from '../API/users'
import { useDispatch } from 'react-redux'
import { hideLoader, showLoader } from '../redux/loaderSlice'

const Login = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState({ email: '', password: '' })
  const dispatch = useDispatch()

  useEffect(() => {
    const user = localStorage.getItem('quickChat-user')
    if (user) {
      navigate('/')
    }
  }, [])

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

  const login = async (e) => {
    e.preventDefault()

    if (handleValidation()) {
      try {
        dispatch(showLoader())
        const data = await loginApi(user)
        dispatch(hideLoader())
        if (data.status) {
          localStorage.setItem('quickChat-user', JSON.stringify(data.user))
          navigate('/')
          toast.success('Login successful', toastOptions)
        } else {
          toast.error(data.message, toastOptions)
        }
      } catch (error) {
        dispatch(hideLoader())
        toast.error(error.message, toastOptions)
      }
    }

    setUser({ email: '', password: '' })
  }

  const handleValidation = () => {
    const { email, password } = user

    if (!validateEmail(email)) {
      toast.error('Email is not valid', toastOptions)
      return false
    } else if (password.length === '') {
      toast.error('Password cannot be empty', toastOptions)
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
            login(e)
          }}
          className='m-6 w-96'
        >
          <div className='bg-white shadow-md p-5 flex flex-col gap-5 w-full'>
            <div className='flex gap-2'>
              <i className='ri-message-2-line text-2xl text-primary'></i>
              <h1 className='text-2xl uppercase text-center font-semibold'>
                QuickChat Login
              </h1>
            </div>
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
              Login
            </button>
            <span>
              Don't have an account?{' '}
              <Link className='text-blue-500 underline' to='/register'>
                Register
              </Link>
            </span>
          </div>
        </form>
      </div>
    </>
  )
}

export default Login
