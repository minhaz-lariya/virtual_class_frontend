import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserShield, faChalkboardTeacher, faUserGraduate } from "@fortawesome/free-solid-svg-icons";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const HomeWrapper = styled.div`
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const VideoBackground = styled.video`
  position: absolute;
  top: 50%;
  left: 50%;
  min-width: 100%;
  min-height: 100%;
  z-index: -2;
  transform: translate(-50%, -50%);
  object-fit: cover;
  filter: brightness(0.3); 
`;

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgba(0,77,64,0.2) 0%, rgba(0,0,0,0.8) 100%);
  z-index: -1;
`;

const ContentContainer = styled.div`
  z-index: 1;
  text-align: center;
  padding: 40px;
  width: 100%;
  max-width: 1200px;
  animation: ${fadeIn} 1s ease-out;
`;

const PortalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin-top: 60px;
`;

const Card = styled.div`
  background: ${props => props.disabled ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.08)'};
  backdrop-filter: blur(12px);
  border: 1px solid ${props => props.disabled ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)'};
  padding: 50px 30px;
  border-radius: 24px;
  color: white;
  transition: all 0.4s ease;
  
  /* Disable interaction logic */
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? '0.6' : '1'};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'}; 

  &:hover {
    ${props => !props.disabled && `
      transform: translateY(-12px);
      background: rgba(255, 255, 255, 0.15);
      border-color: #2ecc71;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      
      .icon-box {
          color: #fff;
          transform: scale(1.1);
      }
    `}
  }

  .icon-box {
    font-size: 3.5rem;
    margin-bottom: 25px;
    color: ${props => props.disabled ? '#555' : '#2ecc71'};
    transition: all 0.4s ease;
  }
`;

export default function Home() {
  const navigate = useNavigate();

  return (
    <HomeWrapper>
      <VideoBackground autoPlay loop muted playsInline>
        <source 
          src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-nodes-connection-background-32215-large.mp4" 
          type="video/mp4" 
        />
      </VideoBackground>
      
      <Overlay />

      <ContentContainer>
        <div className="mb-2 text-white">
          <h1 className="display-2 fw-bold mb-3">IQRA VIRTUAL</h1>
          <p className="lead opacity-75">Select a portal to access the Learning Management System</p>
        </div>

        <PortalGrid>
          {/* ADMIN - CLICKABLE */}
          <Card onClick={() => navigate('/Admin/Sign-In')}>
            <div className="icon-box"><FontAwesomeIcon icon={faUserShield} /></div>
            <h3 className="fw-bold">ADMINISTRATOR</h3>
            <p className="small opacity-75">Full system management and institutional control.</p>
          </Card>

          {/* FACULTY - NON CLICKABLE */}
          <Card disabled>
            <div className="icon-box"><FontAwesomeIcon icon={faChalkboardTeacher} /></div>
            <h3 className="fw-bold">FACULTY</h3>
            <p className="small opacity-50">Classroom management and academic resources.</p>
          </Card>

          {/* STUDENT - NON CLICKABLE */}
          <Card disabled>
            <div className="icon-box"><FontAwesomeIcon icon={faUserGraduate} /></div>
            <h3 className="fw-bold">STUDENT</h3>
            <p className="small opacity-50">Personalized learning dashboard and grades.</p>
          </Card>
        </PortalGrid>
      </ContentContainer>
    </HomeWrapper>
  );
}