import React, { useState } from 'react'
 
const FooterBottom = ({valuationMode,setValuationMode}) => {
    const handleValuatonSwitch = (mode)=> (e)=>{
            e.stopPropagation()
            setValuationMode(mode)
    }
  return (
    <div
        id=""
        className=" flex items-center justify-between bg-gradient-to-r from-gray-50 to-purple-50 p-2 rounded-xl shadow-md border border-gray-200"
        onClick={(e)=>e.stopPropagation()}
        >
        <button
          className={`bg-white text-purple-700 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors duration-300 shadow-sm ${
            valuationMode === "v1"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={handleValuatonSwitch("V1")}
        >
          V1
        </button>
        <button
          className={`bg-white text-purple-700 font-medium px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors duration-300 shadow-sm${
            valuationMode === "v2"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
           onClick={handleValuatonSwitch("V2")}
        >
          V2
        </button>
      </div>
  )
}
 
export default FooterBottom