function editUser() {
  const url = '../../api/users/' + searchedUser.id;
  let data = {
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
}