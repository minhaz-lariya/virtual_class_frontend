import React from 'react';
import styled, { keyframes } from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';

// 1. Spinning Animation
const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// 2. Full Screen Block
const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.85); /* Semi-transparent white */
  backdrop-filter: blur(5px); /* Modern blur effect */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10001; /* Higher than your DropdownMenu (9999) */
  transition: all 0.3s ease;
`;

const SpinnerBox = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const OuterCircle = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4px solid #f1f3f4;
  border-top: 4px solid #004d40; /* Bottle Green */
  border-radius: 50%;
  animation: ${rotate} 1s linear infinite;
`;

const IconCenter = styled.div`
  color: #004d40;
  font-size: 2.8rem;
  z-index: 2;
`;

const Message = styled.p`
  margin-top: 20px;
  font-weight: 600;
  color: #004d40;
  letter-spacing: 0.5px;
  font-family: 'Inter', sans-serif;
`;

/**
 * @param {boolean} status - Controls visibility (true/false)
 */
const LoadingOverlay = ({ status, message = "Processing, please wait..." }) => {
  if (!status) return null;

  return (
    <OverlayContainer>
      <SpinnerBox>
        <OuterCircle />
        <IconCenter>
          <FontAwesomeIcon icon={faGraduationCap} />
        </IconCenter>
      </SpinnerBox>
      <Message>{message}</Message>
    </OverlayContainer>
  );
};

export default LoadingOverlay;