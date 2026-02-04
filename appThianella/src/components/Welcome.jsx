import React from 'react'

import '../styles/Welcome.css'

import logoHorneaditos from '../assets/logoHorneaditos.png'
import tipografiaHorneaditosB from '../assets/tipografiaHorneaditosB.png'

const Welcome = () => {

  const greetingMensagge = () => {
    const time = new Date().getHours()

    if (time >= 5 && time < 12) {
      return 'Buenos dias'
    } else if (time >= 12 && time < 18) {
      return 'Buenas tardes'
    } else {
      return 'Buenas noches'
    }
  }


  return (
    <div className='welcomeContainer'>
      <img src={tipografiaHorneaditosB} alt="Logo Horneaditos Thianella" />
      <h1>{greetingMensagge()}</h1>
    </div>
  )
}

export default Welcome
