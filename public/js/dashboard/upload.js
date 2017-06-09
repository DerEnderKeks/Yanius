let body = $('body');
let dropzone = $('#dropzone');
let uploadButton = $('#upload-button');

function uploadFile(file) {
  uploadButton.attr('disabled', '');
  
  let data = new FormData();
  data.append('file', file || $('#file').prop('files')[0]);
  data.append('apikey', $('#apikey').val());
  data.append('hidden', $('#hide').prop('checked'));
  $.ajax({
    url: url_prefix + '../api/upload',
    type: 'POST',
    data: data,
    processData: false,
    contentType: false
  }).done((response) => {
    Materialize.toast(response.message, 5000);
    count = 0;
    
    if (response.message == 'File uploaded' && $('#open-file').prop('checked')) {
      window.open(response.url, '_self');
    }
    uploadButton.attr('disabled', null);
  });
}

let timeEntered = undefined;
function fileDragEntered(evt) {
  dropzone.css('opacity', '.6');
  timeEntered = new Date().getTime();
}

function fileDragLeft(evt) {
  if (timeEntered && new Date().getTime() - timeEntered > 1) {
    dropzone.css('opacity', 0);
  }
}

function fileDraggedOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.originalEvent.dataTransfer.dropEffect = 'copy';
}

function fileDropped(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  uploadFile(evt.originalEvent.dataTransfer.files[0]);
  dropzone.css('opacity', 0);
}

$(document).ready(function() {
  body.css('height', '100vh');
  
  body.on('dragenter', fileDragEntered);
  body.on('dragleave', fileDragLeft);
  body.on('dragover', fileDraggedOver);
  body.on('drop', fileDropped);

  $('#upload').addClass('active');
});