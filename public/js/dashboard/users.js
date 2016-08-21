var count = 0;
var blockUpdate = false;
var users = [];

function hideLoader() {
  $('#loader').addClass('hide');
  $('#spinner').addClass('hide');
}
function showLoader() {
  $('#spinner').removeClass('hide');
}

function appendUser(user) {
  let adminBadge = user.isAdmin ? '<span data-badge-caption="" class="new badge group-badge red">Admin</span>' : '';
  let htmlElement = $(
    '<li class="collection-item avatar">' +
    '<i class="material-icons circle teal darken-3">person</i>' +
    '<span class="title blue-grey-text">' + user.username + adminBadge + '</span>' +
    '<p class="email grey-text">' + user.email + '</p>' +
    '<div class="secondary-content">' +
    '<a class="pointer" onclick="deleteUser(\'' + user.id + '\', false)">' +
    '<i class="material-icons red-text">delete</i></a>' +
    '<a class="pointer" href="/dashboard/files/' + user.username + '">' +
    '<i class="material-icons teal-text darken-3">folder</i></a>' +
    '<a class="pointer" href="/dashboard/user/' + user.username + '">' +
    '<i class="material-icons teal-text darken-3">edit</i>' +
    '</a>' +
    '</div>' +
    '</li>');
  $('#userlist').append(htmlElement);
}

function loadUsers() {
  let url = '/api/users?index=' + count + '&max=25';
  $.ajax({
    url: url
  }).done(function (data) {
    data.forEach(function (element) {
      count++;
      users.push(element);
      appendUser(element);
    });
    hideLoader();
  });
}

function loadMore() {
  if (blockUpdate) return;
  blockUpdate = true;
  showLoader();
  loadUsers();
  setTimeout(function () {
    blockUpdate = false;
  }, 2000);
}

function deleteUser(id, confirm) {
  if (confirm) {
    let url = '/api/users/' + id;
    $.ajax({
      url: url,
      type: 'DELETE'
    }).done(function (response) {
      Materialize.toast(response.message, 5000);
    });
  } else {
    $('#modalcontent').html(
      '<h4>Delete User</h4>' +
      '<p>Are you sure that you want to delete the user <strong>' + findById(id).username + '</strong>?</p>' +
      '<p><strong>Note: </strong>This will also delete all of their files!</p>'
    );
    $('#modalfooter').html(
      '<a onclick="$(\'#modal\').closeModal()" class="modal-action modal-close waves-effect waves-light btn-flat">Cancel</a>' +
      '<a onclick="deleteUser(\'' + id + '\', true)" class="modal-action modal-close waves-effect waves-light red-text btn-flat">Delete</a>'
    );
    $('#modal').openModal();
  }
}

function addUser(confirm) { // TODO add user to list
  if (confirm) {
    let url = '/api/users/new';
    let data = {
      username: $('input[name=\'username\']').val(),
      email: $('input[name=\'email\']').val(),
      password: $('input[name=\'password\']').val(),
      enabled: $('input[name=\'enabled\']').is(':checked'),
      isAdmin: $('input[name=\'isAdmin\']').is(':checked')
    };

    if (!/^[a-zA-Z0-9_]{4,24}$/.test(data.username)) return addFailed('Invalid Username');
    if (!validator.isEmail(data.email)) return addFailed('Invalid Email Address');
    if (!/^[\x00-\x7F]{8,50}$/.test(data.password)) return addFailed('Invalid Password');

    $.ajax({
      url: url,
      type: 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify(data)
    }).always(function (response) {
      if (response.status === 500 || response.status === 400) return addFailed(response.message);
      Materialize.toast(response.message, 5000);
    });
  } else {
    $('#addUserModal').openModal();
  }
}

function addFailed(message) {
  Materialize.toast(message, 5000);
  setTimeout(function () {
    $('#addUserModal').openModal();
  }, 500);
}

function findById(id) {
  return users.find(function (user) {
    return user.id === id;
  });
}

$('#users').addClass('active');
loadUsers();
