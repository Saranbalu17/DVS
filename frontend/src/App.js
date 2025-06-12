
import Login from './components/authentication/Login'
import { Routes,Route } from 'react-router-dom'
import Home from './components/authentication/Home'
import Signup from './components/authentication/Signup';
import OtpPage from './components/authentication/OtpPage';
import BundleCorrection from './components/bundle/BundleCorrection';
import PasswordChangePopup from './components/authentication/Password';
import SubjectSelection from './components/authentication/AllSubjects';
import Verification from './components/authentication/Verification';
import Proctoring from './components/authentication/Proctoring';

function App() {
//   document.oncontextmenu=()=>{
//     alert("Dont Try Right Click")
//     return false
//   }
// document.onkeydown=e=>{
//   if(e.key=="F12"){
//     alert("Don't Try to Inspect Element")
//     return false
//   }
//   if(e.ctrlKey && e.key=="u"){
//     alert("Don't Try to view page Sources")
//     return false
//   }
//   if(e.ctrlKey && e.key=="c"){
//     alert("Don't Try to Copy Page Elements")
//     return false
//   }
//   if(e.ctrlKey && e.key=="v"){
//     alert("Don't Try to Paste The Content")
//     return false
//   }
// }


  return (
      <>
      <Routes>
      <Route path="/" element={<Login/>} />
      {/* <Route path="/" element={<HomeComponent />}></Route> */}
      <Route path="/login" element={<Login />} />
      <Route path="/verification" element={<Verification />} />
      <Route path="/proctoring" element={<Proctoring />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home/:userId" element={<Home/>} />
      <Route path="/otppage" element={<OtpPage/>}/> 
     <Route path="/passwordChange" element={<PasswordChangePopup/>}/>
     <Route path="/subjects/:userId" element={<SubjectSelection/>}/>
      <Route path="/:userId/bundle-correction" element={<BundleCorrection />}/>
    </Routes>
      </>

  
  )
}

export default App;
