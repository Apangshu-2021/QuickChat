import {
  registerRoute,
  loginRoute,
  getUserRoute,
  getAllUsersRoute,
  updateProfilePictureRoute,
} from '../utils/APIRoutes'
import axios from 'axios'

const registerApi = async (user) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const { data } = await axios.post(registerRoute, user, config)

    return data
  } catch (error) {
    throw error
  }
}

const loginApi = async (user) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const { data } = await axios.post(loginRoute, user, config)

    return data
  } catch (error) {
    throw error
  }
}

const currentUser = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('quickChat-user'))
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    }

    const { data } = await axios.get(getUserRoute, config)

    return data
  } catch (error) {
    throw error
  }
}

const getAllUsers = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('quickChat-user'))
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    }

    const { data } = await axios.get(getAllUsersRoute, config)

    return data
  } catch (error) {
    throw error
  }
}

const updateProfilePicture = async (image) => {
  try {
    const user = JSON.parse(localStorage.getItem('quickChat-user'))
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    }

    const { data } = await axios.post(
      updateProfilePictureRoute,
      { image },
      config
    )

    return data
  } catch (error) {
    throw error
  }
}

export { registerApi, loginApi, currentUser, getAllUsers, updateProfilePicture }
