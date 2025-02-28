const Footer = () => {
  return (
    <footer className="c-space pt-7 pb-3 border-t border-black-300 flex justify-between items-center flex-wrap gap-5">
      <div className="text-black-500 flex gap-2">
        <p >Terms & Conditions</p>
        <p>|</p>
        <p>Privacy Policy</p>
      </div>

      <div className="flex gap-3">
        
        <div className="social-icon" >

          <img
            src="./assets/linkedin.svg"
            alt="instagram"
            className="w-1/2 h-1/2 cursor-pointer"
            onClick={() => window.open("https://www.linkedin.com/in/ankit-tanwar-0110791a8/", "_blank")}
          />
        </div>
      </div>

      <h3 className="text-black-500">© 2025 Ankit. All rights reserved.</h3>
    </footer>
  );
};

export default Footer;
