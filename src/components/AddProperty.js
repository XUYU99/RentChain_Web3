import { ethers } from "ethers";
import { useEffect, useState } from "react";
import "./AddProperty.css";
import {
  PRIVATE_KEY0,
  PRIVATE_KEY1,
  PRIVATE_KEY2,
  HARDHAT_RPC_URL,
  SEPOLIA_PRIVATE_KEY0,
  SEPOLIA_PRIVATE_KEY1,
  SEPOLIA_PRIVATE_KEY2,
  SEPOLIA_RPC_URL,
} from "../components/accountSetting";
const AddProperty = ({ addtogglePop, loadBlockchainData, tokenId }) => {
  const [loading, setLoading] = useState(true); // 加载状态
  const [error, setError] = useState(null); // 错误状态
  const [rentLoading, setrentLoading] = useState(false);
  const [rentSuccess, setrentSuccess] = useState(false);
  // 获取详细信息
  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError(null);
    } catch (error) {
      console.error("Error fetching details:", error);
      setError("Error fetching property details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="addProperty_window">
        <div className="addProperty_loading-spinner">
          <div className="addProperty_container">
            <h2 className="addProperty_title">Add Your Rental Property</h2>

            <div className="addProperty_input_module">
              {/* Name Input */}
              <label className="input_name">
                <p>Property Name:</p>
                <input
                  type="text"
                  className="addProperty_input_Field"
                  placeholder="Enter property name"
                />
              </label>

              {/* Address Input */}
              <label className="input_address">
                <p>Property Address:</p>
                <input
                  type="text"
                  className="addProperty_input_Field"
                  placeholder="Enter property address"
                />
              </label>

              {/* Description Input */}
              <label className="input_description">
                <p>Description:</p>
                <textarea
                  className="addProperty_input_textarea"
                  placeholder="Enter property description"
                />
              </label>

              {/* Image URL Input */}
              <label className="input_imageUrl">
                <p>Image URL:</p>
                <input
                  type="text"
                  className="addProperty_input_Field"
                  placeholder="Enter property image URL"
                />
              </label>

              {/* Attributes Input */}
              <label className="input_attributes">
                <p>Attributes:</p>
                <textarea
                  className="addProperty_input_textarea"
                  placeholder="Enter property attributes"
                />
              </label>
            </div>

            <div className="addProperty_button">
              <button>Commit</button>
              <button onClick={addtogglePop}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProperty;
