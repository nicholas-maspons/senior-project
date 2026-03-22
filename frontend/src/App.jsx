import { useState } from "react";

function App() {

  const [message, setMessage] = useState({})
  const [testData, setTestData] = useState([])

  async function callHelloApi() {
    try {
      const response = await fetch("http://192.168.0.101:3000/api/hello");
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json(); 
      setMessage(data);
      console.log(data);  
    } catch (e) {
      console.error(`Error message: ${e}`)
    }
  }

  async function callTestApi() {
    try {
      const response = await fetch("http://192.168.0.101:3000/api/test");
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      setTestData(data);
      console.log(data);
    } catch (e) {
      console.error(`Error message: ${e}`)
    }
  }

  return (
    <>
      <div>Hello. Hopefully I can see this.</div>
      <div>{message.message}</div>
      <button onClick={callHelloApi}>Call Hello API</button>
      <button onClick={callTestApi}>Fetch Test DB Data</button>
      <ul>
        {testData.map((row) => (
          <li key={row.id}>{row.message} — {row.created_at}</li>
        ))}
      </ul>
    </>
  )
}

export default App