import express from 'express'
const router = express.Router()
import { createNewChat, getAllChats } from '../controller/chatController.js'
import { protect } from '../middleware/authMiddleware.js'

router.route('/create-new-chat').post(protect, createNewChat)
router.route('/get-all-chats').get(protect, getAllChats)

export default router
