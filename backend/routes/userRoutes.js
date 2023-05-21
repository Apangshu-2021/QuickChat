import express from 'express'
const router = express.Router()
import {
  registerUser,
  loginUser,
  getUser,
  getAllUsers,
  updateProfilePicture,
} from '../controller/userController.js'
import { protect } from '../middleware/authMiddleware.js'

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/get-current-user').get(protect, getUser)
router.route('/get-all-users').get(protect, getAllUsers)
router.route('/update-profile-picture').post(protect, updateProfilePicture)

export default router
