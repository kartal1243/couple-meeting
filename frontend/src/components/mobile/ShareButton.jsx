const ShareButton = ({ title, text, url, style = {} }) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: title || 'Couple Meeting', text: text || 'Arkadaslarinla birlikte muzik ve video izle!', url: url || 'https://couplemeeting.com.tr' });
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(url || 'https://couplemeeting.com.tr');
      alert('Link kopyalandi!');
    }
  };

  return (
    <button className="share-btn touch-feedback" onClick={handleShare} style={style}>
      📤 Paylaş
    </button>
  );
};

export default ShareButton;
