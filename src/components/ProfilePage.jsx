import { useState } from 'react';
import profileBg from '../assets/images/profile-bg.png';
import './ProfilePage.css';

/* ── Custom Icons ── */
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" opacity="0.85">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
);

const IconPin = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" opacity="0.85">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const IconBox = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" opacity="0.85">
    <path d="M21 16.5C21 16.88 20.79 17.21 20.47 17.38L12.7 21.5C12.29 21.71 11.72 21.71 11.3 21.5L3.53 17.38C3.21 17.21 3 16.88 3 16.5V7.5C3 7.12 3.21 6.79 3.53 6.62L11.3 2.5C11.71 2.29 12.28 2.29 12.7 2.5L20.47 6.62C20.79 6.79 21 7.12 21 7.5V16.5ZM12 4.15L5.6 7.5L12 10.85L18.4 7.5L12 4.15ZM5 15.91L11 19.06V12.71L5 9.56V15.91ZM19 15.91V9.56L13 12.71V19.06L19 15.91Z"/>
  </svg>
);

const IconSquare = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" opacity="0.85">
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);

const IconEmail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
    <polyline points="22,6 12,13 2,6"></polyline>
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

/* ── Mock Data ── */
const TABS = [
  { id: 'details', label: 'Personal Info', icon: <IconUser /> },
  { id: 'addresses', label: 'My Addresses', icon: <IconPin /> },
  { id: 'orders', label: 'Order History', icon: <IconBox /> },
];

export default function ProfilePage({ user, onLogout, onBack }) {
  const [activeTab, setActiveTab] = useState('details');

  const [userDetails, setUserDetails] = useState({
    name: user?.name || 'mansimran1414',
    email: user?.email || 'mansimran1414@gmail.com',
    phone: '+44 7700 900077',
    joined: 'January 2024'
  });

  return (
    <div className="profileContainer" style={{ backgroundImage: `url(${profileBg})` }}>
      {/* Absolute Header (similar to AuthPage overlay fix) */}
      <div className="profileOverlay" />
      
      <div className="profileWrapper">
        
        {/* ── Glass Sidebar ── */}
        <aside className="profileSidebarBox">
          <div className="profileSidebarInner">
            
            <div className="profileAvatarArea">
              <div className="avatarGlowWrap">
                <div className="avatarGlow"></div>
                <div className="avatarCircle">
                  {userDetails.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <h2 className="profileName">{userDetails.name}</h2>
              <p className="profileJoined">Joined {userDetails.joined}</p>
            </div>

            <nav className="profileNavList">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  className={`profileNavItem ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={`navIcon ${tab.id === 'addresses' ? 'pin' : tab.id === 'orders' ? 'box' : ''}`}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}

              <button className="profileNavItem" onClick={onLogout} style={{ marginTop: '20px' }}>
                <span className="navIcon square"><IconSquare /></span>
                <span>Logout</span>
              </button>
            </nav>

            <button className="profileSideBack" onClick={onBack}>
              ← Back to Shop
            </button>
          </div>
        </aside>

        {/* ── Main Glass Panel ── */}
        <main className="profileMainBox">
          <div className="profileMainInner">
            
            {/* Top Pill Nav */}
            <div className="profileTopPillNav">
              <button 
                className={activeTab === 'details' ? 'active' : ''} 
                onClick={() => setActiveTab('details')}
              >Personal</button>
              <button 
                className={activeTab === 'orders' ? 'active' : ''} 
                onClick={() => setActiveTab('orders')}
              >Orders</button>
              <button 
                className={activeTab === 'addresses' ? 'active' : ''} 
                onClick={() => setActiveTab('addresses')}
              >Addresses</button>
            </div>

            {/* TAB: Personal Details */}
            {activeTab === 'details' && (
              <div className="profileContentFade">
                <h1 className="profileSecTitle">Personal Information</h1>
                <p className="profileSecDesc">Update your personal details and how we can reach you.</p>
                
                <form className="profileGlassForm" onSubmit={e => e.preventDefault()}>
                  
                  <div className="glassInputWrap">
                    <span className="glassInputIcon iconUser"><IconUser /></span>
                    <input 
                      type="text" 
                      value={userDetails.name} 
                      onChange={e => setUserDetails({...userDetails, name: e.target.value})}
                      className="glassInput"
                    />
                  </div>

                  <div className="glassInputWrap">
                    <span className="glassInputIcon"><IconEmail /></span>
                    <input 
                      type="email" 
                      value={userDetails.email} 
                      readOnly 
                      className="glassInput"
                    />
                  </div>

                  <div className="glassInputWrap">
                    <span className="glassInputIcon"><IconPhone /></span>
                    <input 
                      type="tel" 
                      value={userDetails.phone} 
                      onChange={e => setUserDetails({...userDetails, phone: e.target.value})}
                      className="glassInput"
                    />
                  </div>

                  <button type="submit" className="glassSaveBtn">Save Changes</button>
                </form>
              </div>
            )}

            {/* Other tabs placeholder to keep UI functional */}
            {activeTab === 'addresses' && (
              <div className="profileContentFade">
                <h1 className="profileSecTitle">My Addresses</h1>
                <p className="profileSecDesc">Manage your saved delivery locations.</p>
                <div style={{ padding: '20px', textAlign: 'center', color: '#664c39', fontStyle: 'italic' }}>
                  Address management UI coming soon.
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="profileContentFade">
                <h1 className="profileSecTitle">Order History</h1>
                <p className="profileSecDesc">View your past orders and their status.</p>
                <div style={{ padding: '20px', textAlign: 'center', color: '#664c39', fontStyle: 'italic' }}>
                  You have no recent orders.
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
