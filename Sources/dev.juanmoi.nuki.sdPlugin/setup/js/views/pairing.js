// Load the pairing view
function loadPairingView() {

    // Set the status bar
    setStatusBar('pairing');

    // Fill the title
    document.getElementById('title').innerHTML = localization['Pairing']['Title'];

    // Fill the content area
    var content = "<p id='description'>" + localization['Pairing']['Description'] + "</p> \
                   <img class='image' src='images/bridge_pressed.png'> \
                   <div id='loader'></div> \
                   <div id='controls'></div>";
    document.getElementById('content').innerHTML = content;

    pair();

    // Try to pair with all discovered bridges
    function pair() {
        var promises = bridges.map(function(bridge) {
            return new Promise(function(resolve, reject) {
                bridge.requestToken(function(status, data) {
                    if (status) {
                        resolve(bridge);
                    } else {
                        reject(data);
                    }
                })
            })
        });

        Promise.allSettled(promises)
            .then(function(results) {
                pairedBridges = results.filter(function(result) {
                    return result.status === "fulfilled";
                }).map(function(result) {
                    return result.value;
                })

                if(pairedBridges.length === 0) {
                    document.getElementById('loader').classList.add('hide');

                    // Show manual user controls instead
                    var controls = "<div class='button' id='retry'>" + localization['Pairing']['Retry'] + "</div> \
                                <div class='button-transparent' id='close'>" + localization['Pairing']['Close'] + "</div>";
                    document.getElementById('controls').innerHTML = controls;

                    // Add event listener
                    document.getElementById('retry').addEventListener('click', retry);
                    document.addEventListener('enterPressed', retry);

                    document.getElementById('close').addEventListener('click', close);
                    document.addEventListener('escPressed', close);
                } else if (bridges.length === pairedBridges.length) {
                    next();
                } else {
                    //all bridges are not synched
                    document.getElementById('loader').classList.add('hide');

                    document.getElementById('description').innerHTML = localization['Pairing']['NoSynchedBridges'];

                    var controls = "<div class='button' id='continue'>" + localization['Pairing']['Continue'] + "</div> \
                            <div class='button-transparent' id='retry'>" + localization['Pairing']['Retry'] + "</div>";
                    document.getElementById('controls').innerHTML = controls;

                    // Add event listener
                    document.getElementById('continue').addEventListener('click', next);
                    document.addEventListener('enterPressed', next);

                    document.getElementById('retry').addEventListener('click', retry);
                }
                });
    }

    // Retry pairing by reloading the view
    function retry() {
        unloadPairingView();
        loadPairingView();
    }

    // Continue if at least one of multiple bridges are paired
    function next() {
        unloadPairingView();
        loadSaveView();
    }

    // Close the window
    function close() {
        window.close();
    }

    // Unload view
    function unloadPairingView() {
        // Remove event listener
        document.removeEventListener('escPressed', retry);
        document.removeEventListener('enterPressed', close);
    }
}