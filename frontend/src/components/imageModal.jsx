import React, { useEffect } from 'react';

function ImageModal({ imageUrl, onClose }) {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <button className="modal-close-btn" onClick={onClose}>×</button>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Full-size view" className="modal-image" />
      </div>
    </div>
  );
}

export default ImageModal;
