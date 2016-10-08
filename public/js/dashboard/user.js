var blockEdit = false;

function editUser() {
  if (blockEdit) return;
  blockEdit = true;
  var url = '/api/users/' + searchedUser.id;
  var data = {
    username: $('input[name=\'username\']').val(),
    email: $('input[name=\'email\']').val(),
    password: $('input[name=\'password\']').val(),
    enabled: $('input[name=\'enabled\']').is(':checked'),
    isAdmin: $('input[name=\'isAdmin\']').is(':checked')
  };
  $.ajax({
    url: url,
    type: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify(data)
  }).always(function (response) {
    Materialize.toast(response.message, 5000);
  });
  setTimeout(function () {
    blockEdit = false;
  }, 2000);
}