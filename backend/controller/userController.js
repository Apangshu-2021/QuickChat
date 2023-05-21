import User from '../models/userModel.js'
import bcrypt from 'bcryptjs'
import generateToken from '../utils/generateToken.js'
import { cloudinary } from '../cloudinary.js'

// @desc    register a new user
// @route   POST /api/auth/register
// @access  Public

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    const emailCheck = await User.findOne({ email })

    if (emailCheck) {
      return res.json({
        message: 'User with this email already exists',
        status: false,
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    })

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      },
      status: true,
    })
  } catch (error) {
    res.json({ message: error.message, status: false })
  }
}

// @desc    login a user
// @route   POST /api/auth/login
// @access  Public

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    const chat_user = await User.findOne({ email })

    if (!chat_user) {
      return res.json({ message: 'Incorrect email', status: false })
    }

    const comparePassword = await bcrypt.compare(password, chat_user.password)

    if (!comparePassword) {
      return res.json({ message: 'Incorrect password', status: false })
    }

    res.json({
      user: {
        _id: chat_user._id,
        name: chat_user.name,
        email: chat_user.email,
        token: generateToken(chat_user._id),
      },
      status: true,
    })
  } catch (error) {
    res.json({ message: error.message, status: false })
  }
}

// @desc    get current user
// @route   GET /api/auth/get-current-user
// @access  Private

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    res.json({
      user,
      status: true,
    })
  } catch (error) {
    res.json({ message: error.message, status: false })
  }
}

// @desc    get all users except current user
// @route   GET /api/auth/get-all-users
// @access  Private

const getAllUsers = async (req, res) => {
  try {
    const allUsers = await User.find({ _id: { $ne: req.user._id } }).select(
      '-password'
    )

    res.json({
      allUsers,
      status: true,
    })
  } catch (error) {
    res.json({ message: error.message, status: false })
  }
}

// @desc    update user profile picture
// @route   GET /api/auth/update-profile-picture
// @access  Private

const updateProfilePicture = async (req, res) => {
  try {
    const image = req.body.image

    // upload image to cloudinary and get url
    const uploadedImage = await cloudinary.uploader.upload(image, {
      folder: 'quickchat',
    })

    let user = null

    // update user profile picture in database
    if (uploadedImage && uploadedImage.secure_url) {
      user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { profilePic: uploadedImage.secure_url },
        { new: true }
      )
    }

    res.json({
      user,
      status: true,
    })
  } catch (error) {
    res.json({ message: error.message, status: false })
  }
}

export { registerUser, loginUser, getUser, getAllUsers, updateProfilePicture }
