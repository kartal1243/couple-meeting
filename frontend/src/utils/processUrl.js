export const processUrl = (url) => {
  const trimmed = url.trim();
  if (trimmed.includes('youtu.be/') || trimmed.includes('watch?v=')) {
    const id = trimmed.includes('youtu.be/')
      ? trimmed.split('youtu.be/')[1].split('?')[0]
      : trimmed.split('v=')[1].split('&')[0];
    return { type: 'youtube', src: id };
  } else if (trimmed.includes('vimeo.com')) {
    const vimeoMatch = trimmed.match(/vimeo\.com\/(\d+)/);
    const vimeoId = vimeoMatch ? vimeoMatch[1] : trimmed.split('vimeo.com/')[1]?.split('?')[0];
    return { type: 'vimeo', src: vimeoId || trimmed };
  } else if (trimmed.endsWith('.mp4') || trimmed.endsWith('.webm') || trimmed.endsWith('.ogg') || trimmed.includes('/uploads/')) {
    return { type: 'custom_video', src: trimmed };
  } else {
    return { type: 'iframe', src: trimmed };
  }
};
