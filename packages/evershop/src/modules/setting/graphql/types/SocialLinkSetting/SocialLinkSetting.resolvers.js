module.exports = {
  Setting: {
    facebook: (setting) => {
      const facebookUrl = setting.find((s) => s.name === 'facebookUrl');
      const facebookIcon = setting.find((s) => s.name === 'facebookIconUrl');

      return {
        url: facebookUrl ? facebookUrl.value : undefined,
        icon: facebookIcon ? facebookIcon.value : undefined
      }
    },
    tiktok: (setting) => {
      const tiktokUrl = setting.find((s) => s.name === 'tiktokUrl');
      const tiktokIcon = setting.find((s) => s.name === 'tiktokIconUrl');

      return {
        url: tiktokUrl ? tiktokUrl.value : undefined,
        icon: tiktokIcon ? tiktokIcon.value : undefined
      }
    },
    instagram: (setting) => {
      const instagramUrl = setting.find((s) => s.name === 'instagramUrl');
      const instagramIcon = setting.find((s) => s.name === 'instagramIconUrl');

      return {
        url: instagramUrl ? instagramUrl.value : undefined,
        icon: instagramIcon ? instagramIcon.value : undefined
      }
    },
    thread: (setting) => {
      const threadUrl = setting.find((s) => s.name === 'threadUrl');
      const threadIcon = setting.find((s) => s.name === 'threadIconUrl');

      return {
        url: threadUrl ? threadUrl.value : undefined,
        icon: threadIcon ? threadIcon.value : undefined
      }
    }
  }
};
