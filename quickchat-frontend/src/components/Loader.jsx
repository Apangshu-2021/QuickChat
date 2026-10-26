import React from 'react'

const Loader = () => {
  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[999]'>
      <div className='relative flex items-center justify-center'>
        <div className='h-14 w-14 border-4 border-indigo-200 border-t-primary rounded-full animate-spin'></div>
        <i className='ri-message-3-line absolute text-primary text-xl'></i>
      </div>
    </div>
  )
}

export default Loader
