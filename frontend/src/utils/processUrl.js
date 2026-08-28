export const processUrl = (url) => {
  const trimmed = url.trim();
  if (trimmed.includes('youtu.be/') || trimmed.includes('watch?v=')) {
    const id = trimmed.includes('youtu.be/')
      ? trimmed.split('youtu.be/')[1].split('?')[0]
      : trimmed.split('v=')[1].split('&')[0];
    return { type: 'youtube', src: id };
  } else if (trimmed.endsWith('.mp4') || trimmed.endsWith('.webm')) {
    return { type: 'custom_video', src: trimmed };
  } else {
    return { type: 'iframe', src: trimmed };
  }
};
