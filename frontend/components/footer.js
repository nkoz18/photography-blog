import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram, faYoutube, faTiktok } from "@fortawesome/free-brands-svg-icons"


const Footer = () => {
  return (
    <div id="footer">
      <div className="uk-container-large uk-align-center">
        <div id="social">
        <a href="#"><FontAwesomeIcon icon={faInstagram} /></a>
        <a href="#"><FontAwesomeIcon icon={faYoutube} /></a>  
        <a href="#"><FontAwesomeIcon icon={faTiktok} /></a> 
        </div>
      </div>
    </div>
  )
}

export default Footer
