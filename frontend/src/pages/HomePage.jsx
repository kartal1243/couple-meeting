import { useApp } from '../contexts/AppContext';
import { HOME_CSS } from '../constants';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../Home/Hero';
import About from '../Home/About';
import Features from '../Home/Features';
import PublicRooms from '../Home/PublicRooms';
import SocialPreview from '../Home/SocialPreview';

export default function HomePage() {
  const {
    authUser, openAuth, publicRooms, globalMessages,
    setShowSocialModal, setShowJoinModal, setJoinRoomTarget,
    setShowQuickCreate
  } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto' }}>
      <style>{HOME_CSS}</style>
      <Navbar onOpenAuth={openAuth} />
      <main className="cm-home-main" style={{ flex: 1 }}>
        <Hero authUser={authUser} openAuth={openAuth} handleQuickCreateRoom={() => setShowQuickCreate(true)} />
        <PublicRooms publicRooms={publicRooms} onJoinRoom={(room) => { setJoinRoomTarget(room); setShowJoinModal(true); }} onCreateRoom={() => setShowQuickCreate(true)} />
        <About />
        <Features />
        <SocialPreview globalMessages={globalMessages} setShowSocialModal={setShowSocialModal} />
        <Footer />
      </main>
    </div>
  );
}
