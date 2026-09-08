function videoEvents(videos) {
  const cleanups = [];
  for (const video of videos) {
    video.loop = false;
    const container = video.parentElement;
    const open = () => {
      const request = video.requestFullscreen || video.mozRequestFullScreen || video.webkitRequestFullScreen || video.msRequestFullscreen;
      request?.call(video)?.catch?.(() => {});
    };
    const change = () => {
      if ((document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) === video) video.play()?.catch(() => {});
      else { video.pause(); video.currentTime = 0; }
    };
    container.addEventListener('click', open);
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach(name => document.addEventListener(name, change));
    cleanups.push(() => {
      container.removeEventListener('click', open);
      events.forEach(name => document.removeEventListener(name, change));
      video.pause();
    });
  }
  return () => cleanups.forEach(cleanup => cleanup());
}
