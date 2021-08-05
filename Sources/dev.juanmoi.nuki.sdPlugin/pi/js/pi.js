function PI(inContext, inLanguage, inStreamDeckVersion, inPluginVersion) {
    // Init project inspector
    var instance = this;

    // Public localizations for the UI
    this.localization = {};

    // Add event listener
    document.getElementById('device-select').addEventListener('change', deviceChanged);
    document.getElementById('connect-bridge-btn').addEventListener('click', buttonClicked);
    document.addEventListener('saveBridge', setupCallback);

    // Load the localizations
    getLocalization(inLanguage, function(inStatus, inLocalization) {
        if (inStatus) {
            // Save public localization
            instance.localization = inLocalization['PI'];

            // Localize the PI
            instance.localize();
        }
        else {
            log(inLocalization);
        }
    });

    // Localize the UI
    this.localize = function() {
        // Check if localizations were loaded
        if (instance.localization == null) {
            return;
        }

        // Localize the bridge select
        document.getElementById('devices-label').innerHTML = instance.localization['Devices'];
        document.getElementById('no-devices').innerHTML = instance.localization['NoDevices'];
        document.getElementById('connect-bridge-btn').innerHTML = instance.localization['Connect'];
    };

    // Show all devices by type
    this.loadDevices = function() {
        // Remove previously shown devices
        var devices = document.getElementsByClassName('devices');

        while (devices.length > 0) {
            devices[0].parentNode.removeChild(devices[0]);
        }

        // Check if any device is loaded
        var cacheDevices = [];
        if (instance instanceof LockPI) {
            cacheDevices = cache.locks;
        } 

        if (cacheDevices && cacheDevices.length > 0) {
            // Hide the 'No Devices' option
            document.getElementById('no-devices').style.display = 'none';

            // Localize button
            document.getElementById('connect-bridge-btn').innerHTML = instance.localization['Reconnect'];

            // Sort the bridges alphabetically
            var devicesIDsSorted = cacheDevices.sort(function(a, b) {
                return a.nukiId > b.nukiId;
            });

            // Add the devices
            devicesIDsSorted.forEach(function(device) {
                // Add the group
                var option = "<option value='" + device.nukiId + "' class='devices'>" + device.name + "</option>";
                document.getElementById('no-devices').insertAdjacentHTML('beforebegin', option);
            });
        }
        else {
            // Show the 'No Bridges' option
            document.getElementById('no-devices').style.display = 'block';
        }
    }

    // Function called on successful bridge pairing
    function setupCallback(inEvent) {
        // Getting bridges
        var bridges = inEvent.detail.bridges;

        // Localize button with reconnect text
        document.getElementById('connect-bridge-btn').innerHTML = instance.localization['Reconnect'];

        // Getting devices
        var promises = bridges.map(function(bridge) {
            return new Promise(function(resolve, reject) {
                Device.discover(bridge, function(status, data) {
                    if (status) {
                        resolve(data);
                    } else {
                        reject(data)
                    }
                })
            })
        })

        Promise.allSettled(promises)
            .then(function(results) {
                var devices = results.filter(function(result) {
                    return result.status === "fulfilled";
                }).map(function(result) {
                    return result.value;
                }).reduce(function(prev, next) {
                    return [...prev, ...next];
                }, []).reduce(function(prev, next) {                  
                    if (next instanceof Lock) {
                        var locks = prev.locks || [];
                        return {
                            ...prev,
                            locks: [
                                ...locks,
                                {
                                    bridge: { 
                                        token: next.getBridge().getToken(),
                                        bridgeId: next.getBridge().getBridgeId(),
                                        ip: next.getBridge().getIP(),
                                        port: next.getBridge().getPort(),
                                        dateUpdated: next.getBridge().getDateUpdated(),
                                    },
                                    deviceType: next.getDeviceType(),
                                    nukiId: next.getNukiId(),
                                    name: next.getName(),
                                    firmwareVersion: next.getFirmware(),
                                    lastKnownState: next.getLastKnowState(),
                                }
                            ]  
                        }
                    } else if (next instanceof Opener) {
                        var openers = prev.openers || [];
                        return {
                            ...prev,
                            openers: [
                                ...openers,
                                {
                                    bridge: { 
                                        token: next.getBridge().getToken(),
                                        bridgeId: next.getBridge().getBridgeId(),
                                        ip: next.getBridge().getIP(),
                                        port: next.getBridge().getPort(),
                                        dateUpdated: next.getBridge().getDateUpdated(),
                                    },
                                    deviceType: next.getDeviceType(),
                                    nukiId: next.getNukiId(),
                                    name: next.getName(),
                                    firmwareVersion: next.getFirmware(),
                                    lastKnownState: next.getLastKnowState(),
                                }
                            ]
                        }
                    } else {
                        return prev;
                    }
                },
                {
                    locks: [],
                    openers: []
                });

                // Set devices to the newly added devices
                settings.devices = devices;
                instance.saveSettings();

                // Check if global settings need to be initialized
                if (globalSettings.devices === undefined) {
                    globalSettings.devices = {};
                }

                // Add devices to the global settings
                globalSettings.devices = devices;
                saveGlobalSettings(inContext);
            })
    }

    // Opens a new window to setup the devices
    function buttonClicked() {
        window.open('../setup/index.html?language=' + inLanguage + '&streamDeckVersion=' + inStreamDeckVersion + '&pluginVersion=' + inPluginVersion)
    }

    function deviceChanged() {

    }

    // Private function to return the action identifier
    function getAction() {
        var action;

        // Find out type of action
        if (instance instanceof LockPI) {
            action = 'dev.juanmoi.nuki.lock';
        }

        return action;
    }

    // Public function to save the settings
    this.saveSettings = function() {
        saveSettings(getAction(), inContext, settings);
    }

    // Public function to send data to the plugin
    this.sendToPlugin = function(inData) {
        sendToPlugin(getAction(), inContext, inData);
    }
}