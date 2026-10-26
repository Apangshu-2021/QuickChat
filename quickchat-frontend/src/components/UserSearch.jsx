import React from 'react'

const UserSearch = ({ searchKey, setSearchKey }) => {
  return (
    <div className='relative mb-4'>
      <input
        type='text'
        className='rounded-xl w-full border border-gray-200 pl-4 pr-11 text-gray-700 h-12 text-base shadow-sm focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200'
        placeholder='Search users or chats...'
        value={searchKey}
        onChange={(e) => setSearchKey(e.target.value)}
      />
      <i className='ri-search-line absolute top-3.5 right-4 text-gray-400 text-lg pointer-events-none'></i>
    </div>
  )
}

export default UserSearch
