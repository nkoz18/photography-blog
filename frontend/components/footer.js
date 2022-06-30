import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faInstagram,
  faYoutube,
  faTiktok,
} from "@fortawesome/free-brands-svg-icons"

const Footer = () => {
  return (
    <div id="footer">
      <div className="uk-container-large uk-align-center">
        <div id="social">
          <a href="https://www.instagram.com/hotstatenikita/" target="_blank">
            <FontAwesomeIcon icon={faInstagram} />
          </a>
          <a
            href="https://www.youtube.com/channel/UC47YGVeLHf5lAbU1L_QZUNQ"
            target="_blank"
          >
            <FontAwesomeIcon icon={faYoutube} />
          </a>
          <a
            href="https://www.tiktok.com/@nikitacauselove?is_from_webapp=1&sender_device=pc"
            target="_blank"
          >
            <FontAwesomeIcon icon={faTiktok} />
          </a>
        </div>
      </div>
    </div>
  )
}

export default Footer
