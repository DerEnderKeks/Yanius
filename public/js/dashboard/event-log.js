let count = 0;
const timezone = moment.tz.guess();
moment.locale(window.navigator.language);

function hideLoader() {
  $('#loader').addClass('hide');
  $('#spinner').addClass('hide');
}
function showLoader() {
  $('#spinner').removeClass('hide');
}

function getEventStrings(event) {
  if (eventDictionary.hasOwnProperty(event.type)) return eventDictionary[event.type];
  return {text: event.type, icon: 'help_outline', color: 'blue'};
}

function appendEvent(event) {
  let eventStrings = getEventStrings(event);
  let eventInfoHTML = '';
  for (let key in event.event_info) {
    if (!event.event_info.hasOwnProperty(key)) continue;
    eventInfoHTML += '<b>' + (dictionary.hasOwnProperty(key) ? dictionary[key] : key.toUpperCase())+ ': </b>';
    switch (key) {
      case 'size':
        eventInfoHTML += formatFromBytes(event.event_info[key]) || event.event_info[key];
        break;
      default:
        eventInfoHTML += event.event_info[key];
    }
    eventInfoHTML += '<br>';
  }
  let htmlElement = $(
    '<li class="">' +
      '<div class="collapsible-header">' +
        '<i class="material-icons ' + eventStrings.color + '-text">' + eventStrings.icon + '</i>' +
        '<div class="row small-row">' +
          '<div class="col">' + moment(event.timestamp).tz(timezone).format('l LTS') + '</div>' +
          '<div class="col">' + (event.username ? event.username : 'Unknown User') + '</div>' +
          '<div class="col">' + eventStrings.text + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="collapsible-body" style="display: none;">' +
        '<br>' +
        '<div class="row">' +
          '<div class="col s11">' +
            '<div class="col s6">' +
              '<b>' + dictionary.sourceUser + ': </b>' + (event.username ? '<a href="user/' + event.username + '">' + event.username + '</a>' : '-') + '<br>' +
              '<b>' + dictionary.sourceIP + ': </b>' + (event.sourceIP ? '<a target="_blank" href="https://whois.domaintools.com/' + event.sourceIP + '">' + event.sourceIP + '</a>' : '-') +
            '</div>' +
            '<div class="col s6">' +
              eventInfoHTML +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</li>'
  );
  $('#eventlogCollection').append(htmlElement);
}

function loadEvents() {
  let url = '../api/events?index=' + count + '&max=25';
  $.ajax({
    url: url
  }).done((data) => {
    if (Object.prototype.toString.call(data) !== '[object Array]') return;
    data.forEach((element) => {
      count++;
      appendEvent(element);
    });
    hideLoader();
  });
}

function loadMore() {
  showLoader();
  loadEvents();
}

loadEvents();