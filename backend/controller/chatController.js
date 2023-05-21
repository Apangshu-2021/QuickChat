import Chat from '../models/chatModel.js'
import expressAsyncHandler from 'express-async-handler'

// @desc    create a new chat between two users
// @route   POST /api/chat/create-new-chat
// @access  Private

const createNewChat = expressAsyncHandler(async (req, res) => {
  const chat = await Chat.create(req.body)

  // populate members in saved chat
  await chat.populate('members')

  if (chat) {
    res.json({ message: 'Chat created successfully', chat, status: true })
  } else {
    res.json({ message: 'Error creating chat', status: false })
  }
})

// @desc    get all chats of current user
// @route   GET /api/chat/get-all-chats
// @access  Private

const getAllChats = expressAsyncHandler(async (req, res) => {
  const chats = await Chat.find({
    members: {
      $in: [req.user._id],
    },
  })
    .populate('members')
    .populate('lastMessage')
    .sort({ updatedAt: -1 })

  if (chats) {
    res.json({ chats, status: true })
  } else {
    res.json({ message: 'Error getting chats', status: false })
  }
})

export { createNewChat, getAllChats }
