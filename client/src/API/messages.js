import {
  getAllMessagesRoute,
  sendMessageRoute,
  clearChatMessagesRoute,
} from '../utils/APIRoutes'
import axios from 'axios'

const sendMessage = async (message) => {
  try {
    const user = JSON.parse(localStorage.getItem('quickChat-user'))
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    }

    const { data } = await axios.post(sendMessageRoute, message, config)

    return data
  } catch (error) {
    throw error
  }
}

const getMessagesOfChat = async (chatId) => {
  try {
    const user = JSON.parse(localStorage.getItem('quickChat-user'))
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    }
    const route = `${getAllMessagesRoute}/${chatId}`
    const { data } = await axios.get(route, config)

    return data
  } catch (error) {
    throw error
  }
}

const clearChatMessages = async (chatId) => {
  try {
    const user = JSON.parse(localStorage.getItem('quickChat-user'))
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    }

    const { data } = await axios.post(
      clearChatMessagesRoute,
      { chat: chatId },
      config
    )

    return data
  } catch (error) {
    throw error
  }
}

export { sendMessage, getMessagesOfChat, clearChatMessages }
