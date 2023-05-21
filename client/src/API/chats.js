import { getAllChatsRoute, createNewChatRoute } from '../utils/APIRoutes'

import axios from 'axios'

const getAllChatsAPI = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('quickChat-user'))
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    }

    const { data } = await axios.get(getAllChatsRoute, config)

    return data
  } catch (error) {
    throw error
  }
}

const createNewChatAPI = async (members) => {
  try {
    const user = JSON.parse(localStorage.getItem('quickChat-user'))
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    }

    const { data } = await axios.post(createNewChatRoute, { members }, config)

    return data
  } catch (error) {
    throw error
  }
}

export { getAllChatsAPI, createNewChatAPI }
