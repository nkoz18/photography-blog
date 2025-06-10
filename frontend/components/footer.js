import React from "react"

const Footer = () => {
  return (
    <footer id="footer">
      <div className="uk-container-large uk-align-center">
        <div id="social">
          <a
            href="https://www.instagram.com/pixel.shifter/"
            target="_blank"
            rel="noreferrer"
          >
            <img 
              src="/images/icons/social/social_instagram.svg" 
              alt="Instagram" 
              className="social-icon"
            />
          </a>
          <a
            href="https://www.youtube.com/channel/UC47YGVeLHf5lAbU1L_QZUNQ"
            target="_blank"
            rel="noreferrer"
          >
            <img 
              src="/images/icons/social/social_youtube.svg" 
              alt="YouTube" 
              className="social-icon"
            />
          </a>
          <a
            href="https://www.tiktok.com/@nikitacauselove?is_from_webapp=1&sender_device=pc"
            target="_blank"
            rel="noreferrer"
          >
            <img 
              src="/images/icons/social/social_tik_tok.svg" 
              alt="TikTok" 
              className="social-icon"
            />
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer