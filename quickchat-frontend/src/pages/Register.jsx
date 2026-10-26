import React, { useEffect, useState } from 'react'
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
    const existing = localStorage.getItem('quickChat-user')
    if (existing) {
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
    return /\S+@\S+\.\S+/.test(email)
  }

  const handleValidation = () => {
    const { name, email, password } = user
    if (name.trim().length < 3) {
      toast.error('Name must be at least 3 characters long', toastOptions)
      return false
    } else if (!validateEmail(email)) {
      toast.error('Please enter a valid email address', toastOptions)
      return false
    } else if (password.length < 6) {
      toast.error('Password must be at least 6 characters long', toastOptions)
      return false
    }
    return true
  }

  const register = async (e) => {
    e.preventDefault()

    if (handleValidation()) {
      try {
        dispatch(showLoader())
        const data = await registerApi(user)
        dispatch(hideLoader())

        if (data.status) {
          localStorage.setItem('quickChat-user', JSON.stringify(data.user))
          toast.success('Registration successful', toastOptions)
          navigate('/')
        } else {
          toast.error(data.message || 'Registration failed', toastOptions)
        }
      } catch (error) {
        dispatch(hideLoader())
        toast.error(error.message || 'Registration failed', toastOptions)
      }
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#4d426d] via-[#3a3153] to-[#251f35] flex justify-center items-center p-4'>
      <div className='bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl border border-white/20 backdrop-blur-md'>
        <div className='flex flex-col items-center mb-8'>
          <div className='w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl shadow-lg shadow-primary/40 mb-3'>
            <i className='ri-user-add-line'></i>
          </div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900 uppercase'>
            Create Account
          </h1>
          <p className='text-sm text-gray-500 mt-1'>
            Join QuickChat to connect with friends
          </p>
        </div>

        <form onSubmit={register} className='flex flex-col gap-4'>
          <div>
            <label className='block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1'>
              Full Name
            </label>
            <input
              type='text'
              value={user.name}
              onChange={(e) => setUser({ ...user, name: e.target.value })}
              placeholder='Your Name'
              className='w-full'
              required
            />
          </div>

          <div>
            <label className='block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1'>
              Email Address
            </label>
            <input
              type='email'
              value={user.email}
              onChange={(e) => setUser({ ...user, email: e.target.value })}
              placeholder='name@example.com'
              className='w-full'
              required
            />
          </div>

          <div>
            <label className='block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1'>
              Password
            </label>
            <input
              type='password'
              value={user.password}
              onChange={(e) => setUser({ ...user, password: e.target.value })}
              placeholder='•••••••• (min. 6 characters)'
              className='w-full'
              required
            />
          </div>

          <button
            type='submit'
            className='contained-btn w-full mt-2 flex items-center justify-center gap-2'
          >
            <span>Register</span>
            <i className='ri-arrow-right-line'></i>
          </button>
        </form>

        <p className='text-center text-sm text-gray-500 mt-6'>
          Already have an account?{' '}
          <Link
            to='/login'
            className='text-primary font-semibold hover:underline'
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
