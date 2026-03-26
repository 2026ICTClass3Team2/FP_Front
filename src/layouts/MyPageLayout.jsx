import React from 'react'
import { Outlet } from 'react-router-dom'

const MyPageLayout = () => {
  return (
    <>
        <main>
            <Outlet />
        </main>
    </>
  )
}

export default MyPageLayout