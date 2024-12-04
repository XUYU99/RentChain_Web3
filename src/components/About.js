import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Navigation from "../components/Navigation";
function About({ account, setAccount }) {
  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      About Page
    </div>
  );
}

export default About;
