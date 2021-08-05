// Load the save view
function loadSaveView() {
    // Init loadSaveView
    var instance = this;

    // Set the status bar
    setStatusBar('save');

    // Fill the title
    document.getElementById('title').innerHTML = localization['Save'][pairedBridges.length === 1 ? 'Title' : 'TitleMultiple'];

    // Fill the content area
    var content = "<p>" + localization['Save'][pairedBridges.length === 1 ? 'Description' : 'DescriptionMultiple'] + "</p> \
                   <img class='image' src='images/bridge_paired.png'> \
                   <div class='button' id='close'>" + localization['Save']['Save'] + "</div>";
    document.getElementById('content').innerHTML = content;

    // Add event listener
    document.getElementById('close').addEventListener('click', close);
    document.addEventListener('enterPressed', close);

    // Safe the bridge
    var detail = {
        detail: {
            bridges: pairedBridges
        }
    };

    var event = new CustomEvent('saveBridge', detail);
    window.opener.document.dispatchEvent(event);

    // Close this window
    function close() {
        window.close();
    }
}