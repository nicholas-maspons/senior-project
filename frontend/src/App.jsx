import { useState } from "react";

function App() {

  const [message, setMessage] = useState({})

  async function callHelloApi() {
    try {
      const response = await fetch("http://localhost:3000/api/hello");
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json(); 
      setMessage(data);
      console.log(data);  
    } catch (e) {
      console.error(`Error message: ${e}`)
    }
  }

  return (
    <>
      <div>Hello. Hopefully I can see this.</div>
      <div>{message.message}</div>
      <button onClick={callHelloApi}>
        Call Hello API
      </button>
    </>

  )
}

export default App
