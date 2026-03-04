import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faLock, faSignOutAlt, faChevronDown,
  faHome, faBook, faChalkboardTeacher, faBars, faSearch
} from "@fortawesome/free-solid-svg-icons";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Outlet, useNavigate, useNavigation } from "react-router-dom";
import Swal from "sweetalert2";

// Theme Palette
const theme = {
  primary: "#004d40", // Deep Bottle Green
  secondary: "#00695c",
  accent: "#2ecc71", // Emerald Green for active states
  textLight: "#ffffff",
  textMuted: "#a0aec0",
  bgLight: "#f4f7f6",
  sidebarWidth: "260px"
};

// Styled Components
const Wrapper = styled.div`
  display: flex;
  height: 100vh;
  background-color: ${theme.bgLight};
  font-family: 'Inter', -apple-system, sans-serif;
`;

const Sidebar = styled.aside`
  width: ${theme.sidebarWidth};
  background: ${theme.primary};
  color: white;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  z-index: 1100;
  box-shadow: 4px 0 10px rgba(0,0,0,0.1);

  @media (max-width: 992px) {
    transform: ${(props) => (props.isOpen ? "translateX(0)" : "translateX(-100%)")};
    position: fixed;
    height: 100%;
  }
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  background: rgba(0,0,0,0.1);
  
  img {
    height: 35px;
    border-radius: 8px;
    margin-right: 12px;
  }
`;

const NavSection = styled.div`
  flex: 1;
  padding: 1.5rem 0.8rem;
  overflow-y: auto;
`;

const NavItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.8rem 1rem;
  margin-bottom: 0.4rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: ${(props) => (props.active ? theme.textLight : theme.textMuted)};
  background: ${(props) => (props.active ? theme.accent : "transparent")};
  font-weight: ${(props) => (props.active ? "600" : "400")};

  &:hover {
    background: ${(props) => (props.active ? theme.accent : "rgba(255,255,255,0.1)")};
    color: white;
  }

  svg {
    width: 20px;
    margin-right: 12px;
  }
`;

const SubMenu = styled.div`
  margin-left: 2.5rem;
  border-left: 1px solid rgba(255,255,255,0.1);
  padding-left: 0.5rem;
  display: ${(props) => (props.isOpen ? "block" : "none")};
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TopNav = styled.header`
  height: 70px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
`;

const SearchBar = styled.div`
  background: #f1f3f4;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  width: 300px;
  input {
    border: none;
    background: none;
    outline: none;
    margin-left: 10px;
    font-size: 0.9rem;
  }
`;

 const isActive = (path) => location.pathname.includes(path);

const ProfileArea = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  position: relative;

  .avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: ${theme.primary};
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 120%;
  right: 0;
  background: white;
  min-width: 180px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  padding: 0.5rem 0;
  display: ${(props) => (props.show ? "block" : "none")};
  
  /* ADD THIS LINE ONLY */
  z-index: 9999 !important; 
  
  button {
    width: 100%;
    text-align: left;
    padding: 0.7rem 1.2rem;
    border: none;
    background: none;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 10px;
    &:hover { background: #f8f9fa; color: ${theme.accent}; }
  }
`;

export const ContentBody = styled.div`
  padding: 2rem;
  overflow-y: auto;
  background: ${theme.bgLight};
`;

export const PageHeader = styled.div`
  margin-bottom: 2rem;
  h2 { font-weight: 700; color: ${theme.primary}; margin: 0; }
  span { color: #888; font-size: 0.9rem; }
`;

const AdminLayout = () => {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({ courses: true });
  const [activeItem, setActiveItem] = useState("dashboard");

  const redirect = useNavigate()

  const toggleSubmenu = (menu) => {
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };


  useEffect(() => {
    const adminId = localStorage.getItem("adminUserId");

    if (!adminId) {
      Swal.fire({
        icon: 'error',
        title: 'Access Denied',
        text: 'You must be logged in to access this page.',
        confirmButtonColor: '#004d40',
      }).then(() => {
        // Redirect to Login page after they click OK
        redirect("/Admin/Sign-In");
      });
    }
  }, []);


  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be signed out of the Admin Portal!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#004d40', // Matches your theme
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!',
      cancelButtonText: 'Cancel',
      reverseButtons: true // Puts "Cancel" on the left
    }).then((result) => {
      if (result.isConfirmed) {

        localStorage.clear();

        // 3. Show a quick success message (optional)
        Swal.fire({
          title: 'Logged Out!',
          text: 'You have been successfully signed out.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // 4. Redirect to Sign In
        setTimeout(() => {
          redirect("/Admin/SignIn");
        }, 1500);
      }
    });
  };


  return (
    <Wrapper>
      <Sidebar isOpen={isMobileOpen}>
        <SidebarHeader>
          <i className="fas fa-graduation-cap"></i>&nbsp; IQRA VIRTUAL
        </SidebarHeader>

        <NavSection>
          {/* Dashboard */}
          <NavItem
            active={isActive("/Admin/Dashboard")}
            onClick={() => { redirect("/Admin/Dashboard"); setMobileOpen(false); }}
          >
            <FontAwesomeIcon icon={faHome} /> Dashboard
          </NavItem>

          {/* Faculties */}
          <NavItem
            active={isActive("/Admin/Faculties")}
            onClick={() => { redirect("/Admin/Faculties"); setMobileOpen(false); }}
          >
            <FontAwesomeIcon icon={faChalkboardTeacher} /> Faculties
          </NavItem>

          {/* Students */}
          <NavItem
            active={isActive("/Admin/Students")}
            onClick={() => { redirect("/Admin/Students"); setMobileOpen(false); }}
          >
            <FontAwesomeIcon icon={faUser} /> Students
          </NavItem>

          {/* Subjects Dropdown Logic */}
          <div className="mb-2">
            <NavItem onClick={() => toggleSubmenu("subjects")}>
              <FontAwesomeIcon icon={faBook} />
              Academic
              <FontAwesomeIcon
                icon={faChevronDown}
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.8rem',
                  transform: openMenus.subjects ? 'rotate(180deg)' : 'none',
                  transition: '0.3s'
                }}
              />
            </NavItem>
            <SubMenu isOpen={openMenus.subjects || isActive("/Admin/Subjects")}>
              <NavItem
                active={location.pathname === "/Admin/Subjects"}
                onClick={() => redirect("/Admin/Subjects")}
                style={{ fontSize: '0.9rem' }}
              >
                Subject List
              </NavItem>
              <NavItem
                active={isActive("/Admin/Subjects/Allocation")}
                onClick={() => redirect("/Admin/Subjects/Allocation")}
                style={{ fontSize: '0.9rem' }}
              >
                Faculty Allocation
              </NavItem>
            </SubMenu>
          </div>
        </NavSection>

        <div className="p-3 text-center" style={{ fontSize: '0.8rem', opacity: 0.6 }}>
          © 2026 IQRA BCA v2.0
        </div>
      </Sidebar>

      <MainContent>
        <TopNav>
          <div className="d-flex align-items-center">
            <FontAwesomeIcon
              icon={faBars}
              className="d-lg-none me-3"
              onClick={() => setMobileOpen(!isMobileOpen)}
            />
          </div>

          <ProfileArea onClick={() => setAccountOpen(!accountOpen)}>
            <div className="text-end d-none d-md-block">
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: theme.primary }}>{localStorage.getItem("adminUserName")}</div>
            </div>
            <div className="avatar">
              <FontAwesomeIcon icon={faUser} />
            </div>
            <DropdownMenu show={accountOpen}>
              <button onClick={() => redirect("/Admin/Settings")}><FontAwesomeIcon icon={faUser} /> Profile</button>
              <hr className="my-1" />
              <button className="text-danger" onClick={handleLogout}><FontAwesomeIcon icon={faSignOutAlt} /> Logout</button>
            </DropdownMenu>
          </ProfileArea>
        </TopNav>
        <Outlet />
      </MainContent>
    </Wrapper>
  );
};

export default AdminLayout;