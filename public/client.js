(() => {
  const match = location.pathname.match(/^\/(s|o)\/(sala[1-4])\/([a-f0-9]{64})\//);
  if (!match) throw Error('Abra o link privado da sua sala');
  const prefix = `/${match[1]}/${match[2]}/${match[3]}/`;
  window.Studio = { room: match[2], api: route => prefix + route.replace(/^\//, '') };
})();
