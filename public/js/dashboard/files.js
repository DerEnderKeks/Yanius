var count = 0;
var blockUpdate = false;
var files = [];
var timezone = moment.tz.guess();
moment.locale(window.navigator.language);

function hideLoader() {
  $('#loader').addClass('hide');
  $('#spinner').addClass('hide');
}
function showLoader() {
  $('#spinner').removeClass('hide');
}

function appendFile(file) {
  let htmlElement = $(
    '<li class="collection-item avatar">' +
      '<i class="material-icons circle teal darken-3">insert_drive_file</i>' +
      '<span class="title blue-grey-text">' + file.originalName + '</span>' +
      (window.showUploader ? '<span class="grey-text"> uploaded by </span>' +
      '<span class="title blue-grey-text">' + file.uploader.username + '</span>' : '') +
      '<span class="grey-text"> (' + file.mime + ') </span>' +
      '<p class="grey-text">' + moment(file.timestamp).tz(timezone).format('l LTS') + '</p>' +
      '<p class="grey-text">' + file.views + ' Views</p>' +
      '<div class="secondary-content">' +
        '<a class="pointer" onclick="deleteFile(\'' + file.id + '\', false)">' +
          '<i class="material-icons red-text">delete</i>' +
        '</a>' +
        '<a class="pointer" onclick="changeVisibility(\'' + file.id + '\', ' + !file.hidden + ')">' +
          '<i class="material-icons teal-text darken-3">' + (file.hidden ? 'visibility' : 'visibility_off') + '</i>' +
        '</a>' +
        '<a class="pointer" target="_blank" href="/' + file.shortName + '">' +
          '<i class="material-icons teal-text darken-3">file_download</i>' +
        '</a>' +
      '</div>' +
    '</li>');
  $('#filelist').append(htmlElement);
}

function changeVisibility(fileId, hide) {
  let url = '/api/file/' + fileId + '/visibility';
  $.ajax({
    url: url,
    type: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify({hidden: hide})
  }).done((data) => {
    Materialize.toast(data.message, 5000);
    count = 0;
    $('#filelist').html('');
    loadMore(true);
  }).fail((data) => {
    Materialize.toast(JSON.parse(data.responseText).message, 5000);
  });
}

function loadFiles() {
  let url = window.fileAPIurl + '?index=' + count + '&max=25';
  $.ajax({
    url: url
  }).done((data) => {
    if (Object.prototype.toString.call(data) !== '[object Array]') return;
    data.forEach((element) => {
      count++;
      files.push(element);
      appendFile(element);
    });
    hideLoader();
  });
}

function loadMore(force) {
  if (blockUpdate && !force) return;
  blockUpdate = true;
  showLoader();
  loadFiles();
  setTimeout(() => {
    blockUpdate = false;
  }, 2000);
}

function deleteFile(id, confirm) {
  let file = findById(id);
  if (confirm) {
    let url = '/api/file/' + id;
    $.ajax({
      url: url,
      type: 'DELETE'
    }).done((response) => {
      Materialize.toast(response.message, 5000);
      count = 0;
      $('#filelist').html('');
      loadMore(true);
    });
  } else {
    $('#modalcontent').html(
      '<h4>Delete File</h4>' +
      '<p>Are you sure that you want to delete the file <strong>\'' + file.originalName + '\'</strong>?</p>'
    );
    $('#modalfooter').html(
      '<a onclick="$(\'#modal\').closeModal()" class="modal-action modal-close waves-effect waves-light btn-flat">Cancel</a>' +
      '<a onclick="deleteFile(\'' + id + '\', true)" class="modal-action modal-close waves-effect waves-light red-text btn-flat">Delete</a>'
    );
    $('#modal').openModal();
  }
}

function findById(id) {
  return files.find((file) => {
    return file.id === id;
  });
}

loadFiles();
