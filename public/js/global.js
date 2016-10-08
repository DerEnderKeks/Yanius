window.formatFromBytes = (bytes, decimals) => {
  if (bytes === 0) return '0 B';
  let k = 1000;
  let dm = decimals + 1 || 3;
  let sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

window.formatToBytes = (bytes, decimals) => {
  let regex = /([0-9]+)( )?(K|M|G|T|P|E|Z|Y)?B/
  if (regex.exec());
};
