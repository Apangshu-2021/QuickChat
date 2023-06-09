const host =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://quickchat7231.onrender.com'
export const registerRoute = `${host}/api/auth/register`
export const loginRoute = `${host}/api/auth/login`
export const getUserRoute = `${host}/api/auth/get-current-user`
export const getAllUsersRoute = `${host}/api/auth/get-all-users`
export const getAllChatsRoute = `${host}/api/chat/get-all-chats`
export const createNewChatRoute = `${host}/api/chat/create-new-chat`
export const sendMessageRoute = `${host}/api/messages/new-message`
export const getAllMessagesRoute = `${host}/api/messages/get-all-messages`
export const clearChatMessagesRoute = `${host}/api/messages/clear-unread-messages`
export const updateProfilePictureRoute = `${host}/api/auth/update-profile-picture`
