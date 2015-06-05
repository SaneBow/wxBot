// Saves options to chrome.storage.sync.
function save_options() {
  var selector = document.getElementById('selector');
  var unit = selector.options[selector.selectedIndex].value;
  var timenum = document.getElementById('timenum').value;
  var interval = parseInt(timenum);
  (unit == "min") && (interval *= 60);
  chrome.storage.sync.set({
    botSleepInterval: interval,
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    botSleepInterval: '30',
  }, function(items) {
    var interval = parseInt(items.botSleepInterval);
    var unit = 'sec';
    var timenum = interval;
    if (interval >= 180) {
       unit = 'min';
       timenum = Math.floor(interval/60);
    }
    document.getElementById(unit).setAttribute('selected','selected');
    document.getElementById('timenum').value = timenum;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',save_options);
