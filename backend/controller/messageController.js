import Chat from '../models/chatModel.js'
import expressAsyncHandler from 'express-async-handler'
import Message from '../models/messageModel.js'
import { cloudinary } from '../cloudinary.js'

// @desc  save a new message and update chat of current user
// @route   POST /api/messages/new-message
// @access  Private

const saveNewMessageAndUpdateChat = async (req, res) => {
  try {
    // If image present then save to cloudinary and get url
    if (req.body.image !== '') {
      const uploadedImage = await cloudinary.uploader.upload(req.body.image, {
        folder: 'quickchat',
      })
      req.body.image = uploadedImage.secure_url
    }
    // save new message

    const newMessage = new Message(req.body)
    const savedMessage = await newMessage.save()

    // update last message of chat
    await Chat.findOneAndUpdate(
      { _id: req.body.chat },
      {
        lastMessage: savedMessage._id,
        $inc: { unreadMessages: 1 },
      }
    )

    res.json({
      message: 'Message sent successfully',
      status: true,
      savedMessage,
    })
  } catch (error) {
    res.json({
      message: 'Error sending message',
      status: false,
      error: error.message,
    })
  }
}

// @desc  get all messages of a chat
// @route   POST /api/messages/get-all-messages/${chatId}
// @access  Private

const getAllMessagesOfChat = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId }).sort({
      createdAt: 1,
    })

    res.json({
      messages,
      message: 'Message fetched successfully',
      status: true,
    })
  } catch (error) {
    res.json({
      message: 'Error sending message',
      status: false,
      error: error.message,
    })
  }
}

// @desc   clear all unread messages of a chat
// @route   POST /api/messages/clear-unread-messages
// @access  Private

const clearUnreadMessagesOfChat = expressAsyncHandler(async (req, res) => {
  try {
    // find chat and update unreadMessages to 0
    const chat = await Chat.findByIdAndUpdate(
      req.body.chat,
      { unreadMessages: 0 },
      { new: true }
    )
      .populate('lastMessage')
      .populate('members')
      .sort({ updatedAt: -1 })

    if (!chat) {
      res.json({ message: 'Chat not found', status: false })
    }

    // find all unread messages of chat and update read to true
    await Message.updateMany(
      { chat: req.body.chat, read: false },
      { read: true }
    )

    res.json({
      message: 'Unread messages cleared successfully',
      status: true,
      chat,
    })
  } catch (error) {
    res.json({
      message: 'Error clearing unread messages',
      status: false,
      error: error.message,
    })
  }
})

export {
  saveNewMessageAndUpdateChat,
  getAllMessagesOfChat,
  clearUnreadMessagesOfChat,
}
