import { Share } from '@capacitor/share';
import { motion } from 'framer-motion';
import { isApp } from '../../utils/platform';

const ShareButton = ({ title, text, url, style = {} }) => {
  const handleShare = async () => {
    if (isApp()) {
      try {
        await Share.share({
          title: title || 'Couple Meeting',
          text: text || 'Arkadaşlarınla birlikte müzik ve video izle!',
          url: url || 'https://couplemeeting.com.tr',
        });
      } catch (err) {
        console.log('Paylaşma iptal edildi');
      }
    } else {
      if (navigator.share) {
        try {
          await navigator.share({
            title: title || 'Couple Meeting',
            text: text || 'Arkadaşlarınla birlikte müzik ve video izle!',
            url: url || 'https://couplemeeting.com.tr',
          });
        } catch (err) {
          console.log('Paylaşma iptal edildi');
        }
      } else {
        navigator.clipboard.writeText(url || 'https://couplemeeting.com.tr');
        alert('Link kopyalandı!');
      }
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleShare}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '12px 20px', borderRadius: 12,
        background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
        border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
        cursor: 'pointer', ...style
      }}
    >
      <span>📤</span> Paylaş
    </motion.button>
  );
};

export default ShareButton;
