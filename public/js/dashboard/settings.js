let blockSave = false;
let maxfilesizeslider = $('#maxfilesizeslider');
let maxquotaslider = $('#maxquotaslider');

function updateListTypeLabel() {
  let text = 'MIME type ' + ($('#mimelisttype')[0].checked ? 'blacklist' : 'whitelist') + ' (one per line)';
  $('label[for="mimelist"]').text(text);
}

function arrayToStringWithNewlines(array) {
  if (Object.prototype.toString.call(array) !== '[object Array]') return null;
  let text = '';
  array.forEach((element, index) => {
      text += element + ((index < (array.length - 1)) ? '\n' : '');
    }
  );
  return text;
}

function saveSettings() {
  if (blockSave) return;
  blockSave = true;
  const url = '../api/settings';
  $.ajax({
    url: url,
    type: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify(settings)
  }).always(function (response) {
    Materialize.toast(response.message, 5000);
  });
  setTimeout(function () {
    blockSave = false;
  }, 2000);
}

function createSilder() {
  let sliderSettings =  {
    start: [settings.maxFileSize],
    range: {
      'min': [     0 ],
      '10%': [  1e+7 ],
      '25%': [  1e+8 ],
      '50%': [  1e+9 ],
      '75%': [ 1e+10 ],
      'max': [ 1e+11 ]
    },
    tooltips: false,
    format: {
      to: function (value) {
        settings.maxFileSize = value;
        return formatFromBytes(value);
      },
      from: function ( value ) {
        return value;
      }
    }
  };
  noUiSlider.create(maxfilesizeslider[0], sliderSettings);
  sliderSettings.range = {
      'min': [     0 ],
      '10%': [  1e+8 ],
      '25%': [  1e+9 ],
      '50%': [ 1e+10 ],
      '75%': [ 1e+11 ],
      'max': [ 1e+12 ]
  };
  sliderSettings.format = {
    to: function (value) {
      settings.maxQuota = value;
      return formatFromBytes(value);
    },
    from: function ( value ) {
      return value;
    }
  };
  sliderSettings.start = [settings.maxQuota];
  noUiSlider.create(maxquotaslider[0], sliderSettings);
}

$('#settings').addClass('active');

createSilder();

updateListTypeLabel();
$('#mimelisttype').change(() => {
  settings.mimeListType = $('#mimelisttype').is(':checked');
  updateListTypeLabel();
});

$('#mimelist').val(arrayToStringWithNewlines(settings.mimeList)).keyup(() => {
  settings.mimeList = $('#mimelist').val().split('\n');
});

$('#trackingid').val(settings.trackingID).keyup(() => {
  settings.trackingID = $('#trackingid').val();
});

maxfilesizeslider[0].noUiSlider.on('update', (value) => {
  $('#maxfilesize').text(value);
});

maxquotaslider[0].noUiSlider.on('update', (value) => {
  $('#maxquota').text(value);
});