import React, { useState } from 'react'
import tipografiaHorneaditos from '../assets/tipografiaHorneaditos.png'
import Footer from './Footer'

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('https://appthianella-backend.onrender.com/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        onLogin(data.user)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='loginContainer'>
      <img src={tipografiaHorneaditos} alt="logo" />
      <form onSubmit={handleSubmit} className='fromGroup'>
        <label htmlFor="usuario">Usuario:</label>
        <input
          type="text"
          placeholder='Ingrese su usuario...'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <label htmlFor="contraseña">Contraseña:</label>
        <input
          type="password"
          placeholder='Ingrese su contraseña...'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type='submit' disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <Footer/>
    </div>
  )
}

export default Login
