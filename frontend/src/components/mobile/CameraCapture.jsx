import { useState } from 'react';

const CameraCapture = ({ onCapture, currentAvatar }) => {
  const [preview, setPreview] = useState(null);

  const takePhoto = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => { setPreview(ev.target.result); onCapture(ev.target.result); };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="camera-capture touch-feedback" onClick={takePhoto}>
      {preview || currentAvatar ? (
        <img src={preview || currentAvatar} alt="Avatar" className="camera-avatar" />
      ) : (
        <span className="camera-placeholder">📷</span>
      )}
      <div className="camera-edit">✏️</div>
    </div>
  );
};

export default CameraCapture;
