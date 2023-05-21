import React from 'react'

const UserSearch = ({ searchKey, setSearchKey }) => {
  return (
    <div className='relative'>
      <input
        type='text'
        className='rounded-full w-full border-gray-300 pl-10 text-gray-500 h-14 text-lg'
        placeholder='Search users/chats'
        value={searchKey}
        onChange={(e) => setSearchKey(e.target.value)}
      />
      <i className='ri-search-line absolute top-4 left-4 text-gray-500'></i>
    </div>
  )
}

export default UserSearch
