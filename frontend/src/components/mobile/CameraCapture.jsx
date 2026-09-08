import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { isApp } from '../../utils/platform';

const CameraCapture = ({ onCapture, currentAvatar }) => {
  const [preview, setPreview] = useState(null);

  const takePhoto = async () => {
    if (!isApp()) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setPreview(ev.target.result);
            onCapture(ev.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        width: 300,
        height: 300,
      });
      setPreview(photo.dataUrl);
      onCapture(photo.dataUrl);
    } catch (err) {
      console.log('Fotoğraf çekilmedi');
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={takePhoto}
      style={{
        position: 'relative', width: 100, height: 100, borderRadius: '50%',
        background: 'rgba(124,58,237,0.2)', border: '3px solid #7c3aed',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', overflow: 'hidden'
      }}
    >
      {preview || currentAvatar ? (
        <img
          src={preview || currentAvatar}
          alt="Avatar"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      ) : (
        <span style={{ fontSize: 40 }}>📷</span>
      )}

      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: 30, height: 30, borderRadius: '50%',
        background: '#7c3aed', border: '2px solid #1a1a2e',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14
      }}>
        ✏️
      </div>
    </motion.div>
  );
};

export default CameraCapture;
