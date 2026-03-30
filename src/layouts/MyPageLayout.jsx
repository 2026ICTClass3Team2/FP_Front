import React from 'react'
import { Outlet } from 'react-router-dom'

const MyPageLayout = () => {
  return (
    <div>
        <div>
          <h2></h2>
        </div>
        <main>
            <Outlet />
        </main>
    </div>
  )
}

export default MyPageLayout