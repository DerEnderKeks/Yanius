// Initialize collapse button
$('.button-collapse').sideNav();

var loadQuota = () => {
  let percentage = user.quotaUsed/settings.maxQuota || 0;
  var bar = new ProgressBar.Circle('#quotaCircle', {
    color: '#6a1b9a',
    trailColor: '#f3f3f3',
    trailWidth: 1,
    duration: 1400,
    easing: 'bounce',
    strokeWidth: 6,
    text: {
      value: (percentage * 100).toFixed(1) + '%',
      className: 'progressbar__label',
      style: {
        color: '#607d8b',
        position: 'absolute',
        left: '50%',
        top: '50%',
        padding: 0,
        margin: 0,
        transform: {
          prefix: true,
          value: 'translate(-50%, -50%)'
        }
      }
    },
    from: {color: '#6a1b9a', a:0},
    to: {color: '#6a1b9a', a:1},
    step: function(state, circle) {
      circle.path.setAttribute('stroke', state.color);
    }
  });

  $('#quotaUsedTextElement').text(formatFromBytes(user.quotaUsed));
  $('#maxQuotaTextElement').text(formatFromBytes(settings.maxQuota));

  bar.animate(percentage);
};

loadQuota();