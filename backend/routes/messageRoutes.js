import express from 'express'
const router = express.Router()
import {
  saveNewMessageAndUpdateChat,
  getAllMessagesOfChat,
  clearUnreadMessagesOfChat,
} from '../controller/messageController.js'
import { protect } from '../middleware/authMiddleware.js'

router.route('/new-message').post(protect, saveNewMessageAndUpdateChat)
router.route('/get-all-messages/:chatId').get(protect, getAllMessagesOfChat)
router.route('/clear-unread-messages').post(protect, clearUnreadMessagesOfChat)

export default router
