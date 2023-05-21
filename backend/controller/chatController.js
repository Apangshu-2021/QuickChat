import Chat from '../models/chatModel.js'
import expressAsyncHandler from 'express-async-handler'

// @desc    create a new chat between two users
// @route   POST /api/chat/create-new-chat
// @access  Private

const createNewChat = async (req, res) => {
  try {
    const chat = await Chat.create(req.body)

    // populate members in saved chat
    await chat.populate('members')

    res.json({ message: 'Chat created successfully', chat, status: true })
  } catch (error) {
    res.json({ message: error.message, status: false })
  }
}

// @desc    get all chats of current user
// @route   GET /api/chat/get-all-chats
// @access  Private

const getAllChats = expressAsyncHandler(async (req, res) => {
  try {
    const chats = await Chat.find({
      members: {
        $in: [req.user._id],
      },
    })
      .populate('members')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })

    res.json({ chats, status: true })
  } catch (error) {
    res.json({ message: error.message, status: false })
  }
})

export { createNewChat, getAllChats }
